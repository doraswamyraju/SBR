import SwiftUI

struct ReferAndEarnView: View {
    @StateObject private var viewModel = ReferralViewModel()
    @State private var showingSubmitReferralSheet = false
    @State private var showingClaimPayoutSheet = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header card
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        Image(systemName: "giftcard.fill")
                            .font(.title)
                            .foregroundColor(SBRColors.primaryBlue)
                        Text("Refer & Earn Rewards!")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.primaryBlue)
                    }
                    
                    Text("Share your code and earn cash rewards when your friends purchase Sri Balaji Renewables (SBR) products.")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .lineLimit(2)
                    
                    // Referral Code Copy/Share Box
                    let code = viewModel.dashboard?.referralCode ?? "SBR-EARN"
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("YOUR REFERRAL CODE")
                                .font(.system(size: 9))
                                .fontWeight(.bold)
                                .foregroundColor(.gray)
                            Text(code)
                                .font(.title3)
                                .fontWeight(.black)
                                .foregroundColor(SBRColors.textPrimary)
                        }
                        
                        Spacer()
                        
                        HStack(spacing: 8) {
                            Button(action: {
                                UIPasteboard.general.string = code
                                viewModel.successMessage = "Code copied to clipboard!"
                            }) {
                                Image(systemName: "doc.on.doc.fill")
                                    .foregroundColor(SBRColors.primaryBlue)
                                    .padding(8)
                                    .background(SBRColors.primaryBlue.opacity(0.08))
                                    .cornerRadius(8)
                            }
                            
                            // WhatsApp Share Button
                            Button(action: {
                                shareToWhatsApp(code: code)
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "square.and.arrow.up")
                                    Text("Share")
                                }
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.vertical, 8)
                                .padding(.horizontal, 12)
                                .background(Color(red: 37/255, green: 211/255, blue: 102/255)) // WhatsApp green
                                .cornerRadius(8)
                            }
                        }
                    }
                    .padding()
                    .background(SBRColors.background)
                    .cornerRadius(12)
                }
                .padding()
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                
                // Stats Card Grid (Invited, Converted, Total Earned, Available)
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        MiniStatCard(
                            title: "Invited",
                            value: "\(viewModel.dashboard?.totalInvited ?? 0)",
                            icon: "person.2.fill"
                        )
                        MiniStatCard(
                            title: "Converted",
                            value: "\(viewModel.dashboard?.convertedCount ?? 0)",
                            icon: "checkmark.seal.fill"
                        )
                    }
                    HStack(spacing: 12) {
                        MiniStatCard(
                            title: "Total Earned",
                            value: "₹\(Int(viewModel.dashboard?.totalEarnings ?? 0.0))",
                            icon: "indianrupeesign.circle.fill",
                            isHighlight: true
                        )
                        MiniStatCard(
                            title: "Available",
                            value: "₹\(Int(viewModel.dashboard?.availableBalance ?? 0.0))",
                            icon: "creditcard.fill",
                            isHighlight: true
                        )
                    }
                }
                
                // Payout Request Section
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Payout Balance")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textPrimary)
                        Text("Min request is ₹500 via UPI/Bank.")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                    Spacer()
                    Button(action: {
                        showingClaimPayoutSheet = true
                    }) {
                        Text("Claim Payout")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.vertical, 10)
                            .padding(.horizontal, 16)
                            .background(SBRColors.primaryBlue)
                            .cornerRadius(10)
                    }
                }
                .padding()
                .background(Color.white)
                .cornerRadius(14)
                .shadow(color: Color.black.opacity(0.01), radius: 3)
                
                // Refer a Friend Button
                Button(action: {
                    showingSubmitReferralSheet = true
                }) {
                    HStack {
                        Spacer()
                        Image(systemName: "person.badge.plus")
                        Text("Refer a Friend")
                            .fontWeight(.bold)
                        Spacer()
                    }
                    .padding()
                    .foregroundColor(.white)
                    .background(SBRColors.primaryBlue)
                    .cornerRadius(12)
                    .shadow(color: SBRColors.primaryBlue.opacity(0.1), radius: 3, x: 0, y: 2)
                }
                
                // Submitted Referrals list
                VStack(alignment: .leading, spacing: 10) {
                    Text("Your Submitted Referrals")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                    
                    let referrals = viewModel.dashboard?.referrals ?? []
                    if referrals.isEmpty {
                        VStack(spacing: 8) {
                            Text("No referral leads submitted yet.")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                        .background(Color.white)
                        .cornerRadius(12)
                    } else {
                        ForEach(referrals) { ref in
                            ReferralRowView(referral: ref)
                        }
                    }
                }
                
                // Submitted payout claims list
                VStack(alignment: .leading, spacing: 10) {
                    Text("Your Payout Requests")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                    
                    let claims = viewModel.dashboard?.claims ?? []
                    if claims.isEmpty {
                        VStack {
                            Text("No payout requests submitted yet.")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 20)
                        .background(Color.white)
                        .cornerRadius(12)
                    } else {
                        ForEach(claims) { claim in
                            ClaimRowView(claim: claim)
                        }
                    }
                }
            }
            .padding()
        }
        .background(SBRColors.background.ignoresSafeArea())
        .onAppear {
            Task {
                await viewModel.fetchMyReferrals()
                await viewModel.fetchProductsForReferral()
            }
        }
        .alert(isPresented: Binding<Bool>(
            get: { viewModel.successMessage != nil || viewModel.errorMessage != nil },
            set: { _ in viewModel.clearMessages() }
        )) {
            Alert(
                title: Text(viewModel.successMessage != nil ? "Success" : "Error"),
                message: Text(viewModel.successMessage ?? viewModel.errorMessage ?? ""),
                dismissButton: .default(Text("OK"))
            )
        }
        .sheet(isPresented: $showingSubmitReferralSheet) {
            SubmitReferralSheet(
                products: viewModel.products,
                onSubmit: { name, phone, prodId, prodName, notes in
                    Task {
                        let success = await viewModel.submitReferral(name: name, phone: phone, productId: prodId, productName: prodName, notes: notes)
                        if success {
                            showingSubmitReferralSheet = false
                        }
                    }
                }
            )
        }
        .sheet(isPresented: $showingClaimPayoutSheet) {
            ClaimPayoutSheet(
                availableBalance: viewModel.dashboard?.availableBalance ?? 0.0,
                onSubmit: { amount, method, details in
                    Task {
                        let success = await viewModel.claimPayout(amount: amount, method: method, details: details)
                        if success {
                            showingClaimPayoutSheet = false
                        }
                    }
                }
            )
        }
    }
    
    private func shareToWhatsApp(code: String) {
        let msg = "Hey! Use my referral code *\(code)* when booking solar panels or water systems with Sri Balaji Renewables (SBR) to get special discounts! https://sbr.sriddha.com"
        guard let encoded = msg.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else { return }
        
        let whatsappURL = URL(string: "whatsapp://send?text=\(encoded)")
        let genericURL = URL(string: "https://wa.me/?text=\(encoded)")
        
        if let url = whatsappURL, UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        } else if let url = genericURL {
            // Fallback to web WhatsApp or Activity Controller
            let activityVC = UIActivityViewController(activityItems: [msg], applicationActivities: nil)
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let rootVC = windowScene.windows.first?.rootViewController {
                rootVC.present(activityVC, animated: true)
            }
        }
    }
}

