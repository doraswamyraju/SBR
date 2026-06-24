import Foundation
import CoreLocation

@MainActor
class RequestViewModel: ObservableObject {
    @Published var requests: [ServiceRequest] = []
    @Published var users: [User] = [] // For Admin user list
    @Published var isLoading = false
    @Published var errorMessage: String? = nil
    
    // Core Location Simulation timer
    private var trackingTimer: Timer?
    
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
    
    // Book a new service request (Customer)
    func bookRequest(serviceType: String, description: String, address: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        let body = [
            "serviceType": serviceType,
            "description": description,
            "customerAddress": address
        ]
        
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
        let body: [String: AnyEncodable] = [
            "status": AnyEncodable(status.rawValue),
            "requestReview": AnyEncodable(requestReview)
        ]
        do {
            let res = try await APIClient.shared.put(endpoint: "api/requests/\(requestId)/status", body: body, responseType: StandardResponse<ServiceRequest>.self)
            return res.success
        } catch {
            self.errorMessage = error.localizedDescription
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
                return statusRes.success
            }
            isLoading = false
            return false
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
            return res.success
        } catch {
            self.errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }
    
    // Mock Location Broadcaster Simulation
    func startLocationSimulation(activeRequestId: String) {
        stopLocationSimulation()
        
        var currentLat = 12.9716 // Bangalore center seed
        var currentLng = 77.5946
        
        trackingTimer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { _ in
            Task {
                currentLat += (Double.random(in: -0.5...0.5)) * 0.002
                currentLng += (Double.random(in: -0.5...0.5)) * 0.002
                
                // 1. Update overall agent coordinates
                let agentBody = ["latitude": currentLat, "longitude": currentLng]
                struct LocationResponse: Decodable { let success: Bool }
                _ = try? await APIClient.shared.put(endpoint: "api/users/agent/location", body: agentBody, responseType: LocationResponse.self)
                
                // 2. Append request coordinates trace path
                let requestBody = ["latitude": currentLat, "longitude": currentLng]
                _ = try? await APIClient.shared.post(endpoint: "api/requests/\(activeRequestId)/location", body: requestBody, responseType: LocationResponse.self)
            }
        }
    }
    
    func stopLocationSimulation() {
        trackingTimer?.invalidate()
        trackingTimer = nil
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
