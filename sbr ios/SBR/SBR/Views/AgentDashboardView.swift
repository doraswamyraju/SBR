import SwiftUI

enum AgentSection: Hashable {
    case dashboard
    case newRequests
    case activeService
    case vanInventory
    case cashHandover
    case ourCustomers
    case payments
    case profile
}

struct AgentDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject var requestVM = RequestViewModel()
    
    @State private var selectedSection: AgentSection = .dashboard
    @State private var isDrawerOpen = false
    @State private var selectedRequestDetail: ServiceRequest?
    @State private var showingCompletedRequestsSheet = false
    @State private var showingImagePicker = false
    @State private var pickerImageType = "before"
    @State private var activeJobForUpload: ServiceRequest? = nil
    
    @State private var assessingJob: ServiceRequest? = nil
    @State private var completingJob: ServiceRequest? = nil
    
    private var activeJob: ServiceRequest? {
        requestVM.requests.first(where: { $0.status == .accepted || $0.status == .inProgress })
    }
    
    var body: some View {
        SidebarNavigationLayout(
            title: sectionTitle(selectedSection),
            drawerHeader: "Agent Panel",
            sections: [.dashboard, .newRequests, .activeService, .vanInventory, .cashHandover, .ourCustomers, .payments, .profile],
            selectedSection: $selectedSection,
            sectionTitle: { sectionTitle($0) },
            sectionIcon: { sectionIcon($0) },
            isDrawerOpen: $isDrawerOpen,
            onLogout: {
                Task { requestVM.stopLocationTracking(); await authVM.logout() }
            },
            hasFab: false
        ) {
            // Section Views Switcher
            Group {
                switch selectedSection {
                case .dashboard:
                    AgentDashboardContent(
                        requestVM: requestVM,
                        authVM: authVM,
                        onNavigateToSection: { selectedSection = $0 },
                        selectedRequestDetail: $selectedRequestDetail,
                        onShowCompletedRequests: { showingCompletedRequestsSheet = true },
                        onAssessJob: { assessingJob = $0 }
                    )
                case .newRequests:
                    AgentNewRequestsView(requestVM: requestVM, onAssessJob: { assessingJob = $0 })
                case .activeService:
                    AgentActiveServiceView(
                        requestVM: requestVM,
                        showingImagePicker: $showingImagePicker,
                        pickerImageType: $pickerImageType,
                        activeJobForUpload: $activeJobForUpload,
                        onCompleteJob: { completingJob = $0 }
                    )
                case .vanInventory:
                    AgentInventoryView()
                case .cashHandover:
                    CashHandoverView()
                case .ourCustomers:
                    OurCustomersView(isAdmin: false)
                case .payments:
                    AgentPaymentsView(requestVM: requestVM, selectedRequestDetail: $selectedRequestDetail)
                case .profile:
                    AgentProfileScreenView(authVM: authVM, requestVM: requestVM)
                }
            }
        }
        .sheet(item: $selectedRequestDetail) { job in
            RequestDetailView(request: job, requestVM: requestVM)
        }
        .sheet(item: $assessingJob) { job in
            AgentAssessmentSheet(job: job, requestVM: requestVM) {
                assessingJob = nil
            }
        }
        .sheet(item: $completingJob) { job in
            AgentPaymentBreakdownSheet(job: job, requestVM: requestVM) {
                completingJob = nil
            }
        }
        .onAppear {
            Task {
                requestVM.locationManager.requestPermission()
                await requestVM.fetchRequests()
                if let job = activeJob {
                    requestVM.startLocationTracking(activeRequestId: job.id)
                }
            }
        }
        .onChange(of: activeJob?.id) { _, newId in
            if let id = newId {
                requestVM.locationManager.requestPermission()
                requestVM.startLocationTracking(activeRequestId: id)
            } else {
                requestVM.stopLocationTracking()
            }
        }
        .onChange(of: activeJob?.status) { _, newStatus in
            if let job = activeJob, (newStatus == .accepted || newStatus == .inProgress) {
                requestVM.locationManager.requestPermission()
                requestVM.startLocationTracking(activeRequestId: job.id)
            } else {
                requestVM.stopLocationTracking()
            }
        }
        .sheet(isPresented: $showingCompletedRequestsSheet) {
            AgentCompletedRequestsSheet(requestVM: requestVM, onSelectRequest: { req in
                showingCompletedRequestsSheet = false
                selectedRequestDetail = req
            })
        }
        .sheet(isPresented: $showingImagePicker) {
            ImagePicker(sourceType: .camera) { image in
                if let job = activeJobForUpload {
                    uploadImageForJob(job, image: image, type: pickerImageType)
                }
            }
        }
    }

    private func uploadImageForJob(_ job: ServiceRequest, image: UIImage, type: String) {
        Task {
            guard let imageData = image.jpegData(compressionQuality: 0.7) else { return }
            let uploadSuccess = await requestVM.uploadRequestImage(requestId: job.id, imageData: imageData, type: type)
            if uploadSuccess {
                if type == "before" && job.status == .accepted {
                    let statusSuccess = await requestVM.updateStatus(requestId: job.id, status: .inProgress)
                    if statusSuccess {
                        await requestVM.fetchRequests()
                    }
                } else {
                    await requestVM.fetchRequests()
                }
            }
        }
    }
    
    private func sectionTitle(_ section: AgentSection) -> String {
        switch section {
        case .dashboard: return "Dashboard"
        case .newRequests: return "New Requests"
        case .activeService: return "Active Service"
        case .vanInventory: return "Van Inventory & Kits"
        case .cashHandover: return "EOD Cash Handover"
        case .ourCustomers: return "Our Customers"
        case .payments: return "Payments"
        case .profile: return "My Profile"
        }
    }
    
    private func sectionIcon(_ section: AgentSection) -> String {
        switch section {
        case .dashboard: return "square.grid.2x2.fill"
        case .newRequests: return "list.bullet.rectangle.fill"
        case .activeService: return "wrench.and.screwdriver.fill"
        case .vanInventory: return "shippingbox.fill"
        case .cashHandover: return "banknote.fill"
        case .ourCustomers: return "person.2.fill"
        case .payments: return "creditcard.fill"
        case .profile: return "person.crop.circle.fill"
        }
    }
}

