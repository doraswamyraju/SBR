import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    
    var body: some View {
        Group {
            if authVM.isAuthenticated, let user = authVM.user {
                switch user.role {
                case .admin:
                    AdminDashboardView()
                case .agent:
                    AgentDashboardView()
                case .customer:
                    CustomerDashboardView()
                }
            } else {
                AuthView()
            }
        }
        .animation(.default, value: authVM.isAuthenticated)
    }
}
