import SwiftUI
import MapKit

struct AdminDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject var requestVM = RequestViewModel()
    @State private var selectedTab = 0
    @State private var trackingRequest: ServiceRequest?
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Tab 1: Overview
            NavigationView {
                ScrollView {
                    VStack(spacing: 20) {
                        // Stats Grid
                        let totalCollections = requestVM.requests.filter({ $0.paymentStatus == "Paid" }).reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
                        let pending = requestVM.requests.filter({ $0.status == .pending }).count
                        let active = requestVM.requests.filter({ [.assigned, .accepted, .inProgress].contains($0.status) }).count
                        
                        VStack(spacing: 12) {
                            HStack(spacing: 12) {
                                SummaryCard(title: "Active Jobs", value: "\(active)", color: .blue)
                                SummaryCard(title: "Pending", value: "\(pending)", color: .orange)
                            }
                            SummaryCard(title: "Total Collections", value: "₹\(Int(totalCollections))", color: .green)
                        }
                        .padding(.horizontal)
                        
                        // Recent Assignments
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Recent Assignments Awaiting Agents")
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
                                        Text(req.serviceType)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
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
                .navigationTitle("Admin Overview")
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
            
            // Tab 2: Tracking / Map View
            NavigationView {
                ScrollView {
                    VStack(alignment: .leading, spacing: 15) {
                        Text("Online Agents Live GPS Paths")
                            .font(.headline)
                            .foregroundColor(.white)
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
                                        Label("Map Track", systemImage: "map")
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
                .navigationTitle("Live Dispatch")
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
            
            // Tab 3: Service Agent Directory
            NavigationView {
                List(requestVM.users.filter({ $0.role == .agent })) { agent in
                    VStack(alignment: .leading, spacing: 5) {
                        Text(agent.name)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text(agent.email)
                            .font(.caption)
                            .foregroundColor(.gray)
                        Text("Specialization: \(agent.specialization ?? "General Maintenance")")
                            .font(.footnote)
                            .foregroundColor(.indigo)
                    }
                    .listRowBackground(Color.white.opacity(0.01))
                }
                .listStyle(PlainListStyle())
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
                .navigationTitle("Technician Roster")
                .navigationBarTitleDisplayMode(.inline)
            }
            .tabItem {
                Image(systemName: "person.3")
                Text("Technicians")
            }
            .tag(2)
            
            // Tab 4: Customers / Sign Out
            NavigationView {
                VStack(spacing: 25) {
                    List(requestVM.users.filter({ $0.role == .customer })) { cust in
                        VStack(alignment: .leading, spacing: 5) {
                            Text(cust.name)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            Text(cust.address ?? "No address listed")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        .listRowBackground(Color.white.opacity(0.01))
                    }
                    .listStyle(PlainListStyle())
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
                            .padding(.horizontal)
                    }
                    .padding(.bottom)
                }
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
                .navigationTitle("Client Records")
                .navigationBarTitleDisplayMode(.inline)
            }
            .tabItem {
                Image(systemName: "person.2")
                Text("Clients")
            }
            .tag(3)
        }
        .accentColor(.indigo)
        .onAppear {
            Task {
                await requestVM.fetchRequests()
                await requestVM.fetchUsers()
            }
        }
    }
}

struct AdminMapView: View {
    let agentCoordinate: CLLocationCoordinate2D?
    let pathCoordinates: [CLLocationCoordinate2D]
    
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 12.9716, longitude: 77.5946),
        span: MKCoordinateSpan(latitudeDelta: 0.03, longitudeDelta: 0.03)
    )
    
    var body: some View {
        Map(coordinateRegion: $region, annotationItems: getAnnotations()) { item in
            MapMarker(coordinate: item.coordinate, tint: item.color)
        }
        .onAppear {
            if let agent = agentCoordinate {
                region.center = agent
            }
        }
    }
    
    private func getAnnotations() -> [MapItem] {
        var items: [MapItem] = []
        if let agent = agentCoordinate {
            items.append(MapItem(coordinate: agent, color: .red))
        }
        // Include seed path locations as annotations to simulate trail path trace
        for idx in 0..<pathCoordinates.count {
            items.append(MapItem(coordinate: pathCoordinates[idx], color: .blue))
        }
        return items
    }
}

// Extends ServiceRequest so it can be handled by .sheet(item:)
extension ServiceRequest: Identifiable {}
