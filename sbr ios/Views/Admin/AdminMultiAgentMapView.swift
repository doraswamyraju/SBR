import SwiftUI
import MapKit

struct AgentAnnotationItem: Identifiable {
    let id: String
    let name: String
    let coordinate: CLLocationCoordinate2D
}

struct AdminMultiAgentMapView: View {
    @Environment(\.dismiss) var dismiss
    let agents: [User]
    
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 12.9716, longitude: 77.5946),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )
    
    var body: some View {
        NavigationView {
            Map(coordinateRegion: $region, annotationItems: getAnnotations()) { agent in
                MapAnnotation(coordinate: agent.coordinate) {
                    VStack(spacing: 4) {
                        Image(systemName: "person.circle.fill")
                            .font(.title)
                            .foregroundColor(.green)
                            .background(Color.white.clipShape(Circle()))
                        Text(agent.name)
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(4)
                            .background(Color.black.opacity(0.75))
                            .foregroundColor(.white)
                            .cornerRadius(4)
                    }
                }
            }
            .navigationTitle("Live Field Dispatch")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Dismiss") { dismiss() }
                }
            }
            .onAppear {
                let activeAnnotations = getAnnotations()
                if let first = activeAnnotations.first {
                    region.center = first.coordinate
                }
            }
        }
    }
    
    private func getAnnotations() -> [AgentAnnotationItem] {
        agents.compactMap { agent -> AgentAnnotationItem? in
            guard let lat = agent.currentLat, let lng = agent.currentLng else { return nil }
            return AgentAnnotationItem(
                id: agent.id,
                name: agent.name,
                coordinate: CLLocationCoordinate2D(latitude: lat, longitude: lng)
            )
        }
    }
}