// Light themed Agent Dashboard Content matching Android layout
struct AgentDashboardContent: View {
    @ObservedObject var requestVM: RequestViewModel
    @ObservedObject var authVM: AuthViewModel
    let onNavigateToSection: (AgentSection) -> Void
    @Binding var selectedRequestDetail: ServiceRequest?
    var onShowCompletedRequests: (() -> Void)? = nil
    var onAssessJob: ((ServiceRequest) -> Void)? = nil
    
    private var offers: [ServiceRequest] {
        requestVM.requests.filter({ $0.status == .assigned })
    }
    
    private var activeJob: ServiceRequest? {
        requestVM.requests.first(where: { $0.status == .accepted || $0.status == .inProgress })
    }
    
    private var completedTodayCount: Int {
        requestVM.requests.filter({ $0.status == .completed || $0.status == .paid }).count
    }
    
    private var todaysEarningsSum: Double {
        requestVM.requests.filter({ $0.status == .completed || $0.paymentStatus == "Paid" }).reduce(0.0) { $0 + ($1.paymentAmount ?? 0.0) }
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Welcome Text
                Text("Welcome, \(authVM.user?.name ?? "Agent Specialist")")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                    .padding(.horizontal)
                
                // Summary Grid Cards matching Android SummaryGrid
                VStack(spacing: 16) {
                    // Active Job Banner Card
                    Button(action: {
                        if activeJob != nil {
                            onNavigateToSection(.activeService)
                        }
                    }) {
                        SummaryCard(
                            title: "Current Active Job",
                            value: activeJob?.serviceType ?? "No active job",
                            isPrimary: activeJob != nil
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    HStack(spacing: 16) {
                        Button(action: { onNavigateToSection(.newRequests) }) {
                            SummaryCard(title: "New Requests", value: "\(offers.count)", isPrimary: false)
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        SummaryCard(title: "Completed Today", value: "\(completedTodayCount)", isPrimary: false, action: {
                            onShowCompletedRequests?()
                        })
                    }
                    
                    // Today's Earnings container card
                    SummaryCard(title: "Today's Earnings", value: "₹\(Int(todaysEarningsSum))", isPrimary: true, action: {
                        onNavigateToSection(.payments)
                    })
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
                        QuickActionItem(title: "Active Service", icon: "wrench.and.screwdriver.fill") {
                            onNavigateToSection(.activeService)
                        }
                        QuickActionItem(title: "Payments", icon: "creditcard.fill") {
                            onNavigateToSection(.payments)
                        }
                        QuickActionItem(title: "My Profile", icon: "person.crop.circle.fill") {
                            onNavigateToSection(.profile)
                        }
                    }
                    .padding(.horizontal)
                }
                
                // New Assigned Requests section
                VStack(alignment: .leading, spacing: 12) {
                    Text("New Assigned Requests")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                        .padding(.horizontal)
                    
                    if offers.isEmpty {
                        VStack {
                            Text("You have no new requests assigned.")
                                .foregroundColor(.gray)
                                .font(.subheadline)
                                .padding()
                        }
                        .frame(maxWidth: .infinity)
                        .background(Color.white)
                        .cornerRadius(12)
                        .padding(.horizontal)
                    } else {
                        ForEach(offers) { job in
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Service: \(job.serviceType)")
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(SBRColors.textPrimary)
                                
                                Text("Customer: \(job.customerId?.name ?? "Client")")
                                    .font(.subheadline)
                                    .foregroundColor(SBRColors.textPrimary)
                                
                                Text("Address: \(job.customerAddress)")
                                    .font(.subheadline)
                                    .foregroundColor(SBRColors.textSecondary)
                                
                                Spacer().frame(height: 6)
                                
                                HStack(spacing: 12) {
                                    if let phone = job.customerId?.phone {
                                        Button(action: {
                                            if let url = URL(string: "tel:\(phone)") {
                                                UIApplication.shared.open(url)
                                            }
                                        }) {
                                            Label("Call", systemImage: "phone.fill")
                                                .font(.subheadline)
                                                .fontWeight(.bold)
                                                .foregroundColor(SBRColors.primaryBlue)
                                                .frame(maxWidth: .infinity)
                                                .padding(.vertical, 10)
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 8)
                                                        .stroke(SBRColors.primaryBlue, lineWidth: 1.5)
                                                )
                                        }
                                    }
                                    
                                    Button(action: {
                                        onAssessJob?(job)
                                    }) {
                                        Text("Assess & Accept")
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 11)
                                            .background(SBRColors.primaryBlue)
                                            .cornerRadius(8)
                                    }
                                }
                            }
                            .padding(16)
                            .background(Color.white)
                            .cornerRadius(16)
                            .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                            )
                            .padding(.horizontal)
                        }
                    }
                }
                
                Spacer().frame(height: 24)
            }
            .padding(.top)
        }
        .refreshable {
            await requestVM.fetchRequests()
        }
    }
}

// New Assigned Requests list view screen
struct AgentNewRequestsView: View {
    @ObservedObject var requestVM: RequestViewModel
    var onAssessJob: ((ServiceRequest) -> Void)? = nil
    
