import SwiftUI

struct IdentifiableURL: Identifiable {
    let id = UUID()
    let url: URL
}

struct PaymentsView: View {
    @ObservedObject var requestVM: RequestViewModel
    
    @State private var selectedPayment: ServiceRequest? = nil
    @State private var showExportDialog = false
    @State private var shareURL: IdentifiableURL? = nil
    @State private var showingEditAlert = false
    
    // Stats calculation
    private var totalRevenue: Double {
        requestVM.requests.filter({ $0.paymentStatus == "Paid" }).reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
    }
    
    private var todaysCollections: Double {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let calendar = Calendar.current
        return requestVM.requests.filter { req in
            guard req.paymentStatus == "Paid", let ts = req.paymentTimestamp else { return false }
            if let date = formatter.date(from: ts) {
                return calendar.isDateInToday(date)
            }
            return false
        }.reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
    }
    
    private var transactions: [ServiceRequest] {
        requestVM.requests.filter({ $0.paymentStatus == "Paid" })
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header Bar replicated from Scaffold topBar action
            HStack {
                Text("Payments & Revenue")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                Spacer()
                Button(action: { showExportDialog = true }) {
                    Image(systemName: "square.and.arrow.down")
                        .font(.title3)
                        .foregroundColor(SBRColors.primaryBlue)
                }
            }
            .padding()
            .background(Color.white)
            .shadow(color: Color.black.opacity(0.02), radius: 2, x: 0, y: 1)
            
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Summary cards
                    VStack(spacing: 12) {
                        InfoCardView(
                            label: "Total Revenue",
                            value: formatCurrency(totalRevenue),
                            icon: "trending.up.circle.fill",
                            color: Color(red: 219/255, green: 225/255, blue: 255/255) // primaryContainer light blue
                        )
                        InfoCardView(
                            label: "Today's Collections",
                            value: formatCurrency(todaysCollections),
                            icon: "calendar.circle.fill",
                            color: Color(red: 220/255, green: 252/255, blue: 231/255) // secondaryContainer light green
                        )
                    }
                    
                    Text("Transaction History")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                        .padding(.top, 8)
                    
                    if transactions.isEmpty {
                        BoxPlaceholderView(message: "No payment transactions found.")
                    } else {
                        VStack(spacing: 12) {
                            ForEach(transactions) { tx in
                                PaymentListItemView(
                                    payment: tx,
                                    onViewClick: { selectedPayment = tx },
                                    onEditClick: { showingEditAlert = true }
                                )
                            }
                        }
                    }
                }
                .padding()
            }
        }
        .background(SBRColors.background.ignoresSafeArea())
        .sheet(item: $selectedPayment) { payment in
            TransactionDetailDialogView(payment: payment)
        }
        .sheet(isPresented: $showExportDialog) {
            ExportDialogView(requests: transactions) { url in
                shareURL = IdentifiableURL(url: url)
            }
        }
        .sheet(item: $shareURL) { item in
            ShareSheet(activityItems: [item.url])
        }
        .alert(isPresented: $showingEditAlert) {
            Alert(title: Text("Notice"), message: Text("Edit feature coming soon!"), dismissButton: .default(Text("OK")))
        }
        .onAppear {
            Task {
                await requestVM.fetchRequests()
            }
        }
    }
    
    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "en_IN")
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "₹\(Int(value))"
    }
}

// Info Card matching InfoCard on Android
struct InfoCardView: View {
    let label: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack(alignment: .center, spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 32))
                .foregroundColor(SBRColors.primaryBlue)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.footnote)
                    .foregroundColor(SBRColors.textSecondary)
                
                Text(value)
                    .font(.title2)
                    .fontWeight(.black)
                    .foregroundColor(SBRColors.textPrimary)
            }
            Spacer()
        }
        .padding(16)
        .background(color)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 1)
    }
}

// Box placeholder
struct BoxPlaceholderView: View {
    let message: String
    
    var body: some View {
        HStack {
            Spacer()
            Text(message)
                .foregroundColor(.gray)
                .font(.footnote)
                .padding(.vertical, 32)
            Spacer()
        }
        .background(Color.white)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.12), lineWidth: 1)
        )
    }
}

// Payment Row Card View matching PaymentListItem
struct PaymentListItemView: View {
    let payment: ServiceRequest
    let onViewClick: () -> Void
    let onEditClick: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(payment.assignedAgentId?.name ?? "N/A")
                        .font(.body)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                    
                    Text("Date: \(formatTimestamp(payment.paymentTimestamp))")
                        .font(.footnote)
                        .foregroundColor(SBRColors.textSecondary)
                }
                
                Spacer()
                
                Text("₹\(Int(payment.paymentAmount ?? 0))")
                    .font(.body)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.primaryBlue)
            }
            
            Divider()
            
            HStack(spacing: 12) {
                Spacer()
                Button(action: onEditClick) {
                    Text("Edit")
                        .font(.footnote)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.primaryBlue)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(SBRColors.primaryBlue, lineWidth: 1)
                        )
                }
                
                Button(action: onViewClick) {
                    Text("View")
                        .font(.footnote)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 16)
                        .background(SBRColors.primaryBlue)
                        .cornerRadius(8)
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.12), lineWidth: 1)
        )
    }
    
    private func formatTimestamp(_ ts: String?) -> String {
        guard let timestamp = ts else { return "N/A" }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: timestamp) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "dd MMM, yyyy"
            return outputFormatter.string(from: date)
        }
        return String(timestamp.prefix(10))
    }
}

