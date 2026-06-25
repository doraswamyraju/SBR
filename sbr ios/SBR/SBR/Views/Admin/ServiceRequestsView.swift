import SwiftUI

struct ServiceRequestsView: View {
    @ObservedObject var requestVM: RequestViewModel
    @State private var searchQuery = ""
    @State private var selectedRequest: ServiceRequest?
    
    private var filteredRequests: [ServiceRequest] {
        let allRequests = requestVM.requests
        if searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return allRequests
        }
        return allRequests.filter { req in
            req.serviceType.localizedCaseInsensitiveContains(searchQuery) ||
            (req.assignedAgentId?.name.localizedCaseInsensitiveContains(searchQuery) ?? false) ||
            req.status.rawValue.localizedCaseInsensitiveContains(searchQuery)
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Search Bar matching OutlinedTextField style
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                
                ZStack(alignment: .leading) {
                    if searchQuery.isEmpty {
                        Text("Search by service, agent, or status")
                            .foregroundColor(Color.gray.opacity(0.7)) // High contrast placeholder
                    }
                    TextField("", text: $searchQuery)
                        .foregroundColor(SBRColors.textPrimary)
                        .autocapitalization(.none)
                }
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
            if filteredRequests.isEmpty {
                Spacer()
                Text(searchQuery.isEmpty ? "No service requests yet." : "No matching requests found.")
                    .foregroundColor(.gray)
                    .font(.body)
                Spacer()
            } else {
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(filteredRequests) { request in
                            RequestRowItem(
                                request: request,
                                onViewDetails: { selectedRequest = request },
                                onDelete: {
                                    Task {
                                        _ = await requestVM.deleteRequest(requestId: request.id)
                                    }
                                }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
        .background(SBRColors.background.ignoresSafeArea())
        .sheet(item: $selectedRequest) { req in
            RequestDetailView(request: req)
        }
        .onAppear {
            Task {
                await requestVM.fetchRequests()
            }
        }
    }
}

// Request card item inside ServiceRequestsView replicating Android's ServiceRequestsScreen items
struct RequestRowItem: View {
    let request: ServiceRequest
    let onViewDetails: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(request.serviceType)
                    .font(.body)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                
                Text("Agent: \(request.assignedAgentId?.name ?? "Unassigned")")
                    .font(.footnote)
                    .foregroundColor(Color(red: 0.3, green: 0.35, blue: 0.45)) // High contrast text
                
                HStack(spacing: 4) {
                    Text(formatDate(request.createdAt))
                        .font(.footnote)
                        .foregroundColor(Color(red: 0.35, green: 0.4, blue: 0.5)) // High contrast text
                    
                    if request.createdBy == "ADMIN" {
                        Text(" (By Admin)")
                            .font(.footnote)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255)) // SBRGreen `#10B981` (stronger green)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            
            // Status Chip
            Text(request.status.rawValue)
                .font(.caption2)
                .fontWeight(.bold)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(statusColor(for: request.status).opacity(0.12))
                .foregroundColor(statusColor(for: request.status))
                .cornerRadius(20) // rounded status chip
            
            HStack(spacing: 8) {
                Button(action: onViewDetails) {
                    Image(systemName: "arrow.right")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(SBRColors.primaryBlue)
                        .clipShape(Circle())
                        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: onDelete) {
                    Image(systemName: "trash.fill")
                        .font(.subheadline)
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(Color.red.opacity(0.9))
                        .clipShape(Circle())
                        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding(16)
        .background(Color.white) // High contrast white card background
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 3)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.12), lineWidth: 1)
        )
    }
    
    private func statusColor(for status: RequestStatus) -> Color {
        switch status {
        case .pending: return .orange
        case .assigned: return .blue
        case .accepted: return .indigo
        case .inProgress: return .purple
        case .completed: return .green
        case .cancelled: return .red
        }
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: dateString) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "MMM dd, HH:mm"
            return outputFormatter.string(from: date)
        }
        return dateString
    }
}