    var body: some View {
        VStack {
            let offers = requestVM.requests.filter({ $0.status == .assigned })
            if offers.isEmpty {
                Spacer()
                Text("No new requests assigned.")
                    .foregroundColor(.gray)
                Spacer()
            } else {
                List(offers) { job in
                    VStack(alignment: .leading, spacing: 10) {
                        Text(job.serviceType)
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textPrimary)
                        
                        Text("Customer: \(job.customerId?.name ?? "Client")")
                            .font(.body)
                            .foregroundColor(SBRColors.textPrimary)
                        
                        Text("Address: \(job.customerAddress)")
                            .font(.body)
                            .foregroundColor(SBRColors.textSecondary)
                        
                        HStack(spacing: 12) {
                            if let phone = job.customerId?.phone {
                                Button(action: {
                                    if let url = URL(string: "tel:\(phone)") {
                                        UIApplication.shared.open(url)
                                    }
                                }) {
                                    Label("Call Customer", systemImage: "phone.fill")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(SBRColors.primaryBlue)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 8)
                                                .stroke(SBRColors.primaryBlue, lineWidth: 1.5)
                                        )
                                }
                            }
                            
                            Button(action: {
                                onAssessJob?(job)
                            }) {
                                Text("Assess & Accept")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 11)
                                    .background(SBRColors.primaryBlue)
                                    .cornerRadius(8)
                            }
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                    )
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

// Active service details and action handlers
struct AgentActiveServiceView: View {
    @ObservedObject var requestVM: RequestViewModel
    @Binding var showingImagePicker: Bool
    @Binding var pickerImageType: String
    @Binding var activeJobForUpload: ServiceRequest?
    var onCompleteJob: ((ServiceRequest) -> Void)? = nil
    
    private var activeJob: ServiceRequest? {
        requestVM.requests.first(where: { $0.status == .accepted || $0.status == .inProgress })
    }
    
    var body: some View {
        VStack {
            if let error = requestVM.errorMessage {
                Text(error)
                    .font(.footnote)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 16)
                    .frame(maxWidth: .infinity)
                    .background(Color.red)
                    .cornerRadius(8)
                    .padding(.horizontal)
                    .padding(.top, 8)
                    .transition(.move(edge: .top))
            }
            
            if let job = activeJob {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        JobTimerView(request: job)
                        
                        VStack(alignment: .leading, spacing: 12) {
                            Text(job.serviceType)
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(SBRColors.textPrimary)
                            Text("Service Type")
                                .font(.caption)
                                .foregroundColor(.gray)
                            
                            Divider()
                            
                            HStack {
                                Image(systemName: "person.fill")
                                    .foregroundColor(.gray)
                                VStack(alignment: .leading) {
                                    Text(job.customerId?.name ?? "Client")
                                        .fontWeight(.semibold)
                                        .foregroundColor(SBRColors.textPrimary)
                                    Text("Customer")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                            }
                            
                            HStack {
                                Image(systemName: "info.circle.fill")
                                    .foregroundColor(.gray)
                                VStack(alignment: .leading) {
                                    Text(job.status.rawValue)
                                        .fontWeight(.semibold)
                                        .foregroundColor(SBRColors.textPrimary)
                                    Text("Current Status")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                            }
                            
                            HStack {
                                Image(systemName: "mappin.circle.fill")
                                    .foregroundColor(.gray)
                                VStack(alignment: .leading) {
                                    Text(job.customerAddress)
                                        .foregroundColor(SBRColors.textPrimary)
                                    Text("Customer Address")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                            }
                            
                            // Allocated Spares Section (if any)
                            if let comps = job.requiredComponents, !comps.isEmpty {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Image(systemName: "shippingbox.fill")
                                            .foregroundColor(.orange)
                                        Text("Allocated Spare Parts")
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(SBRColors.textPrimary)
                                        Spacer()
                                        if let total = job.inventoryTotal, total > 0 {
                                            Text("₹\(Int(total))")
                                                .font(.subheadline)
                                                .fontWeight(.bold)
                                                .foregroundColor(.orange)
                                        }
                                    }
                                    
                                    ForEach(comps) { comp in
                                        HStack {
                                            Text("• \(comp.name)")
                                                .font(.footnote)
                                                .foregroundColor(SBRColors.textPrimary)
                                            Spacer()
                                            Text("Qty: \(comp.quantity) \(comp.unitPrice != nil ? "(@ ₹\(Int(comp.unitPrice!)))" : "")")
                                                .font(.footnote)
                                                .foregroundColor(.gray)
                                        }
                                    }
                                }
                                .padding(12)
                                .background(Color.orange.opacity(0.08))
                                .cornerRadius(10)
                            }
                            
                            if job.paymentStatus == "Paid" {
                                HStack {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.green)
                                    VStack(alignment: .leading) {
                                        Text("₹\(Int(job.paymentAmount ?? 0)) via \(job.paymentMethod ?? "Cash")")
                                            .fontWeight(.bold)
                                            .foregroundColor(.green)
                                        Text("Payment Collected")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                }
                            }
                            
                            Spacer().frame(height: 10)
                            
                            if let phone = job.customerId?.phone {
                                Button(action: {
                                    if let url = URL(string: "tel:\(phone)") {
                                        UIApplication.shared.open(url)
                                    }
                                }) {
                                    Label("Call Customer", systemImage: "phone.fill")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(SBRColors.primaryBlue)
                                        .cornerRadius(8)
                                }
                            }
                            
                            Spacer().frame(height: 8)
                            
                            // Status specific Action buttons matching restructured flow
                            switch job.status {
                            case .accepted:
                                Button(action: {
                                    self.activeJobForUpload = job
                                    self.pickerImageType = "before"
                                    self.showingImagePicker = true
                                }) {
                                    Label("Upload Before Image & Start Work", systemImage: "camera.fill")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(Color.blue)
                                        .cornerRadius(8)
                                }
                                .disabled(requestVM.isLoading)
                            case .inProgress:
                                if job.beforeImageUrl == nil {
                                    Button(action: {
                                        self.activeJobForUpload = job
                                        self.pickerImageType = "before"
                                        self.showingImagePicker = true
                                    }) {
                                        Label("Upload Before Image", systemImage: "camera.fill")
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 12)
                                            .background(Color.orange)
                                            .cornerRadius(8)
                                    }
                                    .disabled(requestVM.isLoading)
                                } else if job.afterImageUrl == nil {
                                    Button(action: {
                                        self.activeJobForUpload = job
                                        self.pickerImageType = "after"
                                        self.showingImagePicker = true
                                    }) {
                                        Label("Upload After Image", systemImage: "camera.fill")
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 12)
                                            .background(Color.green)
                                            .cornerRadius(8)
                                    }
                                    .disabled(requestVM.isLoading)
                                } else {
                                    // Step 6: Payment Split with Spares, Service Charge, Discount & Review options
                                    Button(action: {
                                        onCompleteJob?(job)
                                    }) {
                                        Label("Step 6: Payment Split & Close Service", systemImage: "creditcard.fill")
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 12)
                                            .background(Color.indigo)
                                            .cornerRadius(8)
                                    }
                                    .disabled(requestVM.isLoading)
                                }
                            default:
                                Text("This job is complete.")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.gray)
                                    .frame(maxWidth: .infinity, alignment: .center)
                            }
                        }
                        .padding(16)
                        .background(Color.white)
                        .cornerRadius(16)
                        .shadow(color: Color.black.opacity(0.03), radius: 5, x: 0, y: 1)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                        )
                        .padding()
                    }
                }
            } else {
                Spacer()
                Text("No active service.")
                    .foregroundColor(.gray)
                Spacer()
            }
        }
        .background(Color(red: 0.97, green: 0.98, blue: 1.0))
    }
}

