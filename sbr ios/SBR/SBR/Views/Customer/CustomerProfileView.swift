import SwiftUI

struct CustomerProfileView: View {
    @ObservedObject var authVM: AuthViewModel
    
    @State private var name = ""
    @State private var phone = ""
    @State private var address = ""
    @State private var isRecurring = false
    @State private var isLoading = false
    @State private var statusMessage = ""
    @State private var statusColor = Color.green
    
    var body: some View {
        Form {
            Section(header: Text("Personal Details").foregroundColor(.gray)) {
                TextField("Name", text: $name)
                TextField("Phone Number", text: $phone)
                    .keyboardType(.phonePad)
                TextField("Service Address", text: $address)
            }
            
            Section(header: Text("Plan Preference").foregroundColor(.gray)) {
                Toggle("Contract Maintenance Mode", isOn: $isRecurring)
                    .disabled(true) // Set by admin only, customer can view
                Text("To modify your service plan contract, please contact SBR Admin support.")
                    .font(.caption2)
                    .foregroundColor(.gray)
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
                            Text("Update Profile Details")
                                .fontWeight(.bold)
                        }
                        Spacer()
                    }
                }
                .foregroundColor(.indigo)
                .disabled(isLoading || name.isEmpty)
            }
        }
        .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if let user = authVM.user {
                name = user.name
                phone = user.phone ?? ""
                address = user.address ?? ""
                isRecurring = user.isRecurring ?? false
            }
        }
    }
    
    private func updateProfile() {
        isLoading = true
        statusMessage = ""
        
        let body: [String: AnyEncodable] = [
            "name": AnyEncodable(name),
            "phone": AnyEncodable(phone),
            "address": AnyEncodable(address)
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
                    // Update UserDefaults
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
