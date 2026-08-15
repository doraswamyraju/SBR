import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    
    var body: some View {
        ZStack {
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
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .animation(.default, value: authVM.isAuthenticated)
    }
}
