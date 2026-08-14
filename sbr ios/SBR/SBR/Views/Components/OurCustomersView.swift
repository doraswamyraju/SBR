import SwiftUI

struct OurCustomersView: View {
    var isAdmin: Bool = false
    @StateObject private var viewModel = CustomerListViewModel()
    @State private var showingAddSheet = false
    @State private var showingClearAlert = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Top Filter Header
            VStack(spacing: 12) {
                // Admin Actions Row (if admin)
                if isAdmin {
                    HStack {
                        Text("Dataset Controls")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.gray)
                        Spacer()
                        Button(action: {
                            showingAddSheet = true
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: "plus")
                                Text("Add Record")
                            }
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.green.opacity(0.8))
                            .cornerRadius(8)
                        }
                        
                        Button(action: {
                            showingClearAlert = true
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: "trash")
                                Text("Clear All")
                            }
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.red.opacity(0.8))
                            .cornerRadius(8)
                        }
                    }
                    .padding(.bottom, 4)
                }
                
                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    
                    TextField("Search S.No, Name, Address, Product, Model...", text: $viewModel.searchQuery)
                        .foregroundColor(.white)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .onChange(of: viewModel.searchQuery) { _ in
                            Task { await viewModel.fetchCustomers() }
                        }
                    
                    if !viewModel.searchQuery.isEmpty {
                        Button(action: {
                            viewModel.searchQuery = ""
                            Task { await viewModel.fetchCustomers() }
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding(12)
                .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.white.opacity(0.15), lineWidth: 1)
                )
                
                // Product Filter Horizontal Chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        OurCustomersFilterChip(
                            title: "All Products",
                            isSelected: viewModel.selectedProduct == "All",
                            action: {
                                viewModel.selectedProduct = "All"
                                Task { await viewModel.fetchCustomers() }
                            }
                        )
                        
                        ForEach(viewModel.availableProducts, id: \.self) { prod in
                            OurCustomersFilterChip(
                                title: prod,
                                isSelected: viewModel.selectedProduct == prod,
                                action: {
                                    viewModel.selectedProduct = prod
                                    Task { await viewModel.fetchCustomers() }
                                }
                            )
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
            .padding()
            .background(Color(red: 0.08, green: 0.11, blue: 0.18))
            
            // Content Body
            if viewModel.isLoading && viewModel.customers.isEmpty {
                VStack(spacing: 12) {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: Color(red: 0.22, green: 0.74, blue: 0.97)))
                        .scaleEffect(1.3)
                    Text("Loading customer list...")
                        .foregroundColor(.gray)
                        .font(.system(size: 14))
                    Spacer()
                }
            } else if viewModel.customers.isEmpty {
                VStack(spacing: 12) {
                    Spacer()
                    Image(systemName: "person.2.slash")
                        .font(.system(size: 40))
                        .foregroundColor(.gray.opacity(0.5))
                    Text("No customer records found")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                    Text("Try adjusting your search criteria or product filter.")
                        .font(.system(size: 13))
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                    Spacer()
                }
                .padding()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        HStack {
                            Text("Showing \(viewModel.customers.count) customer record\(viewModel.customers.count == 1 ? "" : "s")")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                            Spacer()
                        }
                        .padding(.horizontal)
                        .padding(.top, 8)
                        
                        ForEach(viewModel.customers) { record in
                            CustomerRecordCard(record: record, isAdmin: isAdmin) {
                                Task {
                                    await viewModel.deleteRecord(id: record.id)
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 24)
                }
                .refreshable {
                    await viewModel.fetchCustomers()
                }
            }
        }
        .background(Color(red: 0.06, green: 0.09, blue: 0.15).ignoresSafeArea())
        .onAppear {
            Task {
                await viewModel.fetchCustomers()
            }
        }
        .alert(isPresented: $showingClearAlert) {
            Alert(
                title: Text("Clear All Customer Records?"),
                message: Text("Are you sure you want to delete all verified customer installations? This action cannot be undone."),
                primaryButton: .destructive(Text("Clear All")) {
                    Task {
                        await viewModel.clearCustomerList()
                    }
                },
                secondaryButton: .cancel()
            )
        }
        .sheet(isPresented: $showingAddSheet) {
            AddCustomerRecordView(viewModel: viewModel)
        }
    }
}

struct AddCustomerRecordView: View {
    @ObservedObject var viewModel: CustomerListViewModel
    @Environment(\.presentationMode) var presentationMode
    
