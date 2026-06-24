import SwiftUI
import MapKit

struct AdminDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject var requestVM = RequestViewModel()
    @State private var selectedTab = 0
    
    // Admin action sheets
    @State private var showingAddCustomerSheet = false
    @State private var showingCreateJobSheet = false
    @State private var showingMultiAgentMapSheet = false
    @State private var selectedRequestDetail: ServiceRequest?
    @State private var trackingRequest: ServiceRequest?
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Tab 1: Overview
            NavigationView {
                ScrollView {
                    VStack(spacing: 20) {
                        // Quick Action Bar
                        HStack(spacing: 12) {
                            Button(action: { showingCreateJobSheet = true }) {
                                Label("New Job", systemImage: "plus.circle.fill")
                                    .fontWeight(.bold)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color.indigo)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                            }
                            
                            Button(action: { showingAddCustomerSheet = true }) {
                                Label("Add Client", systemImage: "person.badge.plus.fill")
                                    .fontWeight(.bold)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color.green)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                            }
                        }
                        .padding(.horizontal)
                        
                        // Stats Grid
                        let totalCollections = requestVM.requests.filter({ $0.paymentStatus == "Paid" }).reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
                        let pending = requestVM.requests.filter({ $0.status == .pending }).count
                        let active = requestVM.requests.filter({ [.assigned, .accepted, .inProgress].contains($0.status) }).count
                        
                        VStack(spacing: 12) {
                            HStack(spacing: 12) {
                                SummaryCard(title: "Active Jobs", value: "\(active)", color: .blue)
                                SummaryCard(title: "Pending", value: "\(pending)", color: .orange)
                            }
                            
                            NavigationLink(destination: PaymentsView(requestVM: requestVM)) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("TOTAL LEDGER COLLECTIONS")
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                        Text("₹\(Int(totalCollections))")
                                            .font(.title2)
                                            .fontWeight(.black)
                                            .foregroundColor(.green)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(.gray)
                                }
                                .padding()
                                .background(Color.green.opacity(0.1))
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.green.opacity(0.3), lineWidth: 1)
                                )
                            }
                        }
                        .padding(.horizontal)
                        
                        // Recent Assignments
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Awaiting Technician Assignments")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding(.horizontal)
                            
                            let unassigned = requestVM.requests.filter({ $0.status == .pending })
                            if unassigned.isEmpty {
                                Text("All requests have been successfully assigned to field agents!")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                    .padding()
                            } else {
                                ForEach(unassigned) { req in
                                    VStack(alignment: .leading, spacing: 10) {
                                        HStack {
                                            Text(req.serviceType)
                                                .fontWeight(.bold)
                                                .foregroundColor(.white)
                                            Spacer()
                                            Button(action: { selectedRequestDetail = req }) {
                                                Image(systemName: "info.circle")
                                                    .foregroundColor(.indigo)
                                            }
                                        }
                                        Text("Address: \(req.customerAddress)")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                        
                                        // Agent Assignment Menu
                                        Menu("Assign Technician") {
                                            ForEach(requestVM.users.filter({ $0.role == .agent })) { agent in
                                                Button(agent.name) {
                                                    Task {
                                                        let success = await requestVM.assignAgent(requestId: req.id, agentId: agent.id)
                                                        if success {
                                                            await requestVM.fetchRequests()
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        .font(.footnote)
                                        .foregroundColor(.indigo)
                                    }
                                    .padding()
                                    .background(Color.white.opacity(0.02))
                                    .cornerRadius(12)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color.white.opacity(0.05), lineWidth: 1)
                                    )
                                }
                                .padding(.horizontal)
                            }
                        }
                        
                        Spacer()
                    }
                    .padding(.top)
                }
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
                .navigationTitle("Admin Dispatch")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    Button(action: {
                        Task {
                            await requestVM.fetchRequests()
                            await requestVM.fetchUsers()
                        }
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .tabItem {
                Image(systemName: "square.grid.2x2")
                Text("Overview")
            }
            .tag(0)
            
            // Tab 2: Dispatch / Map View
            NavigationView {
                ScrollView {
                    VStack(alignment: .leading, spacing: 15) {
                        HStack {
                            Text("Online Agents Live GPS Paths")
                                .font(.headline)
                                .foregroundColor(.white)
                            Spacer()
                            Button(action: { showingMultiAgentMapSheet = true }) {
                                Label("Global Map", systemImage: "globe")
                                    .font(.caption)
                                    .foregroundColor(.green)
                            }
                        }
                        .padding([.horizontal, .top])
                        
                        let trackingJobs = requestVM.requests.filter({ [.assigned, .accepted, .inProgress].contains($0.status) && $0.assignedAgentId != nil })
                        
                        if trackingJobs.isEmpty {
                            Text("No active service tracking sessions running.")
                                .foregroundColor(.gray)
                                .font(.footnote)
                                .padding()
                        } else {
                            ForEach(trackingJobs) { job in
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(job.serviceType)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                        Text("Technician: \(job.assignedAgentId?.name ?? "Field Agent")")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                    
                                    Spacer()
                                    
                                    Button(action: {
                                        trackingRequest = job
                                    }) {
                                        Label("Track Route", systemImage: "map")
                                            .font(.caption)
                                            .foregroundColor(.white)
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 6)
                                            .background(Color.indigo)
                                            .cornerRadius(8)
                                    }
                                }
                                .padding()
                                .background(Color.white.opacity(0.02))
                                .cornerRadius(12)
                                .padding(.horizontal)
                            }
                        }
                    }
                }
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
                .navigationTitle("Live Tracking")
                .navigationBarTitleDisplayMode(.inline)
                .sheet(item: $trackingRequest) { job in
                    VStack(spacing: 0) {
                        HStack {
                            Text("Live Tracking Path: \(job.assignedAgentId?.name ?? "Agent")")
                                .fontWeight(.bold)
                            Spacer()
                            Button("Done") {
                                trackingRequest = nil
                            }
                        }
                        .padding()
                        
                        AdminMapView(
                            agentCoordinate: job.assignedAgentId?.currentLat != nil ? CLLocationCoordinate2D(latitude: job.assignedAgentId!.currentLat!, longitude: job.assignedAgentId!.currentLng!) : nil,
                            pathCoordinates: job.locationPath?.map({ CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) }) ?? []
                        )
                        
                        Text("Customer Address: \(job.customerAddress)")
                            .font(.caption)
                            .foregroundColor(.gray)
                            .padding()
                    }
                }
            }
            .tabItem {
                Image(systemName: "map")
                Text("Dispatch")
            }
            .tag(1)
            
            // Tab 3: Roster Management
            NavigationView {
                AgentManagementView(requestVM: requestVM)
            }
            .tabItem {
                Image(systemName: "person.3")
                Text("Technicians")
            }
            .tag(2)
            
            // Tab 4: Customers / Sign Out
            NavigationView {
                VStack(spacing: 0) {
                    CustomerManagementView(requestVM: requestVM)
                        .frame(maxHeight: .infinity)
                    
                    Button(action: {
                        Task { await authVM.logout() }
                    }) {
                        Text("Sign Out Admin Profile")
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(12)
                            .padding()
                    }
                }
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
            }
            .tabItem {
                Image(systemName: "person.2")
                Text("Clients")
            }
            .tag(3)
        }
        .accentColor(.indigo)
        .sheet(isPresented: $showingAddCustomerSheet) {
            AddEditCustomerView(customer: nil)
        }
        .sheet(isPresented: $showingCreateJobSheet) {
            AdminCreateRequestView(customers: requestVM.users.filter({ $0.role == .customer }))
        }
        .sheet(isPresented: $showingMultiAgentMapSheet) {
            AdminMultiAgentMapView(agents: requestVM.users.filter({ $0.role == .agent }))
        }
        .sheet(item: $selectedRequestDetail) { req in
            RequestDetailView(request: req)
        }
        .onAppear {
            Task {
                await requestVM.fetchRequests()
                await requestVM.fetchUsers()
            }
        }
    }
}
