import SwiftUI

enum CustomerSection: Hashable {
    case dashboard
    case requests
    case payments
    case support
    case profile
}

struct CustomerDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject var requestVM = RequestViewModel()
    
    @State private var selectedSection: CustomerSection = .dashboard
    @State private var isDrawerOpen = false
    @State private var showingBookRequestSheet = false
    @State private var selectedRequestDetail: ServiceRequest?
    
    // Booking Form State inside Sheet
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
        SidebarNavigationLayout(
            title: sectionTitle(selectedSection),
            drawerHeader: "Customer Panel",
            sections: [.dashboard, .requests, .payments, .support, .profile],
            selectedSection: $selectedSection,
            sectionTitle: { sectionTitle($0) },
            sectionIcon: { sectionIcon($0) },
            isDrawerOpen: $isDrawerOpen,
            onLogout: {
                Task { await authVM.logout() }
            },
            hasFab: selectedSection == .dashboard,
            onFabClick: {
                showingBookRequestSheet = true
            }
        ) {
            // Main content body
            Group {
                switch selectedSection {
                case .dashboard:
                    CustomerDashboardContent(
                        requestVM: requestVM,
                        authVM: authVM,
                        onNavigateToSection: { selectedSection = $0 },
                        onSelectRequest: { selectedRequestDetail = $0 }
                    )
                case .requests:
                    CustomerRequestsListView(requestVM: requestVM, onSelectRequest: { selectedRequestDetail = $0 })
                case .payments:
                    CustomerPaymentsView(requestVM: requestVM, onSelectRequest: { selectedRequestDetail = $0 })
                case .support:
                    CustomerSupportView()
                case .profile:
                    CustomerProfileView(authVM: authVM)
                }
            }
        }
        .sheet(isPresented: $showingBookRequestSheet) {
            NewRequestDialogSheet(
                serviceType: $serviceType,
                description: $description,
                address: $address,
                bookingStatusMessage: $bookingStatusMessage,
                bookingStatusColor: $bookingStatusColor,
                serviceCategories: serviceCategories,
                requestVM: requestVM
            )
        }
        .sheet(item: $selectedRequestDetail) { req in
            RequestDetailView(request: req, requestVM: requestVM)
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
    
    private func sectionTitle(_ section: CustomerSection) -> String {
        switch section {
        case .dashboard: return "Dashboard"
        case .requests: return "My Requests"
        case .payments: return "Payments"
        case .support: return "Contact Support"
        case .profile: return "My Profile"
        }
    }
    
    private func sectionIcon(_ section: CustomerSection) -> String {
        switch section {
        case .dashboard: return "square.grid.2x2.fill"
        case .requests: return "wrench.and.screwdriver.fill"
        case .payments: return "creditcard.fill"
        case .support: return "questionmark.bubble.fill"
        case .profile: return "person.crop.circle.fill"
        }
    }
}

// Light themed customer dashboard content replicating Android layout
struct CustomerDashboardContent: View {
    @ObservedObject var requestVM: RequestViewModel
    @ObservedObject var authVM: AuthViewModel
    let onNavigateToSection: (CustomerSection) -> Void
    let onSelectRequest: (ServiceRequest) -> Void
    
    private var activeRequestsCount: Int {
        requestVM.requests.filter({ [.assigned, .accepted, .inProgress].contains($0.status) }).count
    }
    
