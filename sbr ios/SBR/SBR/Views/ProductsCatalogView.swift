import SwiftUI

struct ProductsCatalogView: View {
    let isAdmin: Bool
    @StateObject private var viewModel = ProductsViewModel()
    @State private var showingEditDialog = false
    @State private var editingProduct: Product? = nil
    
    let categories = [
        "All",
        "Solar Heating",
        "Water Treatment",
        "RO Purification",
        "Solar Power",
        "Heat Pumps",
        "Other Services"
    ]
    
    var filteredProducts: [Product] {
        viewModel.products.filter { prod in
            let matchesSearch = viewModel.searchQuery.isEmpty ||
                prod.name.localizedCaseInsensitiveContains(viewModel.searchQuery) ||
                (prod.description?.localizedCaseInsensitiveContains(viewModel.searchQuery) == true)
            return matchesSearch
        }
    }
    
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(spacing: 0) {
                // Search bar & Header details
                VStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Products & Services")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(SBRColors.textPrimary)
                            Text("Explore solar, water treatment, & heat pumps")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Button(action: {
                            Task { await viewModel.fetchProducts() }
                        }) {
                            Image(systemName: "arrow.clockwise")
                                .font(.body)
                                .foregroundColor(SBRColors.primaryBlue)
                                .padding(8)
                                .background(SBRColors.primaryBlue.opacity(0.08))
                                .clipShape(Circle())
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 12)
                    
                    // Search text field
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)
                        TextField("Search products or services...", text: $viewModel.searchQuery)
                            .foregroundColor(SBRColors.textPrimary)
                            .font(.subheadline)
                    }
                    .padding(.vertical, 10)
                    .padding(.horizontal, 12)
                    .background(Color.white)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.18), lineWidth: 1)
                    )
                    .padding(.horizontal)
                    
                    // Horizontal Categories Chips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(categories, id: \.self) { cat in
                                Button(action: {
                                    viewModel.selectedCategory = cat
                                    Task { await viewModel.fetchProducts() }
                                }) {
                                    Text(cat)
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .padding(.vertical, 8)
                                        .padding(.horizontal, 14)
                                        .background(viewModel.selectedCategory == cat ? SBRColors.primaryBlue : Color.white)
                                        .foregroundColor(viewModel.selectedCategory == cat ? .white : SBRColors.textPrimary)
                                        .cornerRadius(20)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 20)
                                                .stroke(viewModel.selectedCategory == cat ? Color.clear : Color.gray.opacity(0.2), lineWidth: 1)
                                        )
                                }
                            }
                        }
                        .padding(.horizontal)
                        .padding(.bottom, 8)
                    }
                }
                .background(Color.white)
                .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                
                // Content area
                if viewModel.isLoading {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: SBRColors.primaryBlue))
                    Spacer()
                } else if filteredProducts.isEmpty {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: "magnifyingglass.circle")
                            .font(.system(size: 48))
                            .foregroundColor(.gray.opacity(0.6))
                        Text("No products found")
                            .foregroundColor(.gray)
                            .font(.subheadline)
                    }
                    Spacer()
                } else {
                    List(filteredProducts) { prod in
                        ProductItemCard(
                            product: prod,
                            isAdmin: isAdmin,
                            onEdit: {
                                editingProduct = prod
                                showingEditDialog = true
                            },
                            onDelete: {
                                Task {
                                    let _ = await viewModel.deleteProduct(id: prod.id)
                                }
                            }
                        )
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                        .padding(.horizontal)
                        .padding(.vertical, 6)
                    }
                    .listStyle(PlainListStyle())
                    .refreshable {
                        await viewModel.fetchProducts()
                    }
                }
            }
            .background(SBRColors.background)
            
            // Add Product Floating Action Button for admin
            if isAdmin {
                Button(action: {
                    editingProduct = nil
                    showingEditDialog = true
                }) {
                    Image(systemName: "plus")
                        .font(.title2)
                        .foregroundColor(.white)
                        .frame(width: 56, height: 56)
                        .background(SBRColors.primaryBlue)
                        .clipShape(Circle())
                        .shadow(color: Color.black.opacity(0.15), radius: 4, x: 0, y: 2)
                        .padding(16)
                }
            }
        }
        .onAppear {
            Task {
                await viewModel.fetchProducts()
            }
        }
        .sheet(isPresented: $showingEditDialog) {
            ProductEditSheet(
                product: editingProduct,
                categories: categories.filter { $0 != "All" },
                onSave: { req in
                    Task {
                        let success: Bool
                        if let existing = editingProduct {
                            success = await viewModel.updateProduct(id: existing.id, req)
                        } else {
                            success = await viewModel.createProduct(req)
                        }
                        if success {
                            showingEditDialog = false
                        }
                    }
                }
            )
        }
    }
}

