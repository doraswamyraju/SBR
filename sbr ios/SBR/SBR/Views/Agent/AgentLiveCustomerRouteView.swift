import SwiftUI
import MapKit
import CoreLocation

// MARK: - Swiggy / Rapido Style Live Customer Route & Navigation View
struct AgentLiveCustomerRouteView: View {
    @Environment(\.dismiss) var dismiss
    let job: ServiceRequest
    @ObservedObject var requestVM: RequestViewModel
    
    @State private var customerCoordinate: CLLocationCoordinate2D? = nil
    @State private var routeDistance: String? = nil
    @State private var routeEta: String? = nil
    @State private var routeCalculated = false
    @State private var isGeocoding = false
    @State private var mapRecenterTrigger: UUID = UUID()
    @State private var showingNavigationPicker = false
    
    private var agentCoordinate: CLLocationCoordinate2D? {
        requestVM.locationManager.lastLocation?.coordinate
    }
    
    var body: some View {
        NavigationView {
            ZStack(alignment: .bottom) {
                // Main Map with Live Polyline & Annotations
                AgentMKRouteMapView(
                    agentCoordinate: agentCoordinate,
                    customerCoordinate: customerCoordinate,
                    customerName: job.customerId?.name ?? "Customer",
                    customerAddress: job.customerAddress,
                    recenterTrigger: mapRecenterTrigger,
                    onRouteCalculated: { distance, eta in
                        self.routeDistance = distance
                        self.routeEta = eta
                        self.routeCalculated = true
                    }
                )
                .edgesIgnoringSafeArea(.all)
                
                // Top Live Tracking HUD Overlay
                VStack(spacing: 8) {
                    HStack {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(Color.green)
                                .frame(width: 10, height: 10)
                                .overlay(
                                    Circle()
                                        .stroke(Color.green.opacity(0.4), lineWidth: 4)
                                        .scaleEffect(1.4)
                                )
                            Text("LIVE GPS ROUTE")
                                .font(.caption2)
                                .fontWeight(.heavy)
                                .foregroundColor(.white)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.black.opacity(0.75))
                        .clipShape(Capsule())
                        
                        Spacer()
                        
                        // Recenter Map Button
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
                    
                    // Route ETA & Distance Banner
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
                                Text("\(distance)")
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
                
                // Bottom Customer Navigation Drawer
                VStack(spacing: 14) {
                    // Grabber handle
                    Capsule()
                        .fill(Color.gray.opacity(0.4))
                        .frame(width: 40, height: 4)
                        .padding(.top, 8)
                    
                    // Customer Info & Service Type
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "house.fill")
                            .font(.title2)
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(Color.blue)
                            .clipShape(Circle())
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(job.customerId?.name ?? "Customer")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(SBRColors.textPrimary)
                            
                            Text(job.serviceType)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.indigo)
                            
                            Text(job.customerAddress)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        }
                        
                        Spacer()
                        
                        if let phone = job.customerId?.phone, !phone.isEmpty {
                            Button(action: {
                                if let url = URL(string: "tel:\(phone)") {
                                    UIApplication.shared.open(url)
                                }
                            }) {
                                Image(systemName: "phone.fill")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .frame(width: 42, height: 42)
                                    .background(Color.green)
                                    .clipShape(Circle())
                                    .shadow(color: Color.green.opacity(0.3), radius: 4, x: 0, y: 2)
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    // Allocated Spares Badge (if any)
                    if let comps = job.requiredComponents, !comps.isEmpty {
                        HStack {
                            Image(systemName: "shippingbox.fill")
                                .foregroundColor(.orange)
                            Text("\(comps.count) Spare part(s) allocated")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(SBRColors.textPrimary)
                            Spacer()
                            if let total = job.inventoryTotal, total > 0 {
                                Text("₹\(Int(total))")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.orange)
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(8)
                        .padding(.horizontal)
                    }
                    
                    // Primary Navigation Actions
                    HStack(spacing: 12) {
                        Button(action: {
                            openTurnByTurnNavigation()
                        }) {
                            HStack(spacing: 8) {
                                Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                                    .font(.title3)
                                Text("Start Navigation")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                LinearGradient(
                                    colors: [Color.blue, Color.indigo],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(12)
                            .shadow(color: Color.blue.opacity(0.3), radius: 5, x: 0, y: 2)
                        }
                        
                        if let phone = job.customerId?.phone, !phone.isEmpty {
                            Button(action: {
                                if let url = URL(string: "tel:\(phone)") {
                                    UIApplication.shared.open(url)
                                }
                            }) {
                                HStack(spacing: 6) {
                                    Image(systemName: "phone.fill")
                                    Text("Call")
                                        .fontWeight(.bold)
                                }
                                .font(.subheadline)
                                .foregroundColor(.green)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 14)
                                .background(Color.green.opacity(0.12))
                                .cornerRadius(12)
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 12)
                }
                .background(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(Color.white)
                        .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: -4)
                )
            }
            .navigationTitle("Live Customer Route")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: openTurnByTurnNavigation) {
                        Label("Maps", systemImage: "map.fill")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                    }
                }
            }
            .onAppear {
                resolveCustomerLocation()
                requestVM.locationManager.requestPermission()
                if let jobId = job.id as String? {
                    requestVM.startLocationTracking(activeRequestId: jobId)
                }
            }
        }
    }
    
