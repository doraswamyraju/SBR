import SwiftUI
import MapKit

struct TrackedAgentInfo: Identifiable {
    let id: String // agent user id
    let agent: User
    let request: ServiceRequest
}

struct AdminMultiAgentMapView: View {
    @ObservedObject var requestVM: RequestViewModel
    @State private var selectedAgentInfo: TrackedAgentInfo? = nil
    
    // Bottom sheet drag state
    @State private var sheetHeight: CGFloat = 120
    @State private var dragOffset: CGFloat = 0
    
    // Map center coordinate/region state
    @State private var mapCenter = CLLocationCoordinate2D(latitude: 12.9716, longitude: 77.5946)
    @State private var mapSpan = MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    
    private var trackedAgents: [TrackedAgentInfo] {
        let activeRequests = requestVM.requests.filter({ $0.status == .accepted || $0.status == .inProgress })
        return activeRequests.compactMap { req -> TrackedAgentInfo? in
            guard let agent = req.assignedAgentId else { return nil }
            return TrackedAgentInfo(id: agent.id, agent: agent, request: req)
        }
    }
    
    var body: some View {
        GeometryReader { outerGeo in
            ZStack(alignment: .bottom) {
                // Map container using MKMultiAgentMapViewRepresentable
                MKMultiAgentMapViewRepresentable(
                    trackedAgents: trackedAgents,
                    center: $mapCenter,
                    span: $mapSpan,
                    selectedAgent: $selectedAgentInfo
                )
                .edgesIgnoringSafeArea(.all)
                
                // Bottom Sheet overlay replicating Compose BottomSheetScaffold peek height 110
                VStack(spacing: 0) {
                    // Draggable handle
                    Capsule()
                        .fill(Color.gray.opacity(0.4))
                        .frame(width: 40, height: 4)
                        .padding(.vertical, 8)
                    
                    Text("Active Agents")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                        .padding(.horizontal)
                        .padding(.bottom, 8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    if trackedAgents.isEmpty {
                        Spacer().frame(height: 10)
                        Text("No agents are currently on an active job.")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .padding(.bottom, 24)
                        Spacer()
                    } else {
                        ScrollView {
                            VStack(spacing: 12) {
                                ForEach(trackedAgents) { agentInfo in
                                    ActiveAgentRow(agentInfo: agentInfo) {
                                        // Center map on agent
                                        if let coord = getAgentCoordinate(agentInfo) {
                                            withAnimation(.easeInOut(duration: 0.8)) {
                                                mapCenter = coord
                                                mapSpan = MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
                                                selectedAgentInfo = agentInfo
                                                sheetHeight = 120 // Collapse to peek height on selection
                                            }
                                        }
                                    }
                                }
                            }
                            .padding(.horizontal)
                            .padding(.bottom, 24)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: sheetHeight)
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.12), radius: 8, x: 0, y: -3)
                .offset(y: dragOffset)
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            dragOffset = value.translation.height
                        }
                        .onEnded { value in
                            let targetHeight = sheetHeight - value.translation.height
                            let minHeight: CGFloat = 120
                            let maxHeight: CGFloat = outerGeo.size.height * 0.65
                            
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                if targetHeight < (minHeight + maxHeight) / 2 {
                                    sheetHeight = minHeight
                                } else {
                                    sheetHeight = maxHeight
                                }
                                dragOffset = 0
                            }
                        }
                )
            }
        }
        .background(SBRColors.background.ignoresSafeArea())
        .navigationTitle("All Active Agents")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            // Focus map on first agent if exists
            if let first = trackedAgents.first, let coord = getAgentCoordinate(first) {
                mapCenter = coord
            }
        }
    }
    
    private func getAgentCoordinate(_ agentInfo: TrackedAgentInfo) -> CLLocationCoordinate2D? {
        if let last = agentInfo.request.locationPath?.last {
            return CLLocationCoordinate2D(latitude: last.latitude, longitude: last.longitude)
        } else if let lat = agentInfo.agent.currentLat, let lng = agentInfo.agent.currentLng {
            return CLLocationCoordinate2D(latitude: lat, longitude: lng)
        }
        return nil
    }
}

// Active Agent Info Row matching AgentInfoRow on Android
struct ActiveAgentRow: View {
    let agentInfo: TrackedAgentInfo
    let onClick: () -> Void
    
