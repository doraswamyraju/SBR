import SwiftUI

struct AgentDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject var requestVM = RequestViewModel()
    @State private var selectedTab = 0
    @State private var isGpsActive = false
    
    // Sheets/Alerts State
    @State private var showingPaymentDialog = false
    @State private var showingReviewPromptAlert = false
    @State private var requestReviewForClose = false
    @State private var activeJobIdForPayment = ""
    @State private var selectedRequestDetail: ServiceRequest?
    
    @State private var collectAmount = ""
    @State private var paymentMethod = "Cash"
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Tab 1: Active Jobs
            NavigationView {
                ScrollView {
                    VStack(spacing: 20) {
                        // GPS broadcasting control widget
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Image(systemName: "location.circle.fill")
                                    .foregroundColor(isGpsActive ? .green : .gray)
                                    .font(.title3)
                                Text("Mock Live GPS Broadcast")
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                Spacer()
                                Toggle("", isOn: $isGpsActive)
                                    .labelsHidden()
                                    .onChange(of: isGpsActive) { active in
                                        if active {
                                            let activeJob = requestVM.requests.first(where: { $0.status == .accepted || $0.status == .inProgress })
                                            requestVM.startLocationSimulation(activeRequestId: activeJob?.id ?? "no_active_job")
                                        } else {
                                            requestVM.stopLocationSimulation()
                                        }
                                    }
                            }
                            
                            Text(isGpsActive ? "Status: Broadcasting coordinates to VPS every 10s." : "Status: Offline. Turn on toggle to show live route path trace on Admin Map.")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        .padding()
                        .background(Color.white.opacity(0.02))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(isGpsActive ? Color.green.opacity(0.3) : Color.white.opacity(0.05), lineWidth: 1)
                        )
                        .padding(.horizontal)
                        
                        // New Job Offers Section
                        VStack(alignment: .leading, spacing: 10) {
                            Text("New Assigned Offers")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding(.horizontal)
                            
                            let offers = requestVM.requests.filter({ $0.status == .assigned })
                            if offers.isEmpty {
                                Text("No new job offers assigned.")
                                    .foregroundColor(.gray)
                                    .font(.footnote)
                                    .padding()
                            } else {
                                ForEach(offers) { job in
                                    AgentJobCard(job: job, onAccept: {
                                        Task {
                                            let success = await requestVM.updateStatus(requestId: job.id, status: .accepted)
                                            if success { await requestVM.fetchRequests() }
                                        }
                                    }, onStart: nil, onComplete: nil, onUploadPhoto: nil)
                                }
                                .padding(.horizontal)
                            }
                        }
                        
                        // Active Execution Jobs Section
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Jobs In Progress")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding(.horizontal)
                            
                            let activeJobs = requestVM.requests.filter({ $0.status == .accepted || $0.status == .inProgress })
                            if activeJobs.isEmpty {
                                Text("No jobs in progress. Accept an offer to start.")
                                    .foregroundColor(.gray)
                                    .font(.footnote)
                                    .padding()
                            } else {
                                ForEach(activeJobs) { job in
                                    AgentJobCard(job: job, onAccept: nil, onStart: {
                                        Task {
                                            let success = await requestVM.updateStatus(requestId: job.id, status: .inProgress)
                                            if success { await requestVM.fetchRequests() }
                                        }
                                    }, onComplete: {
                                        activeJobIdForPayment = job.id
                                        showingReviewPromptAlert = true
                                    }, onUploadPhoto: { type in
                                        Task {
                                            let mockData = UIImage(systemName: "wrench.and.screwdriver.fill")?.pngData() ?? Data()
                                            let success = await requestVM.uploadRequestImage(requestId: job.id, imageData: mockData, type: type)
                                            if success {
                                                await requestVM.fetchRequests()
                                                alertMessage(msg: "\(type.capitalized) photo uploaded successfully!")
                                            }
                                        }
                                    })
                                }
                                .padding(.horizontal)
                            }
                        }
                    }
                    .padding(.top)
                }
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
                .navigationTitle("Active Services")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    Button(action: {
                        Task { await requestVM.fetchRequests() }
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
                .sheet(isPresented: $showingPaymentDialog) {
                    PaymentDialogView(amount: $collectAmount, method: $paymentMethod, onCancel: {
                        showingPaymentDialog = false
                    }, onSubmit: {
                        Task {
                            let amountVal = Double(collectAmount) ?? 0.0
                            let success = await requestVM.completeJob(
                                requestId: activeJobIdForPayment,
                                amount: amountVal,
                                method: paymentMethod,
                                requestReview: requestReviewForClose
                            )
                            if success {
                                showingPaymentDialog = false
                                collectAmount = ""
                                await requestVM.fetchRequests()
                            }
                        }
                    })
                }
                .alert("Request Customer Review?", isPresented: $showingReviewPromptAlert) {
                    Button("Yes, Request Review") {
                        requestReviewForClose = true
                        showingPaymentDialog = true
                    }
                    Button("No, Complete Only") {
                        requestReviewForClose = false
                        showingPaymentDialog = true
                    }
                    Button("Cancel", role: .cancel) {}
                } message: {
                    Text("Would you like to send a Google Maps review request to the customer via Email and Push Notification?")
                }
            }
            .tabItem {
                Image(systemName: "briefcase")
                Text("My Jobs")
            }
            .tag(0)
            
            // Tab 2: Completed Logs
            NavigationView {
                List(requestVM.requests.filter({ $0.status == .completed })) { job in
                    Button(action: {
                        selectedRequestDetail = job
                    }) {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(job.serviceType)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                Spacer()
                                Text("Completed")
                                    .font(.caption2)
                                    .foregroundColor(.green)
                            }
                            
                            Text("Resolved Address: \(job.customerAddress)")
                                .font(.caption)
                                .foregroundColor(.gray)
                            
                            if let amt = job.paymentAmount {
                                Text("Collected: ₹\(Int(amt)) (\(job.paymentMethod ?? "Cash"))")
                                    .font(.footnote)
                                    .foregroundColor(.green)
                                    .fontWeight(.semibold)
                            }
                        }
                    }
                    .listRowBackground(Color.white.opacity(0.01))
                }
                .listStyle(PlainListStyle())
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
                .navigationTitle("Completed Jobs")
                .navigationBarTitleDisplayMode(.inline)
            }
            .tabItem {
                Image(systemName: "checkmark.circle")
                Text("Logs")
            }
            .tag(1)
            
            // Tab 3: Profile Settings
            NavigationView {
                VStack(spacing: 20) {
                    VStack(spacing: 8) {
                        Image(systemName: "person.crop.badge.checkmark")
                            .font(.system(size: 70))
                            .foregroundColor(.indigo)
                        
                        Text(authVM.user?.name ?? "Agent Specialist")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text(authVM.user?.email ?? "")
                            .foregroundColor(.gray)
                    }
                    .padding(.top)
                    
                    List {
                        NavigationLink(destination: AgentEditProfileView(authVM: authVM)) {
                            Label("Edit My Profile Settings", systemImage: "person.text.rectangle")
                        }
                        .listRowBackground(Color.white.opacity(0.02))
                        
                        NavigationLink(destination: AgentScheduleView()) {
                            Label("Duty & Roster Shift", systemImage: "calendar")
                        }
                        .listRowBackground(Color.white.opacity(0.02))
                        
                        NavigationLink(destination: AgentAnalyticsView(requestVM: requestVM)) {
                            Label("Performance Analytics & Logs", systemImage: "chart.bar.xaxis")
                        }
                        .listRowBackground(Color.white.opacity(0.02))
                    }
                    .listStyle(PlainListStyle())
                    .frame(height: 180)
                    
                    Button(action: {
                        requestVM.stopLocationSimulation()
                        Task { await authVM.logout() }
                    }) {
                        Text("Sign Out")
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(12)
                    }
                    .padding(.horizontal)
                    
                    Spacer()
                }
                .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
                .navigationTitle("Profile Settings")
                .navigationBarTitleDisplayMode(.inline)
            }
            .tabItem {
                Image(systemName: "person")
                Text("Profile")
            }
            .tag(2)
        }
        .accentColor(.indigo)
        .sheet(item: $selectedRequestDetail) { job in
            RequestDetailView(request: job)
        }
        .onAppear {
            Task { await requestVM.fetchRequests() }
        }
    }
    
    private func alertMessage(msg: String) {
        print(msg)
    }
}
