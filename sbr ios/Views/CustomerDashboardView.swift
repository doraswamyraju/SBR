import SwiftUI

struct CustomerDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject var requestVM = RequestViewModel()
    @State private var selectedTab = 0
    
    // Sheets State
    @State private var selectedRequestDetail: ServiceRequest?
    @State private var trackingRequest: ServiceRequest?
    
    // Booking Form State
    @State private var serviceType = "Solar Water Heaters"
    @State private var description = ""
    @State private var address = ""
    @State private var bookingStatusMessage = ""
    @State private var bookingStatusColor = Color.green
    
    let serviceCategories = [
        "Solar Water Heaters",
        "HM Hard Water Scalenors",
        "Automatic Water Softeners",
        "RO Water Plant Maintenance",
        "Domestic RO Purifier Service",
        "Solar Power Systems Maintenance",
        "Heat Pumps Repairs"
    ]
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Tab 1: Overview
            NavigationView {
                ScrollView {
                    VStack(spacing: 20) {
                        // Summary Cards
                        HStack(spacing: 12) {
                            SummaryCard(title: "Active Jobs", value: "\(requestVM.requests.filter({ $0.status == .assigned || $0.status == .accepted || $0.status == .inProgress }).count)", color: .blue)
                            SummaryCard(title: "Pending", value: "\(requestVM.requests.filter({ $0.status == .pending }).count)", color: .orange)
                            SummaryCard(title: "Resolved", value: "\(requestVM.requests.filter({ $0.status == .completed }).count)", color: .green)
                        }
                        .padding(.horizontal)
                        
                        // Active Tracking Section
                        let activeTrackable = requestVM.requests.first(where: { [.assigned, .accepted, .inProgress].contains($0.status) })
                        if let activeJob = activeTrackable {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Live Service Dispatch")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .padding(.horizontal)
                                
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(activeJob.serviceType)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                        Text("Status: \(activeJob.status.rawValue)")
                                            .font(.caption)
                                            .foregroundColor(.indigo)
                                    }
                                    Spacer()
                                    Button(action: {
                                        trackingRequest = activeJob
                                    }) {
                                        Label("Track Live", systemImage: "location.fill")
                                            .font(.caption)
                                            .foregroundColor(.white)
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 6)
                                            .background(Color.green)
                                            .cornerRadius(8)
                                    }
                                }
                                .padding()
                                .background(Color.white.opacity(0.02))
                                .cornerRadius(12)
                                .padding(.horizontal)
                            }
                        }
                        
                        // Latest Requests
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Latest Bookings")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding(.horizontal)
                            
                            if requestVM.requests.isEmpty {
                                Text("No service requests booked yet.")
                                    .foregroundColor(.gray)
                                    .font(.footnote)
                                    .padding()
                            } else {
                                ForEach(requestVM.requests.prefix(3)) { req in
                                    Button(action: {
                                        selectedRequestDetail = req
                                    }) {
                                        RequestRow(request: req)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        
                        Spacer()
                    }
                    .padding(.top)
                }
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
                .navigationTitle("Overview")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    Button(action: {
                        Task { await requestVM.fetchRequests() }
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
            
            // Tab 2: Book Service
            NavigationView {
                Form {
                    Section(header: Text("Service Selection").foregroundColor(.gray)) {
                        Picker("Category", selection: $serviceType) {
                            ForEach(serviceCategories, id: \.self) { cat in
                                Text(cat).tag(cat)
                            }
                        }
                    }
                    
                    Section(header: Text("Appointment Details").foregroundColor(.gray)) {
                        TextEditor(text: $description)
                            .frame(height: 100)
                            .overlay(
                                Group {
                                    if description.isEmpty {
                                        Text("Describe the symptoms or maintenance required...")
                                            .foregroundColor(.gray.opacity(0.7))
                                            .padding(.top, 8)
                                            .padding(.leading, 5)
                                    }
                                },
                                alignment: .topLeading
                             )
                        
                        TextField("Service Address", text: $address)
                    }
                    
                    Section {
                        Button(action: {
                            Task {
                                let success = await requestVM.bookRequest(serviceType: serviceType, description: description, address: address)
                                if success {
                                    bookingStatusColor = .green
                                    bookingStatusMessage = "Request submitted successfully!"
                                    description = ""
                                    await requestVM.fetchRequests()
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                                        selectedTab = 0 // Go to overview
                                    }
                                } else {
                                    bookingStatusColor = .red
                                    bookingStatusMessage = requestVM.errorMessage ?? "Booking failed"
                                }
                            }
                        }) {
                            HStack {
                                Spacer()
                                if requestVM.isLoading {
                                    ProgressView()
                                } else {
                                    Text("Book Appointment")
                                        .fontWeight(.bold)
                                }
                                Spacer()
                            }
                        }
                        .foregroundColor(.indigo)
                        .disabled(requestVM.isLoading || address.isEmpty)
                    }
                    
                    if !bookingStatusMessage.isEmpty {
                        Section {
                            Text(bookingStatusMessage)
                                .foregroundColor(bookingStatusColor)
                                .font(.footnote)
                        }
                    }
                }
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
                .navigationTitle("Schedule Service")
                .navigationBarTitleDisplayMode(.inline)
            }
            .tabItem {
                Image(systemName: "plus.circle")
                Text("Book Service")
            }
            .tag(1)
            
            // Tab 3: History
            NavigationView {
                List(requestVM.requests) { req in
                    Button(action: {
                        selectedRequestDetail = req
                    }) {
                        RequestRow(request: req)
                    }
                    .listRowBackground(Color.white.opacity(0.02))
                }
                .listStyle(PlainListStyle())
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
                .navigationTitle("Service History")
                .navigationBarTitleDisplayMode(.inline)
            }
            .tabItem {
                Image(systemName: "wrench.and.screwdriver")
                Text("History")
            }
            .tag(2)
            
            // Tab 4: Profile
            NavigationView {
                VStack(spacing: 20) {
                    VStack(spacing: 8) {
                        Image(systemName: "person.crop.circle.fill")
                            .font(.system(size: 70))
                            .foregroundColor(.indigo)
                        
                        Text(authVM.user?.name ?? "Client")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text(authVM.user?.email ?? "")
                            .foregroundColor(.gray)
                    }
                    .padding(.top)
                    
                    List {
                        NavigationLink(destination: CustomerProfileView(authVM: authVM)) {
                            Label("Edit Profile Details", systemImage: "person.text.rectangle")
                        }
                        .listRowBackground(Color.white.opacity(0.02))
                        
                        NavigationLink(destination: CustomerPaymentsView(requestVM: requestVM)) {
                            Label("My Invoices & Billing", systemImage: "creditcard")
                        }
                        .listRowBackground(Color.white.opacity(0.02))
                        
                        NavigationLink(destination: CustomerSupportView()) {
                            Label("Helpline & FAQ Support", systemImage: "questionmark.bubble")
                        }
                        .listRowBackground(Color.white.opacity(0.02))
                    }
                    .listStyle(PlainListStyle())
                    .frame(height: 180)
                    
                    Button(action: {
                        Task { await authVM.logout() }
                    }) {
                        Text("Sign Out")
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.red.opacity(0.2), lineWidth: 1)
                            )
                    }
                    .padding(.horizontal)
                    
                    Spacer()
                }
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
                .navigationTitle("My Profile")
                .navigationBarTitleDisplayMode(.inline)
            }
            .tabItem {
                Image(systemName: "person")
                Text("Profile")
            }
            .tag(3)
        }
        .accentColor(.indigo)
        .sheet(item: $selectedRequestDetail) { req in
            RequestDetailView(request: req)
        }
        .sheet(item: $trackingRequest) { req in
            CustomerLiveTrackingView(request: req)
        }
        .onAppear {
            if let user = authVM.user {
                self.address = user.address ?? ""
            }
            Task {
                await requestVM.fetchRequests()
            }
        }
    }
}
