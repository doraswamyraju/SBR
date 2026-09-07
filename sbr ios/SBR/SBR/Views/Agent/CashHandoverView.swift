import SwiftUI

struct CashHandoverView: View {
    @State private var dailySummary: AgentDailySummary?
    @State private var isLoading = false
    @State private var isSubmitting = false
    @State private var agentNotes = ""
    @State private var showSuccessAlert = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Summary Header Card
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("End-of-Day Cash Handover")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                Text("Reconcile daily cash collections with Store In-Charge")
                                    .font(.caption)
                                    .foregroundColor(Color.white.opacity(0.8))
                            }
                            Spacer()
                            Image(systemName: "banknote.fill")
                                .font(.system(size: 30))
                                .foregroundColor(Color.yellow)
                        }
                        
                        Divider().background(Color.white.opacity(0.3))
                        
                        HStack(spacing: 20) {
                            VStack(alignment: .leading) {
                                Text("TODAY'S CASH")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(Color.white.opacity(0.8))
                                Text("₹\(String(format: "%.2f", dailySummary?.totalCollectedCash ?? 0))")
                                    .font(.title2)
                                    .fontWeight(.heavy)
                                    .foregroundColor(.white)
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing) {
                                Text("JOBS COMPLETED")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(Color.white.opacity(0.8))
                                Text("\(dailySummary?.completedJobsCount ?? 0)")
                                    .font(.title2)
                                    .fontWeight(.heavy)
                                    .foregroundColor(.white)
                            }
                        }
                    }
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [Color(red: 0.05, green: 0.35, blue: 0.65), Color(red: 0.1, green: 0.5, blue: 0.85)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
                    
                    // Status or Submission Section
                    if let summary = dailySummary, summary.hasSubmittedHandover, let handover = summary.latestHandover {
                        // Already submitted card
                        VStack(alignment: .leading, spacing: 14) {
                            HStack {
                                Text("Submission Status")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.primary)
                                Spacer()
                                StatusBadgeView(status: handover.status)
                            }
                            
                            Divider()
                            
                            HStack {
                                Text("Handover Amount:")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("₹\(String(format: "%.2f", handover.totalCollectedCash))")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                            }
                            
                            if let inchargeNotes = handover.inchargeNotes, !inchargeNotes.isEmpty {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Store In-Charge Notes:")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Text(inchargeNotes)
                                        .font(.subheadline)
                                        .foregroundColor(.primary)
                                }
                                .padding(8)
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(8)
                            }
                            
                            if handover.status == .discrepancy, let disc = handover.discrepancyAmount {
                                HStack {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundColor(.red)
                                    Text("Discrepancy: ₹\(String(format: "%.2f", disc))")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.red)
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(14)
                        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                    } else {
                        // Submission Form
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Submit Handover")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            Text("You are submitting today's collected cash of ₹\(String(format: "%.2f", dailySummary?.totalCollectedCash ?? 0)) for verification by Store In-Charge.")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Notes / Denomination remarks (Optional)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                TextField("e.g. ₹500x4, ₹200x5...", text: $agentNotes)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }
                            
                            Button(action: submitHandover) {
                                HStack {
                                    if isSubmitting {
                                        ProgressView().tint(.white)
                                    } else {
                                        Image(systemName: "checkmark.circle.fill")
                                        Text("Submit Handover")
                                            .fontWeight(.bold)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }
                            .disabled(isSubmitting || (dailySummary?.totalCollectedCash ?? 0) < 0)
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(14)
                        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                    }
                }
                .padding()
            }
            .navigationTitle("Cash Handover")
            .onAppear(perform: loadSummary)
            .alert("Success", isPresented: $showSuccessAlert) {
                Button("OK") { loadSummary() }
            } message: {
                Text("Cash handover submitted successfully for Store In-Charge verification.")
            }
        }
    }
    
    private func loadSummary() {
        isLoading = true
        Task {
            do {
                let res = try await APIClient.shared.get(
                    endpoint: "api/handovers/agent-daily-summary",
                    responseType: ApiResponse<AgentDailySummary>.self
                )
                if res.success, let data = res.data {
                    DispatchQueue.main.async {
                        self.dailySummary = data
                        self.isLoading = false
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }
    
    private func submitHandover() {
        guard let summary = dailySummary else { return }
        isSubmitting = true
        struct SubmitBody: Encodable {
            let totalCollectedCash: Double
            let completedRequests: [String]
            let agentNotes: String
        }
        
        let body = SubmitBody(
            totalCollectedCash: summary.totalCollectedCash,
            completedRequests: summary.completedRequestIds,
            agentNotes: agentNotes
        )
        
        Task {
            do {
                let res = try await APIClient.shared.post(
                    endpoint: "api/handovers/submit",
                    body: body,
                    responseType: ApiResponse<CashHandover>.self
                )
                DispatchQueue.main.async {
                    self.isSubmitting = false
                    if res.success {
                        self.showSuccessAlert = true
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    self.isSubmitting = false
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
}

struct StatusBadgeView: View {
    let status: HandoverStatus
    
    var body: some View {
        Text(status.rawValue)
            .font(.caption)
            .fontWeight(.bold)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(bgColor.opacity(0.15))
            .foregroundColor(bgColor)
            .cornerRadius(8)
    }
    
    var bgColor: Color {
        switch status {
        case .submitted: return .orange
        case .acknowledged: return .green
        case .discrepancy: return .red
        }
    }
}
