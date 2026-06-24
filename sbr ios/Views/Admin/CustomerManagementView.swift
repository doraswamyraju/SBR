import SwiftUI

struct CustomerManagementView: View {
    @ObservedObject var requestVM: RequestViewModel
    
    @State private var selectedCustomer: User? = nil
    @State private var showingAddEditSheet = false
    
    var body: some View {
        List {
            ForEach(requestVM.users.filter({ $0.role == .customer })) { client in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(client.name)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Spacer()
                        Button(action: {
                            selectedCustomer = client
                            showingAddEditSheet = true
                        }) {
                            Text("Edit")
                                .font(.footnote)
                                .foregroundColor(.indigo)
                        }
                    }
                    Text(client.email)
                        .font(.caption)
                        .foregroundColor(.gray)
                    if let address = client.address {
                        Text("Address: \(address)")
                            .font(.caption2)
                            .foregroundColor(.gray.opacity(0.8))
                            .lineLimit(1)
                    }
                    HStack {
                        Text((client.isRecurring == true) ? "Recurring Plan" : "Pay-As-Go Plan")
                        Spacer()
                        if let phone = client.phone {
                            Text("Call: \(phone)")
                        }
                    }
                    .font(.footnote)
                    .foregroundColor(.indigo)
                }
                .padding(.vertical, 4)
                .listRowBackground(Color.white.opacity(0.01))
            }
        }
        .listStyle(PlainListStyle())
        .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
        .navigationTitle("Customer Accounts")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            Button(action: {
                selectedCustomer = nil
                showingAddEditSheet = true
            }) {
                Image(systemName: "plus")
            }
        }
        .sheet(isPresented: $showingAddEditSheet, onDismiss: {
            Task { await requestVM.fetchUsers() }
        }) {
            AddEditCustomerView(customer: selectedCustomer)
        }
    }
}
