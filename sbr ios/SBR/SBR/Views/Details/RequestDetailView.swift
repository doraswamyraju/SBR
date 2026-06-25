import SwiftUI

struct RequestDetailView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authVM: AuthViewModel
    @ObservedObject var requestVM: RequestViewModel
    
    @State private var currentRequest: ServiceRequest
    @State private var showingLiveTracking = false
    @State private var showingAgentSelection = false
    @State private var showingImagePicker = false
    @State private var pickerImageType = "before"
    @State private var reviewUrl = ""
    
    init(request: ServiceRequest, requestVM: RequestViewModel) {
        _currentRequest = State(initialValue: request)
        self.requestVM = requestVM
    }
    
    var statusColor: Color {
        switch currentRequest.status {
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
                        Text(currentRequest.serviceType)
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textPrimary)
                        
                        Text(currentRequest.status.rawValue)
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
                    if isTrackingActive {
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
                    }
                    
                    // Client Details
                    VStack(alignment: .leading, spacing: 12) {
                        Text("CLIENT DETAILS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.primaryBlue)
                        
                        if let customer = currentRequest.customerId {
                            Label(customer.name, systemImage: "person.fill")
                            if let phone = customer.phone {
                                Label(phone, systemImage: "phone.fill")
                            }
                        } else {
                            Text("Customer info unavailable")
                        }
                        
                        Label(currentRequest.customerAddress, systemImage: "mappin.and.ellipse")
                        
                        if let desc = currentRequest.description, !desc.isEmpty {
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
                        HStack {
                            Text("ASSIGNED TECHNICIAN")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(SBRColors.primaryBlue)
                            
                            Spacer()
                            
                            if isAdmin {
                                Button(action: { showingAgentSelection = true }) {
                                    Text(currentRequest.assignedAgentId != nil ? "Reassign" : "Assign")
                                        .font(.caption2)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 4)
                                        .background(SBRColors.primaryBlue)
                                        .cornerRadius(4)
                                }
                            }
                        }
                        
                        if let agent = currentRequest.assignedAgentId {
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
                            Button(action: {
                                if authVM.user?.role == .agent {
                                    self.pickerImageType = "before"
                                    self.showingImagePicker = true
                                }
                            }) {
                                VStack(spacing: 8) {
                                    Text("Before Photo").font(.caption2).foregroundColor(.gray)
                                    if let url = currentRequest.resolvedBeforeImageUrl {
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
                                            .overlay(
                                                VStack(spacing: 4) {
                                                    Image(systemName: "camera.fill").foregroundColor(.gray)
                                                    if authVM.user?.role == .agent {
                                                        Text("Tap to upload").font(.caption2).foregroundColor(.gray)
                                                    }
                                                }
                                            )
                                    }
                                }
                            }
                            .buttonStyle(PlainButtonStyle())
                            .disabled(authVM.user?.role != .agent || currentRequest.status == .completed)
                            
                            Button(action: {
                                if authVM.user?.role == .agent {
                                    self.pickerImageType = "after"
                                    self.showingImagePicker = true
                                }
                            }) {
                                VStack(spacing: 8) {
                                    Text("After Photo").font(.caption2).foregroundColor(.gray)
                                    if let url = currentRequest.resolvedAfterImageUrl {
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
                                            .overlay(
                                                VStack(spacing: 4) {
                                                    Image(systemName: "camera.fill").foregroundColor(.gray)
                                                    if authVM.user?.role == .agent {
                                                        Text("Tap to upload").font(.caption2).foregroundColor(.gray)
                                                    }
                                                }
                                            )
                                    }
                                }
                            }
                            .buttonStyle(PlainButtonStyle())
                            .disabled(authVM.user?.role != .agent || currentRequest.status == .completed)
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
                            Text(currentRequest.paymentStatus ?? "Pending")
                                .fontWeight(.bold)
                                .foregroundColor(currentRequest.paymentStatus == "Paid" ? .green : .orange)
                        }
                        
                        if let amt = currentRequest.paymentAmount {
                            HStack {
                                Text("Amount Collected:")
                                Spacer()
                                Text("₹\(Int(amt))")
                                    .fontWeight(.bold)
                                    .foregroundColor(SBRColors.textPrimary)
                            }
                        }
                        
                        if let method = currentRequest.paymentMethod {
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
                    
                    if isAdmin {
                        Button(action: {
                            Task {
                                let success = await requestVM.deleteRequest(requestId: currentRequest.id)
                                if success {
                                    dismiss()
                                }
                            }
                        }) {
                            Label("Delete Service Request", systemImage: "trash.fill")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color.red)
                                .cornerRadius(8)
                        }
                        .padding(.horizontal)
                        .padding(.top, 10)
                    }
                    
                    if authVM.user?.role == .customer && currentRequest.status == .completed && currentRequest.requestReview == true {
                        Button(action: {
                            openReviewURL()
                        }) {
                            Label("Leave Sri Balaji Renewables Review", systemImage: "star.bubble.fill")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color.green)
                                .cornerRadius(8)
                        }
                        .padding(.horizontal)
                        .padding(.top, 10)
                    }
                    
                    Spacer()
                }
                .padding(.top)
            }
            .background(SBRColors.background)
            .navigationTitle("Job Specifications")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(SBRColors.primaryBlue, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.down")
                            Text("Close")
                        }
                        .font(.footnote)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    }
                }
            }
        }
        .onAppear {
            Task {
                await requestVM.fetchUsers()
            }
            if currentRequest.status == .completed && currentRequest.requestReview == true {
                fetchReviewUrl()
            }
        }
        .sheet(isPresented: $showingLiveTracking) {
            CustomerLiveTrackingView(request: currentRequest)
        }
        .sheet(isPresented: $showingAgentSelection) {
            DetailAgentSelectionSheet(request: currentRequest, requestVM: requestVM) { updatedReq in
                self.currentRequest = updatedReq
                Task {
                    await requestVM.fetchRequests()
                }
            }
        }
        .sheet(isPresented: $showingImagePicker) {
            ImagePicker(sourceType: .camera) { image in
                uploadImageForDetails(image: image, type: pickerImageType)
            }
        }
    }
    
    private var isAdmin: Bool {
        authVM.user?.role == .admin
    }
    
    private var isTrackingActive: Bool {
        guard currentRequest.assignedAgentId != nil else { return false }
        return currentRequest.status == .assigned ||
               currentRequest.status == .accepted ||
               currentRequest.status == .inProgress
    }
    
    private func uploadImageForDetails(image: UIImage, type: String) {
        Task {
            guard let imageData = image.jpegData(compressionQuality: 0.7) else { return }
            let success = await requestVM.uploadRequestImage(requestId: currentRequest.id, imageData: imageData, type: type)
            if success {
                if let res = try? await APIClient.shared.get(endpoint: "api/requests/\(currentRequest.id)", responseType: RequestViewModel.StandardResponse<ServiceRequest>.self),
                   res.success, let updatedReq = res.data {
                    self.currentRequest = updatedReq
                }
                await requestVM.fetchRequests()
            }
        }
    }
    
    private func fetchReviewUrl() {
        Task {
            struct SettingsResponse: Decodable {
                let success: Bool
                let data: [String: String]
            }
            if let res = try? await APIClient.shared.get(endpoint: "api/settings", responseType: SettingsResponse.self),
               res.success, let url = res.data["reviewUrl"] {
                self.reviewUrl = url
            }
        }
    }
    
    private func openReviewURL() {
        let targetUrlStr = reviewUrl.isEmpty ? "https://g.page/r/CbdJS-IzWTe2EBE/review" : reviewUrl
        if let url = URL(string: targetUrlStr) {
            UIApplication.shared.open(url)
        }
    }
}

struct DetailAgentSelectionSheet: View {
    let request: ServiceRequest
    @ObservedObject var requestVM: RequestViewModel
    var onAssignSuccess: (ServiceRequest) -> Void
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            List(requestVM.users.filter({ $0.role == .agent })) { agent in
                Button(action: {
                    Task {
                        let success = await requestVM.assignAgent(requestId: request.id, agentId: agent.id)
                        if success {
                            if let res = try? await APIClient.shared.get(endpoint: "api/requests/\(request.id)", responseType: RequestViewModel.StandardResponse<ServiceRequest>.self),
                               res.success, let updatedReq = res.data {
                                onAssignSuccess(updatedReq)
                            }
                            dismiss()
                        }
                    }
                }) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(agent.name)
                                .font(.body)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)
                            Text(agent.specialization ?? "Field Agent")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.gray)
                    }
                    .padding(.vertical, 4)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .navigationTitle("Select an Agent")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(SBRColors.primaryBlue, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Text("Cancel")
                            .font(.footnote)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                }
            }
        }
    }
}
