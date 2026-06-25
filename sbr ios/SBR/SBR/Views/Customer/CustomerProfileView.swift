import SwiftUI
import PhotosUI

struct CustomerProfileView: View {
    @ObservedObject var authVM: AuthViewModel
    
    @State private var name = ""
    @State private var phone = ""
    @State private var address = ""
    @State private var selectedItem: PhotosPickerItem? = nil
    @State private var photoData: Data? = nil
    @State private var photoUrl: String? = nil
    
    @State private var isLoading = false
    @State private var statusMessage = ""
    @State private var statusColor = Color.green
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Profile Picture Editor (Android aligned)
                ZStack(alignment: .bottomTrailing) {
                    if let photoData = photoData, let uiImage = UIImage(data: photoData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 120, height: 120)
                            .clipShape(Circle())
                    } else if let photoUrl = photoUrl, let url = URL(string: photoUrl) {
                        AsyncImage(url: url) { image in
                            image.resizable().scaledToFill()
                        } placeholder: {
                            ProgressView()
                        }
                        .frame(width: 120, height: 120)
                        .clipShape(Circle())
                    } else {
                        Image(systemName: "person.crop.circle.fill")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 120, height: 120)
                            .foregroundColor(SBRColors.primaryBlue)
                    }
                    
                    PhotosPicker(selection: $selectedItem, matching: .images, photoLibrary: .shared()) {
                        Image(systemName: "pencil.circle.fill")
                            .symbolRenderingMode(.multicolor)
                            .font(.system(size: 32))
                            .background(Color.white.clipShape(Circle()))
                            .shadow(color: Color.black.opacity(0.15), radius: 3, x: 0, y: 1)
                    }
                }
                .padding(.top, 16)
                .onChange(of: selectedItem) { newItem in
                    Task {
                        if let data = try? await newItem?.loadTransferable(type: Data.self) {
                            photoData = data
                            // Direct upload of profile photo on change
                            await uploadProfileImage(data: data)
                        }
                    }
                }
                
                // Form Fields (Android OutlinedTextField style)
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Full Name")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textSecondary)
                        TextField("Enter your name", text: $name)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                            .foregroundColor(SBRColors.textPrimary)
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Email Address")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textSecondary)
                        Text(authVM.user?.email ?? "")
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(red: 0.95, green: 0.96, blue: 0.98))
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.gray.opacity(0.15), lineWidth: 1)
                            )
                            .foregroundColor(SBRColors.textSecondary)
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Phone Number")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textSecondary)
                        TextField("Enter phone number", text: $phone)
                            .keyboardType(.phonePad)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                            .foregroundColor(SBRColors.textPrimary)
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Primary Address")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textSecondary)
                        TextField("Enter address", text: $address)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                            .foregroundColor(SBRColors.textPrimary)
                    }
                }
                .padding(.horizontal)
                
                if !statusMessage.isEmpty {
                    Text(statusMessage)
                        .foregroundColor(statusColor)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .padding(.top, 4)
                }
                
                // Save Button
                Button(action: saveProfile) {
                    HStack {
                        Spacer()
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Save Changes")
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                        Spacer()
                    }
                    .padding()
                    .background(name.isEmpty || isLoading ? SBRColors.primaryBlue.opacity(0.6) : SBRColors.primaryBlue)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.08), radius: 4, x: 0, y: 2)
                }
                .padding(.horizontal)
                .disabled(name.isEmpty || isLoading)
                
                Spacer()
            }
            .padding(.bottom, 24)
        }
        .background(SBRColors.background.ignoresSafeArea())
        .navigationTitle("My Profile")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if let user = authVM.user {
                name = user.name
                phone = user.phone ?? ""
                address = user.address ?? ""
                photoUrl = user.photoUrl
            }
        }
    }
    
    private func uploadProfileImage(data: Data) async {
        isLoading = true
        statusMessage = ""
        do {
            let filename = "profile_\(authVM.user?.id ?? "unknown")"
            let uploadedUrl = try await APIClient.shared.uploadImage(imageData: data, filename: filename)
            photoUrl = uploadedUrl
            statusColor = .green
            statusMessage = "Photo uploaded successfully. Save to complete!"
        } catch {
            statusColor = .red
            statusMessage = "Photo upload failed: \(error.localizedDescription)"
        }
        isLoading = false
    }
    
    private func saveProfile() {
        isLoading = true
        statusMessage = ""
        
        var body: [String: AnyEncodable] = [
            "name": AnyEncodable(name),
            "phone": AnyEncodable(phone),
            "address": AnyEncodable(address)
        ]
        
        if let photoUrl = photoUrl {
            body["photoUrl"] = AnyEncodable(photoUrl)
        }
        
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
                    statusMessage = "Profile saved successfully!"
                } else {
                    statusColor = .red
                    statusMessage = res.error ?? "Failed to save profile"
                }
            } catch {
                statusColor = .red
                statusMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
