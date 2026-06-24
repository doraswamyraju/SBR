import SwiftUI

struct PaymentsView: View {
    @ObservedObject var requestVM: RequestViewModel
    
    var body: some View {
        VStack(spacing: 0) {
            let completedPaidRequests = requestVM.requests.filter { $0.paymentStatus == "Paid" }
            let totalCollected = completedPaidRequests.reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
            
            // Stats Panel
            VStack(spacing: 8) {
                Text("Total Collections")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .textCase(.uppercase)
                Text("₹\(Int(totalCollected))")
                    .font(.largeTitle)
                    .fontWeight(.black)
                    .foregroundColor(.green)
                Text("\(completedPaidRequests.count) Completed Invoices")
                    .font(.footnote)
                    .foregroundColor(.gray)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.white.opacity(0.02))
            .border(Color.white.opacity(0.05), width: 1)
            
            List {
                if completedPaidRequests.isEmpty {
                    Section {
                        Text("No payment collections registered yet.")
                            .foregroundColor(.gray)
                            .font(.footnote)
                            .listRowBackground(Color.clear)
                    }
                } else {
                    ForEach(completedPaidRequests) { req in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(req.serviceType)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                Spacer()
                                Text("₹\(Int(req.paymentAmount ?? 0.0))")
                                    .fontWeight(.black)
                                    .foregroundColor(.green)
                            }
                            
                            HStack {
                                Label(req.paymentMethod ?? "Online", systemImage: "creditcard")
                                Spacer()
                                Text(formatTimestamp(req.paymentTimestamp))
                            }
                            .font(.caption)
                            .foregroundColor(.gray)
                            
                            HStack {
                                Text("Client: \(req.customerId?.name ?? "Customer")")
                                Spacer()
                                Text("Technician: \(req.assignedAgentId?.name ?? "Agent")")
                            }
                            .font(.footnote)
                            .foregroundColor(.indigo)
                        }
                        .padding(.vertical, 4)
                        .listRowBackground(Color.white.opacity(0.01))
                    }
                }
            }
            .listStyle(PlainListStyle())
            .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
        }
        .navigationTitle("Accounts Ledger")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func formatTimestamp(_ timestampString: String?) -> String {
        guard let ts = timestampString else { return "N/A" }
        // Simple string parsing or standard date formatting
        if ts.count >= 10 {
            return String(ts.prefix(10))
        }
        return ts
    }
}
