import SwiftUI
import MapKit

enum AdminSection: Hashable {
    case dashboard
    case agents
    case customers
    case requests
    case reports
    case payments
    case liveTracking
    case settings
}

struct AdminDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject var requestVM = RequestViewModel()
    
    @State private var selectedSection: AdminSection = .dashboard
    @State private var isDrawerOpen = false
    
    // Action sheets & state
    @State private var showingAddCustomerSheet = false
    @State private var showingCreateJobSheet = false
    @State private var selectedRequestDetail: ServiceRequest?
    @State private var assigningRequest: ServiceRequest?
    
    var body: some View {
        SidebarNavigationLayout(
            title: sectionTitle(selectedSection),
            drawerHeader: "Welcome Admin",
            sections: [.dashboard, .agents, .customers, .requests, .reports, .payments, .liveTracking, .settings],
            selectedSection: $selectedSection,
            sectionTitle: { sectionTitle($0) },
            sectionIcon: { sectionIcon($0) },
            isDrawerOpen: $isDrawerOpen,
            onLogout: {
                Task { await authVM.logout() }
            },
            hasFab: selectedSection == .dashboard,
            onFabClick: {
                showingCreateJobSheet = true
            }
        ) {
            // Main views switcher
            Group {
                switch selectedSection {
                case .dashboard:
                    AdminDashboardContent(
                        requestVM: requestVM,
                        selectedSection: $selectedSection,
                        selectedRequestDetail: $selectedRequestDetail,
                        assigningRequest: $assigningRequest
                    )
                case .agents:
                    AgentManagementView(requestVM: requestVM)
                case .customers:
                    CustomerManagementView(requestVM: requestVM)
                case .requests:
                    ServiceRequestsView(requestVM: requestVM)
                case .reports:
                    ReportsView()
                case .payments:
                    PaymentsView(requestVM: requestVM)
                case .liveTracking:
                    AdminMultiAgentMapView(requestVM: requestVM)
                case .settings:
                    AdminSettingsView(requestVM: requestVM)
                }
            }
        }
        .sheet(isPresented: $showingAddCustomerSheet, onDismiss: {
            Task { await requestVM.fetchUsers() }
        }) {
            AddEditCustomerView(requestVM: requestVM, customer: nil)
        }
        .sheet(isPresented: $showingCreateJobSheet, onDismiss: {
            Task { await requestVM.fetchRequests() }
        }) {
            AdminCreateRequestView(requestVM: requestVM, customers: requestVM.users.filter({ $0.role == .customer }))
        }
        .sheet(item: $selectedRequestDetail) { req in
            RequestDetailView(request: req, requestVM: requestVM)
        }
        .sheet(item: $assigningRequest) { req in
            AgentSelectionSheet(request: req, requestVM: requestVM)
        }
        .onAppear {
            Task {
                await requestVM.fetchRequests()
                await requestVM.fetchUsers()
            }
        }
    }
    
    private func sectionTitle(_ section: AdminSection) -> String {
        switch section {
        case .dashboard: return "Dashboard"
        case .agents: return "Agents"
        case .customers: return "Customers"
        case .requests: return "Requests"
        case .reports: return "Reports"
        case .payments: return "Payments"
        case .liveTracking: return "All Active Agents"
        case .settings: return "Settings"
        }
    }
    
    private func sectionIcon(_ section: AdminSection) -> String {
        switch section {
        case .dashboard: return "square.grid.2x2.fill"
        case .agents: return "person.3.fill"
        case .customers: return "person.2.fill"
        case .requests: return "list.bullet.rectangle.fill"
        case .reports: return "doc.text.below.ecg.fill"
        case .payments: return "creditcard.fill"
        case .liveTracking: return "map.fill"
        case .settings: return "gearshape.fill"
        }
    }
}

// Light themed dashboard content matching Android's layout & styling
struct AdminDashboardContent: View {
    @ObservedObject var requestVM: RequestViewModel
    @Binding var selectedSection: AdminSection
    @Binding var selectedRequestDetail: ServiceRequest?
    @Binding var assigningRequest: ServiceRequest?
    
    private var totalCollections: Double {
        requestVM.requests.filter({ $0.paymentStatus == "Paid" }).reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
    }
    
    private var pendingCount: Int {
        requestVM.requests.filter({ $0.status == .pending }).count
    }
    
