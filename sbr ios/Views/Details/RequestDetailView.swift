import SwiftUI

struct RequestDetailView: View {
    @Environment(\.dismiss) var dismiss
    let request: ServiceRequest
    
    var statusColor: Color {
        switch request.status {
        case .pending: return .orange
        case .assigned: return .blue
        case .accepted: return .cyan
        case .inProgress: return .purple
        case .completed: return .green
        case .cancelled: return .red
        }
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header Card
                    VStack(spacing: 8) {
                        Text(request.serviceType)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text(request.status.rawValue)
                            .font(.footnote)
                            .fontWeight(.bold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(statusColor.opacity(0.15))
                            .foregroundColor(statusColor)
                            .cornerRadius(20)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.white.opacity(0.02))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    // Client Details
                    VStack(alignment: .leading, spacing: 12) {
                        Text("CLIENT DETAILS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.indigo)
                        
                        if let customer = request.customerId {
                            Label(customer.name, systemImage: "person.fill")
                            if let phone = customer.phone {
                                Label(phone, systemImage: "phone.fill")
                            }
                        } else {
                            Text("Customer info unavailable")
                        }
                        
                        Label(request.customerAddress, systemImage: "mappin.and.ellipse")
                        
                        if let desc = request.description {
                            Divider().background(Color.white.opacity(0.1))
                            Text("Description:")
                                .font(.footnote)
                                .foregroundColor(.gray)
                            Text(desc)
                                .font(.body)
                                .foregroundColor(.white.opacity(0.9))
                        }
                    }
                    .font(.footnote)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.02))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    // Assigned Technician
                    VStack(alignment: .leading, spacing: 12) {
                        Text("ASSIGNED TECHNICIAN")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.indigo)
                        
                        if let agent = request.assignedAgentId {
                            Label(agent.name, systemImage: "person.badge.shield.checkmark.fill")
                            if let spec = agent.specialization {
                                Text("Specialization: \(spec)")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            if let phone = agent.phone {
                                Button(action: {
                                    if let url = URL(string: "tel:\(phone)") {
                                        UIApplication.shared.open(url)
                                    }
                                }) {
                                    Label("Call \(agent.name)", systemImage: "phone.circle.fill")
                                        .foregroundColor(.green)
                                }
                            }
                        } else {
                            Text("No technician assigned yet.")
                                .foregroundColor(.gray)
                        }
                    }
                    .font(.footnote)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.02))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    // Attachment Photos
                    VStack(alignment: .leading, spacing: 12) {
                        Text("SERVICE DOCUMENTATION PHOTOS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.indigo)
                        
                        HStack(spacing: 20) {
                            VStack(spacing: 8) {
                                Text("Before Photo").font(.caption2).foregroundColor(.gray)
                                if let beforeUrl = request.beforeImageUrl, let url = URL(string: beforeUrl) {
                                    AsyncImage(url: url) { image in
                                        image.resizable().scaledToFill()
                                    } placeholder: {
                                        ProgressView()
                                    }
                                    .frame(height: 120)
                                    .cornerRadius(8)
                                } else {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(Color.white.opacity(0.03))
                                        .frame(height: 120)
                                        .overlay(Image(systemName: "photo").foregroundColor(.gray))
                                }
                            }
                            
                            VStack(spacing: 8) {
                                Text("After Photo").font(.caption2).foregroundColor(.gray)
                                if let afterUrl = request.afterImageUrl, let url = URL(string: afterUrl) {
                                    AsyncImage(url: url) { image in
                                        image.resizable().scaledToFill()
                                    } placeholder: {
                                        ProgressView()
                                    }
                                    .frame(height: 120)
                                    .cornerRadius(8)
                                } else {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(Color.white.opacity(0.03))
                                        .frame(height: 120)
                                        .overlay(Image(systemName: "photo").foregroundColor(.gray))
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color.white.opacity(0.02))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    // Invoice / Payment Details
                    VStack(alignment: .leading, spacing: 12) {
                        Text("BILLING & INVOICE DETAILS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.indigo)
                        
                        HStack {
                            Text("Payment Status:")
                            Spacer()
                            Text(request.paymentStatus ?? "Pending")
                                .fontWeight(.bold)
                                .foregroundColor(request.paymentStatus == "Paid" ? .green : .orange)
                        }
                        
                        if let amt = request.paymentAmount {
                            HStack {
                                Text("Amount Collected:")
                                Spacer()
                                Text("₹\(Int(amt))")
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                            }
                        }
                        
                        if let method = request.paymentMethod {
                            HStack {
                                Text("Payment Method:")
                                Spacer()
                                Text(method)
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                    .font(.footnote)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.white.opacity(0.02))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    Spacer()
                }
                .padding(.top)
            }
            .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
            .navigationTitle("Job Specifications")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Dismiss") { dismiss() }
                }
            }
        }
    }
}