// Side list item shell for Agent My Profile view (matched with Android screen)
struct AgentProfileScreenView: View {
    @ObservedObject var authVM: AuthViewModel
    @ObservedObject var requestVM: RequestViewModel
    
    @State private var isAvailable: Bool = true
    @State private var isUpdatingAvailability = false
    @State private var showingDeleteAlert = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text("My Profile")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                    .padding(.top)
                
                if let user = authVM.user {
                    // Profile Info Card
                    VStack(alignment: .leading, spacing: 0) {
                        ProfileInfoRow(title: user.name, subtitle: "Name", icon: "person.fill")
                        Divider().padding(.leading, 50)
                        ProfileInfoRow(title: user.email, subtitle: "Email", icon: "envelope.fill")
                        Divider().padding(.leading, 50)
                        ProfileInfoRow(title: user.phone ?? "N/A", subtitle: "Phone", icon: "phone.fill")
                    }
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.02), radius: 5, x: 0, y: 1)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                    )
                    .padding(.horizontal)
                    
                    // Agent Stats & Availability Card
                    VStack(alignment: .leading, spacing: 0) {
                        ProfileStatRow(title: "\(user.completedJobs ?? 0) Jobs Completed", icon: "briefcase.fill")
                        Divider().padding(.leading, 50)
                        ProfileStatRow(title: String(format: "%.1f / 5.0", user.rating ?? 0.0), icon: "star.fill")
                        Divider().padding(.leading, 50)
                        
                        // Availability Toggle Row
                        HStack(spacing: 12) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.title3)
                                .foregroundColor(SBRColors.primaryBlue)
                                .frame(width: 36, height: 36)
                                .background(SBRColors.primaryBlue.opacity(0.08))
                                .cornerRadius(8)
                            
                            Toggle(isOn: $isAvailable) {
                                Text(isAvailable ? "Available for new jobs" : "Not available")
                                    .fontWeight(.medium)
                                    .foregroundColor(SBRColors.textPrimary)
                            }
                            .disabled(isUpdatingAvailability)
                            .onChange(of: isAvailable) { _, newValue in
                                updateAvailability(to: newValue)
                            }
                        }
                        .padding(.vertical, 12)
                        .padding(.horizontal)
                    }
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.02), radius: 5, x: 0, y: 1)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                    )
                    .padding(.horizontal)
                    
                    NavigationLink(destination: AgentEditProfileView(authVM: authVM)) {
                        Text("Edit Profile")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(SBRColors.primaryBlue)
                            .cornerRadius(8)
                    }
                    .padding(.horizontal)
                    .padding(.top, 10)
                    
                    // Privacy Policy Link
                    Link(destination: URL(string: "https://sbr.sriddha.com/privacy")!) {
                        HStack {
                            Image(systemName: "hand.raised.fill")
                            Text("Privacy Policy")
                                .fontWeight(.medium)
                        }
                        .font(.footnote)
                        .foregroundColor(SBRColors.primaryBlue)
                        .padding(.top, 8)
                    }
                    
                    Divider()
                        .padding(.horizontal)
                        .padding(.top, 16)
                    
                    // Delete Account Section
                    VStack(spacing: 8) {
                        Text("Danger Zone")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        Text("Permanently delete your profile and personal data. This cannot be undone.")
                            .font(.caption2)
                            .foregroundColor(.gray)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        Button(action: { showingDeleteAlert = true }) {
                            HStack {
                                Spacer()
                                Text("Delete Account")
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                Spacer()
                            }
                            .padding()
                            .background(Color.red.opacity(0.85))
                            .cornerRadius(12)
                        }
                    }
                    .padding()
                    .background(Color.red.opacity(0.05))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.red.opacity(0.15), lineWidth: 1)
                    )
                    .padding(.horizontal)
                    .padding(.top, 8)
                } else {
                    ProgressView()
                }
                
                Spacer()
            }
        }
        .background(Color(red: 0.97, green: 0.98, blue: 1.0).ignoresSafeArea())
        .alert(isPresented: $showingDeleteAlert) {
            Alert(
                title: Text("Delete Account"),
                message: Text("Are you absolutely sure you want to permanently delete your account? This action is permanent and cannot be undone."),
                primaryButton: .destructive(Text("Delete")) {
                    deleteUserAccount()
                },
                secondaryButton: .cancel()
            )
        }
        .onAppear {
            if let user = authVM.user {
                isAvailable = user.isAvailable ?? true
            }
        }
    }
    
    private func updateAvailability(to newValue: Bool) {
        isUpdatingAvailability = true
        let body = ["isAvailable": AnyEncodable(newValue)]
        Task {
            struct ProfileResponse: Decodable {
                let success: Bool
                let data: User?
                let error: String?
            }
            do {
                let res = try await APIClient.shared.put(endpoint: "api/users/profile", body: body, responseType: ProfileResponse.self)
                if res.success, let updatedUser = res.data {
                    authVM.user = updatedUser
                    if let encodedUser = try? JSONEncoder().encode(updatedUser) {
                        UserDefaults.standard.set(encodedUser, forKey: "auth_user")
                    }
                }
            } catch {
                print("Failed to update availability status: \(error)")
            }
            isUpdatingAvailability = false
        }
    }
    
    private func deleteUserAccount() {
        Task {
            _ = await authVM.deleteAccount()
        }
    }
}

