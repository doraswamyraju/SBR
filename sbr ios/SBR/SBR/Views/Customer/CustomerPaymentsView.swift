import SwiftUI

struct CustomerPaymentsView: View {
    @ObservedObject var requestVM: RequestViewModel
    var onSelectRequest: (ServiceRequest) -> Void
    
    private var myPaidRequests: [ServiceRequest] {
        requestVM.requests.filter { $0.paymentStatus == "Paid" }
    }
    
    private var totalSpent: Double {
        myPaidRequests.reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
    }
    
    private var freeServicesCount: Int {
        myPaidRequests.filter { ($0.paymentAmount ?? 0.0) == 0.0 }.count
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Summary Cards
                HStack(spacing: 16) {
                    // Card 1: Total Payments
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Total Payments Made")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textSecondary)
                        Spacer(minLength: 4)
                        Text("₹\(Int(totalSpent))")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textPrimary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .frame(height: 100)
                    .background(Color.white)
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 2)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.gray.opacity(0.1), lineWidth: 1)
                    )
                    
                    // Card 2: Free Services
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Free Services Used")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textSecondary)
                        Spacer(minLength: 4)
                        Text("\(freeServicesCount)")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textPrimary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .frame(height: 100)
                    .background(Color.white)
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 2)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.gray.opacity(0.1), lineWidth: 1)
                    )
                }
                
                Text("Payment History")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                    .padding(.top, 8)
                
                if myPaidRequests.isEmpty {
                    VStack {
                        Text("No payment history found.")
                            .foregroundColor(.gray)
                            .font(.subheadline)
                            .padding(.vertical, 32)
                    }
                    .frame(maxWidth: .infinity)
                    .background(Color.white)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.1), lineWidth: 1)
                    )
                } else {
                    VStack(spacing: 12) {
                        ForEach(myPaidRequests) { req in
                            HStack(spacing: 12) {
                                Image(systemName: "creditcard.fill")
                                    .font(.title3)
                                    .foregroundColor(SBRColors.primaryBlue)
                                    .frame(width: 44, height: 44)
                                    .background(SBRColors.primaryBlue.opacity(0.1))
                                    .cornerRadius(10)
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(req.serviceType)
                                        .font(.body)
                                        .fontWeight(.bold)
                                        .foregroundColor(SBRColors.textPrimary)
                                    
                                    Text(formatDate(req.paymentTimestamp ?? req.createdAt))
                                        .font(.caption)
                                        .foregroundColor(SBRColors.textSecondary)
                                }
                                
                                Spacer()
                                
                                VStack(alignment: .trailing, spacing: 6) {
                                    Text("₹\(Int(req.paymentAmount ?? 0.0))")
                                        .font(.body)
                                        .fontWeight(.bold)
                                        .foregroundColor(SBRColors.primaryBlue)
                                    
                                    Button(action: { onSelectRequest(req) }) {
                                        Text("Details")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                            .padding(.vertical, 4)
                                            .padding(.horizontal, 12)
                                            .background(SBRColors.primaryBlue)
                                            .cornerRadius(6)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding(16)
                            .background(Color.white)
                            .cornerRadius(12)
                            .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.1), lineWidth: 1)
                            )
                        }
                    }
                }
            }
            .padding()
        }
        .background(SBRColors.background.ignoresSafeArea())
        .navigationTitle("My Payments")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: dateString) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "dd MMM, yyyy"
            return outputFormatter.string(from: date)
        }
        return String(dateString.prefix(10))
    }
}