    var body: some View {
        Button(action: onClick) {
            HStack(spacing: 16) {
                Image(systemName: "person.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.white)
                    .frame(width: 40, height: 40)
                    .background(SBRColors.primaryBlue)
                    .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(agentInfo.agent.name)
                        .font(.body)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                    
                    Text("On duty for: \(agentInfo.request.serviceType)")
                        .font(.footnote)
                        .foregroundColor(SBRColors.textSecondary)
                }
                
                Spacer()
                
                Image(systemName: "mappin.circle.fill")
                    .font(.title3)
                    .foregroundColor(SBRColors.primaryBlue)
            }
            .padding(12)
            .background(Color(red: 0.92, green: 0.93, blue: 0.96)) // surfaceVariant light gray style
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MKMapView wrapper mapping polyline paths and azure pins
struct MKMultiAgentMapViewRepresentable: UIViewRepresentable {
    let trackedAgents: [TrackedAgentInfo]
    @Binding var center: CLLocationCoordinate2D
    @Binding var span: MKCoordinateSpan
    @Binding var selectedAgent: TrackedAgentInfo?
    
    class Coordinator: NSObject, MKMapViewDelegate {
        var parent: MKMultiAgentMapViewRepresentable
        var lastSetCenter: CLLocationCoordinate2D? = nil
        
        init(_ parent: MKMultiAgentMapViewRepresentable) {
            self.parent = parent
        }
        
        // Custom renderer for path Polylines (yellow color)
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let polyline = overlay as? MKPolyline {
                let renderer = MKPolylineRenderer(polyline: polyline)
                renderer.strokeColor = .systemYellow
                renderer.lineWidth = 4
                return renderer
            }
            return MKOverlayRenderer(overlay: overlay)
        }
        
        // Custom markers
        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            guard !(annotation is MKUserLocation) else { return nil }
            let identifier = "AgentMarker"
            var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: identifier) as? MKMarkerAnnotationView
            if annotationView == nil {
                annotationView = MKMarkerAnnotationView(annotation: annotation, reuseIdentifier: identifier)
                annotationView?.canShowCallout = true
                annotationView?.markerTintColor = .systemTeal // Azure blue marker tint
                annotationView?.glyphImage = UIImage(systemName: "person.fill")
            } else {
                annotationView?.annotation = annotation
            }
            return annotationView
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        mapView.mapType = .standard
        return mapView
    }
    
    private func isValidCoordinate(_ coord: CLLocationCoordinate2D) -> Bool {
        return coord.latitude >= -90.0 && coord.latitude <= 90.0 &&
               coord.longitude >= -180.0 && coord.longitude <= 180.0 &&
               coord.latitude != 0.0 && coord.longitude != 0.0
    }
    
    func updateUIView(_ uiView: MKMapView, context: Context) {
        uiView.removeOverlays(uiView.overlays)
        uiView.removeAnnotations(uiView.annotations)
        
        for agentInfo in trackedAgents {
            let pathPoints = agentInfo.request.locationPath ?? []
            
            // Draw tracking history line
            if pathPoints.count >= 2 {
                let coords = pathPoints.map { CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) }
                    .filter { isValidCoordinate($0) }
                if coords.count >= 2 {
                    let polyline = MKPolyline(coordinates: coords, count: coords.count)
                    uiView.addOverlay(polyline)
                }
            }
            
            // Setup pin annotation
            let lastCoord: CLLocationCoordinate2D?
            if let last = pathPoints.last {
                lastCoord = CLLocationCoordinate2D(latitude: last.latitude, longitude: last.longitude)
            } else if let lat = agentInfo.agent.currentLat, let lng = agentInfo.agent.currentLng {
                lastCoord = CLLocationCoordinate2D(latitude: lat, longitude: lng)
            } else {
                lastCoord = nil
            }
            
            if let coord = lastCoord, isValidCoordinate(coord) {
                let annotation = MKPointAnnotation()
                annotation.title = agentInfo.agent.name
                annotation.subtitle = "On duty for: \(agentInfo.request.serviceType)"
                annotation.coordinate = coord
                uiView.addAnnotation(annotation)
            }
        }
        
        if isValidCoordinate(center) {
            let shouldUpdateRegion: Bool
            if let lastCenter = context.coordinator.lastSetCenter {
                shouldUpdateRegion = abs(lastCenter.latitude - center.latitude) > 0.0001 ||
                                     abs(lastCenter.longitude - center.longitude) > 0.0001
            } else {
                shouldUpdateRegion = true
            }
            
            if shouldUpdateRegion {
                context.coordinator.lastSetCenter = center
                let region = MKCoordinateRegion(center: center, span: span)
                uiView.setRegion(region, animated: true)
            }
        }
    }
}