// Helpers for matched UI
struct ProfileInfoRow: View {
    let title: String
    let subtitle: String
    let icon: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(SBRColors.primaryBlue)
                .frame(width: 36, height: 36)
                .background(SBRColors.primaryBlue.opacity(0.08))
                .cornerRadius(8)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                Text(subtitle)
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            Spacer()
        }
        .padding(.vertical, 12)
        .padding(.horizontal)
    }
}

struct ProfileStatRow: View {
    let title: String
    let icon: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(SBRColors.primaryBlue)
                .frame(width: 36, height: 36)
                .background(SBRColors.primaryBlue.opacity(0.08))
                .cornerRadius(8)
            
            Text(title)
                .fontWeight(.medium)
                .foregroundColor(SBRColors.textPrimary)
            Spacer()
        }
        .padding(.vertical, 12)
        .padding(.horizontal)
    }
}

// MARK: - Step 3: Agent Assessment Sheet
struct AgentAssessmentSheet: View {
    let job: ServiceRequest
    @ObservedObject var requestVM: RequestViewModel
    let onDismiss: () -> Void
    
    @State private var assessmentType: String = "service_only" // "service_only" or "spare_parts"
    @State private var vanItems: [AgentInventoryItem] = []
    @State private var selectedComponents: [RequiredComponent] = []
    @State private var isLoadingVanStock = false
    @State private var selectedInventoryItemId: String = ""
    @State private var partQuantity: Int = 1
    @State private var isSubmitting = false
    @State private var alertMessage: String? = nil
    @State private var showAlert = false
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("1. Call & Assess Customer Request").foregroundColor(.gray)) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(job.serviceType)
                            .font(.headline)
                            .foregroundColor(SBRColors.textPrimary)
                        Text("Customer: \(job.customerId?.name ?? "Client")")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Text("Address: \(job.customerAddress)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                    
                    if let phone = job.customerId?.phone {
                        Button(action: {
                            if let url = URL(string: "tel:\(phone)") {
                                UIApplication.shared.open(url)
                            }
                        }) {
                            Label("Call Customer: \(phone)", systemImage: "phone.fill")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(SBRColors.primaryBlue)
                        }
                    }
                }
                
                Section(header: Text("2. Job Requirement Assessment").foregroundColor(.gray)) {
                    Picker("Requirement", selection: $assessmentType) {
                        Text("Service Only").tag("service_only")
                        Text("Requires Spares").tag("spare_parts")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
                
                if assessmentType == "spare_parts" {
                    Section(header: Text("3. Allocate Parts from Van Stock").foregroundColor(.gray)) {
                        if isLoadingVanStock {
                            HStack {
                                ProgressView()
                                Text("Loading van inventory...")
                                    .font(.footnote)
                                    .foregroundColor(.gray)
                            }
                        } else if vanItems.isEmpty {
                            Text("No spare parts found in your van inventory.")
                                .font(.footnote)
                                .foregroundColor(.red)
                        } else {
                            Picker("Select Spare Part", selection: $selectedInventoryItemId) {
                                Text("Choose a part").tag("")
                                ForEach(vanItems) { item in
                                    Text("\(item.displayName) (Stock: \(item.quantity))\(item.unitPrice != nil ? " - ₹\(Int(item.unitPrice!))" : "")")
                                        .tag(item.id)
                                }
                            }
                            
                            if !selectedInventoryItemId.isEmpty {
                                Stepper("Quantity: \(partQuantity)", value: $partQuantity, in: 1...50)
                                
                                Button(action: addPartToSelection) {
                                    Label("Add Part to Job", systemImage: "plus.circle.fill")
                                        .fontWeight(.semibold)
                                        .foregroundColor(SBRColors.primaryBlue)
                                }
                            }
                        }
                    }
                    
                    if !selectedComponents.isEmpty {
                        Section(header: Text("Allocated Parts Summary").foregroundColor(.gray)) {
                            ForEach(selectedComponents) { comp in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(comp.name)
                                            .font(.subheadline)
                                            .fontWeight(.medium)
                                        Text("Qty: \(comp.quantity)\(comp.unitPrice != nil ? " × ₹\(Int(comp.unitPrice!))" : "")")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                    Spacer()
                                    Text("₹\(Int(Double(comp.quantity) * (comp.unitPrice ?? 0.0)))")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                    
                                    Button(action: {
                                        selectedComponents.removeAll(where: { $0.id == comp.id })
                                    }) {
                                        Image(systemName: "trash")
                                            .foregroundColor(.red)
                                    }
                                    .buttonStyle(BorderlessButtonStyle())
                                    .padding(.leading, 8)
                                }
                            }
                            
                            HStack {
                                Text("Estimated Parts Total")
                                    .fontWeight(.bold)
                                Spacer()
                                Text("₹\(Int(estimatedPartsTotal))")
                                    .fontWeight(.bold)
                                    .foregroundColor(SBRColors.primaryBlue)
                            }
                        }
                    }
                }
                
                Section {
                    Button(action: confirmAcceptance) {
                        HStack {
                            Spacer()
                            if isSubmitting {
                                ProgressView().tint(.white)
                            } else {
                                Text(assessmentType == "service_only" ? "Confirm & Accept (Service Only)" : (selectedComponents.isEmpty ? "Allocate Spares to Accept" : "Confirm & Allocate Spares (₹\(Int(estimatedPartsTotal)))"))
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                            }
                            Spacer()
                        }
                    }
                    .padding(.vertical, 4)
                    .listRowBackground(assessmentType == "spare_parts" && selectedComponents.isEmpty ? Color.gray : SBRColors.primaryBlue)
                    .disabled(isSubmitting || (assessmentType == "spare_parts" && selectedComponents.isEmpty))
                }
            }
            .navigationTitle("Assess & Accept")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { onDismiss() }
                }
            }
            .onAppear {
                fetchVanStock()
            }
            .alert("Notice", isPresented: $showAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(alertMessage ?? "")
            }
        }
    }
    
    private var estimatedPartsTotal: Double {
        selectedComponents.reduce(0.0) { $0 + (Double($1.quantity) * ($1.unitPrice ?? 0.0)) }
    }
    
    private func fetchVanStock() {
        isLoadingVanStock = true
        Task {
            do {
                let res = try await APIClient.shared.get(
                    endpoint: "api/agent-inventory/my-stock",
                    responseType: APIResponse<[AgentInventoryItem]>.self
                )
                DispatchQueue.main.async {
                    self.vanItems = res.data ?? []
                    self.isLoadingVanStock = false
                }
            } catch {
                DispatchQueue.main.async {
                    self.isLoadingVanStock = false
                }
            }
        }
    }
    
    private func addPartToSelection() {
        guard let item = vanItems.first(where: { $0.id == selectedInventoryItemId }) else { return }
        let prodName = item.displayName
        let prodSku = item.sku
        let prodPrice = item.unitPrice ?? 0.0
        let prodId = item.productId ?? item.id
        
        if let idx = selectedComponents.firstIndex(where: { $0.productId == prodId || $0.name == prodName }) {
            let existing = selectedComponents[idx]
            selectedComponents[idx] = RequiredComponent(
                posProductId: existing.posProductId,
                productId: prodId,
                name: prodName,
                sku: prodSku,
                quantity: existing.quantity + partQuantity,
                unitPrice: prodPrice
            )
        } else {
            selectedComponents.append(RequiredComponent(
                posProductId: item.posProductId,
                productId: prodId,
                name: prodName,
                sku: prodSku,
                quantity: partQuantity,
                unitPrice: prodPrice
            ))
        }
        
        selectedInventoryItemId = ""
        partQuantity = 1
    }
    
    private func confirmAcceptance() {
        isSubmitting = true
        Task {
            let compsToSend = assessmentType == "spare_parts" ? selectedComponents : []
            let success = await requestVM.updateStatus(
                requestId: job.id,
                status: .accepted,
                requiredComponents: compsToSend
            )
            DispatchQueue.main.async {
                self.isSubmitting = false
                if success {
                    self.onDismiss()
                    Task { await self.requestVM.fetchRequests() }
                } else {
                    self.alertMessage = self.requestVM.errorMessage ?? "Failed to accept request"
                    self.showAlert = true
                }
            }
        }
    }
}

