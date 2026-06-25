import SwiftUI

struct RequestDetailView: View {
    @Environment(\.dismiss) var dismiss
    let request: ServiceRequest
    @State private var showingLiveTracking = false
    
    var statusColor: Color {
        switch request.status {
        case .pending: return .orange
        case .assigned: return .blue
        case .accepted: return .indigo
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
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textPrimary)
                        
                        Text(request.status.rawValue)
                            .font(.caption)
                            .fontWeight(.bold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(statusColor.opacity(0.15))
                            .foregroundColor(statusColor)
                            .cornerRadius(20)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                    )
                    .padding(.horizontal)
                    
                    // Track Agent Live Button (Customer tracking)
                    if request.assignedAgentId != nil && request.status == .inProgress {
                        Button(action: { showingLiveTracking = true }) {
                            Label("Track Agent Live", systemImage: "location.circle.fill")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(SBRColors.primaryBlue)
                                .cornerRadius(8)
                        }
                        .padding(.horizontal)
                        .sheet(isPresented: $showingLiveTracking) {
                            CustomerLiveTrackingView(request: request)
                        }
                    }
                    
                    // Client Details
                    VStack(alignment: .leading, spacing: 12) {
                        Text("CLIENT DETAILS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.primaryBlue)
                        
                        if let customer = request.customerId {
                            Label(customer.name, systemImage: "person.fill")
                            if let phone = customer.phone {
                                Label(phone, systemImage: "phone.fill")
                            }
                        } else {
                            Text("Customer info unavailable")
                        }
                        
                        Label(request.customerAddress, systemImage: "mappin.and.ellipse")
                        
                        if let desc = request.description, !desc.isEmpty {
                            Divider()
                            Text("Description:")
                                .font(.footnote)
                                .foregroundColor(.gray)
                            Text(desc)
                                .font(.body)
                                .foregroundColor(SBRColors.textPrimary)
                        }
                    }
                    .font(.footnote)
                    .foregroundColor(SBRColors.textPrimary)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                    )
                    .padding(.horizontal)
                    
                    // Assigned Technician
                    VStack(alignment: .leading, spacing: 12) {
                        Text("ASSIGNED TECHNICIAN")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.primaryBlue)
                        
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
                                        .fontWeight(.bold)
                                }
                            }
                        } else {
                            Text("No technician assigned yet.")
                                .foregroundColor(.gray)
                        }
                    }
                    .font(.footnote)
                    .foregroundColor(SBRColors.textPrimary)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                    )
                    .padding(.horizontal)
                    
                    // Attachment Photos
                    VStack(alignment: .leading, spacing: 12) {
                        Text("SERVICE DOCUMENTATION PHOTOS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.primaryBlue)
                        
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
                                        .fill(Color(red: 0.95, green: 0.96, blue: 0.98))
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
                                        .fill(Color(red: 0.95, green: 0.96, blue: 0.98))
                                        .frame(height: 120)
                                        .overlay(Image(systemName: "photo").foregroundColor(.gray))
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                    )
                    .padding(.horizontal)
                    
                    // Invoice / Payment Details
                    VStack(alignment: .leading, spacing: 12) {
                        Text("BILLING & INVOICE DETAILS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.primaryBlue)
                        
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
                                    .foregroundColor(SBRColors.textPrimary)
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
                    .foregroundColor(SBRColors.textPrimary)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.12), lineWidth: 1)
                    )
                    .padding(.horizontal)
                    
                    Spacer()
                }
                .padding(.top)
            }
            .background(SBRColors.background)
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
