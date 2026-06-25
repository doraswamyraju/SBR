import SwiftUI

struct CustomerManagementView: View {
    @ObservedObject var requestVM: RequestViewModel
    
    @State private var selectedCustomer: User? = nil
    @State private var showingAddEditSheet = false
    @State private var searchQuery = ""
    @State private var customerToDelete: User? = nil
    
    private var filteredCustomers: [User] {
        let clients = requestVM.users.filter({ $0.role == .customer })
        if searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return clients
        }
        return clients.filter { client in
            client.name.localizedCaseInsensitiveContains(searchQuery) ||
            (client.phone?.localizedCaseInsensitiveContains(searchQuery) ?? false)
        }
    }
    
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(spacing: 0) {
                // Search Bar matching OutlinedTextField style
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    
                    TextField("Search by Name or Phone", text: $searchQuery)
                        .foregroundColor(SBRColors.textPrimary)
                        .autocapitalization(.none)
                }
                .padding(.vertical, 12)
                .padding(.horizontal, 16)
                .background(Color.white)
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )
                .padding()
                
                // Content Area
                if filteredCustomers.isEmpty {
                    Spacer()
                    Text(searchQuery.isEmpty ? "No customers found. Tap the '+' button to add one." : "No customers match your search.")
                        .foregroundColor(.gray)
                        .font(.body)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                    Spacer()
                } else {
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(filteredCustomers) { client in
                                CustomerInfoCardView(
                                    customer: client,
                                    onCardClick: {
                                        selectedCustomer = client
                                        showingAddEditSheet = true
                                    },
                                    onDeleteClick: {
                                        customerToDelete = client
                                    }
                                )
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .background(SBRColors.background.ignoresSafeArea())
            
            // Replicated Material 3 Floating Action Button (FAB) at the bottom-right
            Button(action: {
                selectedCustomer = nil
                showingAddEditSheet = true
            }) {
                Image(systemName: "plus")
                    .font(.title)
                    .foregroundColor(SBRColors.primaryBlue) // Dark blue plus icon
                    .frame(width: 56, height: 56)
                    .background(Color(red: 221/255, green: 225/255, blue: 255/255)) // Light blue container `#DDE1FF`
                    .clipShape(RoundedRectangle(cornerRadius: 16)) // Squircle shape matching Compose
                    .shadow(color: Color.black.opacity(0.12), radius: 4, x: 0, y: 2)
            }
            .padding(20)
        }
        .navigationTitle("Customer Accounts")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingAddEditSheet, onDismiss: {
            Task { await requestVM.fetchUsers() }
        }) {
            AddEditCustomerView(customer: selectedCustomer)
        }
        .alert(item: $customerToDelete) { client in
            Alert(
                title: Text("Delete Customer"),
                message: Text("Are you sure you want to delete \(client.name)? This action cannot be undone."),
                primaryButton: .destructive(Text("Delete")) {
                    deleteCustomerAction(client.id)
                },
                secondaryButton: .cancel(Text("Cancel"))
            )
        }
    }
    
    private func deleteCustomerAction(_ userId: String) {
        Task {
            do {
                struct DeleteResponse: Decodable { let success: Bool }
                let res = try await APIClient.shared.delete(endpoint: "api/users/\(userId)", responseType: DeleteResponse.self)
                if res.success {
                    await requestVM.fetchUsers()
                }
            } catch {
                print("Failed to delete customer: \(error.localizedDescription)")
            }
        }
    }
}

// SwiftUI custom Customer Info Card matching CustomerInfoCard on Android
struct CustomerInfoCardView: View {
    let customer: User
    let onCardClick: () -> Void
    let onDeleteClick: () -> Void
    
    var body: some View {
        HStack(alignment: .center, spacing: 16) {
            Image(systemName: "person.fill")
                .font(.system(size: 24))
                .foregroundColor(.white)
                .frame(width: 44, height: 44)
                .background(SBRColors.primaryBlue)
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(customer.name)
                    .font(.body)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                
                if let phone = customer.phone {
                    Text(phone)
                        .font(.footnote)
                        .foregroundColor(SBRColors.textSecondary)
                }
                
                if let address = customer.address {
                    Text(address)
                        .font(.footnote)
                        .foregroundColor(SBRColors.textSecondary)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
            .onTapGesture {
                onCardClick()
            }
            
            Button(action: onDeleteClick) {
                Image(systemName: "trash")
                    .font(.title3)
                    .foregroundColor(.red)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.12), lineWidth: 1)
        )
    }
}