struct MiniStatCard: View {
    let title: String
    let value: String
    let icon: String
    var isHighlight: Bool = false
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(SBRColors.primaryBlue)
                .frame(width: 40, height: 40)
                .background(SBRColors.primaryBlue.opacity(0.08))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
                Text(value)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
            }
            Spacer()
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 14)
        .background(isHighlight ? SBRColors.primaryBlue.opacity(0.04) : Color.white)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.12), lineWidth: 1)
        )
    }
}

struct ReferralRowView: View {
    let referral: Referral
    
    var statusColor: Color {
        switch referral.status {
        case "Purchased", "Reward Credited": return .green
        case "Contacted": return .orange
        default: return SBRColors.primaryBlue
        }
    }
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(referral.refereeName)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                Text("Phone: \(referral.refereePhone)")
                    .font(.caption2)
                    .foregroundColor(.gray)
                Text("Product: \(referral.productName)")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundColor(.gray)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text(referral.status)
                    .font(.system(size: 9))
                    .fontWeight(.bold)
                    .padding(.vertical, 4)
                    .padding(.horizontal, 8)
                    .background(statusColor.opacity(0.1))
                    .foregroundColor(statusColor)
                    .cornerRadius(6)
                
                if referral.rewardAmount > 0 {
                    Text("+₹\(Int(referral.rewardAmount))")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.01), radius: 2)
    }
}

