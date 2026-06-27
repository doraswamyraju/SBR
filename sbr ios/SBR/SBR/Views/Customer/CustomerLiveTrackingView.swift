import SwiftUI
import MapKit
import Combine

struct CustomerLiveTrackingView: View {
    @Environment(\.dismiss) var dismiss
    @State private var currentRequest: ServiceRequest
    @State private var customerCoordinate: CLLocationCoordinate2D? = nil
    
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 12.9716, longitude: 77.5946),
        span: MKCoordinateSpan(latitudeDelta: 0.02, longitudeDelta: 0.02)
    )
    
    private let timer = Timer.publish(every: 10, on: .main, in: .common).autoconnect()
    
    init(request: ServiceRequest) {
        _currentRequest = State(initialValue: request)
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if let agent = currentRequest.assignedAgentId {
                    Map(coordinateRegion: $region, annotationItems: getAnnotations(agent: agent)) { item in
                        MapAnnotation(coordinate: item.coordinate) {
                            VStack(spacing: 4) {
                                Image(systemName: item.iconName)
                                    .font(.title2)
                                    .foregroundColor(item.tint)
                                    .background(Color.white.clipShape(Circle()))
                                Text(item.label)
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .padding(4)
                                    .background(Color.black.opacity(0.8))
                                    .foregroundColor(.white)
                                    .cornerRadius(4)
                            }
                        }
                    }
                    .onAppear {
                        geocodeAddress()
                        centerMapOnAgent(agent: agent)
                        Task {
                            await refreshRequest()
                        }
                    }
                    .onReceive(timer) { _ in
                        Task {
                            await refreshRequest()
                        }
                    }
                    
                    // Agent Quick Details Panel
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Image(systemName: "person.crop.circle.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.indigo)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(agent.name)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                Text("Field Service Representative")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            
                            Spacer()
                            
                            if let phone = agent.phone {
                                Button(action: {
                                    if let url = URL(string: "tel:\(phone)") {
                                        UIApplication.shared.open(url)
                                    }
                                }) {
                                    Image(systemName: "phone.circle.fill")
                                        .font(.title)
                                        .foregroundColor(.green)
                                }
                            }
                        }
                        
                        Divider().background(Color.white.opacity(0.1))
                        
                        HStack {
                            Label("Job Status: \(currentRequest.status.rawValue)", systemImage: "info.circle")
                            Spacer()
                            Text("Mode: Real-time GPS Track")
                        }
                        .font(.footnote)
                        .foregroundColor(.gray)
                    }
                    .padding()
                    .background(Color(red: 0.08, green: 0.08, blue: 0.12))
                } else {
                    ZStack {
                        Color.clear
                        Text("No active tracking available. Wait for a technician assignment.")
                            .foregroundColor(.gray)
                            .multilineTextAlignment(.center)
                            .padding()
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .navigationTitle("Track Technician")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
    
    private struct MapAnnotationItem: Identifiable {
        let id: String
        let label: String
        let coordinate: CLLocationCoordinate2D
        let iconName: String
        let tint: Color
    }
    
    private func isValidCoordinate(_ coord: CLLocationCoordinate2D) -> Bool {
        return coord.latitude >= -90.0 && coord.latitude <= 90.0 &&
               coord.longitude >= -180.0 && coord.longitude <= 180.0 &&
               coord.latitude != 0.0 && coord.longitude != 0.0
    }
    
    private func getAnnotations(agent: User) -> [MapAnnotationItem] {
        var items: [MapAnnotationItem] = []
        
        // Agent Location Pin
        let lastCoord: CLLocationCoordinate2D?
        if let last = currentRequest.locationPath?.last {
            lastCoord = CLLocationCoordinate2D(latitude: last.latitude, longitude: last.longitude)
        } else if let lat = agent.currentLat, let lng = agent.currentLng {
            lastCoord = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        } else {
            lastCoord = nil
        }
        
        if let coord = lastCoord, isValidCoordinate(coord) {
            items.append(MapAnnotationItem(
                id: "agent",
                label: "Agent: \(agent.name)",
                coordinate: coord,
                iconName: "car.circle.fill",
                tint: .green
            ))
        }
        
        // Customer Location Pin
        if let customerCoord = customerCoordinate {
            items.append(MapAnnotationItem(
                id: "customer",
                label: "My Address",
                coordinate: customerCoord,
                iconName: "house.circle.fill",
                tint: .blue
            ))
        }
        
        return items
    }
    
    private func geocodeAddress() {
        let address = currentRequest.customerAddress
        CLGeocoder().geocodeAddressString(address) { placemarks, error in
            if let coord = placemarks?.first?.location?.coordinate, isValidCoordinate(coord) {
                DispatchQueue.main.async {
                    self.customerCoordinate = coord
                }
            }
        }
    }
    
    private func centerMapOnAgent(agent: User) {
        let lastCoord: CLLocationCoordinate2D?
        if let last = currentRequest.locationPath?.last {
            lastCoord = CLLocationCoordinate2D(latitude: last.latitude, longitude: last.longitude)
        } else if let lat = agent.currentLat, let lng = agent.currentLng {
            lastCoord = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        } else {
            lastCoord = nil
        }
        if let coord = lastCoord, isValidCoordinate(coord) {
            region.center = coord
        }
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
                    self.currentRequest = updatedReq
                    if let agent = updatedReq.assignedAgentId {
                        centerMapOnAgent(agent: agent)
                    }
                }
            }
        } catch {
            print("Failed to refresh tracking location: \(error.localizedDescription)")
        }
    }
}
