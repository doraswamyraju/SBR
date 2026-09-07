import SwiftUI

struct AgentInventoryView: View {
    @State private var items: [AgentInventoryItem] = []
    @State private var indents: [AgentIndent] = []
    @State private var products: [Product] = []
    @State private var selectedTab = 0
    @State private var isLoading = false
    @State private var showIndentSheet = false
    
    // Indent Form State
    @State private var selectedProductId = ""
    @State private var indentQuantity = 1
    @State private var urgency = "MEDIUM"
    @State private var agentRemarks = ""
    @State private var isSubmittingIndent = false
    @State private var alertMessage = ""
    @State private var showAlert = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Picker
                Picker("Tab", selection: $selectedTab) {
                    Text("Van Kit Stock").tag(0)
                    Text("Requisitions / Indents").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                
                if isLoading {
                    Spacer()
                    ProgressView("Loading inventory data...")
                    Spacer()
                } else if selectedTab == 0 {
                    vanStockList
                } else {
                    indentsList
                }
            }
            .navigationTitle("Van Inventory & Kits")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showIndentSheet = true }) {
                        HStack(spacing: 4) {
                            Image(systemName: "plus.circle.fill")
                            Text("Raise Indent")
                        }
                    }
                }
            }
            .sheet(isPresented: $showIndentSheet) {
                raiseIndentSheet
            }
            .alert("Notice", isPresented: $showAlert) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(alertMessage)
            }
            .onAppear(perform: loadData)
        }
    }
    
    // Van Stock List View
    private var vanStockList: some View {
        Group {
            if items.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "shippingbox")
                        .font(.system(size: 48))
                        .foregroundColor(.gray)
                    Text("No parts currently assigned to your van kit.")
                        .foregroundColor(.secondary)
                    Button("Raise Indent to Store") {
                        showIndentSheet = true
                    }
                    .padding(.top, 8)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List(items) { item in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.productId?.name ?? "Unknown Component")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                if let sku = item.productId?.sku, !sku.isEmpty {
                                    Text("SKU: \(sku)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 4) {
                                Text("Qty: \(item.quantity)")
                                    .font(.title3)
                                    .fontWeight(.bold)
                                    .foregroundColor(item.isLowStock ? .red : .primary)
                                
                                if item.isLowStock {
                                    HStack(spacing: 2) {
                                        Image(systemName: "exclamationmark.triangle.fill")
                                            .font(.caption2)
                                        Text("Low (Min: \(item.minAlertThreshold))")
                                            .font(.caption2)
                                            .fontWeight(.bold)
                                    }
                                    .foregroundColor(.red)
                                }
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
                .refreshable {
                    loadData()
                }
            }
        }
    }
    
    // Indents List View
    private var indentsList: some View {
        Group {
            if indents.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.system(size: 48))
                        .foregroundColor(.gray)
                    Text("No past or active indents raised.")
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List(indents) { indent in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Indent #\(String(indent.id.suffix(6)))")
                                .font(.subheadline)
                                .fontWeight(.bold)
                            Spacer()
                            IndentStatusBadge(status: indent.status)
                        }
                        
                        Divider()
                        
                        ForEach(indent.items) { reqItem in
                            HStack {
                                Text(reqItem.name)
                                    .font(.subheadline)
                                Spacer()
                                Text("x\(reqItem.requestedQuantity)")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                            }
                        }
                        
                        if let urgency = indent.urgency {
                            HStack {
                                Text("Urgency:")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(urgency)
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(urgency == "HIGH" ? .red : .orange)
                            }
                        }
                        
                        if let inchargeRemarks = indent.inchargeRemarks, !inchargeRemarks.isEmpty {
                            Text("Store Note: \(inchargeRemarks)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .padding(6)
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(6)
                        }
                    }
                    .padding(.vertical, 4)
                }
                .refreshable {
                    loadData()
                }
            }
        }
    }
    
    // Raise Indent Modal
    private var raiseIndentSheet: some View {
        NavigationView {
            Form {
                Section(header: Text("Select Spare Part / Component")) {
                    Picker("Product", selection: $selectedProductId) {
                        Text("Select a Product").tag("")
                        ForEach(products) { prod in
                            Text("\(prod.name) (Central: \(prod.stockLevel ?? 0))").tag(prod.id)
                        }
                    }
                    
                    Stepper("Quantity: \(indentQuantity)", value: $indentQuantity, in: 1...50)
                }
                
                Section(header: Text("Priority & Notes")) {
                    Picker("Urgency", selection: $urgency) {
                        Text("Low").tag("LOW")
                        Text("Medium").tag("MEDIUM")
                        Text("High / Urgent").tag("HIGH")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    
                    TextField("Reason / Notes for Store In-Charge", text: $agentRemarks)
                }
                
                Section {
                    Button(action: submitIndent) {
                        HStack {
                            Spacer()
                            if isSubmittingIndent {
                                ProgressView().tint(.white)
                            } else {
                                Text("Submit Requisition to Store")
                                    .fontWeight(.bold)
                            }
                            Spacer()
                        }
                    }
                    .disabled(selectedProductId.isEmpty || isSubmittingIndent)
                }
            }
            .navigationTitle("New Indent Request")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        showIndentSheet = false
                    }
                }
            }
        }
    }
    
    private func loadData() {
        isLoading = true
        Task {
            do {
                async let invRes = APIClient.shared.get(
                    endpoint: "api/agent-inventory/my-stock",
                    responseType: ApiResponse<[AgentInventoryItem]>.self
                )
                async let indRes = APIClient.shared.get(
                    endpoint: "api/indents/my-indents",
                    responseType: ApiResponse<[AgentIndent]>.self
                )
                async let prodRes = APIClient.shared.get(
                    endpoint: "api/products",
                    responseType: ApiResponse<[Product]>.self
                )
                
                let (inv, ind, prods) = try await (invRes, indRes, prodRes)
                
                DispatchQueue.main.async {
                    self.items = inv.data ?? []
                    self.indents = ind.data ?? []
                    self.products = prods.data ?? []
                    self.isLoading = false
                }
            } catch {
                DispatchQueue.main.async {
                    self.isLoading = false
                    self.alertMessage = error.localizedDescription
                    self.showAlert = true
                }
            }
        }
    }
    
    private func submitIndent() {
        guard !selectedProductId.isEmpty else { return }
        isSubmittingIndent = true
        
        let selectedProduct = products.first(where: { $0.id == selectedProductId })
        
        struct IndentItemReq: Encodable {
            let productId: String
            let name: String
            let sku: String
            let requestedQuantity: Int
        }
        
        struct CreateIndentReq: Encodable {
            let items: [IndentItemReq]
            let urgency: String
            let agentRemarks: String
        }
        
        let req = CreateIndentReq(
            items: [
                IndentItemReq(
                    productId: selectedProductId,
                    name: selectedProduct?.name ?? "Spare Part",
                    sku: selectedProduct?.sku ?? "",
                    requestedQuantity: indentQuantity
                )
            ],
            urgency: urgency,
            agentRemarks: agentRemarks
        )
        
        Task {
            do {
                let res = try await APIClient.shared.post(
                    endpoint: "api/indents/create",
                    body: req,
                    responseType: ApiResponse<AgentIndent>.self
                )
                DispatchQueue.main.async {
                    self.isSubmittingIndent = false
                    if res.success {
                        self.showIndentSheet = false
                        self.selectedProductId = ""
                        self.agentRemarks = ""
                        self.indentQuantity = 1
                        self.loadData()
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    self.isSubmittingIndent = false
                    self.alertMessage = error.localizedDescription
                    self.showAlert = true
                }
            }
        }
    }
}

struct IndentStatusBadge: View {
    let status: IndentStatus
    
    var body: some View {
        Text(status.rawValue)
            .font(.caption2)
            .fontWeight(.bold)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.15))
            .foregroundColor(color)
            .cornerRadius(6)
    }
    
    var color: Color {
        switch status {
        case .pending: return .orange
        case .dispatched: return .green
        case .rejected: return .red
        }
    }
}
