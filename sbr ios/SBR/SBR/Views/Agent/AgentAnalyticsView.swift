import SwiftUI

struct AgentPaymentsView: View {
    @ObservedObject var requestVM: RequestViewModel
    @Binding var selectedRequestDetail: ServiceRequest?
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                let completedJobs = requestVM.requests.filter { $0.status == .completed || $0.paymentStatus == "Paid" }
                let totalCollections = completedJobs.reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
                let todaysCollections = completedJobs.filter { isToday(dateString: $0.paymentTimestamp) }.reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
                
                // Summary Cards
                HStack(spacing: 16) {
                    // Total Collections Card
                    VStack(alignment: .leading, spacing: 8) {
                        Image(systemName: "indianrupeesign.circle.fill")
                            .font(.title2)
                            .foregroundColor(SBRColors.primaryBlue)
                        Text("Total Collections")
                            .font(.caption)
                            .foregroundColor(.gray)
                            .fontWeight(.medium)
                        Text(formatCurrency(totalCollections))
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textPrimary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.03), radius: 5, x: 0, y: 1)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                    )
                    
                    // Today's Collections Card
                    VStack(alignment: .leading, spacing: 8) {
                        Image(systemName: "calendar.badge.clock")
                            .font(.title2)
                            .foregroundColor(SBRColors.primaryBlue)
                        Text("Today's Collections")
                            .font(.caption)
                            .foregroundColor(.gray)
                            .fontWeight(.medium)
                        Text(formatCurrency(todaysCollections))
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textPrimary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.03), radius: 5, x: 0, y: 1)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                    )
                }
                .padding(.horizontal)
                
                Text("Collection History")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                    .padding(.horizontal)
                
                if completedJobs.isEmpty {
                    VStack {
                        Spacer().frame(height: 40)
                        Text("No payment collections found.")
                            .foregroundColor(.gray)
                            .frame(maxWidth: .infinity, alignment: .center)
                        Spacer()
                    }
                } else {
                    LazyVStack(spacing: 12) {
                        ForEach(completedJobs) { job in
                            HStack(spacing: 12) {
                                Image(systemName: "creditcard.fill")
                                    .font(.title2)
                                    .foregroundColor(SBRColors.primaryBlue)
                                    .frame(width: 40, height: 40)
                                    .background(SBRColors.primaryBlue.opacity(0.08))
                                    .cornerRadius(8)
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(job.serviceType)
                                        .fontWeight(.bold)
                                        .foregroundColor(SBRColors.textPrimary)
                                    Text("vs \(job.customerId?.name ?? "Customer")")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                    Text(formatDate(job.paymentTimestamp))
                                        .font(.caption2)
                                        .foregroundColor(.gray)
                                }
                                
                                Spacer()
                                
                                VStack(alignment: .trailing, spacing: 6) {
                                    Text(formatCurrency(job.paymentAmount ?? 0.0))
                                        .fontWeight(.bold)
                                        .foregroundColor(SBRColors.primaryBlue)
                                    
                                    Button(action: {
                                        selectedRequestDetail = job
                                    }) {
                                        Text("Details")
                                            .font(.footnote)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                            .padding(.vertical, 6)
                                            .padding(.horizontal, 12)
                                            .background(SBRColors.primaryBlue)
                                            .cornerRadius(6)
                                    }
                                }
                            }
                            .padding()
                            .background(Color.white)
                            .cornerRadius(12)
                            .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                
                Spacer()
            }
            .padding(.top)
        }
        .background(Color(red: 0.97, green: 0.98, blue: 1.0).ignoresSafeArea())
        .navigationTitle("Payments")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    // MARK: - Helpers
    
    private func isToday(dateString: String?) -> Bool {
        guard let dateString = dateString else { return false }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: dateString) else {
            let fallbackFormatter = ISO8601DateFormatter()
            guard let fallbackDate = fallbackFormatter.date(from: dateString) else { return false }
            return Calendar.current.isDateInToday(fallbackDate)
        }
        return Calendar.current.isDateInToday(date)
    }
    
    private func formatDate(_ dateString: String?) -> String {
        guard let dateString = dateString else { return "N/A" }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var resolvedDate: Date? = formatter.date(from: dateString)
        if resolvedDate == nil {
            let fallbackFormatter = ISO8601DateFormatter()
            resolvedDate = fallbackFormatter.date(from: dateString)
        }
        guard let date = resolvedDate else { return "N/A" }
        
        let outputFormatter = DateFormatter()
        outputFormatter.dateFormat = "dd MMM, yyyy"
        return outputFormatter.string(from: date)
    }
    
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "en_IN")
        return formatter.string(from: NSNumber(value: amount)) ?? "₹\(Int(amount))"
    }
}