    // Resolve Customer Coordinates (from lat/lng or via Geocoder)
    private func resolveCustomerLocation() {
        if let lat = job.latitude, let lng = job.longitude, isValidCoordinate(lat: lat, lng: lng) {
            self.customerCoordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
            return
        }
        
        isGeocoding = true
        CLGeocoder().geocodeAddressString(job.customerAddress) { placemarks, error in
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
    
    // Open Apple Maps or Google Maps for turn-by-turn navigation
    private func openTurnByTurnNavigation() {
        guard let dest = customerCoordinate else {
            // Fallback to address search if no coordinates
            let encodedAddress = job.customerAddress.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
            if let url = URL(string: "http://maps.apple.com/?daddr=\(encodedAddress)&dirflg=d") {
                UIApplication.shared.open(url)
            }
            return
        }
        
        let appleMapsURL = URL(string: "http://maps.apple.com/?daddr=\(dest.latitude),\(dest.longitude)&dirflg=d")
        let googleMapsURL = URL(string: "comgooglemaps://?daddr=\(dest.latitude),\(dest.longitude)&directionsmode=driving")
        
        if let gUrl = googleMapsURL, UIApplication.shared.canOpenURL(gUrl) {
            UIApplication.shared.open(gUrl)
        } else if let aUrl = appleMapsURL {
            UIApplication.shared.open(aUrl)
        }
    }
}

// MARK: - Embedded Swiggy / Rapido Style Mini Route Card for Active Service View
struct AgentRouteMapCardView: View {
    let job: ServiceRequest
    @ObservedObject var requestVM: RequestViewModel
    let onExpandFullScreen: () -> Void
    
    @State private var customerCoordinate: CLLocationCoordinate2D? = nil
    @State private var routeDistance: String? = nil
    @State private var routeEta: String? = nil
    
    private var agentCoordinate: CLLocationCoordinate2D? {
        requestVM.locationManager.lastLocation?.coordinate
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Top Status Header
            HStack {
                HStack(spacing: 6) {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 8, height: 8)
                    Text("LIVE NAVIGATION")
                        .font(.caption2)
                        .fontWeight(.heavy)
                        .foregroundColor(.green)
                }
                
                Spacer()
                
                if let eta = routeEta, let distance = routeDistance {
                    Text("⏱ \(eta) (\(distance))")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.textPrimary)
                }
                
                Button(action: onExpandFullScreen) {
                    Image(systemName: "arrow.up.left.and.arrow.down.right")
                        .font(.caption)
                        .foregroundColor(.blue)
                        .padding(4)
                        .background(Color.blue.opacity(0.1))
                        .clipShape(Circle())
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color(red: 0.95, green: 0.97, blue: 1.0))
            
            // Interactive Map Preview (tap to expand)
            ZStack(alignment: .bottomTrailing) {
                AgentMKRouteMapView(
                    agentCoordinate: agentCoordinate,
                    customerCoordinate: customerCoordinate,
                    customerName: job.customerId?.name ?? "Customer",
                    customerAddress: job.customerAddress,
                    recenterTrigger: UUID(),
                    onRouteCalculated: { distance, eta in
                        self.routeDistance = distance
                        self.routeEta = eta
                    }
                )
                .frame(height: 180)
                .allowsHitTesting(false)
                
                // Overlay Tap Area to expand
                Color.clear
                    .contentShape(Rectangle())
                    .onTapGesture {
                        onExpandFullScreen()
                    }
                
                // One-tap Turn-by-turn Navigation button
                Button(action: {
                    openTurnByTurnNavigation()
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "location.fill")
                        Text("Start GPS")
                            .fontWeight(.bold)
                    }
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.blue)
                    .cornerRadius(8)
                    .shadow(color: Color.black.opacity(0.2), radius: 3, x: 0, y: 1)
                }
                .padding(10)
            }
            
