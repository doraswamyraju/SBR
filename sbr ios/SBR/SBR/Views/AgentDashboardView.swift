import SwiftUI

enum AgentSection: Hashable {
    case dashboard
    case newRequests
    case activeService
    case payments
    case profile
}

struct AgentDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject var requestVM = RequestViewModel()
    
    @State private var selectedSection: AgentSection = .dashboard
    @State private var isDrawerOpen = false
    @State private var selectedRequestDetail: ServiceRequest?
    
    var body: some View {
        SidebarNavigationLayout(
            title: sectionTitle(selectedSection),
            drawerHeader: "Agent Panel",
            sections: [.dashboard, .newRequests, .activeService, .payments, .profile],
            selectedSection: $selectedSection,
            sectionTitle: { sectionTitle($0) },
            sectionIcon: { sectionIcon($0) },
            isDrawerOpen: $isDrawerOpen,
            onLogout: {
                Task { await requestVM.stopLocationSimulation(); await authVM.logout() }
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
                        selectedRequestDetail: $selectedRequestDetail
                    )
                case .newRequests:
                    AgentNewRequestsView(requestVM: requestVM)
                case .activeService:
                    AgentActiveServiceView(requestVM: requestVM)
                case .payments:
                    AgentAnalyticsView(requestVM: requestVM)
                case .profile:
                    AgentProfileScreenView(authVM: authVM, requestVM: requestVM)
                }
            }
        }
        .sheet(item: $selectedRequestDetail) { job in
            RequestDetailView(request: job)
        }
        .onAppear {
            Task {
                await requestVM.fetchRequests()
            }
        }
    }
    
    private func sectionTitle(_ section: AgentSection) -> String {
        switch section {
        case .dashboard: return "Dashboard"
        case .newRequests: return "New Requests"
        case .activeService: return "Active Service"
        case .payments: return "Payments"
        case .profile: return "My Profile"
        }
    }
    
    private func sectionIcon(_ section: AgentSection) -> String {
        switch section {
        case .dashboard: return "square.grid.2x2.fill"
        case .newRequests: return "list.bullet.rectangle.fill"
        case .activeService: return "wrench.and.screwdriver.fill"
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
    
    private var offers: [ServiceRequest] {
        requestVM.requests.filter({ $0.status == .assigned })
    }
    
    private var activeJob: ServiceRequest? {
        requestVM.requests.first(where: { $0.status == .accepted || $0.status == .inProgress })
    }
    
    private var completedTodayCount: Int {
        requestVM.requests.filter({ $0.status == .completed }).count
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
                        
                        SummaryCard(title: "Completed Today", value: "\(completedTodayCount)", isPrimary: false)
                    }
                    
                    // Today's Earnings container card
                    SummaryCard(title: "Today's Earnings", value: "₹\(Int(todaysEarningsSum))", isPrimary: true)
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
                                        Task {
                                            let success = await requestVM.updateStatus(requestId: job.id, status: .accepted)
                                            if success {
                                                await requestVM.fetchRequests()
                                            }
                                        }
                                    }) {
                                        Text("Accept")
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
                
                Spacer()
            }
            .padding(.top)
        }
    }
}

