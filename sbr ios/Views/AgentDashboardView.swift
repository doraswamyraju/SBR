import SwiftUI

struct AgentDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject var requestVM = RequestViewModel()
    @State private var selectedTab = 0
    @State private var isGpsActive = false
    
    // Payment Dialog State
    @State private var showingPaymentDialog = false
    @State private var activeJobIdForPayment = ""
    @State private var collectAmount = ""
    @State private var paymentMethod = "Cash"
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Tab 1: Active Jobs
            NavigationView {
                ScrollView {
                    VStack(spacing: 20) {
                        // GPS broad casting control widget
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
                                            // Start simulation on the first active job if any
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
                                        showingPaymentDialog = true
                                    }, onUploadPhoto: { type in
                                        Task {
                                            // Simulate capturing/attaching photo using systemic default image
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
                            let success = await requestVM.completeJob(requestId: activeJobIdForPayment, amount: amountVal, method: paymentMethod)
                            if success {
                                showingPaymentDialog = false
                                collectAmount = ""
                                await requestVM.fetchRequests()
                            }
                        }
                    })
                }
            }
            .tabItem {
                Image(systemName: "briefcase")
                Text("My Jobs")
            }
            .tag(0)
            
            // Tab 2: Completed Jobs
            NavigationView {
                List(requestVM.requests.filter({ $0.status == .completed })) { job in
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
                VStack(spacing: 25) {
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
                    
                    VStack(alignment: .leading, spacing: 15) {
                        HStack {
                            Text("Contact:")
                                .foregroundColor(.gray)
                            Spacer()
                            Text(authVM.user?.phone ?? "N/A")
                                .foregroundColor(.white)
                        }
                        
                        HStack {
                            Text("Specialization:")
                                .foregroundColor(.gray)
                            Spacer()
                            Text(authVM.user?.specialization ?? "General Field Service")
                                .foregroundColor(.indigo)
                        }
                        
                        HStack {
                            Text("Assigned Zone:")
                                .foregroundColor(.gray)
                            Spacer()
                            Text(authVM.user?.location ?? "Bangalore")
                                .foregroundColor(.white)
                        }
                    }
                    .padding()
                    .background(Color.white.opacity(0.03))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
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
        .onAppear {
            Task { await requestVM.fetchRequests() }
        }
    }
    
    private func alertMessage(msg: String) {
        // UI notification wrapper
        print(msg)
    }
}

struct AgentJobCard: View {
    let job: ServiceRequest
    var onAccept: (() -> Void)?
    var onStart: (() -> Void)?
    var onComplete: (() -> Void)?
    var onUploadPhoto: ((String) -> Void)?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(job.serviceType)
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Text(job.status.rawValue)
                    .font(.caption2)
                    .foregroundColor(.indigo)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.indigo.opacity(0.15))
                    .cornerRadius(10)
            }
            
            VStack(alignment: .leading, spacing: 6) {
                Text("Address: \(job.customerAddress)")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                if let desc = job.description {
                    Text("Details: \(desc)")
                        .font(.footnote)
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            
            // Photo Upload Documentation Row
            if job.status == .accepted || job.status == .inProgress {
                HStack(spacing: 12) {
                    VStack(alignment: .leading) {
                        Text("Before service photo")
                            .font(.caption2)
                            .foregroundColor(.gray)
                        if job.beforeImageUrl != nil {
                            Text("✓ Attached").foregroundColor(.green).font(.caption2)
                        } else {
                            Button(action: { onUploadPhoto?("before") }) {
                                Label("Upload", systemImage: "arrow.up.doc")
                                    .font(.caption)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(6)
                            }
                        }
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .leading) {
                        Text("After service photo")
                            .font(.caption2)
                            .foregroundColor(.gray)
                        if job.afterImageUrl != nil {
                            Text("✓ Attached").foregroundColor(.green).font(.caption2)
                        } else {
                            Button(action: { onUploadPhoto?("after") }) {
                                Label("Upload", systemImage: "arrow.up.doc")
                                    .font(.caption)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(6)
                            }
                        }
                    }
                }
                .padding(.vertical, 6)
                .border(Color.white.opacity(0.03), width: 1)
            }
            
            // Job Action buttons
            HStack {
                if let accept = onAccept {
                    Button(action: accept) {
                        Text("Accept Offer")
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
                
                if let start = onStart {
                    Button(action: start) {
                        Text("Start Execution")
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
                
                if let complete = onComplete {
                    Button(action: complete) {
                        Text("Mark Completed")
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding()
        .background(Color.white.opacity(0.02))
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.05), lineWidth: 1)
        )
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