struct ClaimRowView: View {
    let claim: ReferralClaim
    
    var statusColor: Color {
        switch claim.status {
        case "Completed": return .green
        case "Rejected": return .red
        default: return .orange
        }
    }
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("₹\(Int(claim.amount)) via \(claim.payoutMethod)")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                Text(claim.payoutDetails)
                    .font(.caption2)
                    .foregroundColor(.gray)
                if let ref = claim.transactionRef, !ref.isEmpty {
                    Text("Ref: \(ref)")
                        .font(.system(size: 9, design: .monospaced))
                        .foregroundColor(.gray)
                }
            }
            Spacer()
            Text(claim.status)
                .font(.system(size: 9))
                .fontWeight(.bold)
                .padding(.vertical, 4)
                .padding(.horizontal, 8)
                .background(statusColor.opacity(0.1))
                .foregroundColor(statusColor)
                .cornerRadius(6)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.01), radius: 2)
    }
}

struct SubmitReferralSheet: View {
    let products: [Product]
    let onSubmit: (String, String, String?, String, String?) -> Void
    @Environment(\.dismiss) var dismiss
    
    @State private var name = ""
    @State private var phone = ""
    @State private var selectedProduct: Product? = nil
    @State private var notes = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Friend's Details")) {
                    TextField("Full Name *", text: $name)
                    TextField("Phone Number *", text: $phone)
                        .keyboardType(.phonePad)
                }
                
                Section(header: Text("Product Interest")) {
                    Picker("Select Product", selection: $selectedProduct) {
                        Text("Select Product").tag(nil as Product?)
                        ForEach(products) { prod in
                            Text(prod.name).tag(prod as Product?)
                        }
                    }
                }
                
                Section(header: Text("Notes (Optional)")) {
                    TextEditor(text: $notes)
                        .frame(height: 80)
                }
            }
            .navigationTitle("Refer a Friend")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit") {
                        if !name.isEmpty && !phone.isEmpty {
                            let prodId = selectedProduct?.id
                            let prodName = selectedProduct?.name ?? "Custom Inquiry"
                            onSubmit(name, phone, prodId, prodName, notes.isEmpty ? nil : notes)
                        }
                    }
                    .disabled(name.isEmpty || phone.isEmpty)
                }
            }
            .onAppear {
                if selectedProduct == nil {
                    selectedProduct = products.first
                }
            }
        }
    }
}

struct ClaimPayoutSheet: View {
    let availableBalance: Double
    let onSubmit: (Double, String, String) -> Void
    @Environment(\.dismiss) var dismiss
    
    @State private var amount = ""
    @State private var payoutMethod = "UPI"
    @State private var payoutDetails = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Balance Information")) {
                    HStack {
                        Text("Available Balance")
                        Spacer()
                        Text("₹\(Int(availableBalance))")
                            .fontWeight(.bold)
                    }
                }
                
                Section(header: Text("Payout Request")) {
                    TextField("Amount (Min ₹500)", text: $amount)
                        .keyboardType(.numberPad)
                    
                    Picker("Payout Method", selection: $payoutMethod) {
                        Text("UPI").tag("UPI")
                        Text("Bank Transfer").tag("Bank Transfer")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    
                    TextField(payoutMethod == "UPI" ? "UPI ID (e.g. 9876543210@ybl)" : "Bank Name, A/C No, IFSC Code", text: $payoutDetails)
                }
            }
            .navigationTitle("Request Payout")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    let amtVal = Double(amount) ?? 0.0
                    Button("Request") {
                        onSubmit(amtVal, payoutMethod, payoutDetails)
                    }
                    .disabled(amtVal < 500.0 || amtVal > availableBalance || payoutDetails.isEmpty)
                }
            }
            .onAppear {
                if availableBalance >= 500 {
                    amount = "500"
                }
            }
        }
    }
}
