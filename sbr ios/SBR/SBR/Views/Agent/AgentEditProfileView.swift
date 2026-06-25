import SwiftUI

struct AgentEditProfileView: View {
    @ObservedObject var authVM: AuthViewModel
    
    @State private var name = ""
    @State private var phone = ""
    @State private var specialization = ""
    @State private var location = ""
    @State private var isLoading = false
    @State private var statusMessage = ""
    @State private var statusColor = Color.green
    
    var body: some View {
        Form {
            Section(header: Text("Technician Details").foregroundColor(.gray)) {
                TextField("Name", text: $name)
                    .disabled(true) // Set by admin, agent can view
                TextField("Phone Number", text: $phone)
                    .keyboardType(.phonePad)
            }
            
            Section(header: Text("Expertise & Location").foregroundColor(.gray)) {
                TextField("Specialization", text: $specialization)
                TextField("Service Zone / Location", text: $location)
            }
            
            if !statusMessage.isEmpty {
                Section {
                    Text(statusMessage)
                        .foregroundColor(statusColor)
                        .font(.footnote)
                }
            }
            
            Section {
                Button(action: updateProfile) {
                    HStack {
                        Spacer()
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Update Profile Info")
                                .fontWeight(.bold)
                        }
                        Spacer()
                    }
                }
                .foregroundColor(.indigo)
                .disabled(isLoading || phone.isEmpty || specialization.isEmpty || location.isEmpty)
            }
        }
        .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if let user = authVM.user {
                name = user.name
                phone = user.phone ?? ""
                specialization = user.specialization ?? ""
                location = user.location ?? ""
            }
        }
    }
    
    private func updateProfile() {
        isLoading = true
        statusMessage = ""
        
        let body: [String: AnyEncodable] = [
            "name": AnyEncodable(name),
            "phone": AnyEncodable(phone),
            "specialization": AnyEncodable(specialization),
            "location": AnyEncodable(location)
        ]
        
        Task {
            do {
                struct ProfileResponse: Decodable {
                    let success: Bool
                    let data: User?
                    let error: String?
                }
                let res = try await APIClient.shared.put(endpoint: "api/users/profile", body: body, responseType: ProfileResponse.self)
                if res.success, let updatedUser = res.data {
                    authVM.user = updatedUser
                    if let encodedUser = try? JSONEncoder().encode(updatedUser) {
                        UserDefaults.standard.set(encodedUser, forKey: "auth_user")
                    }
                    statusColor = .green
                    statusMessage = "Profile updated successfully!"
                } else {
                    statusColor = .red
                    statusMessage = res.error ?? "Failed to update profile"
                }
            } catch {
                statusColor = .red
                statusMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
