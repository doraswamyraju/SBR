import Foundation
import Combine

@MainActor
class AuthViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    @Published var errorMessage: String? = nil
    @Published var isAuthenticated = false
    
    struct AuthResponse: Decodable {
        let success: Bool
        let token: String?
        let user: User?
        let error: String?
    }
    
    init() {
        restoreSession()
    }
    
    // Check if token exists on app launch
    func restoreSession() {
        if let storedUser = UserDefaults.standard.data(forKey: "auth_user") {
            if let decodedUser = try? JSONDecoder().decode(User.self, from: storedUser) {
                self.user = decodedUser
                self.isAuthenticated = true
            }
        }
    }
    
    // Login with Email/Password
    func login(email: String, password: String, fcmToken: String? = nil) async {
        isLoading = true
        errorMessage = nil
        
        let body: [String: String] = [
            "email": email,
            "password": password,
            "fcmToken": fcmToken ?? ""
        ]
        
        do {
            let res = try await APIClient.shared.post(endpoint: "api/auth/login", body: body, responseType: AuthResponse.self)
            if res.success, let token = res.token, let authUser = res.user {
                APIClient.shared.saveToken(token)
                
                if let encodedUser = try? JSONEncoder().encode(authUser) {
                    UserDefaults.standard.set(encodedUser, forKey: "auth_user")
                }
                
                self.user = authUser
                self.isAuthenticated = true
            } else {
                self.errorMessage = res.error ?? "Login failed"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // Register account
    func register(name: String, email: String, password: String, role: UserRole, phone: String) async {
        isLoading = true
        errorMessage = nil
        
        let body: [String: String] = [
            "name": name,
            "email": email,
            "password": password,
            "role": role.rawValue,
            "phone": phone
        ]
        
        do {
            let res = try await APIClient.shared.post(endpoint: "api/auth/register", body: body, responseType: AuthResponse.self)
            if res.success, let token = res.token, let authUser = res.user {
                APIClient.shared.saveToken(token)
                
                if let encodedUser = try? JSONEncoder().encode(authUser) {
                    UserDefaults.standard.set(encodedUser, forKey: "auth_user")
                }
                
                self.user = authUser
                self.isAuthenticated = true
            } else {
                self.errorMessage = res.error ?? "Registration failed"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    // Sign Out
    func logout(fcmToken: String? = nil) async {
        let body: [String: String] = ["fcmToken": fcmToken ?? ""]
        struct LogoutResponse: Decodable {
            let success: Bool
        }
        
        // Call backend logout asynchronously to clear FCM registration
        _ = try? await APIClient.shared.post(endpoint: "api/auth/logout", body: body, responseType: LogoutResponse.self)
        
        APIClient.shared.clearToken()
        self.user = nil
        self.isAuthenticated = false
    }
}
