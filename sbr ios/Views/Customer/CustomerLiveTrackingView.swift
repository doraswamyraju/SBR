import SwiftUI
import MapKit

struct CustomerLiveTrackingView: View {
    @Environment(\.dismiss) var dismiss
    let request: ServiceRequest
    
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 12.9716, longitude: 77.5946),
        span: MKCoordinateSpan(latitudeDelta: 0.02, longitudeDelta: 0.02)
    )
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if let agent = request.assignedAgentId {
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
                        if let lat = agent.currentLat, let lng = agent.currentLng {
                            region.center = CLLocationCoordinate2D(latitude: lat, longitude: lng)
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
                            Label("Job Status: \(request.status.rawValue)", systemImage: "info.circle")
                            Spacer()
                            Text("Mode: Real-time GPS Track")
                        }
                        .font(.footnote)
                        .foregroundColor(.gray)
                    }
                    .padding()
                    .background(Color(red: 0.08, green: 0.08, blue: 0.12))
                } else {
                    Box(modifier: Modifier.fillMaxSize(), contentAlignment: Alignment.Center) {
                        Text("No active tracking available. Wait for a technician assignment.")
                            .foregroundColor(.gray)
                    }
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
    
    private func getAnnotations(agent: User) -> [MapAnnotationItem] {
        var items: [MapAnnotationItem] = []
        
        // Agent Location Pin
        if let lat = agent.currentLat, let lng = agent.currentLng {
            items.append(MapAnnotationItem(
                id: "agent",
                label: "Agent: \(agent.name)",
                coordinate: CLLocationCoordinate2D(latitude: lat, longitude: lng),
                iconName: "car.circle.fill",
                tint: .green
            ))
        }
        
        // Customer Location Pin
        // Parse request coordinates or fallback to Bangalore default for map safety
        items.append(MapAnnotationItem(
            id: "customer",
            label: "My Address",
            coordinate: CLLocationCoordinate2D(latitude: 12.9716, longitude: 77.5946),
            iconName: "house.circle.fill",
            tint: .blue
        ))
        
        return items
    }
}
