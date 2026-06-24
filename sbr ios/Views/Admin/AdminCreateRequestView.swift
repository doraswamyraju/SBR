import SwiftUI

struct AdminCreateRequestView: View {
    @Environment(\.dismiss) var dismiss
    let customers: [User]
    
    @State private var selectedCustomerId = ""
    @State private var serviceType = "Solar Water Heaters"
    @State private var description = ""
    @State private var address = ""
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    
    let serviceCategories = [
        "Solar Water Heaters",
        "HM Hard Water Scalenors",
        "Automatic Water Softeners",
        "RO Water Plant Maintenance",
        "Domestic RO Purifier Service",
        "Solar Power Systems Maintenance",
        "Heat Pumps Repairs"
    ]
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Select Customer")) {
                    Picker("Customer Name", selection: $selectedCustomerId) {
                        Text("Select Client...").tag("")
                        ForEach(customers) { c in
                            Text(c.name).tag(c.id)
                        }
                    }
                    .onChange(of: selectedCustomerId) { id in
                        if let client = customers.first(where: { $0.id == id }) {
                            address = client.address ?? ""
                        }
                    }
                }
                
                Section(header: Text("Service Specifications")) {
                    Picker("Service Category", selection: $serviceType) {
                        ForEach(serviceCategories, id: \.self) { cat in
                            Text(cat).tag(cat)
                        }
                    }
                    
                    TextEditor(text: $description)
                        .frame(height: 100)
                        .overlay(
                            Group {
                                if description.isEmpty {
                                    Text("Add diagnostic details, schedule time or technician directions...")
                                        .foregroundColor(.gray.opacity(0.6))
                                        .padding(.top, 8)
                                        .padding(.leading, 5)
                                }
                            },
                            alignment: .topLeading
                        )
                    
                    TextField("Service Address", text: $address)
                }
                
                if let err = errorMessage {
                    Section {
                        Text(err).foregroundColor(.red).font(.caption)
                    }
                }
                
                Section {
                    Button(action: submitRequest) {
                        HStack {
                            Spacer()
                            if isLoading {
                                ProgressView()
                            } else {
                                Text("Book Service Request")
                                    .fontWeight(.bold)
                            }
                            Spacer()
                        }
                    }
                    .disabled(isLoading || selectedCustomerId.isEmpty || address.isEmpty)
                }
            }
            .navigationTitle("New Service Job")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onAppear {
                if selectedCustomerId.isEmpty && !customers.isEmpty {
                    selectedCustomerId = customers.first?.id ?? ""
                    address = customers.first?.address ?? ""
                }
            }
        }
    }
    
    private func submitRequest() {
        isLoading = true
        errorMessage = nil
        
        let body = [
            "customerId": selectedCustomerId,
            "serviceType": serviceType,
            "description": description,
            "customerAddress": address
        ]
        
        Task {
            do {
                struct RequestResponse: Decodable { let success: Bool }
                let res = try await APIClient.shared.post(endpoint: "api/requests", body: body, responseType: RequestResponse.self)
                if res.success {
                    dismiss()
                } else {
                    errorMessage = "Failed to book request"
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
