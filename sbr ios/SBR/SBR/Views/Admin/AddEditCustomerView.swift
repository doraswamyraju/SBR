import SwiftUI

struct AddEditCustomerView: View {
    @Environment(\.dismiss) var dismiss
    let customer: User? // Nil for adding new customer
    
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var phone = ""
    @State private var address = ""
    @State private var isRecurring = false
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Basic Information")) {
                    TextField("Full Name", text: $name)
                    TextField("Email Address", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .disabled(customer != nil) // Cannot edit email
                    
                    if customer == nil {
                        SecureField("Password", text: $password)
                    }
                    
                    TextField("Phone Number", text: $phone)
                        .keyboardType(.phonePad)
                }
                
                Section(header: Text("Service Preference")) {
                    TextField("Customer Address", text: $address)
                    Toggle("Recurring Service Contract", isOn: $isRecurring)
                }
                
                if let err = errorMessage {
                    Section {
                        Text(err).foregroundColor(.red).font(.caption)
                    }
                }
                
                Section {
                    Button(action: saveCustomer) {
                        HStack {
                            Spacer()
                            if isLoading {
                                ProgressView()
                            } else {
                                Text(customer == nil ? "Create Customer Profile" : "Save Changes")
                                    .fontWeight(.bold)
                            }
                            Spacer()
                        }
                    }
                    .disabled(isLoading || name.isEmpty || email.isEmpty || (customer == nil && password.isEmpty))
                }
            }
            .navigationTitle(customer == nil ? "New Customer" : "Edit Customer")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onAppear {
                if let c = customer {
                    name = c.name
                    email = c.email
                    phone = c.phone ?? ""
                    address = c.address ?? ""
                    isRecurring = c.isRecurring ?? false
                }
            }
        }
    }
    
    private func saveCustomer() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                if let c = customer {
                    // Update existing
                    let body: [String: AnyEncodable] = [
                        "name": AnyEncodable(name),
                        "phone": AnyEncodable(phone),
                        "address": AnyEncodable(address),
                        "isRecurring": AnyEncodable(isRecurring)
                    ]
                    struct UserResponse: Decodable { let success: Bool }
                    let res = try await APIClient.shared.put(endpoint: "api/users/\(c.id)", body: body, responseType: UserResponse.self)
                    if res.success {
                        dismiss()
                    } else {
                        errorMessage = "Failed to update profile"
                    }
                } else {
                    // Create new
                    let body = [
                        "name": name,
                        "email": email,
                        "password": password,
                        "role": "CUSTOMER",
                        "phone": phone,
                        "address": address,
                        "isRecurring": isRecurring ? "true" : "false"
                    ]
                    struct RegisterResponse: Decodable { let success: Bool }
                    let res = try await APIClient.shared.post(endpoint: "api/auth/register", body: body, responseType: RegisterResponse.self)
                    if res.success {
                        dismiss()
                    } else {
                        errorMessage = "Failed to create customer"
                    }
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