            // Bottom Quick Action Buttons
            HStack(spacing: 10) {
                Button(action: {
                    openTurnByTurnNavigation()
                }) {
                    Label("Navigate (Turn-by-Turn)", systemImage: "arrow.triangle.turn.up.right.diamond.fill")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 9)
                        .background(Color.blue)
                        .cornerRadius(8)
                }
                
                Button(action: onExpandFullScreen) {
                    Label("Full Route", systemImage: "map.fill")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.primaryBlue)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 9)
                        .background(SBRColors.primaryBlue.opacity(0.12))
                        .cornerRadius(8)
                }
            }
            .padding(10)
            .background(Color.white)
        }
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.blue.opacity(0.2), lineWidth: 1.5)
        )
        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 2)
        .onAppear {
            resolveCustomerLocation()
        }
    }
    
    private func resolveCustomerLocation() {
        if let lat = job.latitude, let lng = job.longitude, isValidCoordinate(lat: lat, lng: lng) {
            self.customerCoordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
            return
        }
        
        CLGeocoder().geocodeAddressString(job.customerAddress) { placemarks, _ in
            DispatchQueue.main.async {
                if let coord = placemarks?.first?.location?.coordinate, isValidCoordinate(lat: coord.latitude, lng: coord.longitude) {
                    self.customerCoordinate = coord
                }
            }
        }
    }
    
    private func isValidCoordinate(lat: Double, lng: Double) -> Bool {
        return lat >= -90.0 && lat <= 90.0 && lng >= -180.0 && lng <= 180.0 && lat != 0.0 && lng != 0.0
    }
    
    private func openTurnByTurnNavigation() {
        guard let dest = customerCoordinate else {
            let encoded = job.customerAddress.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
            if let url = URL(string: "http://maps.apple.com/?daddr=\(encoded)&dirflg=d") {
                UIApplication.shared.open(url)
            }
            return
        }
        
        let appleMapsURL = URL(string: "http://maps.apple.com/?daddr=\(dest.latitude),\(dest.longitude)&dirflg=d")
        let googleMapsURL = URL(string: "comgooglemaps://?daddr=\(dest.latitude),\(dest.longitude)&directionsmode=driving")
        
        if let gUrl = googleMapsURL, UIApplication.shared.canOpenURL(gUrl) {
            UIApplication.shared.open(gUrl)
        } else if let aUrl = appleMapsURL {
            UIApplication.shared.open(aUrl)
        }
    }
}

