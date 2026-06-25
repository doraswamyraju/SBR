import SwiftUI

struct AddEditAddressSheet: View {
    @Environment(\.dismiss) var dismiss
    
    let addressToEdit: UserAddress?
    let onSave: (UserAddress) -> Void
    
    @State private var title = "Home"
    @State private var customTitle = ""
    @State private var addressLine = ""
    @State private var latitude: Double? = nil
    @State private var longitude: Double? = nil
    
    @State private var showingPinPicker = false
    
    let predefinedTitles = ["Home", "Work", "Office", "Other"]
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Address Details")) {
                    Picker("Address Type", selection: $title) {
                        ForEach(predefinedTitles, id: \.self) { type in
                            Text(type).tag(type)
                        }
                    }
                    
                    if title == "Other" {
                        TextField("Enter Custom Label", text: $customTitle)
                            .foregroundColor(SBRColors.textPrimary)
                    }
                    
                    TextEditor(text: $addressLine)
                        .frame(height: 80)
                        .overlay(
                            Group {
                                if addressLine.isEmpty {
                                    Text("Enter full address details...")
                                        .foregroundColor(.gray.opacity(0.6))
                                        .padding(.top, 8)
                                        .padding(.leading, 5)
                                }
                            },
                            alignment: .topLeading
                        )
                }
                
                Section(header: Text("Location Pin (Coordinates)")) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            if let lat = latitude, let lng = longitude, lat != 0, lng != 0 {
                                Text("Location Pin Set")
                                    .fontWeight(.semibold)
                                    .foregroundColor(.green)
                                Text(String(format: "%.5f, %.5f", lat, lng))
                                    .font(.system(.caption, design: .monospaced))
                                    .foregroundColor(.gray)
                            } else {
                                Text("No Location Pin")
                                    .fontWeight(.semibold)
                                    .foregroundColor(.orange)
                                Text("Map pin coordinates not set")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                        }
                        
                        Spacer()
                        
                        Button(action: {
                            showingPinPicker = true
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "mappin.and.ellipse")
                                Text(latitude != nil ? "Edit Pin" : "Set Pin")
                            }
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(SBRColors.primaryBlue)
                            .cornerRadius(8)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    .padding(.vertical, 4)
                }
                
                Section {
                    Button(action: {
                        let finalTitle = title == "Other" ? (customTitle.isEmpty ? "Other" : customTitle) : title
                        let updatedAddress = UserAddress(
                            _id: addressToEdit?._id,
                            title: finalTitle,
                            addressLine: addressLine,
                            latitude: latitude,
                            longitude: longitude
                        )
                        onSave(updatedAddress)
                        dismiss()
                    }) {
                        HStack {
                            Spacer()
                            Text(addressToEdit == nil ? "Add Address" : "Save Changes")
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            Spacer()
                        }
                    }
                    .listRowBackground(
                        addressLine.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? SBRColors.primaryBlue.opacity(0.5) : SBRColors.primaryBlue
                    )
                    .disabled(addressLine.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .navigationTitle(addressToEdit == nil ? "Add New Address" : "Edit Address")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .sheet(isPresented: $showingPinPicker) {
                MapPinPickerSheet(
                    latitude: $latitude,
                    longitude: $longitude,
                    addressString: addressLine
                )
            }
            .onAppear {
                if let item = addressToEdit {
                    if predefinedTitles.contains(item.title) {
                        title = item.title
                    } else {
                        title = "Other"
                        customTitle = item.title
                    }
                    addressLine = item.addressLine
                    latitude = item.latitude
                    longitude = item.longitude
                }
            }
        }
    }
}