// Detail Popup Dialog View
struct TransactionDetailDialogView: View {
    let payment: ServiceRequest
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Transaction Details")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                    .padding(.top)
                
                VStack(spacing: 12) {
                    DetailDialogRow(label: "Transaction ID", value: payment.id)
                    Divider()
                    DetailDialogRow(label: "Agent Name", value: payment.assignedAgentId?.name ?? "N/A")
                    Divider()
                    DetailDialogRow(label: "Customer Name", value: payment.customerId?.name ?? "N/A")
                    Divider()
                    DetailDialogRow(label: "Date & Time", value: formatTimestamp(payment.paymentTimestamp))
                    Divider()
                    DetailDialogRow(label: "Payment Method", value: payment.paymentMethod ?? "N/A")
                    Divider()
                    DetailDialogRow(label: "Amount", value: "₹\(Int(payment.paymentAmount ?? 0.0))", isValueBold: true)
                }
                .padding()
                .background(Color.white)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
                
                Spacer()
            }
            .padding()
            .background(SBRColors.background.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
    
    private func formatTimestamp(_ ts: String?) -> String {
        guard let timestamp = ts else { return "N/A" }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: timestamp) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "dd MMM yyyy, HH:mm a"
            return outputFormatter.string(from: date)
        }
        return timestamp
    }
}

struct DetailDialogRow: View {
    let label: String
    let value: String
    var isValueBold: Bool = false
    
    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.body)
                .foregroundColor(SBRColors.textSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            Text(value)
                .font(.body)
                .fontWeight(isValueBold ? .bold : .regular)
                .foregroundColor(SBRColors.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

// Export Dialog overlay matching ExportDialog
struct ExportDialogView: View {
    let requests: [ServiceRequest]
    let onExport: (URL) -> Void
    
    @Environment(\.dismiss) var dismiss
    @State private var fromDate = Date().addingTimeInterval(-86400 * 30) // Default 30 days ago
    @State private var toDate = Date()
    @State private var showingError = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Text("Select Date Range")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                
                VStack(spacing: 16) {
                    DatePicker("From Date", selection: $fromDate, displayedComponents: .date)
                        .datePickerStyle(CompactDatePickerStyle())
                    
                    DatePicker("To Date", selection: $toDate, displayedComponents: .date)
                        .datePickerStyle(CompactDatePickerStyle())
                }
                .padding()
                .background(Color.white)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
                
                Button(action: generateCSVExport) {
                    Text("Download CSV")
                        .font(.body)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(SBRColors.primaryBlue)
                        .cornerRadius(8)
                }
                
                Spacer()
            }
            .padding()
            .background(SBRColors.background.ignoresSafeArea())
            .alert(isPresented: $showingError) {
                Alert(title: Text("Empty Range"), message: Text("No transactions found in the selected date range."), dismissButton: .default(Text("OK")))
            }
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
    
    private func generateCSVExport() {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        let filtered = requests.filter { req in
            guard let ts = req.paymentTimestamp else { return false }
            if let date = formatter.date(from: ts) {
                return date >= fromDate && date <= toDate
            }
            return false
        }
        
        guard !filtered.isEmpty else {
            showingError = true
            return
        }
        
        var csvString = "Transaction ID,Date,Agent Name,Customer Name,Amount,Payment Method\n"
        for req in filtered {
            let agentName = req.assignedAgentId?.name ?? "N/A"
            let customerName = req.customerId?.name ?? "N/A"
            let dateStr = req.paymentTimestamp?.prefix(19) ?? "N/A"
            let amount = req.paymentAmount ?? 0.0
            let method = req.paymentMethod ?? "N/A"
            csvString.append("\"\(req.id)\",\"\(dateStr)\",\"\(agentName)\",\"\(customerName)\",\(amount),\"\(method)\"\n")
        }
        
        let tempDir = FileManager.default.temporaryDirectory
        let fileURL = tempDir.appendingPathComponent("payment_export_\(Int(Date().timeIntervalSince1970)).csv")
        do {
            try csvString.write(to: fileURL, atomically: true, encoding: .utf8)
            onExport(fileURL)
            dismiss()
        } catch {
            print("Failed to write CSV: \(error)")
        }
    }
}

// Native iOS UIActivityViewController wrapper
struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
