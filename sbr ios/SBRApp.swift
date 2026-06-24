import SwiftUI

@main
struct SBRApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @StateObject var authVM = AuthViewModel()
    
    var body: some Scene {
        WindowGroup {
            DashboardView()
                .environmentObject(authVM)
        }
    }
}