// MARK: - Step 6: Payment Breakdown Sheet with Dynamic Extra Spares & Google Review Options
struct AgentPaymentBreakdownSheet: View {
    let job: ServiceRequest
    @ObservedObject var requestVM: RequestViewModel
    let onDismiss: () -> Void
    
    @State private var components: [RequiredComponent] = []
    @State private var serviceChargeText: String = "350"
    @State private var discountText: String = "0"
    @State private var discountRemarks: String = ""
    @State private var paymentMethod: String = "Cash"
    
    // Dynamic parts addition during Step 6
    @State private var showAddExtraPartSheet = false
    @State private var vanItems: [AgentInventoryItem] = []
    @State private var selectedExtraItemId: String = ""
    @State private var extraQuantity: Int = 1
    @State private var extraUnitPrice: String = ""
    @State private var isLoadingVanStock = false
    @State private var isSubmitting = false
    @State private var alertMessage: String? = nil
    @State private var showAlert = false
    
    var body: some View {
        NavigationView {
            Form {
                // Job Summary Header
                Section(header: Text("Job Details").foregroundColor(.gray)) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(job.serviceType)
                            .font(.headline)
                            .foregroundColor(SBRColors.textPrimary)
                        Text("Customer: \(job.customerId?.name ?? "Client")")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Text(job.customerAddress)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 2)
                }
                
                // Step 6 Dynamic Parts Used Section
                Section(header: HStack {
                    Text("1. Spare Parts Used")
                        .foregroundColor(.gray)
                    Spacer()
                    Button(action: { showAddExtraPartSheet = true }) {
                        HStack(spacing: 3) {
                            Image(systemName: "plus.circle.fill")
                            Text("Add Extra Part")
                        }
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.primaryBlue)
                    }
                }) {
                    if components.isEmpty {
                        Text("No spare parts recorded. Tap '+ Add Extra Part' if any spares were used on site.")
                            .font(.footnote)
                            .foregroundColor(.secondary)
                            .padding(.vertical, 4)
                    } else {
                        ForEach(components) { comp in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(comp.name)
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                    Text("Qty: \(comp.quantity)\(comp.unitPrice != nil ? " × ₹\(Int(comp.unitPrice!))" : "")")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                                Spacer()
                                Text("₹\(Int(Double(comp.quantity) * (comp.unitPrice ?? 0.0)))")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                
                                Button(action: {
                                    components.removeAll(where: { $0.id == comp.id })
                                }) {
                                    Image(systemName: "trash")
                                        .foregroundColor(.red)
                                }
                                .buttonStyle(BorderlessButtonStyle())
                                .padding(.leading, 8)
                            }
                        }
                        
                        HStack {
                            Text("Parts Subtotal")
                                .fontWeight(.semibold)
                            Spacer()
                            Text("₹\(Int(inventorySubtotal))")
                                .fontWeight(.bold)
                                .foregroundColor(SBRColors.primaryBlue)
                        }
                    }
                }
                
                // Service Charge & Store Discount Breakdown
                Section(header: Text("2. Service Charge & Store Discount").foregroundColor(.gray)) {
                    HStack {
                        Text("Service Charge (₹)")
                            .font(.subheadline)
                        Spacer()
                        TextField("350", text: $serviceChargeText)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }
                    
                    HStack {
                        Text("Store Discount (₹)")
                            .font(.subheadline)
                        Spacer()
                        TextField("0", text: $discountText)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("⚠️ Store In-Charge Verification:")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.orange)
                        Text("Any discount entered here must be confirmed with the Store In-Charge or Admin.")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 2)
                    
                    TextField("Reason for discount (optional)", text: $discountRemarks)
                        .font(.footnote)
                }
                
                // Payment Method & Summary
                Section(header: Text("3. Payment Method & Final Amount").foregroundColor(.gray)) {
                    Picker("Payment Method", selection: $paymentMethod) {
                        Text("Cash").tag("Cash")
                        Text("UPI").tag("UPI")
                        Text("Card").tag("Card")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    
                    VStack(spacing: 8) {
                        HStack {
                            Text("Parts Subtotal:")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            Spacer()
                            Text("₹\(Int(inventorySubtotal))")
                                .font(.subheadline)
                        }
                        HStack {
                            Text("Service Charge:")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            Spacer()
                            Text("+ ₹\(Int(serviceChargeValue))")
                                .font(.subheadline)
                        }
                        if discountValue > 0 {
                            HStack {
                                Text("Discount:")
                                    .font(.subheadline)
                                    .foregroundColor(.red)
                                Spacer()
                                Text("- ₹\(Int(discountValue))")
                                    .font(.subheadline)
                                    .foregroundColor(.red)
                            }
                        }
                        Divider()
                        HStack {
                            Text("Net Total Payable:")
                                .font(.headline)
                                .fontWeight(.bold)
                            Spacer()
                            Text("₹\(Int(netTotal))")
                                .font(.title3)
                                .fontWeight(.heavy)
                                .foregroundColor(SBRColors.primaryBlue)
                        }
                    }
                    .padding(.vertical, 4)
                }
                
                // Closeout Buttons: With Google Review vs Without Review
                Section {
                    VStack(spacing: 12) {
                        Button(action: { completeJobAction(requestReview: true) }) {
                            HStack {
                                Spacer()
                                if isSubmitting {
                                    ProgressView().tint(.white)
                                } else {
                                    Label("Collect ₹\(Int(netTotal)) & Close with Review", systemImage: "star.fill")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                }
                                Spacer()
                            }
                        }
                        .padding(.vertical, 4)
                        .listRowBackground(SBRColors.primaryBlue)
                        .disabled(isSubmitting)
                        
                        Button(action: { completeJobAction(requestReview: false) }) {
                            HStack {
                                Spacer()
                                Label("Collect ₹\(Int(netTotal)) & Close (No Review)", systemImage: "checkmark.circle.fill")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.secondary)
                                Spacer()
                            }
                        }
                        .padding(.vertical, 2)
                        .disabled(isSubmitting)
                    }
                }
            }
            .navigationTitle("Payment & Completion")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { onDismiss() }
                }
            }
            .onAppear {
                initValues()
            }
            .sheet(isPresented: $showAddExtraPartSheet) {
                addExtraPartSheet
            }
            .alert("Notice", isPresented: $showAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(alertMessage ?? "")
            }
        }
    }
    
    private var inventorySubtotal: Double {
        components.reduce(0.0) { $0 + (Double($1.quantity) * ($1.unitPrice ?? 0.0)) }
    }
    
    private var serviceChargeValue: Double {
        Double(serviceChargeText) ?? 0.0
    }
    
    private var discountValue: Double {
        Double(discountText) ?? 0.0
    }
    
    private var netTotal: Double {
        max(0.0, inventorySubtotal + serviceChargeValue - discountValue)
    }
    
    private func initValues() {
        if let existing = job.requiredComponents, !existing.isEmpty {
            self.components = existing
        }
        if let sc = job.serviceCharge, sc > 0 {
            self.serviceChargeText = "\(Int(sc))"
        }
        if let disc = job.discount, disc > 0 {
            self.discountText = "\(Int(disc))"
        }
        if let remarks = job.discountRemarks {
            self.discountRemarks = remarks
        }
        fetchVanStock()
    }
    
    private func fetchVanStock() {
        isLoadingVanStock = true
        Task {
            do {
                let res = try await APIClient.shared.get(
                    endpoint: "api/agent-inventory/my-stock",
                    responseType: APIResponse<[AgentInventoryItem]>.self
                )
                DispatchQueue.main.async {
                    self.vanItems = res.data ?? []
                    self.isLoadingVanStock = false
                }
            } catch {
                DispatchQueue.main.async {
                    self.isLoadingVanStock = false
                }
            }
        }
    }
    
    // Modal to add extra part from van inventory
    private var addExtraPartSheet: some View {
        NavigationView {
            Form {
                Section(header: Text("Select Extra Spare Part").foregroundColor(.gray)) {
                    if isLoadingVanStock {
                        ProgressView("Loading stock...")
                    } else if vanItems.isEmpty {
                        Text("No stock items found in your van.")
                            .foregroundColor(.red)
                    } else {
                        Picker("Select Part", selection: $selectedExtraItemId) {
                            Text("Choose Part").tag("")
                            ForEach(vanItems) { item in
                                Text("\(item.displayName) (Stock: \(item.quantity))\(item.unitPrice != nil ? " - ₹\(Int(item.unitPrice!))" : "")")
                                    .tag(item.id)
                            }
                        }
                        .onChange(of: selectedExtraItemId) { _, newId in
                            if let item = vanItems.first(where: { $0.id == newId }), let p = item.unitPrice {
                                extraUnitPrice = "\(Int(p))"
                            }
                        }
                        
                        Stepper("Quantity: \(extraQuantity)", value: $extraQuantity, in: 1...50)
                        
                        HStack {
                            Text("Unit Price (₹)")
                            Spacer()
                            TextField("Price", text: $extraUnitPrice)
                                .keyboardType(.numberPad)
                                .multilineTextAlignment(.trailing)
                                .frame(width: 100)
                        }
                    }
                }
                
                Section {
                    Button(action: addExtraPart) {
                        HStack {
                            Spacer()
                            Text("Add to Job Summary")
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            Spacer()
                        }
                    }
                    .listRowBackground(SBRColors.primaryBlue)
                    .disabled(selectedExtraItemId.isEmpty)
                }
            }
            .navigationTitle("Add Extra Spare Part")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { showAddExtraPartSheet = false }
                }
            }
        }
    }
    
    private func addExtraPart() {
        guard let item = vanItems.first(where: { $0.id == selectedExtraItemId }) else { return }
        let prodName = item.displayName
        let prodSku = item.sku
        let prodPrice = Double(extraUnitPrice) ?? (item.unitPrice ?? 0.0)
        let prodId = item.productId ?? item.id
        
        if let idx = components.firstIndex(where: { $0.productId == prodId || $0.name == prodName }) {
            let existing = components[idx]
            components[idx] = RequiredComponent(
                posProductId: existing.posProductId,
                productId: prodId,
                name: prodName,
                sku: prodSku,
                quantity: existing.quantity + extraQuantity,
                unitPrice: prodPrice
            )
        } else {
            components.append(RequiredComponent(
                posProductId: item.posProductId,
                productId: prodId,
                name: prodName,
                sku: prodSku,
                quantity: extraQuantity,
                unitPrice: prodPrice
            ))
        }
        
        selectedExtraItemId = ""
        extraQuantity = 1
        extraUnitPrice = ""
        showAddExtraPartSheet = false
    }
    
    private func completeJobAction(requestReview: Bool) {
        isSubmitting = true
        Task {
            let success = await requestVM.completeJob(
                requestId: job.id,
                inventoryTotal: inventorySubtotal,
                serviceCharge: serviceChargeValue,
                discount: discountValue,
                discountRemarks: discountRemarks,
                finalAmount: netTotal,
                paymentMethod: paymentMethod,
                requiredComponents: components,
                requestReview: requestReview
            )
            
            DispatchQueue.main.async {
                self.isSubmitting = false
                if success {
                    self.requestVM.stopLocationTracking()
                    self.onDismiss()
                    Task { await self.requestVM.fetchRequests() }
                } else {
                    self.alertMessage = self.requestVM.errorMessage ?? "Failed to close service."
                    self.showAlert = true
                }
            }
        }
    }
}

struct AgentCompletedRequestsSheet: View {
    @ObservedObject var requestVM: RequestViewModel
    let onSelectRequest: (ServiceRequest) -> Void
    @Environment(\.dismiss) var dismiss
    
    private var completedRequests: [ServiceRequest] {
        requestVM.requests.filter({ $0.status == .completed || $0.status == .paid })
    }
    
    var body: some View {
        NavigationView {
            VStack {
                if completedRequests.isEmpty {
                    Spacer()
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(Color.gray.opacity(0.4))
                        .padding(.bottom, 8)
                    Text("No completed services yet.")
                        .foregroundColor(.gray)
                        .font(.subheadline)
                    Spacer()
                } else {
                    List(completedRequests) { req in
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
            .navigationTitle("Completed Services")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                }
            }
            .background(Color(red: 0.97, green: 0.98, blue: 1.0))
        }
    }
}
