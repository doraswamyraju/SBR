import Foundation
import CoreLocation
import Combine

@MainActor
class RequestViewModel: ObservableObject {
    @Published var requests: [ServiceRequest] = []
    @Published var users: [User] = [] // For Admin user list
    @Published var isLoading = false
    @Published var errorMessage: String? = nil
    
    // Real Location Manager
    @Published var locationManager = LocationManager()
    
    struct StandardResponse<T: Decodable>: Decodable {
        let success: Bool
        let data: T?
        let error: String?
    }
    
    // Fetch requests (populates user-role specific lists automatically via backend guards)
    func fetchRequests() async {
        isLoading = true
        errorMessage = nil
        do {
            let res = try await APIClient.shared.get(endpoint: "api/requests", responseType: StandardResponse<[ServiceRequest]>.self)
            if res.success, let data = res.data {
                self.requests = data
            } else {
                self.errorMessage = res.error ?? "Failed to fetch requests"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // Fetch all users (for Admin dashboard)
    func fetchUsers() async {
        isLoading = true
        errorMessage = nil
        do {
            let res = try await APIClient.shared.get(endpoint: "api/users", responseType: StandardResponse<[User]>.self)
            if res.success, let data = res.data {
                self.users = data
            } else {
                self.errorMessage = res.error ?? "Failed to fetch users"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func bookRequest(serviceType: String, description: String, address: String, latitude: Double? = nil, longitude: Double? = nil) async -> Bool {
        isLoading = true
        errorMessage = nil
        var body: [String: AnyEncodable] = [
            "serviceType": AnyEncodable(serviceType),
            "description": AnyEncodable(description),
            "customerAddress": AnyEncodable(address)
        ]
        
        if let latitude = latitude {
            body["latitude"] = AnyEncodable(latitude)
        }
        if let longitude = longitude {
            body["longitude"] = AnyEncodable(longitude)
        }
        
        do {
            let res = try await APIClient.shared.post(endpoint: "api/requests", body: body, responseType: StandardResponse<ServiceRequest>.self)
            isLoading = false
            return res.success
        } catch {
            self.errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }
    
    // Assign Agent to Request (Admin)
    func assignAgent(requestId: String, agentId: String) async -> Bool {
        let body = ["agentId": agentId]
        do {
            let res = try await APIClient.shared.put(endpoint: "api/requests/\(requestId)/assign", body: body, responseType: StandardResponse<ServiceRequest>.self)
            return res.success
        } catch {
            self.errorMessage = error.localizedDescription
            return false
        }
    }
    
    // Update Request Status (Agent)
    func updateStatus(requestId: String, status: RequestStatus, requestReview: Bool = false) async -> Bool {
        isLoading = true
        errorMessage = nil
        let body: [String: AnyEncodable] = [
            "status": AnyEncodable(status.rawValue),
            "requestReview": AnyEncodable(requestReview)
        ]
        do {
            let res = try await APIClient.shared.put(endpoint: "api/requests/\(requestId)/status", body: body, responseType: StandardResponse<ServiceRequest>.self)
            isLoading = false
            if res.success {
                return true
            } else {
                self.errorMessage = res.error ?? "Failed to update status"
                return false
            }
        } catch {
            self.errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }
    
    // Complete Job & Record Payment (Agent)
    func completeJob(requestId: String, amount: Double, method: String, requestReview: Bool = false) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        let paymentBody: [String: AnyEncodable] = [
            "amount": AnyEncodable(amount),
            "method": AnyEncodable(method)
        ]
        
        let statusBody: [String: AnyEncodable] = [
            "status": AnyEncodable(RequestStatus.completed.rawValue),
            "requestReview": AnyEncodable(requestReview)
        ]
        
        do {
            // 1. Record payment details
            let paymentRes = try await APIClient.shared.put(endpoint: "api/requests/\(requestId)/payment", body: paymentBody, responseType: StandardResponse<ServiceRequest>.self)
            
            // 2. Mark request completed
            if paymentRes.success {
                let statusRes = try await APIClient.shared.put(endpoint: "api/requests/\(requestId)/status", body: statusBody, responseType: StandardResponse<ServiceRequest>.self)
                isLoading = false
                if statusRes.success {
                    return true
                } else {
                    self.errorMessage = statusRes.error ?? "Failed to mark request completed"
                    return false
                }
            } else {
                self.errorMessage = paymentRes.error ?? "Failed to record payment"
                isLoading = false
                return false
            }
        } catch {
            self.errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }
    
    // Record Payment Details Only (Agent)
    func recordPayment(requestId: String, amount: Double, method: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        let body: [String: AnyEncodable] = [
            "amount": AnyEncodable(amount),
            "method": AnyEncodable(method)
        ]
        
        do {
            let res = try await APIClient.shared.put(endpoint: "api/requests/\(requestId)/payment", body: body, responseType: StandardResponse<ServiceRequest>.self)
            isLoading = false
            if res.success {
                return true
            } else {
                self.errorMessage = res.error ?? "Failed to record payment"
                return false
            }
        } catch {
            self.errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }
    
    // Upload image documentation (Agent)
    func uploadRequestImage(requestId: String, imageData: Data, type: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            // 1. Upload file to VPS
            let url = try await APIClient.shared.uploadImage(imageData: imageData, filename: "img_\(requestId)_\(type)")
            
            // 2. Associate image url to request
            let body = ["imageUrl": url, "imageType": type]
            let res = try await APIClient.shared.put(endpoint: "api/requests/\(requestId)/image", body: body, responseType: StandardResponse<ServiceRequest>.self)
            isLoading = false
            if res.success {
                return true
            } else {
                self.errorMessage = res.error ?? "Failed to associate image"
                return false
            }
        } catch {
            self.errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }
    
    // Real Location Broadcaster
    func startLocationTracking(activeRequestId: String) {
        locationManager.startTracking(activeRequestId: activeRequestId)
    }
    
    func stopLocationTracking() {
        locationManager.stopTracking()
    }
    
    // Delete service request (Admin)
    func deleteRequest(requestId: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            struct DeleteResponse: Decodable { let success: Bool }
            let res = try await APIClient.shared.delete(endpoint: "api/requests/\(requestId)", responseType: DeleteResponse.self)
            if res.success {
                await fetchRequests()
                return true
            }
            return false
        } catch {
            self.errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }
}

// Helper generic Encodable struct for mixing types in dictionaries
struct AnyEncodable: Encodable {
    private let encode: (Encoder) throws -> Void
    
    init<T: Encodable>(_ value: T) {
        self.encode = value.encode
    }
    
    func encode(to encoder: Encoder) throws {
        try encode(encoder)
    }
}
