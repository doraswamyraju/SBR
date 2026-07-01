import SwiftUI

// SBR Theme Color Constants matching Android's custom colors exactly
struct SBRColors {
    static let primaryBlue = Color(red: 13/255, green: 27/255, blue: 79/255)   // Navy Blue `#0D1B4F`
    static let background = Color(red: 249/255, green: 250/255, blue: 251/255) // Off-white `#F9FAFB`
    static let cardBackground = Color.white                                    // Solid white for cards
    static let textPrimary = Color(red: 31/255, green: 41/255, blue: 55/255)   // Dark Charcoal `#1F2937`
    static let textSecondary = Color.gray                                      // Standard gray
}

// Reusable Navigation Drawer Layout replicating Android's ModalNavigationDrawer
struct SidebarNavigationLayout<Content: View, SectionType: Hashable>: View {
    let title: String
    let drawerHeader: String
    let sections: [SectionType]
    @Binding var selectedSection: SectionType
    let sectionTitle: (SectionType) -> String
    let sectionIcon: (SectionType) -> String
    @Binding var isDrawerOpen: Bool
    let onLogout: () -> Void
    var hasFab: Bool = false
    var onFabClick: (() -> Void)? = nil
    @ViewBuilder let content: () -> Content
    
    var body: some View {
        ZStack {
            // Main Content Area
            VStack(spacing: 0) {
                // TopAppBar (Solid Royal Blue, white controls/title)
                HStack(spacing: 16) {
                    // Back button shown when not on the primary screen
                    if selectedSection != sections.first {
                        Button(action: {
                            if let first = sections.first {
                                withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                    selectedSection = first
                                }
                            }
                        }) {
                            Image(systemName: "arrow.left")
                                .font(.title2)
                                .foregroundColor(.white)
                        }
                    }
                    
                    // Menu toggle drawer button (always visible)
                    Button(action: {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                            isDrawerOpen.toggle()
                        }
                    }) {
                        Image(systemName: "line.3.horizontal")
                            .font(.title2)
                            .foregroundColor(.white)
                    }
                    
                    // Logo next to toggle button on the left
                    Image("Logo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 32, height: 32)
                        .cornerRadius(6)
                        .background(Color.white.cornerRadius(6))
                    
                    Text(title)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    // Log out icon on the far right of the top bar
                    Button(action: {
                        onLogout()
                    }) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .font(.title3)
                            .foregroundColor(.white)
                    }
                }
                .padding()
                .background(SBRColors.primaryBlue)
                
                // Screen Body
                ZStack(alignment: .bottomTrailing) {
                    content()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(SBRColors.background)
                    
                    // Floating Action Button matching Android (Squircle FAB)
                    if hasFab, let onFabClick = onFabClick {
                        Button(action: onFabClick) {
                            Image(systemName: "plus")
                                .font(.title)
                                .foregroundColor(SBRColors.primaryBlue) // Dark blue icon
                                .frame(width: 56, height: 56)
                                .background(Color(red: 221/255, green: 225/255, blue: 255/255)) // Light blue container `#DDE1FF`
                                .clipShape(RoundedRectangle(cornerRadius: 16)) // Squircle shape matching Compose
                                .shadow(color: Color.black.opacity(0.12), radius: 4, x: 0, y: 2)
                        }
                        .padding(20)
                    }
                }
            }
            
            // Drawer Semi-Transparent Backdrop
            if isDrawerOpen {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                    .onTapGesture {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                            isDrawerOpen = false
                        }
                    }
            }
            
            // Left Drawer Menu
            GeometryReader { geometry in
                HStack(spacing: 0) {
                    VStack(alignment: .leading, spacing: 0) {
                        // Safe area top spacer to prevent status bar cut-offs
                        Spacer()
                            .frame(height: max(geometry.safeAreaInsets.top, 44))
                        
                        // Drawer Header Banner matching Android title style
                        VStack(alignment: .leading, spacing: 8) {
                            Text(drawerHeader)
                                .font(.title2)
                                .fontWeight(.black)
                                .foregroundColor(SBRColors.primaryBlue)
                            
                            Divider()
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 12)
                        
                        // Scrollable List of Sections
                        ScrollView {
                            VStack(alignment: .leading, spacing: 4) {
                                ForEach(sections, id: \.self) { section in
                                    Button(action: {
                                        selectedSection = section
                                        withAnimation {
                                            isDrawerOpen = false
                                        }
                                    }) {
                                        HStack(spacing: 16) {
                                            Image(systemName: sectionIcon(section))
                                                .font(.system(size: 18, weight: .semibold))
                                                .foregroundColor(selectedSection == section ? SBRColors.primaryBlue : .gray)
                                                .frame(width: 24)
                                            
                                            Text(sectionTitle(section))
                                                .fontWeight(selectedSection == section ? .bold : .medium)
                                                .foregroundColor(selectedSection == section ? SBRColors.primaryBlue : SBRColors.textPrimary)
                                        }
                                        .padding(.vertical, 14)
                                        .padding(.horizontal, 16)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .background(selectedSection == section ? SBRColors.primaryBlue.opacity(0.08) : Color.clear)
                                        .cornerRadius(8)
                                    }
                                    .padding(.horizontal, 10)
                                }
                            }
                        }
                        
                        Spacer()
                        
                        // Drawer Footer Logout Button
                        Button(action: {
                            onLogout()
                            withAnimation {
                                isDrawerOpen = false
                            }
                        }) {
                            HStack(spacing: 16) {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(.red)
                                
                                Text("Logout")
                                    .fontWeight(.bold)
                                    .foregroundColor(.red)
                            }
                            .padding(.vertical, 14)
                            .padding(.horizontal, 20)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.red.opacity(0.06))
                        }
                        .padding(.bottom, geometry.safeAreaInsets.bottom + 10)
                    }
                    .frame(width: 280)
                    .background(Color.white) // Force light background so text is always readable
                    .shadow(color: Color.black.opacity(0.12), radius: 8, x: 4, y: 0)
                    .offset(x: isDrawerOpen ? 0 : -280)
                    
                    Spacer()
                }
            }
            .ignoresSafeArea()
        }
    }
}

