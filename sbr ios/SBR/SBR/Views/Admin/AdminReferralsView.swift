import SwiftUI

struct AdminReferralsView: View {
    @StateObject private var viewModel = ReferralViewModel()
    @State private var selectedTab = 0 // 0: Leads, 1: Claims
    @State private var selectedReferral: Referral? = nil
    @State private var selectedClaim: ReferralClaim? = nil
    
    // Status update sheets fields
    @State private var showingReferralSheet = false
    @State private var showingClaimSheet = false
    
    @State private var referralStatus = "Pending"
    @State private var purchaseAmount = ""
    @State private var rewardAmount = ""
    @State private var referralNotes = ""
    
    @State private var claimStatus = "Pending"
    @State private var transactionRef = ""
    @State private var adminNotes = ""
    
    var body: some View {
        VStack(spacing: 0) {
            Picker("Select View", selection: $selectedTab) {
                Text("Referral Leads").tag(0)
                Text("Payout Claims").tag(1)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()
            .background(Color.white)
            
            if viewModel.isLoading {
                Spacer()
                ProgressView()
                Spacer()
            } else {
                if selectedTab == 0 {
                    // Leads List
                    let referrals = viewModel.allReferrals
                    if referrals.isEmpty {
                        Spacer()
                        Text("No referrals registered.")
                            .foregroundColor(.gray)
                        Spacer()
                    } else {
                        List(referrals) { ref in
                            Button(action: {
                                selectedReferral = ref
                                referralStatus = ref.status
                                purchaseAmount = ref.purchaseAmount != nil ? String(Int(ref.purchaseAmount!)) : ""
                                rewardAmount = String(Int(ref.rewardAmount))
                                referralNotes = ref.notes ?? ""
                                showingReferralSheet = true
                            }) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(ref.refereeName)
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(SBRColors.textPrimary)
                                        Text("Referred By Code: \(ref.referralCode)")
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                        Text("Phone: \(ref.refereePhone)")
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                        Text("Interest: \(ref.productName)")
                                            .font(.caption2)
                                            .fontWeight(.semibold)
                                            .foregroundColor(SBRColors.primaryBlue)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 4) {
                                        Text(ref.status)
                                            .font(.system(size: 9))
                                            .fontWeight(.bold)
                                            .padding(.vertical, 4)
                                            .padding(.horizontal, 8)
                                            .background(statusColor(ref.status).opacity(0.1))
                                            .foregroundColor(statusColor(ref.status))
                                            .cornerRadius(6)
                                        
                                        Text("Reward: ₹\(Int(ref.rewardAmount))")
                                            .font(.caption2)
                                            .fontWeight(.semibold)
                                            .foregroundColor(.gray)
                                    }
                                }
                            }
                            .listRowInsets(EdgeInsets())
                            .listRowBackground(Color.clear)
                            .padding(.horizontal)
                            .padding(.vertical, 6)
                        }
                        .listStyle(PlainListStyle())
                        .refreshable {
                            await viewModel.adminFetchAllReferrals()
                        }
                    }
                } else {
                    // Claims List
                    let claims = viewModel.allClaims
                    if claims.isEmpty {
                        Spacer()
                        Text("No payout requests registered.")
                            .foregroundColor(.gray)
                        Spacer()
                    } else {
                        List(claims) { claim in
                            Button(action: {
                                selectedClaim = claim
                                claimStatus = claim.status
                                transactionRef = claim.transactionRef ?? ""
                                adminNotes = claim.adminNotes ?? ""
                                showingClaimSheet = true
                            }) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(claim.userName)
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(SBRColors.textPrimary)
                                        Text("Phone: \(claim.userPhone)")
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                        Text("Method: \(claim.payoutMethod)")
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                        Text("Details: \(claim.payoutDetails)")
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 4) {
                                        Text("₹\(Int(claim.amount))")
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(SBRColors.primaryBlue)
                                        
                                        Text(claim.status)
                                            .font(.system(size: 9))
                                            .fontWeight(.bold)
                                            .padding(.vertical, 4)
                                            .padding(.horizontal, 8)
                                            .background(claimStatusColor(claim.status).opacity(0.1))
                                            .foregroundColor(claimStatusColor(claim.status))
                                            .cornerRadius(6)
                                    }
                                }
                            }
                            .listRowInsets(EdgeInsets())
                            .listRowBackground(Color.clear)
                            .padding(.horizontal)
                            .padding(.vertical, 6)
                        }
                        .listStyle(PlainListStyle())
                        .refreshable {
                            await viewModel.adminFetchAllClaims()
                        }
                    }
                }
            }
        }
        .background(SBRColors.background)
        .onAppear {
            Task {
                await viewModel.adminFetchAllReferrals()
                await viewModel.adminFetchAllClaims()
            }
        }
        .sheet(isPresented: $showingReferralSheet) {
            if let ref = selectedReferral {
                NavigationView {
                    Form {
                        Section(header: Text("Referral Lead Info")) {
                            HStack {
                                Text("Name")
                                Spacer()
                                Text(ref.refereeName).foregroundColor(.gray)
                            }
                            HStack {
                                Text("Product Interest")
                                Spacer()
                                Text(ref.productName).foregroundColor(.gray)
                            }
                        }
                        
                        Section(header: Text("Update Status")) {
                            Picker("Status", selection: $referralStatus) {
                                Text("Pending").tag("Pending")
                                Text("Contacted").tag("Contacted")
                                Text("Purchased").tag("Purchased")
                                Text("Reward Credited").tag("Reward Credited")
                            }
                            
                            TextField("Purchase Amount (₹)", text: $purchaseAmount)
                                .keyboardType(.numberPad)
                            
                            TextField("Reward Amount (₹)", text: $rewardAmount)
                                .keyboardType(.numberPad)
                            
                            TextField("Notes", text: $referNotes)
                        }
                    }
                    .navigationTitle("Update Referral Lead")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Cancel") { showingReferralSheet = false }
                        }
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Save") {
                                Task {
                                    let success = await viewModel.adminUpdateReferralStatus(
                                        id: ref.id,
                                        status: referralStatus,
                                        purchaseAmount: Double(purchaseAmount),
                                        rewardAmount: Double(rewardAmount),
                                        notes: referralNotes.isEmpty ? nil : referralNotes
                                    )
                                    if success {
                                        showingReferralSheet = false
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showingClaimSheet) {
            if let claim = selectedClaim {
                NavigationView {
                    Form {
                        Section(header: Text("Claim details")) {
                            HStack {
                                Text("Customer Name")
                                Spacer()
                                Text(claim.userName).foregroundColor(.gray)
                            }
                            HStack {
                                Text("Amount")
                                Spacer()
                                Text("₹\(Int(claim.amount))").foregroundColor(.gray)
                            }
                            HStack {
                                Text("Details")
                                Spacer()
                                Text(claim.payoutDetails).foregroundColor(.gray)
                            }
                        }
                        
                        Section(header: Text("Update Claim")) {
                            Picker("Status", selection: $claimStatus) {
                                Text("Pending").tag("Pending")
                                Text("Completed").tag("Completed")
                                Text("Rejected").tag("Rejected")
                            }
                            
                            TextField("Transaction Reference / ID", text: $transactionRef)
                            TextField("Admin Notes", text: $adminNotes)
                        }
                    }
                    .navigationTitle("Update Payout Request")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Cancel") { showingClaimSheet = false }
                        }
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Save") {
                                Task {
                                    let success = await viewModel.adminUpdateClaimStatus(
                                        id: claim.id,
                                        status: claimStatus,
                                        transactionRef: transactionRef.isEmpty ? nil : transactionRef,
                                        adminNotes: adminNotes.isEmpty ? nil : adminNotes
                                    )
                                    if success {
                                        showingClaimSheet = false
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    private func statusColor(_ status: String) -> Color {
        switch status {
        case "Purchased", "Reward Credited": return .green
        case "Contacted": return .orange
        default: return SBRColors.primaryBlue
        }
    }
    
    private func claimStatusColor(_ status: String) -> Color {
        switch status {
        case "Completed": return .green
        case "Rejected": return .red
        default: return .orange
        }
    }
}
