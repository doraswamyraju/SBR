import SwiftUI

struct CustomerDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject var requestVM = RequestViewModel()
    @State private var selectedTab = 0
    
    // Booking Form State
    @State private var serviceType = "Solar Water Heaters"
    @State private var description = ""
    @State private var address = ""
    @State private var bookingStatusMessage = ""
    @State private var bookingStatusColor = Color.green
    
    // Profile Form State
    @State private var phone = ""
    @State private var billingAddress = ""
    @State private var isRecurring = false
    
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
                                    RequestRow(request: req)
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
                    RequestRow(request: req)
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
                VStack(spacing: 25) {
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
                    
                    VStack(alignment: .leading, spacing: 15) {
                        HStack {
                            Text("Phone:")
                                .foregroundColor(.gray)
                            Spacer()
                            Text(authVM.user?.phone ?? "N/A")
                                .foregroundColor(.white)
                        }
                        
                        HStack {
                            Text("Address:")
                                .foregroundColor(.gray)
                            Spacer()
                            Text(authVM.user?.address ?? "None set")
                                .foregroundColor(.white)
                                .multilineTextAlignment(.trailing)
                        }
                        
                        HStack {
                            Text("Plan Type:")
                                .foregroundColor(.gray)
                            Spacer()
                            Text((authVM.user?.isRecurring == true) ? "Recurring Contract" : "Pay As Go")
                                .foregroundColor(.indigo)
                        }
                    }
                    .padding()
                    .background(Color.white.opacity(0.03))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
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
        .onAppear {
            // Set fields and load requests
            if let user = authVM.user {
                self.address = user.address ?? ""
            }
            Task {
                await requestVM.fetchRequests()
            }
        }
    }
}

// UI helper metrics card
struct SummaryCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
                .textCase(.uppercase)
            Text(value)
                .font(.title)
                .fontWeight(.black)
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(color.opacity(0.3), lineWidth: 1)
        )
    }
}

struct RequestRow: View {
    let request: ServiceRequest
    
    var statusColor: Color {
        switch request.status {
        case .pending: return .orange
        case .assigned: return .blue
        case .accepted: return .cyan
        case .inProgress: return .purple
        case .completed: return .green
        case .cancelled: return .red
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(request.serviceType)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text(request.status.rawValue)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusColor.opacity(0.15))
                    .foregroundColor(statusColor)
                    .cornerRadius(20)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(statusColor.opacity(0.3), lineWidth: 1)
                    )
            }
            
            if let desc = request.description {
                Text(desc)
                    .font(.footnote)
                    .foregroundColor(.gray)
                    .lineLimit(2)
            }
            
            HStack {
                Image(systemName: "map")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text(request.customerAddress)
                    .font(.caption)
                    .foregroundColor(.gray)
                    .lineLimit(1)
                
                Spacer()
                
                if let paymentStatus = request.paymentStatus, paymentStatus == "Paid" {
                    Text("Paid")
                        .font(.caption2)
                        .foregroundColor(.green)
                }
            }
        }
        .padding()
        .background(Color.white.opacity(0.01))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.05), lineWidth: 1)
        )
    }
}
