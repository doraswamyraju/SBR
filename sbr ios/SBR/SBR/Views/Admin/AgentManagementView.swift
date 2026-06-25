import SwiftUI

struct AgentManagementView: View {
    @ObservedObject var requestVM: RequestViewModel
    
    @State private var showingAddEditSheet = false
    @State private var selectedAgent: User? = nil
    @State private var filterSelection = "All" // "All", "Active", "Inactive"
    
    // Add/Edit Fields
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var phone = ""
    @State private var specialization = ""
    @State private var location = ""
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    
    private var filteredAgents: [User] {
        let agents = requestVM.users.filter({ $0.role == .agent })
        switch filterSelection {
        case "Active":
            return agents.filter({ $0.status == "Active" })
        case "Inactive":
            return agents.filter({ $0.status != "Active" })
        default:
            return agents
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // "Add New Agent" button inside the screen content at the top in a centered row
            HStack {
                Spacer()
                Button(action: {
                    selectedAgent = nil
                    name = ""
                    email = ""
                    password = ""
                    phone = ""
                    specialization = "Solar Water Heaters"
                    location = "Bangalore"
                    errorMessage = nil
                    showingAddEditSheet = true
                }) {
                    Text("Add New Agent")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.vertical, 10)
                        .padding(.horizontal, 24)
                        .background(SBRColors.primaryBlue)
                        .cornerRadius(20)
                }
                Spacer()
            }
            .padding(.top, 16)
            .padding(.bottom, 12)
            
            // Filter Chips for agent status
            HStack(spacing: 12) {
                FilterChip(label: "All", selected: filterSelection) { filterSelection = "All" }
                FilterChip(label: "Active", selected: filterSelection) { filterSelection = "Active" }
                FilterChip(label: "Inactive", selected: filterSelection) { filterSelection = "Inactive" }
            }
            .padding(.bottom, 16)
            
            // Roster list
            if filteredAgents.isEmpty {
                Spacer()
                Text("No agents found.")
                    .foregroundColor(.gray)
                Spacer()
            } else {
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(filteredAgents) { agent in
                            AgentCardView(
                                agent: agent,
                                onEdit: {
                                    selectedAgent = agent
                                    name = agent.name
                                    email = agent.email
                                    phone = agent.phone ?? ""
                                    specialization = agent.specialization ?? ""
                                    location = agent.location ?? ""
                                    password = ""
                                    errorMessage = nil
                                    showingAddEditSheet = true
                                },
                                onToggleStatus: { isChecked in
                                    toggleAgentStatus(agent, isChecked: isChecked)
                                }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
        .background(SBRColors.background.ignoresSafeArea())
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
    
    private func toggleAgentStatus(_ agent: User, isChecked: Bool) {
        let newStatus = isChecked ? "Active" : "Inactive"
        let body: [String: AnyEncodable] = [
            "name": AnyEncodable(agent.name),
            "phone": AnyEncodable(agent.phone ?? ""),
            "specialization": AnyEncodable(agent.specialization ?? ""),
            "location": AnyEncodable(agent.location ?? ""),
            "status": AnyEncodable(newStatus)
        ]
        
        Task {
            do {
                struct UserResponse: Decodable { let success: Bool }
                let res = try await APIClient.shared.put(endpoint: "api/users/\(agent.id)", body: body, responseType: UserResponse.self)
                if res.success {
                    await requestVM.fetchUsers()
                }
            } catch {
                print("Failed to toggle status: \(error.localizedDescription)")
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

// SwiftUI custom Filter Chip matching Android ElevatedFilterChip
struct FilterChip: View {
    let label: String
    let selected: String
    let onClick: () -> Void
    
    var body: some View {
        Button(action: onClick) {
            Text(label)
                .font(.footnote)
                .fontWeight(.bold)
                .foregroundColor(selected == label ? .white : SBRColors.textPrimary)
                .padding(.vertical, 8)
                .padding(.horizontal, 16)
                .background(selected == label ? SBRColors.primaryBlue : Color.white)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(selected == label ? Color.clear : Color.gray.opacity(0.3), lineWidth: 1)
                )
                .shadow(color: Color.black.opacity(0.04), radius: 2, x: 0, y: 1)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// SwiftUI custom Card replicating AgentCard on Android
struct AgentCardView: View {
    let agent: User
    let onEdit: () -> Void
    let onToggleStatus: (Bool) -> Void
    
    var body: some View {
        HStack(alignment: .center, spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Name: \(agent.name)")
                    .font(.body)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                
                Text("Phone: \(agent.phone ?? "N/A")")
                    .font(.footnote)
                    .foregroundColor(SBRColors.textSecondary)
                
                Text("Location: \(agent.location ?? "Unknown")")
                    .font(.footnote)
                    .foregroundColor(SBRColors.textSecondary)
                
                Text("Status: \(agent.status ?? "Inactive")")
                    .font(.footnote)
                    .foregroundColor(agent.status == "Active" ? .green : .red)
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
            .onTapGesture {
                onEdit()
            }
            
            // Toggle switch on the right side of the card
            Toggle("", isOn: Binding(
                get: { agent.status == "Active" },
                set: { isChecked in
                    onToggleStatus(isChecked)
                }
            ))
            .labelsHidden()
            .toggleStyle(SwitchToggleStyle(tint: SBRColors.primaryBlue))
        }
        .padding(16)
        .background(Color(red: 0.92, green: 0.93, blue: 0.96)) // surfaceVariant light gray style
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.12), lineWidth: 1)
        )
    }
}
