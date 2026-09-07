import SwiftUI

struct StoreInchargeDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    
    @State private var selectedTab = 0 // 0: Dispatch Queue, 1: Cash Reconciliation, 2: Agent Indents
    @State private var requests: [ServiceRequest] = []
    @State private var agents: [User] = []
    @State private var pendingHandovers: [CashHandover] = []
    @State private var pendingIndents: [AgentIndent] = []
    
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var alertMessage = ""
    @State private var showAlert = false
    
    // Reconciliation Sheet State
    @State private var selectedHandover: CashHandover?
    @State private var receivedCashText = ""
    @State private var reconciliationNotes = ""
    @State private var isSubmittingReconciliation = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header Bar with User Info & Logout
                headerBar
                
                // Segmented Tab Picker
                Picker("Store Mode", selection: $selectedTab) {
                    Text("Dispatch (\(unassignedRequestsCount))").tag(0)
                    Text("Cash Handover (\(pendingHandovers.count))").tag(1)
                    Text("Indents (\(pendingIndents.count))").tag(2)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                
                if isLoading {
                    Spacer()
                    ProgressView("Updating Store Console...")
                    Spacer()
                } else {
                    TabView(selection: $selectedTab) {
                        dispatchQueueView.tag(0)
                        cashHandoverView.tag(1)
                        indentsQueueView.tag(2)
                    }
                    .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                }
            }
            .navigationBarHidden(true)
            .sheet(item: $selectedHandover) { handover in
                reconciliationSheet(for: handover)
            }
            .alert("Store In-Charge Alert", isPresented: $showAlert) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(alertMessage)
            }
            .task { await loadAllData() }
        }
    }
    
    // Header Bar
    private var headerBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Store In-Charge Console")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                Text("Logged in as \(authVM.user?.name ?? "Store In-Charge")")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Button(action: {
                Task { await authVM.logout() }
            }) {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                    .foregroundColor(.red)
                    .padding(8)
                    .background(Color.red.opacity(0.1))
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal)
        .padding(.top, 8)
    }
    
    private var unassignedRequestsCount: Int {
        requests.filter { $0.status == .pending || $0.assignedAgentId == nil }.count
    }
    
    // 1. Dispatch Queue View
    private var dispatchQueueView: some View {
        ScrollView {
            VStack(spacing: 12) {
                let unassigned = requests.filter { $0.status == .pending || $0.assignedAgentId == nil }
                if unassigned.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.green)
                        Text("All service requests are dispatched!")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 40)
                } else {
                    ForEach(unassigned) { req in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(req.serviceType)
                                    .font(.headline)
                                Spacer()
                                Text(req.status.rawValue)
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Color.orange.opacity(0.15))
                                    .foregroundColor(.orange)
                                    .cornerRadius(6)
                            }
                            
                            Text("Customer: \(req.customerId?.name ?? "Unknown")")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            Text("Address: \(req.customerAddress)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            // Agent Assignment Menu
                            Menu {
                                ForEach(agents) { agent in
                                    Button(agent.name) {
                                        assignAgent(requestId: req.id, agentId: agent.id)
                                    }
                                }
                            } label: {
                                HStack {
                                    Image(systemName: "person.badge.plus")
                                    Text("Assign Field Agent")
                                    Spacer()
                                    Image(systemName: "chevron.down")
                                }
                                .padding(10)
                                .background(Color.blue.opacity(0.1))
                                .foregroundColor(.blue)
                                .cornerRadius(8)
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
                        .padding(.horizontal)
                    }
                }
            }
            .padding(.vertical)
        }
        .refreshable { await loadAllData() }
    }
    
    // 2. Cash Handover Reconciliation View
    private var cashHandoverView: some View {
        ScrollView {
            VStack(spacing: 12) {
                if pendingHandovers.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "banknote")
                            .font(.system(size: 40))
                            .foregroundColor(.green)
                        Text("No pending agent cash handovers.")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 40)
                } else {
                    ForEach(pendingHandovers) { handover in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(handover.agentId?.name ?? "Field Agent")
                                        .font(.headline)
                                    Text("Date: \(handover.date)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Text("₹\(String(format: "%.2f", handover.totalCollectedCash))")
                                    .font(.title3)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                            }
                            
                            if let notes = handover.agentNotes, !notes.isEmpty {
                                Text("Agent Note: \(notes)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .padding(6)
                                    .background(Color.gray.opacity(0.1))
                                    .cornerRadius(6)
                            }
                            
                            Button(action: {
                                selectedHandover = handover
                                receivedCashText = "\(handover.totalCollectedCash)"
                            }) {
                                HStack {
                                    Image(systemName: "checkmark.shield.fill")
                                    Text("Verify & Reconcile")
                                        .fontWeight(.bold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(10)
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
                        .padding(.horizontal)
                    }
                }
            }
            .padding(.vertical)
        }
        .refreshable { await loadAllData() }
    }
    
    // 3. Indents Requisition View
    private var indentsQueueView: some View {
        ScrollView {
            VStack(spacing: 12) {
                if pendingIndents.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "shippingbox.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.blue)
                        Text("No pending part requisitions from field agents.")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 40)
                } else {
                    ForEach(pendingIndents) { indent in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text("Requisition from \(indent.agentId?.name ?? "Agent")")
                                    .font(.headline)
                                Spacer()
                                Text(indent.urgency ?? "MEDIUM")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.orange.opacity(0.15))
                                    .foregroundColor(.orange)
                                    .cornerRadius(4)
                            }
                            
                            Divider()
                            
                            ForEach(indent.items) { item in
                                HStack {
                                    Text(item.name)
                                        .font(.subheadline)
                                    Spacer()
                                    Text("Qty: \(item.requestedQuantity)")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                }
                            }
                            
                            if let remarks = indent.agentRemarks, !remarks.isEmpty {
                                Text("Remarks: \(remarks)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            HStack(spacing: 12) {
                                Button(action: { dispatchIndent(indentId: indent.id) }) {
                                    HStack {
                                        Image(systemName: "arrow.up.right.box.fill")
                                        Text("Dispatch to Van")
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(8)
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                                }
                                
                                Button(action: { rejectIndent(indentId: indent.id) }) {
                                    Text("Reject")
                                        .frame(maxWidth: .infinity)
                                        .padding(8)
                                        .background(Color.red.opacity(0.1))
                                        .foregroundColor(.red)
                                        .cornerRadius(8)
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
                        .padding(.horizontal)
                    }
                }
            }
            .padding(.vertical)
        }
        .refreshable { await loadAllData() }
    }
    
    // Reconciliation Modal Sheet
    private func reconciliationSheet(for handover: CashHandover) -> some View {
        NavigationView {
            Form {
                Section(header: Text("Handover Details")) {
                    HStack {
                        Text("Agent:")
                        Spacer()
                        Text(handover.agentId?.name ?? "Unknown")
                            .fontWeight(.bold)
                    }
                    HStack {
                        Text("Submitted Amount:")
                        Spacer()
                        Text("₹\(String(format: "%.2f", handover.totalCollectedCash))")
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                }
                
                Section(header: Text("Actual Cash Received by Store In-Charge")) {
                    TextField("Received Amount (₹)", text: $receivedCashText)
                        .keyboardType(.decimalPad)
                    
                    TextField("Verification Notes / Remarks", text: $reconciliationNotes)
                }
                
                Section {
                    Button(action: { submitReconciliation(for: handover) }) {
                        HStack {
                            Spacer()
                            if isSubmittingReconciliation {
                                ProgressView().tint(.white)
                            } else {
                                Text("Confirm & Settle Cash Handover")
                                    .fontWeight(.bold)
                            }
                            Spacer()
                        }
                    }
                    .disabled(isSubmittingReconciliation)
                }
            }
            .navigationTitle("Reconcile Cash")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { selectedHandover = nil }
                }
            }
        }
    }
    
    // Network Operations
    @MainActor
    private func loadAllData() async {
        isLoading = true
        do {
            async let reqRes = APIClient.shared.get(
                endpoint: "api/requests",
                responseType: ApiResponse<[ServiceRequest]>.self
            )
            async let usersRes = APIClient.shared.get(
                endpoint: "api/users",
                responseType: ApiResponse<[User]>.self
            )
            async let handRes = APIClient.shared.get(
                endpoint: "api/handovers/pending",
                responseType: ApiResponse<[CashHandover]>.self
            )
            async let indRes = APIClient.shared.get(
                endpoint: "api/indents/pending",
                responseType: ApiResponse<[AgentIndent]>.self
            )
            
            let (r, u, h, ind) = try await (reqRes, usersRes, handRes, indRes)
            
            self.requests = r.data ?? []
            self.agents = (u.data ?? []).filter { $0.role == .agent }
            self.pendingHandovers = h.data ?? []
            self.pendingIndents = ind.data ?? []
            self.isLoading = false
        } catch {
            self.isLoading = false
            self.alertMessage = error.localizedDescription
            self.showAlert = true
        }
    }
    
    private func assignAgent(requestId: String, agentId: String) {
        struct AssignReq: Encodable {
            let assignedAgentId: String
        }
        
        Task {
            do {
                let res = try await APIClient.shared.put(
                    endpoint: "api/requests/\(requestId)/assign",
                    body: AssignReq(assignedAgentId: agentId),
                    responseType: ApiResponse<ServiceRequest>.self
                )
                if res.success {
                    await self.loadAllData()
                }
            } catch {
                await MainActor.run {
                    self.alertMessage = error.localizedDescription
                    self.showAlert = true
                }
            }
        }
    }
    
    private func submitReconciliation(for handover: CashHandover) {
        guard let received = Double(receivedCashText) else { return }
        isSubmittingReconciliation = true
        
        struct AcknowledgeReq: Encodable {
            let acknowledgedAmount: Double
            let inchargeNotes: String
        }
        
        Task {
            do {
                let res = try await APIClient.shared.post(
                    endpoint: "api/handovers/\(handover.id)/acknowledge",
                    body: AcknowledgeReq(acknowledgedAmount: received, inchargeNotes: reconciliationNotes),
                    responseType: ApiResponse<CashHandover>.self
                )
                await MainActor.run {
                    self.isSubmittingReconciliation = false
                    if res.success {
                        self.selectedHandover = nil
                    }
                }
                if res.success {
                    await self.loadAllData()
                }
            } catch {
                await MainActor.run {
                    self.isSubmittingReconciliation = false
                    self.alertMessage = error.localizedDescription
                    self.showAlert = true
                }
            }
        }
    }
    
    private func dispatchIndent(indentId: String) {
        struct DispatchReq: Encodable {
            let inchargeRemarks: String
        }
        
        Task {
            do {
                let res = try await APIClient.shared.post(
                    endpoint: "api/indents/\(indentId)/dispatch",
                    body: DispatchReq(inchargeRemarks: "Dispatched by Store In-Charge"),
                    responseType: ApiResponse<AgentIndent>.self
                )
                if res.success {
                    await self.loadAllData()
                }
            } catch {
                await MainActor.run {
                    self.alertMessage = error.localizedDescription
                    self.showAlert = true
                }
            }
        }
    }
    
    private func rejectIndent(indentId: String) {
        struct RejectReq: Encodable {
            let inchargeRemarks: String
        }
        
        Task {
            do {
                let res = try await APIClient.shared.post(
                    endpoint: "api/indents/\(indentId)/reject",
                    body: RejectReq(inchargeRemarks: "Out of stock at central store"),
                    responseType: ApiResponse<AgentIndent>.self
                )
                if res.success {
                    await self.loadAllData()
                }
            } catch {
                await MainActor.run {
                    self.alertMessage = error.localizedDescription
                    self.showAlert = true
                }
            }
        }
    }
}
