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
        VStack(spacing: 0) {
            // Action Header with Raise Indent button
            HStack {
                // Tab Picker
                Picker("Tab", selection: $selectedTab) {
                    Text("Van Kit Stock (\(items.count))").tag(0)
                    Text("Requisitions / Indents (\(indents.count))").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                
                Button(action: { showIndentSheet = true }) {
                    HStack(spacing: 4) {
                        Image(systemName: "plus.circle.fill")
                        Text("Raise Indent")
                    }
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(SBRColors.primaryBlue)
                    .cornerRadius(8)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 10)
            
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
        .background(Color(red: 0.97, green: 0.98, blue: 1.0))
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
    
    // Van Stock List View
    private var vanStockList: some View {
        Group {
            if items.isEmpty {
                VStack(spacing: 12) {
                    Spacer()
                    Image(systemName: "shippingbox")
                        .font(.system(size: 48))
                        .foregroundColor(.gray)
                    Text("No parts currently assigned to your van kit.")
                        .foregroundColor(.secondary)
                    Button("Raise Indent to Store") {
                        showIndentSheet = true
                    }
                    .padding(.top, 8)
                    Spacer()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List(items) { item in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.displayName)
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                if let sku = item.sku, !sku.isEmpty {
                                    Text("SKU: \(sku)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                if let cat = item.category, !cat.isEmpty {
                                    Text("Category: \(cat)")
                                        .font(.caption2)
                                        .foregroundColor(.gray)
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
                                        Text("Low (Min: \(item.minThreshold ?? 1))")
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
                .listStyle(PlainListStyle())
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
                    Spacer()
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.system(size: 48))
                        .foregroundColor(.gray)
                    Text("No past or active indents raised.")
                        .foregroundColor(.secondary)
                    Spacer()
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
                .listStyle(PlainListStyle())
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
                    if products.isEmpty {
                        Text("Loading product catalog...")
                            .foregroundColor(.gray)
                    } else {
                        Picker("Product", selection: $selectedProductId) {
                            Text("Select a Product").tag("")
                            ForEach(products) { prod in
                                Text("\(prod.name) (Central: \(prod.basePrice != nil ? "₹\(Int(prod.basePrice!))" : "In Stock"))").tag(prod.id)
                            }
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
                    responseType: APIResponse<[AgentInventoryItem]>.self
                )
                async let indRes = APIClient.shared.get(
                    endpoint: "api/indents/my-indents",
                    responseType: APIResponse<[AgentIndent]>.self
                )
                async let prodRes = APIClient.shared.get(
                    endpoint: "api/products",
                    responseType: APIResponse<[Product]>.self
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
                    sku: selectedProduct?.slug ?? "",
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
                    responseType: APIResponse<AgentIndent>.self
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
        Text(status.displayName)
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
        case .requested, .pending: return .orange
        case .approved: return .blue
        case .dispatched: return .green
        case .rejected: return .red
        }
    }
}
