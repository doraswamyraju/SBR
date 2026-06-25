import SwiftUI

struct AgentAnalyticsView: View {
    @ObservedObject var requestVM: RequestViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                let completedJobs = requestVM.requests.filter { $0.status == .completed || $0.paymentStatus == "Paid" }
                let totalEarnings = completedJobs.reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
                
                // Header Analytics Card
                VStack(spacing: 12) {
                    Text("My Performance Dashboard")
                        .font(.headline)
                        .foregroundColor(.indigo)
                    
                    HStack(spacing: 20) {
                        VStack(spacing: 4) {
                            Text("Jobs Solved")
                                .font(.caption)
                                .foregroundColor(.gray)
                            Text("\(completedJobs.count)")
                                .font(.title)
                                .fontWeight(.black)
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.white.opacity(0.03))
                        .cornerRadius(10)
                        
                        VStack(spacing: 4) {
                            Text("Total Earnings")
                                .font(.caption)
                                .foregroundColor(.gray)
                            Text("₹\(Int(totalEarnings))")
                                .font(.title)
                                .fontWeight(.black)
                                .foregroundColor(.green)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.white.opacity(0.03))
                        .cornerRadius(10)
                    }
                }
                .padding()
                .background(Color.white.opacity(0.02))
                .cornerRadius(12)
                .padding(.horizontal)
                
                // Job breakdown ledger
                VStack(alignment: .leading, spacing: 14) {
                    Text("RECENT RESOLVED JOBS")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.indigo)
                        .padding(.horizontal)
                    
                    if completedJobs.isEmpty {
                        Text("No completed job logs registered.")
                            .font(.footnote)
                            .foregroundColor(.gray)
                            .padding()
                    } else {
                        ForEach(completedJobs) { job in
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(job.serviceType)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                    Text("Client: \(job.customerId?.name ?? "Customer")")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 4) {
                                    Text("₹\(Int(job.paymentAmount ?? 0.0))")
                                        .fontWeight(.bold)
                                        .foregroundColor(.green)
                                    Text(job.paymentMethod ?? "Cash")
                                        .font(.caption2)
                                        .foregroundColor(.gray)
                                }
                            }
                            .padding()
                            .background(Color.white.opacity(0.01))
                            .cornerRadius(10)
                            .padding(.horizontal)
                        }
                    }
                }
                
                Spacer()
            }
            .padding(.top)
        }
        .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
        .navigationTitle("Analytics & Logs")
        .navigationBarTitleDisplayMode(.inline)
    }
}