// New Assigned Requests list view screen
struct AgentNewRequestsView: View {
    @ObservedObject var requestVM: RequestViewModel
    
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
                                Task {
                                    let success = await requestVM.updateStatus(requestId: job.id, status: .accepted)
                                    if success {
                                        await requestVM.fetchRequests()
                                    }
                                }
                            }) {
                                Text("Accept")
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
    
    @State private var showingPaymentDialog = false
    @State private var showingReviewPromptAlert = false
    @State private var requestReviewForClose = false
    @State private var collectAmount = ""
    @State private var paymentMethod = "Cash"
    
    private var activeJob: ServiceRequest? {
        requestVM.requests.first(where: { $0.status == .accepted || $0.status == .inProgress || $0.status == .completed })
    }
    
    var body: some View {
        VStack {
            if let job = activeJob {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
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
                            
                            // Mock live GPS tracking control panel inside Active Service card
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Mock Live GPS Broadcast")
                                    .fontWeight(.bold)
                                    .foregroundColor(SBRColors.textPrimary)
                                    .font(.subheadline)
                                
                                Button(action: {
                                    requestVM.startLocationSimulation(activeRequestId: job.id)
                                }) {
                                    Text("Start Mock GPS Tracking")
                                        .font(.footnote)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .padding(.vertical, 8)
                                        .padding(.horizontal, 14)
                                        .background(Color.green)
                                        .cornerRadius(6)
                                }
                            }
                            .padding()
                            .background(Color.green.opacity(0.08))
                            .cornerRadius(10)
                            
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
                            
                            // Status specific Action buttons matching Android flow
                            switch job.status {
                            case .accepted:
                                Button(action: { markJobInProgress(job) }) {
                                    Text("Start Work / Mark as Arrived")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(Color.blue)
                                        .cornerRadius(8)
                                }
                            case .inProgress:
                                HStack(spacing: 12) {
                                    Button(action: { uploadBeforeImage(job) }) {
                                        Text("Before Image")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 11)
                                            .background(job.beforeImageUrl == nil ? Color.orange : Color.gray)
                                            .cornerRadius(8)
                                            .disabled(job.beforeImageUrl != nil)
                                    }
                                    
                                    Button(action: {
                                        showingReviewPromptAlert = true
                                    }) {
                                        Text("After Image & Complete")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 11)
                                            .background(job.beforeImageUrl != nil ? Color.green : Color.gray)
                                            .cornerRadius(8)
                                            .disabled(job.beforeImageUrl == nil)
                                    }
                                }
                            case .completed:
                                Button(action: {
                                    showingPaymentDialog = true
                                }) {
                                    Text("Update Payment Details")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(Color.green)
                                        .cornerRadius(8)
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
        .sheet(isPresented: $showingPaymentDialog) {
            if let job = activeJob {
                PaymentDialogView(amount: $collectAmount, method: $paymentMethod, onCancel: {
                    showingPaymentDialog = false
                }, onSubmit: {
                    handlePaymentSubmit(jobId: job.id)
                })
            }
        }
        .alert("Request Customer Review?", isPresented: $showingReviewPromptAlert) {
            Button("Yes, Request Review") {
                handleRequestReview(yesRequest: true)
            }
            Button("No, Complete Only") {
                handleRequestReview(yesRequest: false)
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Would you like to send a Google Maps review request to the customer via Email and Push Notification?")
        }
    }
    
    // Extracted helper actions to speed up compiler type-checking
    private func markJobInProgress(_ job: ServiceRequest) {
        Task {
            let success = await requestVM.updateStatus(requestId: job.id, status: .inProgress)
            if success { await requestVM.fetchRequests() }
        }
    }
    
    private func uploadBeforeImage(_ job: ServiceRequest) {
        Task {
            let mockData = UIImage(systemName: "camera.fill")?.pngData() ?? Data()
            _ = await requestVM.uploadRequestImage(requestId: job.id, imageData: mockData, type: "before")
            await requestVM.fetchRequests()
        }
    }
    
    private func handleRequestReview(yesRequest: Bool) {
        requestReviewForClose = yesRequest
        Task {
            guard let jobId = activeJob?.id else { return }
            let mockData = UIImage(systemName: "camera.fill")?.pngData() ?? Data()
            let success = await requestVM.uploadRequestImage(requestId: jobId, imageData: mockData, type: "after")
            if success {
                _ = await requestVM.updateStatus(requestId: jobId, status: .completed, requestReview: yesRequest)
                await requestVM.fetchRequests()
                showingPaymentDialog = true
            }
        }
    }
    
    private func handlePaymentSubmit(jobId: String) {
        Task {
            let amountVal = Double(collectAmount) ?? 0.0
            let success = await requestVM.completeJob(
                requestId: jobId,
                amount: amountVal,
                method: paymentMethod,
                requestReview: requestReviewForClose
            )
            if success {
                showingPaymentDialog = false
                collectAmount = ""
                requestVM.stopLocationSimulation()
                await requestVM.fetchRequests()
            }
        }
    }
}

// Side list item shell for Agent My Profile view
struct AgentProfileScreenView: View {
    @ObservedObject var authVM: AuthViewModel
    @ObservedObject var requestVM: RequestViewModel
    
    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 8) {
                Image(systemName: "person.crop.badge.checkmark")
                    .font(.system(size: 70))
                    .foregroundColor(SBRColors.primaryBlue)
                
                Text(authVM.user?.name ?? "Agent Specialist")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                
                Text(authVM.user?.email ?? "")
                    .foregroundColor(.gray)
            }
            .padding(.top)
            
            List {
                NavigationLink(destination: AgentEditProfileView(authVM: authVM)) {
                    Label("Edit My Profile Settings", systemImage: "person.text.rectangle")
                }
                .listRowBackground(Color.white)
                
                NavigationLink(destination: AgentScheduleView()) {
                    Label("Duty & Roster Shift", systemImage: "calendar")
                }
                .listRowBackground(Color.white)
                
                NavigationLink(destination: AgentAnalyticsView(requestVM: requestVM)) {
                    Label("Performance Analytics & Logs", systemImage: "chart.bar.xaxis")
                }
                .listRowBackground(Color.white)
            }
            .listStyle(GroupedListStyle())
            
            Spacer()
        }
        .background(Color(red: 0.97, green: 0.98, blue: 1.0))
    }
}

// Complete Job Payment Dialogue View
struct PaymentDialogView: View {
    @Binding var amount: String
    @Binding var method: String
    let onCancel: () -> Void
    let onSubmit: () -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Payment Details").foregroundColor(.gray)) {
                    TextField("Amount Collected (INR)", text: $amount)
                        .keyboardType(.numberPad)
                    
                    Picker("Method", selection: $method) {
                        Text("Cash").tag("Cash")
                        Text("UPI / Online").tag("UPI / Online")
                        Text("Card").tag("Card")
                    }
                }
                
                Section {
                    Button(action: onSubmit) {
                        Text("Confirm & Close Job")
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                    .disabled(amount.isEmpty)
                    
                    Button(action: onCancel) {
                        Text("Cancel")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Job Closeout")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