    @State private var sNo = ""
    @State private var name = ""
    @State private var address = ""
    @State private var product = ""
    @State private var model = ""
    @State private var purchaseDate = ""
    @State private var errorMessage: String? = nil
    @State private var isSaving = false
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Customer Information")) {
                    TextField("S.No. (Optional)", text: $sNo)
                    TextField("Customer Name *", text: $name)
                    TextField("Address", text: $address)
                }
                
                Section(header: Text("Product Details")) {
                    TextField("Product", text: $product)
                    TextField("Model (Optional)", text: $model)
                    TextField("Purchase Date (e.g. 14-Aug-2026)", text: $purchaseDate)
                }
                
                if let err = errorMessage {
                    Section {
                        Text(err)
                            .foregroundColor(.red)
                            .font(.system(size: 13))
                    }
                }
            }
            .navigationTitle("Add Customer Record")
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                },
                trailing: Button("Save") {
                    if name.isEmpty {
                        errorMessage = "Customer name is required"
                    } else {
                        isSaving = true
                        let req = AddCustomerRecordRequest(
                            sNo: sNo.isEmpty ? nil : sNo,
                            name: name,
                            address: address.isEmpty ? nil : address,
                            product: product.isEmpty ? "General Product" : product,
                            model: model.isEmpty ? nil : model,
                            purchaseDate: purchaseDate.isEmpty ? nil : purchaseDate
                        )
                        Task {
                            let success = await viewModel.addCustomerRecord(record: req)
                            isSaving = false
                            if success {
                                presentationMode.wrappedValue.dismiss()
                            } else {
                                errorMessage = viewModel.errorMessage ?? "Failed to save record"
                            }
                        }
                    }
                }
                .disabled(isSaving)
            )
        }
    }
}

// Subview: Filter Chip
struct OurCustomersFilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: isSelected ? .bold : .medium))
                .foregroundColor(isSelected ? .white : Color.gray)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isSelected ? Color(red: 0.01, green: 0.52, blue: 0.78) : Color(red: 0.12, green: 0.16, blue: 0.23))
                .cornerRadius(16)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isSelected ? Color.clear : Color.white.opacity(0.1), lineWidth: 1)
                )
        }
    }
}

// Subview: Customer Record Card
struct CustomerRecordCard: View {
    let record: CustomerRecord
    let isAdmin: Bool
    let onDelete: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header Row: S.No & Name
            HStack(alignment: .top) {
                if let sNo = record.sNo, !sNo.isEmpty {
                    Text(sNo)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.15))
                        .cornerRadius(6)
                }
                
                Text(record.name)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                
                Spacer()
                
                if isAdmin {
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .font(.system(size: 13))
                            .foregroundColor(Color.red.opacity(0.8))
                            .padding(6)
                            .background(Color.red.opacity(0.15))
                            .cornerRadius(6)
                    }
                }
            }
            
            // Address Row
            if let address = record.address, !address.isEmpty {
                HStack(alignment: .top, spacing: 6) {
                    Image(systemName: "mappin.and.ellipse")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                    Text(address)
                        .font(.system(size: 13))
                        .foregroundColor(Color(red: 0.8, green: 0.84, blue: 0.88))
                }
            }
            
            Divider()
                .background(Color.white.opacity(0.08))
            
            // Metadata Tags Row: Product, Model, Purchase Date
            HStack(spacing: 8) {
                // Product Tag
                HStack(spacing: 4) {
                    Image(systemName: "tag.fill")
                        .font(.system(size: 10))
                    Text(record.product ?? record.model ?? "Product")
                        .font(.system(size: 11, weight: .semibold))
                }
                .foregroundColor(.white)
                .padding(.horizontal, 9)
                .padding(.vertical, 4)
                .background(Color(red: 0.01, green: 0.52, blue: 0.78))
                .cornerRadius(12)
                
                // Model Tag (Optional)
                if let model = record.model, !model.isEmpty, model != record.product {
                    HStack(spacing: 4) {
                        Image(systemName: "square.stack.3d.up.fill")
                            .font(.system(size: 10))
                        Text(model)
                            .font(.system(size: 11, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 4)
                    .background(Color(red: 0.49, green: 0.23, blue: 0.93))
                    .cornerRadius(12)
                }
                
                Spacer()
                
                // Purchase Date
                if let date = record.purchaseDate, !date.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .font(.system(size: 11))
                        Text(date)
                            .font(.system(size: 11, weight: .medium))
                    }
                    .foregroundColor(Color(red: 0.29, green: 0.87, blue: 0.5))
                } else {
                    Text("N/A")
                        .font(.system(size: 11))
                        .foregroundColor(.gray)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(4)
                }
            }
        }
        .padding(14)
        .background(Color(red: 0.12, green: 0.16, blue: 0.23))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}
