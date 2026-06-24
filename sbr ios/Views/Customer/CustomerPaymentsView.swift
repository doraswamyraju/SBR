import SwiftUI

struct CustomerPaymentsView: View {
    @ObservedObject var requestVM: RequestViewModel
    
    var body: some View {
        VStack(spacing: 0) {
            let myPaidRequests = requestVM.requests.filter { $0.paymentStatus == "Paid" }
            let totalSpent = myPaidRequests.reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
            
            // Spending Panel
            VStack(spacing: 8) {
                Text("Total Settled Payments")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .textCase(.uppercase)
                Text("₹\(Int(totalSpent))")
                    .font(.largeTitle)
                    .fontWeight(.black)
                    .foregroundColor(.green)
                Text("\(myPaidRequests.count) Completed Payments")
                    .font(.footnote)
                    .foregroundColor(.gray)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.white.opacity(0.02))
            .border(Color.white.opacity(0.05), width: 1)
            
            List {
                if myPaidRequests.isEmpty {
                    Section {
                        Text("No payment transactions found.")
                            .foregroundColor(.gray)
                            .font(.footnote)
                            .listRowBackground(Color.clear)
                    }
                } else {
                    ForEach(myPaidRequests) { req in
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
                                Label(req.paymentMethod ?? "UPI", systemImage: "creditcard")
                                Spacer()
                                Text(formatTimestamp(req.paymentTimestamp))
                            }
                            .font(.caption)
                            .foregroundColor(.gray)
                            
                            if let agent = req.assignedAgentId {
                                Text("Serviced by: \(agent.name)")
                                    .font(.caption2)
                                    .foregroundColor(.indigo)
                            }
                        }
                        .padding(.vertical, 4)
                        .listRowBackground(Color.white.opacity(0.01))
                    }
                }
            }
            .listStyle(PlainListStyle())
            .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
        }
        .navigationTitle("My Billing")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func formatTimestamp(_ timestampString: String?) -> String {
        guard let ts = timestampString else { return "N/A" }
        if ts.count >= 10 {
            return String(ts.prefix(10))
        }
        return ts
    }
}