struct ProductItemCard: View {
    let product: Product
    let isAdmin: Bool
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                // Product Image
                if let imgUrlStr = product.image, !imgUrlStr.isEmpty, let url = URL(string: imgUrlStr) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        Color.gray.opacity(0.1)
                    }
                    .frame(width: 72, height: 72)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    // Fallback visual placeholder
                    VStack {
                        Image(systemName: "solarpanel.fill")
                            .font(.title2)
                            .foregroundColor(SBRColors.primaryBlue.opacity(0.6))
                    }
                    .frame(width: 72, height: 72)
                    .background(SBRColors.primaryBlue.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                
                // Text details
                VStack(alignment: .leading, spacing: 4) {
                    Text(product.name)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                    
                    if let subtitle = product.subtitle, !subtitle.isEmpty {
                        Text(subtitle)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    
                    Text(product.category ?? "General")
                        .font(.system(size: 10))
                        .fontWeight(.bold)
                        .padding(.vertical, 4)
                        .padding(.horizontal, 8)
                        .background(SBRColors.primaryBlue.opacity(0.07))
                        .foregroundColor(SBRColors.primaryBlue)
                        .cornerRadius(6)
                        .padding(.top, 2)
                }
                
                Spacer()
                
                // Admin Actions
                if isAdmin {
                    HStack(spacing: 8) {
                        Button(action: onEdit) {
                            Image(systemName: "pencil")
                                .foregroundColor(SBRColors.primaryBlue)
                                .padding(6)
                                .background(SBRColors.primaryBlue.opacity(0.08))
                                .clipShape(Circle())
                        }
                        
                        Button(action: onDelete) {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                                .padding(6)
                                .background(Color.red.opacity(0.08))
                                .clipShape(Circle())
                        }
                    }
                }
            }
            
            if let desc = product.description, !desc.isEmpty {
                Text(desc)
                    .font(.caption)
                    .foregroundColor(SBRColors.textPrimary)
                    .lineLimit(3)
                    .padding(.top, 4)
            }
            
            Divider()
                .padding(.vertical, 4)
            
            // Pricing and Referral Rewards details
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    if let base = product.basePrice, base > 0 {
                        Text("₹\(Int(base))")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.primaryBlue)
                    }
                    if let mrp = product.mrp, let base = product.basePrice, mrp > base {
                        Text("MRP: ₹\(Int(mrp))")
                            .font(.caption2)
                            .foregroundColor(.gray)
                            .strikethrough()
                    }
                }
                
                Spacer()
                
                // Reward Badge
                if let commVal = product.commissionValue, commVal > 0 {
                    let text = product.commissionType == "percentage" ? "\(Int(commVal))% Commission" : "₹\(Int(commVal)) Reward"
                    HStack(spacing: 4) {
                        Image(systemName: "gift.fill")
                            .font(.caption2)
                        Text(text)
                            .font(.caption2)
                            .fontWeight(.bold)
                    }
                    .padding(.vertical, 4)
                    .padding(.horizontal, 8)
                    .background(Color.green.opacity(0.12))
                    .foregroundColor(.green)
                    .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.02), radius: 4, x: 0, y: 2)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.gray.opacity(0.1), lineWidth: 1)
        )
    }
}

struct ProductEditSheet: View {
    let product: Product?
    let categories: [String]
    let onSave: (ProductRequest) -> Void
    @Environment(\.dismiss) var dismiss
    
    @State private var name = ""
    @State private var category = ""
    @State private var subtitle = ""
    @State private var description = ""
    @State private var basePrice = ""
    @State private var mrp = ""
    @State private var commissionType = "fixed"
    @State private var commissionValue = ""
    
    init(product: Product?, categories: [String], onSave: @escaping (ProductRequest) -> Void) {
        self.product = product
        self.categories = categories
        self.onSave = onSave
        
        _name = State(initialValue: product?.name ?? "")
        _category = State(initialValue: product?.category ?? categories.first ?? "Solar Heating")
        _subtitle = State(initialValue: product?.subtitle ?? "")
        _description = State(initialValue: product?.description ?? "")
        _basePrice = State(initialValue: product?.basePrice != nil ? String(Int(product!.basePrice!)) : "")
        _mrp = State(initialValue: product?.mrp != nil ? String(Int(product!.mrp!)) : "")
        _commissionType = State(initialValue: product?.commissionType ?? "fixed")
        _commissionValue = State(initialValue: product?.commissionValue != nil ? String(Int(product!.commissionValue!)) : "")
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Basic Details")) {
                    TextField("Product Name *", text: $name)
                    
                    Picker("Category", selection: $category) {
                        ForEach(categories, id: \.self) { cat in
                            Text(cat).tag(cat)
                        }
                    }
                    
                    TextField("Subtitle / Tagline", text: $subtitle)
                    
                    ZStack(alignment: .topLeading) {
                        if description.isEmpty {
                            Text("Description")
                                .foregroundColor(.gray.opacity(0.5))
                                .padding(.top, 8)
                        }
                        TextEditor(text: $description)
                            .frame(height: 80)
                            .padding(.horizontal, -4)
                    }
                }
                
                Section(header: Text("Pricing & Rewards")) {
                    TextField("Base Price (₹)", text: $basePrice)
                        .keyboardType(.numberPad)
                    
                    TextField("MRP (₹)", text: $mrp)
                        .keyboardType(.numberPad)
                    
                    Picker("Reward Type", selection: $commissionType) {
                        Text("Fixed Amount (₹)").tag("fixed")
                        Text("Percentage (%)").tag("percentage")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    
                    TextField("Referral Reward Value", text: $commissionValue)
                        .keyboardType(.numberPad)
                }
            }
            .navigationTitle(product == nil ? "Add Product" : "Edit Product")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        if !name.isEmpty {
                            let req = ProductRequest(
                                name: name,
                                slug: product?.slug,
                                category: category,
                                image: product?.image,
                                images: product?.images,
                                subtitle: subtitle.isEmpty ? nil : subtitle,
                                tagline: product?.tagline,
                                description: description.isEmpty ? nil : description,
                                features: product?.features,
                                basePrice: Double(basePrice),
                                mrp: Double(mrp),
                                commissionType: commissionType,
                                commissionValue: Double(commissionValue),
                                isActive: true
                            )
                            onSave(req)
                        }
                    }
                    .disabled(name.isEmpty)
                }
            }
        }
    }
}
