import SwiftUI

struct AgentManagementView: View {
    @ObservedObject var requestVM: RequestViewModel
    
    @State private var showingAddEditSheet = false
    @State private var selectedAgent: User? = nil
    
    // Add/Edit Fields
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var phone = ""
    @State private var specialization = ""
    @State private var location = ""
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    
    var body: some View {
        List {
            ForEach(requestVM.users.filter({ $0.role == .agent })) { agent in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(agent.name)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Spacer()
                        Button(action: {
                            selectedAgent = agent
                            name = agent.name
                            email = agent.email
                            phone = agent.phone ?? ""
                            specialization = agent.specialization ?? ""
                            location = agent.location ?? ""
                            password = ""
                            showingAddEditSheet = true
                        }) {
                            Text("Edit")
                                .font(.footnote)
                                .foregroundColor(.indigo)
                        }
                    }
                    Text(agent.email)
                        .font(.caption)
                        .foregroundColor(.gray)
                    HStack {
                        Text("Specialty: \(agent.specialization ?? "General")")
                        Spacer()
                        Text("Zone: \(agent.location ?? "N/A")")
                    }
                    .font(.footnote)
                    .foregroundColor(.gray.opacity(0.8))
                }
                .padding(.vertical, 4)
                .listRowBackground(Color.white.opacity(0.01))
            }
        }
        .listStyle(PlainListStyle())
        .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
        .navigationTitle("Technician Directory")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            Button(action: {
                selectedAgent = nil
                name = ""
                email = ""
                password = ""
                phone = ""
                specialization = "Solar Water Heaters"
                location = "Bangalore"
                showingAddEditSheet = true
            }) {
                Image(systemName: "plus")
            }
        }
        .sheet(isPresented: $showingAddEditSheet) {
            NavigationView {
                Form {
                    Section(header: Text("Roster Profile")) {
                        TextField("Name", text: $name)
                        TextField("Email Address", text: $email)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .disabled(selectedAgent != nil)
                        
                        if selectedAgent == nil {
                            SecureField("Account Password", text: $password)
                        }
                        
                        TextField("Phone Number", text: $phone)
                            .keyboardType(.phonePad)
                    }
                    
                    Section(header: Text("Expertise & Routing")) {
                        TextField("Specialization", text: $specialization)
                        TextField("Assigned Service Location", text: $location)
                    }
                    
                    if let err = errorMessage {
                        Section {
                            Text(err).foregroundColor(.red).font(.caption)
                        }
                    }
                    
                    Section {
                        Button(action: saveAgent) {
                            HStack {
                                Spacer()
                                if isLoading {
                                    ProgressView()
                                } else {
                                    Text(selectedAgent == nil ? "Add to Roster" : "Update Technician")
                                        .fontWeight(.bold)
                                }
                                Spacer()
                            }
                        }
                        .disabled(isLoading || name.isEmpty || email.isEmpty || (selectedAgent == nil && password.isEmpty))
                    }
                }
                .navigationTitle(selectedAgent == nil ? "Add Technician" : "Edit Details")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") { showingAddEditSheet = false }
                    }
                }
            }
        }
    }
    
    private func saveAgent() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                if let agent = selectedAgent {
                    // Update profile via PUT api/users/:id
                    let body: [String: AnyEncodable] = [
                        "name": AnyEncodable(name),
                        "phone": AnyEncodable(phone),
                        "specialization": AnyEncodable(specialization),
                        "location": AnyEncodable(location)
                    ]
                    struct UserResponse: Decodable { let success: Bool }
                    let res = try await APIClient.shared.put(endpoint: "api/users/\(agent.id)", body: body, responseType: UserResponse.self)
                    if res.success {
                        await requestVM.fetchUsers()
                        showingAddEditSheet = false
                    } else {
                        errorMessage = "Failed to update profile"
                    }
                } else {
                    // Register agent
                    let body = [
                        "name": name,
                        "email": email,
                        "password": password,
                        "role": "AGENT",
                        "phone": phone,
                        "specialization": specialization,
                        "location": location
                    ]
                    struct RegisterResponse: Decodable { let success: Bool }
                    let res = try await APIClient.shared.post(endpoint: "api/auth/register", body: body, responseType: RegisterResponse.self)
                    if res.success {
                        await requestVM.fetchUsers()
                        showingAddEditSheet = false
                    } else {
                        errorMessage = "Failed to create agent"
                    }
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
