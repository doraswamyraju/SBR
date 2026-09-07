import SwiftUI
import MapKit
import Combine
import CoreLocation

struct CustomerLiveTrackingView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authVM: AuthViewModel
    @State private var currentRequest: ServiceRequest
    @State private var customerCoordinate: CLLocationCoordinate2D? = nil
    @State private var routeDistance: String? = nil
    @State private var routeEta: String? = nil
    @State private var isGeocoding = false
    @State private var mapRecenterTrigger: UUID = UUID()
    
    // Fast 3-second live polling timer for instant real-time tracking
    private let timer = Timer.publish(every: 3, on: .main, in: .common).autoconnect()
    
    init(request: ServiceRequest) {
        _currentRequest = State(initialValue: request)
    }
    
    private var agentCoordinate: CLLocationCoordinate2D? {
        if let last = currentRequest.locationPath?.last {
            return CLLocationCoordinate2D(latitude: last.latitude, longitude: last.longitude)
        } else if let agent = currentRequest.assignedAgentId, let lat = agent.currentLat, let lng = agent.currentLng {
            return CLLocationCoordinate2D(latitude: lat, longitude: lng)
        }
        return nil
    }
    
    var body: some View {
        NavigationView {
            ZStack(alignment: .bottom) {
                if currentRequest.assignedAgentId != nil {
                    // Live Route Map with Driving Polyline & Annotations
                    AgentMKRouteMapView(
                        agentCoordinate: agentCoordinate,
                        customerCoordinate: customerCoordinate,
                        customerName: currentRequest.customerId?.name ?? "Customer",
                        customerAddress: currentRequest.customerAddress,
                        isNavigating: false,
                        recenterTrigger: mapRecenterTrigger,
                        onRouteCalculated: { distance, eta, _ in
                            self.routeDistance = distance
                            self.routeEta = eta
                        }
                    )
                    .edgesIgnoringSafeArea(.all)
                    
                    // Top Live Status & Metrics Bar
                    VStack(spacing: 8) {
                        HStack {
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(Color.green)
                                    .frame(width: 9, height: 9)
                                    .overlay(
                                        Circle()
                                            .stroke(Color.green.opacity(0.4), lineWidth: 4)
                                            .scaleEffect(1.4)
                                    )
                                Text("LIVE GPS TRACKING")
                                    .font(.caption2)
                                    .fontWeight(.heavy)
                                    .foregroundColor(.white)
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.black.opacity(0.75))
                            .clipShape(Capsule())
                            
                            Spacer()
                            
                            // Recenter Map
                            Button(action: {
                                mapRecenterTrigger = UUID()
                            }) {
                                Image(systemName: "location.north.line.fill")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.white)
                                    .padding(10)
                                    .background(Color.black.opacity(0.75))
                                    .clipShape(Circle())
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                        
                        // ETA & Distance Badge
                        if let eta = routeEta, let distance = routeDistance {
                            HStack(spacing: 12) {
                                HStack(spacing: 6) {
                                    Image(systemName: "bolt.car.fill")
                                        .foregroundColor(.yellow)
                                    Text("ETA: \(eta)")
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                }
                                
                                Divider()
                                    .frame(height: 16)
                                    .background(Color.white.opacity(0.4))
                                
                                HStack(spacing: 6) {
                                    Image(systemName: "arrow.triangle.swap")
                                        .foregroundColor(.cyan)
                                    Text(distance)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                }
                            }
                            .font(.subheadline)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(
                                LinearGradient(
                                    colors: [Color(red: 0.1, green: 0.2, blue: 0.4), Color(red: 0.05, green: 0.1, blue: 0.25)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(14)
                            .shadow(color: Color.black.opacity(0.3), radius: 6, x: 0, y: 3)
                            .padding(.horizontal, 16)
                            .transition(.scale.combined(with: .opacity))
                        }
                        
                        Spacer()
                    }
                    
                    // Bottom Details & Contact Panel
                    bottomTrackingPanel
                } else {
                    ZStack {
                        Color(red: 0.96, green: 0.97, blue: 0.99).edgesIgnoringSafeArea(.all)
                        VStack(spacing: 12) {
                            Image(systemName: "location.slash.fill")
                                .font(.system(size: 48))
                                .foregroundColor(.gray)
                            Text("No active technician assigned yet.")
                                .font(.headline)
                                .foregroundColor(SBRColors.textPrimary)
                            Text("Live GPS tracking will activate once a technician is assigned to this service request.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 32)
                        }
                    }
                }
            }
            .navigationTitle("Live Tracking")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .onAppear {
                resolveCustomerLocation()
                Task { await refreshRequest() }
            }
            .onReceive(timer) { _ in
                Task { await refreshRequest() }
            }
        }
    }
    
    // MARK: - Role-Aware Bottom Panel
    private var bottomTrackingPanel: some View {
        VStack(spacing: 12) {
            Capsule()
                .fill(Color.gray.opacity(0.4))
                .frame(width: 40, height: 4)
                .padding(.top, 8)
            
            if let agent = currentRequest.assignedAgentId {
                // Agent Card
                HStack(alignment: .center, spacing: 12) {
                    Image(systemName: "person.crop.circle.fill")
                        .font(.system(size: 42))
                        .foregroundColor(.blue)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(agent.name)
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textPrimary)
                        Text(agent.specialization ?? "Field Service Representative")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        HStack(spacing: 6) {
                            Circle().fill(Color.green).frame(width: 6, height: 6)
                            Text("Status: \(currentRequest.status.rawValue)")
                                .font(.caption2)
                                .fontWeight(.semibold)
                                .foregroundColor(.green)
                        }
                    }
                    
                    Spacer()
                    
                    if let phone = agent.phone, !phone.isEmpty {
                        Button(action: {
                            if let url = URL(string: "tel:\(phone)") {
                                UIApplication.shared.open(url)
                            }
                        }) {
                            VStack(spacing: 2) {
                                Image(systemName: "phone.fill")
                                    .font(.subheadline)
                                Text("Call Agent")
                                    .font(.system(size: 9, weight: .bold))
                            }
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.green)
                            .cornerRadius(10)
                            .shadow(color: Color.green.opacity(0.3), radius: 3, x: 0, y: 2)
                        }
                    }
                }
                .padding(.horizontal)
            }
            
            // Customer & Address Details (Detailed view for Admin / Store Incharge)
            if authVM.user?.role == .admin || authVM.user?.role == .storeIncharge {
                Divider().padding(.horizontal)
                
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "house.fill")
                        .font(.title3)
                        .foregroundColor(.indigo)
                        .frame(width: 32)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Customer: \(currentRequest.customerId?.name ?? "Client")")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(SBRColors.textPrimary)
                        Text(currentRequest.customerAddress)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                    
                    Spacer()
                    
                    if let custPhone = currentRequest.customerId?.phone, !custPhone.isEmpty {
                        Button(action: {
                            if let url = URL(string: "tel:\(custPhone)") {
                                UIApplication.shared.open(url)
                            }
                        }) {
                            VStack(spacing: 2) {
                                Image(systemName: "phone.fill")
                                    .font(.subheadline)
                                Text("Call Customer")
                                    .font(.system(size: 9, weight: .bold))
                            }
                            .foregroundColor(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .background(Color.blue)
                            .cornerRadius(10)
                        }
                    }
                }
                .padding(.horizontal)
            } else {
                // Customer-facing Destination view
                HStack(spacing: 8) {
                    Image(systemName: "mappin.circle.fill")
                        .foregroundColor(.red)
                    Text("Destination: \(currentRequest.customerAddress)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                    Spacer()
                }
                .padding(.horizontal)
            }
        }
        .padding(.bottom, 16)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: -4)
        )
    }
    
    // Resolve Customer Coordinates
    private func resolveCustomerLocation() {
        if let lat = currentRequest.latitude, let lng = currentRequest.longitude, isValidCoordinate(lat: lat, lng: lng) {
            self.customerCoordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
            return
        }
        
        isGeocoding = true
        CLGeocoder().geocodeAddressString(currentRequest.customerAddress) { placemarks, _ in
            DispatchQueue.main.async {
                self.isGeocoding = false
                if let coord = placemarks?.first?.location?.coordinate, isValidCoordinate(lat: coord.latitude, lng: coord.longitude) {
                    self.customerCoordinate = coord
                }
            }
        }
    }
    
    private func isValidCoordinate(lat: Double, lng: Double) -> Bool {
        return lat >= -90.0 && lat <= 90.0 && lng >= -180.0 && lng <= 180.0 && lat != 0.0 && lng != 0.0
    }
    
    private func refreshRequest() async {
        do {
            struct SingleRequestResponse: Decodable {
                let success: Bool
                let data: ServiceRequest?
            }
            let res = try await APIClient.shared.get(
                endpoint: "api/requests/\(currentRequest.id)",
                responseType: SingleRequestResponse.self
            )
            if res.success, let updatedReq = res.data {
                await MainActor.run {
                    withAnimation(.easeInOut(duration: 0.5)) {
                        self.currentRequest = updatedReq
                    }
                }
            }
        } catch {
            print("Failed to refresh tracking location: \(error.localizedDescription)")
        }
    }
}
