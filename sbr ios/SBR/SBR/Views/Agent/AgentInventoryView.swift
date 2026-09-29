import SwiftUI

struct IndentDraftItem: Identifiable, Equatable {
    let id = UUID()
    let productId: String
    var name: String
    var sku: String
    var requestedQuantity: Int
    var stockLevel: Int
}

struct AgentInventoryView: View {
    @State private var items: [AgentInventoryItem] = []
    @State private var indents: [AgentIndent] = []
    @State private var products: [Product] = []
    @State private var selectedTab = 0
    @State private var isLoading = false
    @State private var showIndentSheet = false
    
    // Multi-Item Indent Form State
    @State private var draftItems: [IndentDraftItem] = []
    @State private var selectedProductId = ""
    @State private var itemQuantity = 1
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
                
                Button(action: {
                    draftItems.removeAll()
                    selectedProductId = ""
                    itemQuantity = 1
                    agentRemarks = ""
                    urgency = "MEDIUM"
                    showIndentSheet = true
                }) {
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
                        draftItems.removeAll()
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
                            Text("Indent #\(String(indent.id.suffix(6)).uppercased())")
                                .font(.subheadline)
                                .fontWeight(.bold)
                            Spacer()
                            IndentStatusBadge(status: indent.status)
                        }
                        
                        Divider()
                        
                        ForEach(indent.items) { reqItem in
                            HStack {
                                Text("• \(reqItem.name)")
                                    .font(.subheadline)
                                Spacer()
                                Text("x\(reqItem.requestedQuantity)")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.blue)
                            }
                        }
                        
                        if let urgency = indent.urgency {
                            HStack {
                                Text("Urgency:")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(urgency.uppercased())
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(urgency.uppercased() == "HIGH" || urgency.uppercased() == "EMERGENCY" ? .red : .orange)
                            }
                        }
                        
                        if let remarks = indent.agentRemarks, !remarks.isEmpty {
                            Text("Agent Note: \(remarks)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
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
    
    // Raise Multi-Item Indent Modal
    private var raiseIndentSheet: some View {
        NavigationView {
            Form {
                // Section 1: Add Item
                Section(header: Text("1. Select & Add Spare Part")) {
                    if products.isEmpty {
                        Text("Loading product catalog...")
                            .foregroundColor(.gray)
                    } else {
                        Picker("Product", selection: $selectedProductId) {
                            Text("Choose a product...").tag("")
                            ForEach(products) { prod in
                                Text("\(prod.name) (Stock: \(prod.stockLevel ?? 0))").tag(prod.id)
                            }
                        }
                    }
                    
                    Stepper("Quantity to Add: \(itemQuantity)", value: $itemQuantity, in: 1...50)
                    
                    Button(action: addProductToDraft) {
                        HStack {
                            Spacer()
                            Image(systemName: "plus.circle")
                            Text("Add to Requisition")
                                .fontWeight(.semibold)
                            Spacer()
                        }
                    }
                    .disabled(selectedProductId.isEmpty)
                }
                
                // Section 2: Items in Requisition Basket
                Section(header: Text("2. Requisition Items (\(draftItems.count))")) {
                    if draftItems.isEmpty {
                        Text("No items added yet. Select a product above and tap 'Add to Requisition'.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        ForEach($draftItems) { $item in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.name)
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                    if !item.sku.isEmpty {
                                        Text("SKU: \(item.sku)")
                                            .font(.caption2)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                Spacer()
                                Stepper("Qty: \(item.requestedQuantity)", value: $item.requestedQuantity, in: 1...99)
                                    .labelsHidden()
                                Text("x\(item.requestedQuantity)")
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                    .frame(minWidth: 32)
                            }
                        }
                        .onDelete(perform: removeDraftItem)
                    }
                }
                
                // Section 3: Urgency & Remarks
                Section(header: Text("3. Priority & Notes")) {
                    Picker("Urgency", selection: $urgency) {
                        Text("Low").tag("LOW")
                        Text("Medium").tag("MEDIUM")
                        Text("Urgent").tag("HIGH")
                        Text("Emergency").tag("EMERGENCY")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    
                    TextField("Reason / Notes for Store In-Charge", text: $agentRemarks)
                }
                
                // Section 4: Submit Button
                Section {
                    Button(action: submitIndent) {
                        HStack {
                            Spacer()
                            if isSubmittingIndent {
                                ProgressView().tint(.white)
                            } else {
                                Text("Submit Requisition (\(draftItems.count) Items)")
                                    .fontWeight(.bold)
                            }
                            Spacer()
                        }
                    }
                    .disabled(draftItems.isEmpty || isSubmittingIndent)
                }
            }
            .navigationTitle("New Requisition Indent")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        showIndentSheet = false
                    }
                }
            }
        }
    }
    
    private func addProductToDraft() {
        guard let prod = products.first(where: { $0.id == selectedProductId }) else { return }
        
        if let existingIndex = draftItems.firstIndex(where: { $0.productId == prod.id }) {
            draftItems[existingIndex].requestedQuantity += itemQuantity
        } else {
            draftItems.append(
                IndentDraftItem(
                    productId: prod.id,
                    name: prod.name,
                    sku: prod.sku ?? prod.slug ?? "",
                    requestedQuantity: itemQuantity,
                    stockLevel: prod.stockLevel ?? 0
                )
            )
        }
        
        selectedProductId = ""
        itemQuantity = 1
    }
    
    private func removeDraftItem(at offsets: IndexSet) {
        draftItems.remove(atOffsets: offsets)
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
        guard !draftItems.isEmpty else { return }
        isSubmittingIndent = true
        
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
            items: draftItems.map {
                IndentItemReq(
                    productId: $0.productId,
                    name: $0.name,
                    sku: $0.sku,
                    requestedQuantity: $0.requestedQuantity
                )
            },
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
                        self.draftItems.removeAll()
                        self.selectedProductId = ""
                        self.agentRemarks = ""
                        self.selectedTab = 1
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
