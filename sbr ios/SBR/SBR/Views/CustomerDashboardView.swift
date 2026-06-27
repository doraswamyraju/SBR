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
                requestVM: requestVM,
                serviceType: $serviceType,
                description: $description,
                address: $address,
                bookingStatusMessage: $bookingStatusMessage,
                bookingStatusColor: $bookingStatusColor
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
    
    @State private var reviewUrl = ""
    
    private var activeRequestsCount: Int {
        requestVM.requests.filter({ [.assigned, .accepted, .inProgress].contains($0.status) }).count
    }
    
    private var pendingPaymentsSum: Double {
        // Calculate unpaid completed requests sum
        requestVM.requests.filter({ $0.status == .completed && ($0.paymentStatus == nil || $0.paymentStatus != "Paid") }).reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
    }
    
    private func fetchReviewUrl() {
        Task {
            struct SettingsResponse: Decodable {
                let success: Bool
                let data: [String: String]
            }
            if let res = try? await APIClient.shared.get(endpoint: "api/settings", responseType: SettingsResponse.self),
               res.success, let url = res.data["reviewUrl"] {
                self.reviewUrl = url
            }
        }
    }
    
    private func openReviewURL() {
        let targetUrlStr = reviewUrl.isEmpty ? "https://g.page/r/CbdJS-IzWTe2EBE/review" : reviewUrl
        if let url = URL(string: targetUrlStr) {
            UIApplication.shared.open(url)
        }
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
                            VStack(spacing: 8) {
                                Button(action: { onSelectRequest(req) }) {
                                    RequestRow(request: req)
                                }
                                .buttonStyle(PlainButtonStyle())
                                
                                if req.status == .completed && req.requestReview == true {
                                    GeminiGlowOutlineButton(
                                        title: "Leave Sri Balaji Renewables Review",
                                        icon: "star.bubble.fill"
                                    ) {
                                        openReviewURL()
                                    }
                                    .padding(.top, 2)
                                }
                            }
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
        }
        .scrollBounceBehavior(.always, axes: .vertical)
        .onAppear {
            fetchReviewUrl()
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
    @EnvironmentObject var authVM: AuthViewModel
    @ObservedObject var requestVM: RequestViewModel
    @Environment(\.dismiss) var dismiss
    
    @Binding var serviceType: String
    @Binding var description: String
    @Binding var address: String
    @Binding var bookingStatusMessage: String
    @Binding var bookingStatusColor: Color
    
    // Internal state for selection
    @State private var selectedAddressId: String = ""
    @State private var customAddressLine: String = ""
    @State private var customLatitude: Double? = nil
    @State private var customLongitude: Double? = nil
    
    @State private var showingPinPicker = false
    
    struct SelectableAddress: Identifiable, Hashable {
        let id: String
        let label: String
        let addressLine: String
        let latitude: Double?
        let longitude: Double?
    }
    
    private var selectableAddresses: [SelectableAddress] {
        var list: [SelectableAddress] = []
        
        // Primary Address
        if let primaryAddr = authVM.user?.address, !primaryAddr.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            list.append(SelectableAddress(
                id: "primary",
                label: "Primary Address",
                addressLine: primaryAddr,
                latitude: authVM.user?.latitude,
                longitude: authVM.user?.longitude
            ))
        }
        
        // Saved Addresses
        if let savedList = authVM.user?.addresses {
            for addr in savedList {
                list.append(SelectableAddress(
                    id: addr.id,
                    label: addr.title,
                    addressLine: addr.addressLine,
                    latitude: addr.latitude,
                    longitude: addr.longitude
                ))
            }
        }
        
        return list
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    
                    // Service Type Input Field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Service Required")
                            .font(.headline)
                            .foregroundColor(SBRColors.textPrimary)
                        
                        TextField("e.g. Solar Heater Leak Repair", text: $serviceType)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.15), lineWidth: 1)
                            )
                            .foregroundColor(SBRColors.textPrimary)
                            .shadow(color: Color.black.opacity(0.01), radius: 3)
                    }
                    .padding(.horizontal)
                    
                    // Symptoms / Details Editor
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Symptoms & Details")
                            .font(.headline)
                            .foregroundColor(SBRColors.textPrimary)
                        
                        TextEditor(text: $description)
                            .frame(height: 100)
                            .padding(8)
                            .background(Color.white)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.15), lineWidth: 1)
                            )
                            .foregroundColor(SBRColors.textPrimary)
                            .overlay(
                                Group {
                                    if description.isEmpty {
                                        Text("Describe what needs maintenance or repair...")
                                            .foregroundColor(.gray.opacity(0.6))
                                            .font(.body)
                                            .padding(.top, 16)
                                            .padding(.leading, 12)
                                    }
                                },
                                alignment: .topLeading
                            )
                    }
                    .padding(.horizontal)
                    
                    // Address Selection Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Service Address")
                            .font(.headline)
                            .foregroundColor(SBRColors.textPrimary)
                        
                        let options = selectableAddresses
                        if !options.isEmpty {
                            // Picker for addresses
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Select Location")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(SBRColors.textSecondary)
                                
                                Picker("Select Location", selection: $selectedAddressId) {
                                    ForEach(options) { opt in
                                        Text("\(opt.label) (\(opt.addressLine.prefix(20))...)")
                                            .tag(opt.id)
                                    }
                                    Text("Use Custom / New Address...").tag("custom")
                                }
                                .pickerStyle(MenuPickerStyle())
                                .padding()
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.white)
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.gray.opacity(0.15), lineWidth: 1)
                                )
                            }
                        } else {
                            // If nothing is saved, force Custom/New address view directly
                            VStack(alignment: .leading, spacing: 4) {
                                Text("No saved addresses found. Please enter details below:")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                                    .fontWeight(.semibold)
                            }
                            .onAppear {
                                selectedAddressId = "custom"
                            }
                        }
                        
                        // Show Address input fields depending on selection
                        if selectedAddressId == "custom" || options.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Enter Custom Address")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(SBRColors.textSecondary)
                                
                                TextField("Street Address, Landmark, City", text: $customAddressLine)
                                    .padding()
                                    .background(Color.white)
                                    .cornerRadius(12)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color.gray.opacity(0.15), lineWidth: 1)
                                    )
                                    .foregroundColor(SBRColors.textPrimary)
                                
                                // Coordinates pin status
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        if let lat = customLatitude, let lng = customLongitude {
                                            Label("Location Pin Placed", systemImage: "checkmark.circle.fill")
                                                .foregroundColor(.green)
                                                .font(.caption)
                                                .fontWeight(.semibold)
                                            Text(String(format: "%.5f, %.5f", lat, lng))
                                                .font(.system(.caption2, design: .monospaced))
                                                .foregroundColor(.gray)
                                        } else {
                                            Label("No Location Pin", systemImage: "info.circle.fill")
                                                .foregroundColor(.orange)
                                                .font(.caption)
                                                .fontWeight(.semibold)
                                            Text("A precise pin helps representative locate you.")
                                                .font(.caption2)
                                                .foregroundColor(.gray)
                                        }
                                    }
                                    
                                    Spacer()
                                    
                                    Button(action: {
                                        showingPinPicker = true
                                    }) {
                                        HStack(spacing: 4) {
                                            Image(systemName: "mappin.and.ellipse")
                                            Text(customLatitude != nil ? "Edit Pin" : "Set Pin")
                                        }
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .padding(.vertical, 8)
                                        .padding(.horizontal, 12)
                                        .background(SBRColors.primaryBlue)
                                        .cornerRadius(8)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                                .padding()
                                .background(Color.white)
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.gray.opacity(0.1), lineWidth: 1)
                                )
                            }
                            .padding(.top, 4)
                        } else {
                            // Display the selected address info nicely
                            if let selectedOpt = options.first(where: { $0.id == selectedAddressId }) {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Image(systemName: "mappin.circle.fill")
                                            .foregroundColor(SBRColors.primaryBlue)
                                        Text(selectedOpt.label)
                                            .fontWeight(.bold)
                                            .foregroundColor(SBRColors.textPrimary)
                                        
                                        Spacer()
                                        
                                        if selectedOpt.latitude != nil {
                                            Text("Pin Saved")
                                                .font(.caption2)
                                                .foregroundColor(.green)
                                                .padding(.horizontal, 8)
                                                .padding(.vertical, 2)
                                                .background(Color.green.opacity(0.1))
                                                .cornerRadius(6)
                                        }
                                    }
                                    
                                    Text(selectedOpt.addressLine)
                                        .font(.subheadline)
                                        .foregroundColor(SBRColors.textSecondary)
                                        .lineLimit(3)
                                }
                                .padding()
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(red: 0.96, green: 0.97, blue: 0.99))
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.gray.opacity(0.15), lineWidth: 1)
                                )
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    if !bookingStatusMessage.isEmpty {
                        Text(bookingStatusMessage)
                            .foregroundColor(bookingStatusColor)
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .padding(.horizontal)
                    }
                    
                    // Book Appointment Button
                    Button(action: submitBooking) {
                        HStack {
                            Spacer()
                            if requestVM.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text("Book Appointment")
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                            }
                            Spacer()
                        }
                        .padding()
                        .background(isSubmitDisabled ? SBRColors.primaryBlue.opacity(0.6) : SBRColors.primaryBlue)
                        .cornerRadius(12)
                        .shadow(color: SBRColors.primaryBlue.opacity(0.15), radius: 4, x: 0, y: 2)
                    }
                    .padding(.horizontal)
                    .disabled(isSubmitDisabled)
                    
                }
                .padding(.top)
                .padding(.bottom, 24)
            }
            .background(SBRColors.background.ignoresSafeArea())
            .navigationTitle("New Service Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .sheet(isPresented: $showingPinPicker) {
                MapPinPickerSheet(
                    latitude: $customLatitude,
                    longitude: $customLongitude,
                    addressString: customAddressLine
                )
            }
            .onAppear {
                // Pre-populate with first available address if exists
                let options = selectableAddresses
                if let first = options.first {
                    selectedAddressId = first.id
                } else {
                    selectedAddressId = "custom"
                }
            }
        }
    }
    
    private var isSubmitDisabled: Bool {
        if requestVM.isLoading || serviceType.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return true
        }
        
        if selectedAddressId == "custom" {
            return customAddressLine.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        } else {
            return selectableAddresses.first(where: { $0.id == selectedAddressId }) == nil
        }
    }
    
    private func submitBooking() {
        var finalAddress = ""
        var finalLatitude: Double? = nil
        var finalLongitude: Double? = nil
        
        if selectedAddressId == "custom" {
            finalAddress = customAddressLine
            finalLatitude = customLatitude
            finalLongitude = customLongitude
        } else if let matched = selectableAddresses.first(where: { $0.id == selectedAddressId }) {
            finalAddress = matched.addressLine
            finalLatitude = matched.latitude
            finalLongitude = matched.longitude
        }
        
        Task {
            let success = await requestVM.bookRequest(
                serviceType: serviceType,
                description: description,
                address: finalAddress,
                latitude: finalLatitude,
                longitude: finalLongitude
            )
            if success {
                bookingStatusColor = .green
                bookingStatusMessage = "Service request placed successfully!"
                description = ""
                serviceType = ""
                await requestVM.fetchRequests()
                
                // Dismiss sheet on success delay
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                    dismiss()
                }
            } else {
                bookingStatusColor = .red
                bookingStatusMessage = requestVM.errorMessage ?? "Failed to book request"
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