// Summary Card aligned with Android's primary/secondary colored cards
struct SummaryCard: View {
    let title: String
    let value: String
    var isPrimary: Bool = true
    var action: (() -> Void)? = nil
    
    var body: some View {
        let cardContent = VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(isPrimary ? .white : SBRColors.textPrimary)
                .lineLimit(2)
                .multilineTextAlignment(.leading)
            
            Spacer(minLength: 4)
            
            Text(value)
                .font(.title)
                .fontWeight(.black)
                .foregroundColor(isPrimary ? .white : SBRColors.textPrimary)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .frame(height: 110)
        .background(isPrimary ? SBRColors.primaryBlue : Color(red: 0.9, green: 0.92, blue: 0.96))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
        
        return Group {
            if let action = action {
                Button(action: action) {
                    cardContent
                }
                .buttonStyle(PlainButtonStyle())
            } else {
                cardContent
            }
        }
    }
}

// Request Row item aligned with Android's SurfaceVariant list cards
struct RequestRow: View {
    let request: ServiceRequest
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: serviceIcon(for: request.serviceType))
                .font(.title3)
                .foregroundColor(statusColor(for: request.status))
                .frame(width: 44, height: 44)
                .background(statusColor(for: request.status).opacity(0.1))
                .cornerRadius(10)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(request.serviceType)
                    .font(.body)
                    .fontWeight(.bold)
                    .foregroundColor(SBRColors.textPrimary)
                
                Text(request.customerAddress)
                    .font(.caption)
                    .foregroundColor(SBRColors.textSecondary)
                    .lineLimit(1)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 6) {
                Text(request.status.rawValue)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusColor(for: request.status).opacity(0.15))
                    .foregroundColor(statusColor(for: request.status))
                    .cornerRadius(6)
                
                Text(formatDate(request.createdAt))
                    .font(.caption2)
                    .foregroundColor(SBRColors.textSecondary)
            }
        }
        .padding(16)
        .background(SBRColors.cardBackground)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.1), lineWidth: 1)
        )
    }
    
    private func serviceIcon(for type: String) -> String {
        switch type {
        case "Solar Water Heaters": return "sun.max.fill"
        case "HM Hard Water Scalenors": return "drop.triangle.fill"
        case "Automatic Water Softeners": return "drop.fill"
        case "RO Water Plant Maintenance": return "arrow.3.circlepath"
        case "Domestic RO Purifier Service": return "circle.grid.2x1.fill"
        case "Solar Power Systems Maintenance": return "bolt.fill"
        case "Heat Pumps Repairs": return "thermometer"
        default: return "wrench.and.screwdriver.fill"
        }
    }
    
    private func statusColor(for status: RequestStatus) -> Color {
        switch status {
        case .pending: return .orange
        case .assigned: return .blue
        case .accepted: return .indigo
        case .inProgress: return .purple
        case .completed: return .green
        case .cancelled: return .red
        case .paid: return .green
        }
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: dateString) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateStyle = .short
            outputFormatter.timeStyle = .none
            return outputFormatter.string(from: date)
        }
        return String(dateString.prefix(10))
    }
}

struct GeminiGlowOutlineButton: View {
    let title: String
    let icon: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [
                                Color(red: 0.25, green: 0.45, blue: 0.95),
                                Color(red: 0.58, green: 0.35, blue: 0.95),
                                Color(red: 0.88, green: 0.35, blue: 0.65)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                
                Text(title)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [
                                Color(red: 0.25, green: 0.45, blue: 0.95),
                                Color(red: 0.58, green: 0.35, blue: 0.95),
                                Color(red: 0.88, green: 0.35, blue: 0.65)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
            }
            .padding(.vertical, 12)
            .padding(.horizontal, 20)
            .frame(maxWidth: .infinity)
            .background(Color.white)
            .cornerRadius(10)
            .shadow(color: Color(red: 0.58, green: 0.35, blue: 0.95).opacity(0.35), radius: 6, x: 0, y: 3)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(
                        LinearGradient(
                            colors: [
                                Color(red: 0.25, green: 0.45, blue: 0.95),
                                Color(red: 0.58, green: 0.35, blue: 0.95),
                                Color(red: 0.88, green: 0.35, blue: 0.65)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        lineWidth: 2
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