    private var activeCount: Int {
        requestVM.requests.filter({ [.assigned, .accepted, .inProgress].contains($0.status) }).count
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text("Admin Dashboard")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                    .padding(.horizontal)
                
                // Stats Card Grid (2x2) replicating SummaryCardGrid
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        SummaryCard(
                            title: "Total Requests",
                            value: "\(requestVM.requests.count)",
                            isPrimary: true,
                            action: {
                                withAnimation {
                                    selectedSection = .requests
                                }
                            }
                        )
                        SummaryCard(
                            title: "Active Agents",
                            value: "\(requestVM.users.filter({ $0.role == .agent }).count)",
                            isPrimary: true,
                            action: {
                                withAnimation {
                                    selectedSection = .agents
                                }
                            }
                        )
                    }
                    HStack(spacing: 12) {
                        SummaryCard(
                            title: "Payments & Revenue",
                            value: "₹\(Int(totalCollections))",
                            isPrimary: true,
                            action: {
                                withAnimation {
                                    selectedSection = .payments
                                }
                            }
                        )
                        SummaryCard(
                            title: "Satisfaction",
                            value: "98%",
                            isPrimary: true,
                            action: {
                                withAnimation {
                                    selectedSection = .reports
                                }
                            }
                        )
                    }
                }
                .padding(.horizontal)
                
                // Recent Activities section
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Activities")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                        .padding(.horizontal)
                    
                    let unassigned = requestVM.requests.filter({ $0.status == .pending })
                    
                    if unassigned.isEmpty {
                        VStack {
                            Text("No pending requests found.")
                                .foregroundColor(.gray)
                                .font(.subheadline)
                                .padding()
                        }
                        .frame(maxWidth: .infinity)
                        .background(Color.white)
                        .cornerRadius(12)
                        .padding(.horizontal)
                    } else {
                        ForEach(unassigned) { req in
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Request ID: \(req.id)")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(SBRColors.textPrimary)
                                
                                HStack {
                                    Text("Service:")
                                        .fontWeight(.bold)
                                        .foregroundColor(SBRColors.textPrimary)
                                    Text(req.serviceType)
                                        .foregroundColor(SBRColors.textPrimary)
                                }
                                .font(.footnote)
                                
                                HStack {
                                    Text("Status:")
                                        .fontWeight(.bold)
                                        .foregroundColor(SBRColors.textPrimary)
                                    Text("Pending")
                                        .foregroundColor(.orange)
                                        .fontWeight(.semibold)
                                }
                                .font(.footnote)
                                
                                Spacer().frame(height: 4)
                                
                                Button(action: { assigningRequest = req }) {
                                    Text("Choose Agent")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .padding(.vertical, 8)
                                        .padding(.horizontal, 16)
                                        .background(SBRColors.primaryBlue)
                                        .cornerRadius(8)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(red: 0.92, green: 0.93, blue: 0.96)) // soft gray surfaceVariant style
                            .cornerRadius(12)
                            .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                            )
                            .padding(.horizontal)
                        }
                    }
                }
                
                Spacer()
            }
            .padding(.top)
        }
        .refreshable {
            await requestVM.fetchRequests()
            await requestVM.fetchUsers()
        }
    }
}

// Agent Selection Sheet replicating AgentSelectionDialog
struct AgentSelectionSheet: View {
    let request: ServiceRequest
    @ObservedObject var requestVM: RequestViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 12) {
                    let agents = requestVM.users.filter({ $0.role == .agent })
                    if agents.isEmpty {
                        Spacer().frame(height: 60)
                        Image(systemName: "person.crop.circle.badge.exclamationmark")
                            .font(.system(size: 60))
                            .foregroundColor(.gray.opacity(0.5))
                            .padding(.bottom, 8)
                        Text("No available technicians found")
                            .foregroundColor(.gray)
                            .font(.subheadline)
                    } else {
                        ForEach(agents) { agent in
                            Button(action: {
                                Task {
                                    let success = await requestVM.assignAgent(requestId: request.id, agentId: agent.id)
                                    if success {
                                        await requestVM.fetchRequests()
                                        dismiss()
                                    }
                                }
                            }) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(agent.name)
                                            .font(.body)
                                            .fontWeight(.bold)
                                            .foregroundColor(SBRColors.textPrimary)
                                        
                                        HStack(spacing: 6) {
                                            Image(systemName: "wrench.and.screwdriver.fill")
                                                .font(.caption2)
                                                .foregroundColor(SBRColors.primaryBlue)
                                            Text(agent.specialization ?? "Field Technician")
                                                .font(.caption)
                                                .foregroundColor(.gray)
                                        }
                                        
                                        if let phone = agent.phone {
                                            HStack(spacing: 6) {
                                                Image(systemName: "phone.fill")
                                                    .font(.caption2)
                                                    .foregroundColor(.green)
                                                Text(phone)
                                                    .font(.caption)
                                                    .foregroundColor(.gray)
                                            }
                                        }
                                    }
                                    
                                    Spacer()
                                    
                                    Image(systemName: "chevron.right")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(SBRColors.primaryBlue)
                                }
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.white)
                                .cornerRadius(12)
                                .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                                )
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                }
                .padding()
            }
            .background(SBRColors.background.ignoresSafeArea())
            .navigationTitle("Select Technician")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(SBRColors.primaryBlue, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Text("Cancel")
                            .font(.footnote)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                }
            }
        }
    }
}
