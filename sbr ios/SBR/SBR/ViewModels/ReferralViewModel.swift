import Foundation
import Combine

@MainActor
class ReferralViewModel: ObservableObject {
    @Published var dashboard: ReferralDashboard? = nil
    @Published var allReferrals: [Referral] = []
    @Published var allClaims: [ReferralClaim] = []
    @Published var products: [Product] = [] // For selecting products in referral form
    @Published var isLoading = false
    @Published var successMessage: String? = nil
    @Published var errorMessage: String? = nil
    
    func clearMessages() {
        successMessage = nil
        errorMessage = nil
    }
    
    // CUSTOMER METHODS
    func fetchMyReferrals() async {
        isLoading = true
        errorMessage = nil
        do {
            let res = try await APIClient.shared.get(endpoint: "api/referrals/my-referrals", responseType: APIResponse<ReferralDashboard>.self)
            if res.success, let data = res.data {
                self.dashboard = data
            } else {
                self.errorMessage = res.error ?? "Failed to fetch referral dashboard"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func fetchProductsForReferral() async {
        do {
            // Load products list for dropdown
            let res = try await APIClient.shared.get(endpoint: "api/products?activeOnly=false", responseType: APIResponse<[Product]>.self)
            if res.success, let data = res.data {
                self.products = data
            }
        } catch {
            print("Failed to fetch products for referral dropdown: \(error)")
        }
    }
    
    func submitReferral(name: String, phone: String, productId: String?, productName: String, notes: String?) async -> Bool {
        isLoading = true
        errorMessage = nil
        successMessage = nil
        let req = SubmitReferralRequest(refereeName: name, refereePhone: phone, productId: productId, productName: productName, notes: notes)
        do {
            let res = try await APIClient.shared.post(endpoint: "api/referrals/submit", body: req, responseType: APIResponse<Referral>.self)
            if res.success {
                self.successMessage = "Referral submitted successfully!"
                await fetchMyReferrals()
                isLoading = false
                return true
            } else {
                self.errorMessage = res.error ?? "Failed to submit referral"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
        return false
    }
    
    func claimPayout(amount: Double, method: String, details: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        successMessage = nil
        let req = ClaimPayoutRequest(amount: amount, payoutMethod: method, payoutDetails: details)
        do {
            let res = try await APIClient.shared.post(endpoint: "api/referrals/claim-payout", body: req, responseType: APIResponse<ReferralClaim>.self)
            if res.success {
                self.successMessage = "Payout request submitted successfully!"
                await fetchMyReferrals()
                isLoading = false
                return true
            } else {
                self.errorMessage = res.error ?? "Failed to request payout"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
        return false
    }
    
    // ADMIN METHODS
    func adminFetchAllReferrals() async {
        isLoading = true
        errorMessage = nil
        do {
            let res = try await APIClient.shared.get(endpoint: "api/referrals/admin/all", responseType: APIResponse<[Referral]>.self)
            if res.success, let data = res.data {
                self.allReferrals = data
            } else {
                self.errorMessage = res.error ?? "Failed to fetch referrals"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func adminFetchAllClaims() async {
        isLoading = true
        errorMessage = nil
        do {
            let res = try await APIClient.shared.get(endpoint: "api/referrals/admin/claims", responseType: APIResponse<[ReferralClaim]>.self)
            if res.success, let data = res.data {
                self.allClaims = data
            } else {
                self.errorMessage = res.error ?? "Failed to fetch payout claims"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func adminUpdateReferralStatus(id: String, status: String, purchaseAmount: Double?, rewardAmount: Double?, notes: String?) async -> Bool {
        isLoading = true
        errorMessage = nil
        successMessage = nil
        let req = UpdateReferralStatusRequest(status: status, purchaseAmount: purchaseAmount, rewardAmount: rewardAmount, notes: notes)
        do {
            let res = try await APIClient.shared.put(endpoint: "api/referrals/admin/\(id)/status", body: req, responseType: APIResponse<Referral>.self)
            if res.success {
                self.successMessage = "Referral updated successfully!"
                await adminFetchAllReferrals()
                isLoading = false
                return true
            } else {
                self.errorMessage = res.error ?? "Failed to update referral"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
        return false
    }
    
    func adminUpdateClaimStatus(id: String, status: String, transactionRef: String?, adminNotes: String?) async -> Bool {
        isLoading = true
        errorMessage = nil
        successMessage = nil
        let req = UpdateClaimStatusRequest(status: status, transactionRef: transactionRef, adminNotes: adminNotes)
        do {
            let res = try await APIClient.shared.put(endpoint: "api/referrals/admin/claims/\(id)/status", body: req, responseType: APIResponse<ReferralClaim>.self)
            if res.success {
                self.successMessage = "Claim status updated successfully!"
                await adminFetchAllClaims()
                isLoading = false
                return true
            } else {
                self.errorMessage = res.error ?? "Failed to update claim"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
        return false
    }
}