// MARK: - UIViewRepresentable MKMapView with Real Route Polyline and Custom Annotations
struct AgentMKRouteMapView: UIViewRepresentable {
    let agentCoordinate: CLLocationCoordinate2D?
    let customerCoordinate: CLLocationCoordinate2D?
    let customerName: String
    let customerAddress: String
    let recenterTrigger: UUID
    let onRouteCalculated: ((String, String) -> Void)?
    
    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        mapView.showsUserLocation = false
        mapView.showsCompass = true
        mapView.showsScale = true
        return mapView
    }
    
    func updateUIView(_ mapView: MKMapView, context: Context) {
        context.coordinator.parent = self
        context.coordinator.updateMap(mapView)
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, MKMapViewDelegate {
        var parent: AgentMKRouteMapView
        private var lastAgentCoord: CLLocationCoordinate2D?
        private var lastCustomerCoord: CLLocationCoordinate2D?
        private var lastRecenterTrigger: UUID?
        private var activePolyline: MKPolyline?
        
        init(_ parent: AgentMKRouteMapView) {
            self.parent = parent
        }
        
        func updateMap(_ mapView: MKMapView) {
            let agentChanged = (lastAgentCoord?.latitude != parent.agentCoordinate?.latitude ||
                                lastAgentCoord?.longitude != parent.agentCoordinate?.longitude)
            let customerChanged = (lastCustomerCoord?.latitude != parent.customerCoordinate?.latitude ||
                                  lastCustomerCoord?.longitude != parent.customerCoordinate?.longitude)
            let triggerChanged = (lastRecenterTrigger != parent.recenterTrigger)
            
            guard agentChanged || customerChanged || triggerChanged else { return }
            
            lastAgentCoord = parent.agentCoordinate
            lastCustomerCoord = parent.customerCoordinate
            lastRecenterTrigger = parent.recenterTrigger
            
            // Re-plot annotations
            mapView.removeAnnotations(mapView.annotations)
            
            var points: [CLLocationCoordinate2D] = []
            
            if let agent = parent.agentCoordinate, isValid(agent) {
                let agentAnno = CustomPointAnnotation()
                agentAnno.coordinate = agent
                agentAnno.title = "You (Agent)"
                agentAnno.subtitle = "En route"
                agentAnno.pinType = .agent
                mapView.addAnnotation(agentAnno)
                points.append(agent)
            }
            
            if let customer = parent.customerCoordinate, isValid(customer) {
                let customerAnno = CustomPointAnnotation()
                customerAnno.coordinate = customer
                customerAnno.title = parent.customerName
                customerAnno.subtitle = parent.customerAddress
                customerAnno.pinType = .customer
                mapView.addAnnotation(customerAnno)
                points.append(customer)
            }
            
            // Calculate Driving Route Polyline if both endpoints are present
            if let agent = parent.agentCoordinate, let customer = parent.customerCoordinate, isValid(agent), isValid(customer) {
                calculateRoute(from: agent, to: customer, on: mapView)
            } else if let singlePoint = points.first {
                let region = MKCoordinateRegion(center: singlePoint, span: MKCoordinateSpan(latitudeDelta: 0.02, longitudeDelta: 0.02))
                mapView.setRegion(region, animated: true)
            }
        }
        
        private func calculateRoute(from start: CLLocationCoordinate2D, to destination: CLLocationCoordinate2D, on mapView: MKMapView) {
            let request = MKDirections.Request()
            request.source = MKMapItem(placemark: MKPlacemark(coordinate: start))
            request.destination = MKMapItem(placemark: MKPlacemark(coordinate: destination))
            request.transportType = .automobile
            
            let directions = MKDirections(request: request)
            directions.calculate { [weak self, weak mapView] response, error in
                guard let self = self, let mapView = mapView else { return }
                
                if let route = response?.routes.first {
                    DispatchQueue.main.async {
                        // Remove old polyline overlay
                        if let old = self.activePolyline {
                            mapView.removeOverlay(old)
                        }
                        self.activePolyline = route.polyline
                        mapView.addOverlay(route.polyline, level: .aboveRoads)
                        
                        // Fit camera bounding rect with padding
                        let mapRect = route.polyline.boundingMapRect
                        let padding = UIEdgeInsets(top: 70, left: 50, bottom: 220, right: 50)
                        mapView.setVisibleMapRect(mapRect, edgePadding: padding, animated: true)
                        
                        // Format distance & ETA
                        let distanceKm = String(format: "%.1f km", route.distance / 1000.0)
                        let travelMinutes = Int(ceil(route.expectedTravelTime / 60.0))
                        let etaString = "\(travelMinutes) min"
                        
                        self.parent.onRouteCalculated?(distanceKm, etaString)
                    }
                } else {
                    // Fallback to straight line bounding if directions error
                    let coords = [start, destination]
                    let polyline = MKPolyline(coordinates: coords, count: coords.count)
                    if let old = self.activePolyline {
                        mapView.removeOverlay(old)
                    }
                    self.activePolyline = polyline
                    mapView.addOverlay(polyline, level: .aboveRoads)
                    
                    let mapRect = polyline.boundingMapRect
                    mapView.setVisibleMapRect(mapRect, edgePadding: UIEdgeInsets(top: 80, left: 60, bottom: 220, right: 60), animated: true)
                    
                    let loc1 = CLLocation(latitude: start.latitude, longitude: start.longitude)
                    let loc2 = CLLocation(latitude: destination.latitude, longitude: destination.longitude)
                    let dist = loc1.distance(from: loc2)
                    let distanceKm = String(format: "%.1f km", dist / 1000.0)
                    self.parent.onRouteCalculated?(distanceKm, "~10 min")
                }
            }
        }
        
        private func isValid(_ coord: CLLocationCoordinate2D) -> Bool {
            return coord.latitude >= -90.0 && coord.latitude <= 90.0 &&
                   coord.longitude >= -180.0 && coord.longitude <= 180.0 &&
                   coord.latitude != 0.0 && coord.longitude != 0.0
        }
        
        // MARK: - MKMapViewDelegate Overlay & Annotation Renderers
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let polyline = overlay as? MKPolyline {
                let renderer = MKPolylineRenderer(polyline: polyline)
                renderer.strokeColor = UIColor.systemBlue
                renderer.lineWidth = 5.0
                renderer.lineCap = .round
                renderer.lineJoin = .round
                return renderer
            }
            return MKOverlayRenderer(overlay: overlay)
        }
        
        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            guard let customAnno = annotation as? CustomPointAnnotation else { return nil }
            
            let identifier = customAnno.pinType == .agent ? "AgentPin" : "CustomerPin"
            var view = mapView.dequeueReusableAnnotationView(withIdentifier: identifier)
            
            if view == nil {
                view = MKAnnotationView(annotation: customAnno, reuseIdentifier: identifier)
                view?.canShowCallout = true
            } else {
                view?.annotation = customAnno
            }
            
            if customAnno.pinType == .agent {
                view?.image = createPulsingMarkerImage(systemName: "figure.walk.circle.fill", tintColor: .systemGreen, size: CGSize(width: 36, height: 36))
            } else {
                view?.image = createPulsingMarkerImage(systemName: "house.circle.fill", tintColor: .systemRed, size: CGSize(width: 36, height: 36))
            }
            
            return view
        }
        
        private func createPulsingMarkerImage(systemName: String, tintColor: UIColor, size: CGSize) -> UIImage? {
            let config = UIImage.SymbolConfiguration(pointSize: 32, weight: .bold)
            if let base = UIImage(systemName: systemName, withConfiguration: config) {
                UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
                tintColor.setFill()
                let rect = CGRect(origin: .zero, size: size)
                base.draw(in: rect)
                let img = UIGraphicsGetImageFromCurrentImageContext()
                UIGraphicsEndImageContext()
                return img
            }
            return nil
        }
    }
}

// MARK: - Custom Point Annotation Model
class CustomPointAnnotation: MKPointAnnotation {
    enum PinType {
        case agent
        case customer
    }
    var pinType: PinType = .agent
}
