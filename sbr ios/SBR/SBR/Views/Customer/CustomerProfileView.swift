import SwiftUI
import PhotosUI

struct CustomerProfileView: View {
    @ObservedObject var authVM: AuthViewModel
    
    @State private var name = ""
    @State private var phone = ""
    @State private var address = ""
    @State private var latitude: Double? = nil
    @State private var longitude: Double? = nil
    @State private var addresses: [UserAddress] = []
    
    @State private var selectedItem: PhotosPickerItem? = nil
    @State private var photoData: Data? = nil
    @State private var photoUrl: String? = nil
    
    @State private var isLoading = false
    @State private var statusMessage = ""
    @State private var statusColor = Color.green
    
    // Address Sheets control
    @State private var showingPrimaryPinPicker = false
    @State private var showingAddAddressSheet = false
    @State private var selectedAddressForEdit: UserAddress? = nil
    @State private var showingEditAddressSheet = false
    
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
                    } else if let photoUrl = photoUrl, let url = URL(string: photoUrl.lowercased().hasPrefix("http://") ? "https://" + photoUrl.dropFirst(7) : photoUrl) {
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
                        
                        HStack(spacing: 8) {
                            TextField("Enter address", text: $address)
                                .padding()
                                .background(Color.white)
                                .cornerRadius(10)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                                .foregroundColor(SBRColors.textPrimary)
                            
                            Button(action: {
                                showingPrimaryPinPicker = true
                            }) {
                                Image(systemName: latitude != nil ? "mappin.and.ellipse" : "mappin")
                                    .foregroundColor(latitude != nil ? .green : .gray)
                                    .frame(width: 50, height: 50)
                                    .background(Color.white)
                                    .cornerRadius(10)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                    )
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                        
                        if let lat = latitude, let lng = longitude, lat != 0, lng != 0 {
                            Text(String(format: "Primary Pin: %.5f, %.5f", lat, lng))
                                .font(.system(.caption2, design: .monospaced))
                                .foregroundColor(.green)
                                .padding(.leading, 4)
                        }
                    }
                }
                .padding(.horizontal)
                
                // Saved Addresses Section
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Saved Addresses")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textPrimary)
                        
                        Spacer()
                        
                        Button(action: {
                            showingAddAddressSheet = true
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: "plus.circle.fill")
                                Text("Add Address")
                            }
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(SBRColors.primaryBlue)
                        }
                    }
                    .padding(.horizontal)
                    
                    if addresses.isEmpty {
                        Text("No saved addresses yet.")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .center)
                            .background(Color.white)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.gray.opacity(0.15), lineWidth: 1)
                            )
                            .padding(.horizontal)
                    } else {
                        VStack(spacing: 12) {
                            ForEach(addresses) { item in
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack(spacing: 6) {
                                            Image(systemName: addressIcon(for: item.title))
                                                .foregroundColor(SBRColors.primaryBlue)
                                            Text(item.title)
                                                .font(.subheadline)
                                                .fontWeight(.bold)
                                                .foregroundColor(SBRColors.textPrimary)
                                            
                                            if let lat = item.latitude, let lng = item.longitude, lat != 0, lng != 0 {
                                                Image(systemName: "mappin.and.ellipse")
                                                    .foregroundColor(.green)
                                                    .font(.caption)
                                            }
                                        }
                                        
                                        Text(item.addressLine)
                                            .font(.caption)
                                            .foregroundColor(SBRColors.textSecondary)
                                            .lineLimit(2)
                                    }
                                    
                                    Spacer()
                                    
                                    Button(action: {
                                        selectedAddressForEdit = item
                                        showingEditAddressSheet = true
                                    }) {
                                        Image(systemName: "pencil")
                                            .foregroundColor(.blue)
                                            .padding(6)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                    
                                    Button(action: {
                                        if let index = addresses.firstIndex(where: { $0.id == item.id }) {
                                            addresses.remove(at: index)
                                            saveProfile()
                                        }
                                    }) {
                                        Image(systemName: "trash")
                                            .foregroundColor(.red)
                                            .padding(6)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                                .padding()
                                .background(Color.white)
                                .cornerRadius(12)
                                .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.gray.opacity(0.1), lineWidth: 1)
                                )
                                .padding(.horizontal)
                            }
                        }
                    }
                }
                .padding(.top, 8)
                
                if !statusMessage.isEmpty {
                    Text(statusMessage)
                        .foregroundColor(statusColor)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .padding(.top, 4)
                }
                
                // Save Button
                Button(action: { saveProfile() }) {
                    HStack {
                        Spacer()
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Save Profile Changes")
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
                latitude = user.latitude
                longitude = user.longitude
                addresses = user.addresses ?? []
                photoUrl = user.photoUrl
            }
        }
        .sheet(isPresented: $showingPrimaryPinPicker) {
            MapPinPickerSheet(
                latitude: $latitude,
                longitude: $longitude,
                addressString: address
            )
        }
        .sheet(isPresented: $showingAddAddressSheet) {
            AddEditAddressSheet(addressToEdit: nil) { newAddress in
                addresses.append(newAddress)
                saveProfile()
            }
        }
        .sheet(item: $selectedAddressForEdit) { item in
            AddEditAddressSheet(addressToEdit: item) { updatedAddress in
                if let index = addresses.firstIndex(where: { $0.id == updatedAddress.id }) {
                    addresses[index] = updatedAddress
                    saveProfile()
                }
            }
        }
    }
    
    private func addressIcon(for title: String) -> String {
        let lower = title.lowercased()
        if lower.contains("home") { return "house.fill" }
        if lower.contains("work") || lower.contains("office") { return "briefcase.fill" }
        return "mappin.circle.fill"
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
            "address": AnyEncodable(address),
            "addresses": AnyEncodable(addresses)
        ]
        
        if let latitude = latitude {
            body["latitude"] = AnyEncodable(latitude)
        }
        if let longitude = longitude {
            body["longitude"] = AnyEncodable(longitude)
        }
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