    private var pendingPaymentsSum: Double {
        // Calculate unpaid completed requests sum
        requestVM.requests.filter({ $0.status == .completed && ($0.paymentStatus == nil || $0.paymentStatus != "Paid") }).reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Welcome Text
                Text("Welcome, \(authVM.user?.name ?? "Client")")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                    .padding(.horizontal)
                
                // Summary Grid Cards
                VStack(spacing: 16) {
                    HStack(spacing: 16) {
                        Button(action: { onNavigateToSection(.requests) }) {
                            SummaryCard(title: "Active Requests", value: "\(activeRequestsCount)", isPrimary: true)
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        Button(action: { onNavigateToSection(.payments) }) {
                            SummaryCard(title: "Pending Payments", value: "₹\(Int(pendingPaymentsSum))", isPrimary: true)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    
                    // Next Scheduled Service
                    let nextServiceStr = authVM.user?.nextServiceDate ?? "Not Scheduled"
                    SummaryCard(title: "Next Scheduled Service", value: nextServiceStr, isPrimary: false)
                }
                .padding(.horizontal)
                
                // Quick Actions
                VStack(alignment: .leading, spacing: 12) {
                    Text("Quick Actions")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                        .padding(.horizontal)
                    
                    HStack(spacing: 16) {
                        QuickActionItem(title: "My Requests", icon: "list.bullet.rectangle.fill") {
                            onNavigateToSection(.requests)
                        }
                        QuickActionItem(title: "Make Payment", icon: "creditcard.fill") {
                            onNavigateToSection(.payments)
                        }
                        QuickActionItem(title: "Contact Support", icon: "phone.circle.fill") {
                            onNavigateToSection(.support)
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Recent Activity
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Activity")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                        .padding(.horizontal)
                    
                    if requestVM.requests.isEmpty {
                        VStack {
                            Text("No service requests booked yet.")
                                .foregroundColor(.gray)
                                .font(.subheadline)
                                .padding()
                        }
                        .frame(maxWidth: .infinity)
                        .background(Color.white)
                        .cornerRadius(12)
                        .padding(.horizontal)
                    } else {
                        ForEach(requestVM.requests.prefix(3)) { req in
                            Button(action: { onSelectRequest(req) }) {
                                RequestRow(request: req)
                            }
                            .buttonStyle(PlainButtonStyle())
                            .padding(.horizontal)
                        }
                    }
                }
                
                Spacer()
            }
            .padding(.top)
        }
    }
}

// Quick action card helper component
struct QuickActionItem: View {
    let title: String
    let icon: String
    let onClick: () -> Void
    
    var body: some View {
        Button(action: onClick) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(SBRColors.primaryBlue)
                    .frame(width: 48, height: 48)
                    .background(SBRColors.primaryBlue.opacity(0.08))
                    .clipShape(Circle())
                
                Text(title)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.gray.opacity(0.15), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// Booking Dialog/Sheet replicating NewRequestDialog
struct NewRequestDialogSheet: View {
    @Binding var serviceType: String
    @Binding var description: String
    @Binding var address: String
    @Binding var bookingStatusMessage: String
    @Binding var bookingStatusColor: Color
    
    let serviceCategories: [String]
    @ObservedObject var requestVM: RequestViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Service Selection")) {
                    Picker("Category", selection: $serviceType) {
                        ForEach(serviceCategories, id: \.self) { cat in
                            Text(cat).tag(cat)
                        }
                    }
                }
                
                Section(header: Text("Appointment Details")) {
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
                                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                                    dismiss()
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
                    .foregroundColor(SBRColors.primaryBlue)
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
            .navigationTitle("New Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// Customers Requests list view screen
struct CustomerRequestsListView: View {
    @ObservedObject var requestVM: RequestViewModel
    let onSelectRequest: (ServiceRequest) -> Void
    
    var body: some View {
        VStack {
            if requestVM.requests.isEmpty {
                Spacer()
                Text("No service requests booked yet.")
                    .foregroundColor(.gray)
                Spacer()
            } else {
                List(requestVM.requests) { req in
                    Button(action: { onSelectRequest(req) }) {
                        RequestRow(request: req)
                    }
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                    .padding(.horizontal)
                    .padding(.vertical, 6)
                }
                .listStyle(PlainListStyle())
            }
        }
        .background(Color(red: 0.97, green: 0.98, blue: 1.0))
        .onAppear {
            Task {
                await requestVM.fetchRequests()
            }
        }
    }
}
