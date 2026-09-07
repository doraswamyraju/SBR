import SwiftUI
import MapKit
import CoreLocation

// MARK: - Navigation Step Item
struct LiveNavStep: Identifiable {
    let id = UUID()
    let instruction: String
    let distance: CLLocationDistance
    let coordinate: CLLocationCoordinate2D
    
    var iconName: String {
        let lower = instruction.lowercased()
        if lower.contains("right") {
            return "arrow.turn.up.right"
        } else if lower.contains("left") {
            return "arrow.turn.up.left"
        } else if lower.contains("u-turn") || lower.contains("uturn") {
            return "arrow.uturn.backward"
        } else if lower.contains("roundabout") || lower.contains("rotary") {
            return "arrow.triangle.2.circlepath"
        } else if lower.contains("arrive") || lower.contains("destination") {
            return "flag.checkered"
        } else {
            return "arrow.up"
        }
    }
}

// MARK: - Agent Live In-App Route & Turn-by-Turn Navigation View
struct AgentLiveCustomerRouteView: View {
    @Environment(\.dismiss) var dismiss
    let job: ServiceRequest
    @ObservedObject var requestVM: RequestViewModel
    
    var startInNavigationMode: Bool = false
    
    @State private var isNavigating: Bool = false
    @State private var customerCoordinate: CLLocationCoordinate2D? = nil
    @State private var routeDistance: String? = nil
    @State private var routeEta: String? = nil
    @State private var navSteps: [LiveNavStep] = []
    @State private var currentStepIndex: Int = 0
    @State private var currentStepDistanceMeters: CLLocationDistance = 0
    
    @State private var isGeocoding = false
    @State private var mapRecenterTrigger: UUID = UUID()
    @State private var hasArrived: Bool = false
    @State private var showingStepsSheet: Bool = false
    @State private var showingExternalMapsPrompt: Bool = false
    
    private var agentCoordinate: CLLocationCoordinate2D? {
        requestVM.locationManager.lastLocation?.coordinate
    }
    
    var body: some View {
        NavigationView {
            ZStack(alignment: .top) {
                // Main Map with Live Polyline & In-App Camera Tracking
                AgentMKRouteMapView(
                    agentCoordinate: agentCoordinate,
                    customerCoordinate: customerCoordinate,
                    customerName: job.customerId?.name ?? "Customer",
                    customerAddress: job.customerAddress,
                    isNavigating: isNavigating,
                    recenterTrigger: mapRecenterTrigger,
                    onRouteCalculated: { distance, eta, steps in
                        self.routeDistance = distance
                        self.routeEta = eta
                        self.navSteps = steps
                        self.updateNavigationProgress()
                    }
                )
                .edgesIgnoringSafeArea(.all)
                
                // TOP OVERLAYS
                if isNavigating {
                    // Turn-by-Turn Active Navigation Header
                    VStack(spacing: 8) {
                        currentManeuverBanner
                        
                        if navSteps.count > currentStepIndex + 1 {
                            nextManeuverPreview(step: navSteps[currentStepIndex + 1])
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
                } else {
                    // Overview Mode Header
                    overviewTopBar
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                }
                
                // BOTTOM OVERLAYS
                VStack {
                    Spacer()
                    
                    if isNavigating {
                        activeNavigationBottomPanel
                    } else {
                        overviewBottomPanel
                    }
                }
            }
            .navigationBarHidden(true)
            .onAppear {
                if startInNavigationMode {
                    self.isNavigating = true
                }
                resolveCustomerLocation()
                requestVM.locationManager.requestPermission()
                if let jobId = job.id as String? {
                    requestVM.startLocationTracking(activeRequestId: jobId)
                }
            }
            .onChange(of: requestVM.locationManager.lastLocation) { _, _ in
                if isNavigating {
                    updateNavigationProgress()
                }
            }
            .sheet(isPresented: $showingStepsSheet) {
                allRouteStepsView
            }
            .confirmationDialog("Open in External Maps", isPresented: $showingExternalMapsPrompt, titleVisibility: .visible) {
                Button("Apple Maps") { openExternalAppleMaps() }
                Button("Google Maps") { openExternalGoogleMaps() }
                Button("Cancel", role: .cancel) {}
            }
        }
    }
    
    // MARK: - Turn-by-Turn Instruction Banner
    private var currentManeuverBanner: some View {
        HStack(alignment: .center, spacing: 14) {
            let currentStep = navSteps.indices.contains(currentStepIndex) ? navSteps[currentStepIndex] : nil
            let icon = currentStep?.iconName ?? "arrow.up"
            let instruction = currentStep?.instruction ?? "Head towards customer address"
            
            // Big Turn Icon
            Image(systemName: icon)
                .font(.system(size: 32, weight: .black))
                .foregroundColor(.white)
                .frame(width: 54, height: 54)
                .background(Color.green)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .shadow(color: Color.green.opacity(0.4), radius: 6, x: 0, y: 3)
            
            VStack(alignment: .leading, spacing: 3) {
                // Distance to next turn
                if currentStepDistanceMeters > 0 {
                    Text(formatDistance(currentStepDistanceMeters))
                        .font(.title2)
                        .fontWeight(.heavy)
                        .foregroundColor(.white)
                } else if let distance = routeDistance {
                    Text(distance)
                        .font(.title2)
                        .fontWeight(.heavy)
                        .foregroundColor(.white)
                }
                
                // Turn Instruction Text
                Text(instruction)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .lineLimit(2)
            }
            
            Spacer()
            
            // Recenter Camera Button
            Button(action: {
                mapRecenterTrigger = UUID()
            }) {
                Image(systemName: "location.north.line.fill")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .padding(12)
                    .background(Color.white.opacity(0.2))
                    .clipShape(Circle())
            }
        }
        .padding(14)
        .background(
            LinearGradient(
                colors: [Color(red: 0.08, green: 0.12, blue: 0.22), Color(red: 0.04, green: 0.08, blue: 0.16)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(18)
        .shadow(color: Color.black.opacity(0.4), radius: 10, x: 0, y: 5)
    }
    
    // MARK: - Next Maneuver Preview Sub-banner
    private func nextManeuverPreview(step: LiveNavStep) -> some View {
        HStack(spacing: 8) {
            Text("THEN")
                .font(.system(size: 10, weight: .black))
                .foregroundColor(.yellow)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.black.opacity(0.4))
                .cornerRadius(4)
            
            Image(systemName: step.iconName)
                .font(.caption)
                .foregroundColor(.white)
            
            Text(step.instruction)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(.white.opacity(0.9))
                .lineLimit(1)
            
            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(Color.black.opacity(0.75))
        .cornerRadius(10)
    }
    
    // MARK: - Active In-App Navigation Bottom Panel
    private var activeNavigationBottomPanel: some View {
        VStack(spacing: 12) {
            // Arrival notification banner (if close)
            if hasArrived {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundColor(.green)
                    Text("You have arrived near customer location!")
                        .font(.footnote)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 14)
                .background(Color.green.opacity(0.9))
                .clipShape(Capsule())
                .transition(.scale)
            }
            
            HStack(alignment: .center, spacing: 16) {
                // Trip Metrics
                VStack(alignment: .leading, spacing: 2) {
                    if let eta = routeEta {
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text(eta)
                                .font(.title)
                                .fontWeight(.heavy)
                                .foregroundColor(Color.green)
                            Text("remaining")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    if let dist = routeDistance {
                        Text("\(dist) • \(job.customerId?.name ?? "Customer")")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(SBRColors.textPrimary)
                            .lineLimit(1)
                    }
                }
                
                Spacer()
                
                // Call Customer
                if let phone = job.customerId?.phone, !phone.isEmpty {
                    Button(action: {
                        if let url = URL(string: "tel:\(phone)") {
                            UIApplication.shared.open(url)
                        }
                    }) {
                        Image(systemName: "phone.fill")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(Color.green)
                            .clipShape(Circle())
                            .shadow(color: Color.green.opacity(0.3), radius: 4, x: 0, y: 2)
                    }
                }
                
                // Steps List
                Button(action: { showingStepsSheet = true }) {
                    Image(systemName: "list.bullet")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.blue)
                        .clipShape(Circle())
                        .shadow(color: Color.blue.opacity(0.3), radius: 4, x: 0, y: 2)
                }
                
                // End Navigation Button
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        self.isNavigating = false
                    }
                }) {
                    Image(systemName: "xmark")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.red)
                        .clipShape(Circle())
                        .shadow(color: Color.red.opacity(0.3), radius: 4, x: 0, y: 2)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)
            .padding(.bottom, 24)
            .background(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(Color.white)
                    .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: -4)
            )
        }
    }
    
    // MARK: - Overview Top Bar
    private var overviewTopBar: some View {
        HStack {
            Button(action: { dismiss() }) {
                Image(systemName: "chevron.left.circle.fill")
                    .font(.system(size: 28))
                    .foregroundColor(Color.black.opacity(0.75))
                    .background(Color.white.clipShape(Circle()))
            }
            
            HStack(spacing: 6) {
                Circle()
                    .fill(Color.green)
                    .frame(width: 8, height: 8)
                Text("LIVE ROUTE")
                    .font(.caption2)
                    .fontWeight(.heavy)
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color.black.opacity(0.75))
            .clipShape(Capsule())
            
            Spacer()
            
            // Recenter
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
    }
    
    // MARK: - Overview Bottom Panel
    private var overviewBottomPanel: some View {
        VStack(spacing: 14) {
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
            
            // Route Metrics (ETA & Distance)
            if let eta = routeEta, let distance = routeDistance {
                HStack(spacing: 16) {
                    HStack(spacing: 6) {
                        Image(systemName: "bolt.car.fill")
                            .foregroundColor(.yellow)
                        Text("ETA: \(eta)")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                    
                    Divider()
                        .frame(height: 16)
                        .background(Color.white.opacity(0.3))
                    
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.triangle.swap")
                            .foregroundColor(.cyan)
                        Text(distance)
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity)
                .background(
                    LinearGradient(
                        colors: [Color(red: 0.1, green: 0.2, blue: 0.38), Color(red: 0.05, green: 0.1, blue: 0.25)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(12)
                .padding(.horizontal)
            }
            
            // Primary Action Buttons
            VStack(spacing: 8) {
                // START IN-APP LIVE NAVIGATION
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        self.isNavigating = true
                    }
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                            .font(.title3)
                        Text("Start Live Navigation")
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
                
                // Secondary Options
                HStack(spacing: 12) {
                    Button(action: { showingStepsSheet = true }) {
                        Label("Route Steps (\(navSteps.count))", systemImage: "list.bullet")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                    }
                    
                    Button(action: { showingExternalMapsPrompt = true }) {
                        Label("External Maps", systemImage: "arrow.up.right.square")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 16)
        }
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: -4)
        )
    }
    
    // MARK: - Route Steps Sheet View
    private var allRouteStepsView: some View {
        NavigationView {
            List {
                ForEach(Array(navSteps.enumerated()), id: \.offset) { index, step in
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: step.iconName)
                            .font(.title3)
                            .foregroundColor(index == currentStepIndex ? .green : .blue)
                            .frame(width: 32)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(step.instruction)
                                .font(.subheadline)
                                .fontWeight(index == currentStepIndex ? .bold : .medium)
                                .foregroundColor(SBRColors.textPrimary)
                            
                            if step.distance > 0 {
                                Text(formatDistance(step.distance))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Turn-by-Turn Steps")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { showingStepsSheet = false }
                }
            }
        }
    }
    
    // MARK: - Navigation Progress & Step Calculation
    private func updateNavigationProgress() {
        guard let agentLoc = requestVM.locationManager.lastLocation else { return }
        
        // Check destination arrival (within 50 meters)
        if let dest = customerCoordinate {
            let destLoc = CLLocation(latitude: dest.latitude, longitude: dest.longitude)
            if agentLoc.distance(from: destLoc) <= 50.0 {
                self.hasArrived = true
            }
        }
        
        // Find closest remaining step
        guard !navSteps.isEmpty else { return }
        
        if currentStepIndex < navSteps.count {
            let stepCoord = navSteps[currentStepIndex].coordinate
            let stepLoc = CLLocation(latitude: stepCoord.latitude, longitude: stepCoord.longitude)
            let distToStep = agentLoc.distance(from: stepLoc)
            self.currentStepDistanceMeters = distToStep
            
            // If agent passed this step point (within 25m), advance to next step
            if distToStep < 25.0 && currentStepIndex + 1 < navSteps.count {
                withAnimation {
                    self.currentStepIndex += 1
                }
            }
        }
    }
    
    private func formatDistance(_ meters: CLLocationDistance) -> String {
        if meters >= 1000.0 {
            return String(format: "In %.1f km", meters / 1000.0)
        } else {
            return "In \(Int(meters)) m"
        }
    }
    
    // Resolve Customer Coordinates
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
    
    private func openExternalAppleMaps() {
        guard let dest = customerCoordinate else { return }
        if let url = URL(string: "http://maps.apple.com/?daddr=\(dest.latitude),\(dest.longitude)&dirflg=d") {
            UIApplication.shared.open(url)
        }
    }
    
    private func openExternalGoogleMaps() {
        guard let dest = customerCoordinate else { return }
        if let url = URL(string: "comgooglemaps://?daddr=\(dest.latitude),\(dest.longitude)&directionsmode=driving"), UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        } else {
            openExternalAppleMaps()
        }
    }
}

// MARK: - Embedded In-App Mini Route Card for Active Service View
struct AgentRouteMapCardView: View {
    let job: ServiceRequest
    @ObservedObject var requestVM: RequestViewModel
    let onOpenNavigation: (Bool) -> Void // Bool: startInNavigationMode
    
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
                
                Button(action: { onOpenNavigation(false) }) {
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
            
            // Map Preview (tap to open)
            ZStack(alignment: .bottomTrailing) {
                AgentMKRouteMapView(
                    agentCoordinate: agentCoordinate,
                    customerCoordinate: customerCoordinate,
                    customerName: job.customerId?.name ?? "Customer",
                    customerAddress: job.customerAddress,
                    isNavigating: false,
                    recenterTrigger: UUID(),
                    onRouteCalculated: { distance, eta, _ in
                        self.routeDistance = distance
                        self.routeEta = eta
                    }
                )
                .frame(height: 180)
                .allowsHitTesting(false)
                
                Color.clear
                    .contentShape(Rectangle())
                    .onTapGesture {
                        onOpenNavigation(false)
                    }
            }
            
            // Bottom Quick Action Buttons
            HStack(spacing: 10) {
                Button(action: {
                    onOpenNavigation(true) // Start directly in In-App turn-by-turn navigation!
                }) {
                    Label("Start In-App Navigation", systemImage: "arrow.triangle.turn.up.right.diamond.fill")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            LinearGradient(
                                colors: [Color.blue, Color.indigo],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(8)
                }
                
                Button(action: {
                    onOpenNavigation(false)
                }) {
                    Label("View Route", systemImage: "map.fill")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(SBRColors.primaryBlue)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
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
}

// MARK: - MKMapView Representable with 3D Driving Camera & Polyline Route
struct AgentMKRouteMapView: UIViewRepresentable {
    let agentCoordinate: CLLocationCoordinate2D?
    let customerCoordinate: CLLocationCoordinate2D?
    let customerName: String
    let customerAddress: String
    let isNavigating: Bool
    let recenterTrigger: UUID
    let onRouteCalculated: ((String, String, [LiveNavStep]) -> Void)?
    
    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        mapView.showsUserLocation = false
        mapView.showsCompass = true
        mapView.showsScale = true
        mapView.isPitchEnabled = true
        mapView.isRotateEnabled = true
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
        private var lastNavigatingState: Bool?
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
            let navStateChanged = (lastNavigatingState != parent.isNavigating)
            
            guard agentChanged || customerChanged || triggerChanged || navStateChanged else { return }
            
            lastAgentCoord = parent.agentCoordinate
            lastCustomerCoord = parent.customerCoordinate
            lastRecenterTrigger = parent.recenterTrigger
            lastNavigatingState = parent.isNavigating
            
            // Re-plot annotations
            mapView.removeAnnotations(mapView.annotations)
            
            var points: [CLLocationCoordinate2D] = []
            
            if let agent = parent.agentCoordinate, isValid(agent) {
                let agentAnno = CustomPointAnnotation()
                agentAnno.coordinate = agent
                agentAnno.title = "You (Agent)"
                agentAnno.subtitle = parent.isNavigating ? "Navigating" : "En route"
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
            
            // In Active Navigation Mode: Position 3D driving camera behind agent
            if parent.isNavigating, let agent = parent.agentCoordinate, isValid(agent) {
                let heading = calculateBearing(from: agent, to: parent.customerCoordinate ?? agent)
                let camera = MKMapCamera(
                    lookingAtCenter: agent,
                    fromDistance: 350.0,
                    pitch: 55.0, // 3D driving angle
                    heading: heading
                )
                mapView.setCamera(camera, animated: true)
            }
            
            // Calculate Driving Route Polyline if both endpoints are present
            if let agent = parent.agentCoordinate, let customer = parent.customerCoordinate, isValid(agent), isValid(customer) {
                calculateRoute(from: agent, to: customer, on: mapView)
            } else if let singlePoint = points.first, !parent.isNavigating {
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
                        
                        // If not in 3D navigating mode, fit bounding rect
                        if !self.parent.isNavigating {
                            let mapRect = route.polyline.boundingMapRect
                            let padding = UIEdgeInsets(top: 80, left: 50, bottom: 240, right: 50)
                            mapView.setVisibleMapRect(mapRect, edgePadding: padding, animated: true)
                        }
                        
                        // Parse route steps
                        var stepsList: [LiveNavStep] = []
                        for step in route.steps {
                            if !step.instructions.isEmpty {
                                stepsList.append(LiveNavStep(
                                    instruction: step.instructions,
                                    distance: step.distance,
                                    coordinate: step.polyline.coordinate
                                ))
                            }
                        }
                        
                        // Format distance & ETA
                        let distanceKm = String(format: "%.1f km", route.distance / 1000.0)
                        let travelMinutes = Int(ceil(route.expectedTravelTime / 60.0))
                        let etaString = "\(travelMinutes) min"
                        
                        self.parent.onRouteCalculated?(distanceKm, etaString, stepsList)
                    }
                } else {
                    // Straight line fallback
                    let coords = [start, destination]
                    let polyline = MKPolyline(coordinates: coords, count: coords.count)
                    if let old = self.activePolyline {
                        mapView.removeOverlay(old)
                    }
                    self.activePolyline = polyline
                    mapView.addOverlay(polyline, level: .aboveRoads)
                    
                    if !self.parent.isNavigating {
                        let mapRect = polyline.boundingMapRect
                        mapView.setVisibleMapRect(mapRect, edgePadding: UIEdgeInsets(top: 80, left: 60, bottom: 240, right: 60), animated: true)
                    }
                    
                    let loc1 = CLLocation(latitude: start.latitude, longitude: start.longitude)
                    let loc2 = CLLocation(latitude: destination.latitude, longitude: destination.longitude)
                    let dist = loc1.distance(from: loc2)
                    let distanceKm = String(format: "%.1f km", dist / 1000.0)
                    self.parent.onRouteCalculated?(distanceKm, "~10 min", [])
                }
            }
        }
        
        private func calculateBearing(from start: CLLocationCoordinate2D, to end: CLLocationCoordinate2D) -> CLLocationDirection {
            let lat1 = start.latitude.degreesToRadians
            let lon1 = start.longitude.degreesToRadians
            let lat2 = end.latitude.degreesToRadians
            let lon2 = end.longitude.degreesToRadians
            
            let dLon = lon2 - lon1
            let y = sin(dLon) * cos(lat2)
            let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)
            let radiansBearing = atan2(y, x)
            return radiansBearing.radiansToDegrees >= 0 ? radiansBearing.radiansToDegrees : radiansBearing.radiansToDegrees + 360
        }
        
        private func isValid(_ coord: CLLocationCoordinate2D) -> Bool {
            return coord.latitude >= -90.0 && coord.latitude <= 90.0 &&
                   coord.longitude >= -180.0 && coord.longitude <= 180.0 &&
                   coord.latitude != 0.0 && coord.longitude != 0.0
        }
        
        // MARK: - MKMapViewDelegate
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let polyline = overlay as? MKPolyline {
                let renderer = MKPolylineRenderer(polyline: polyline)
                renderer.strokeColor = UIColor.systemBlue
                renderer.lineWidth = 6.0
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
                view?.image = createPulsingMarkerImage(systemName: "location.north.circle.fill", tintColor: .systemGreen, size: CGSize(width: 38, height: 38))
            } else {
                view?.image = createPulsingMarkerImage(systemName: "house.circle.fill", tintColor: .systemRed, size: CGSize(width: 38, height: 38))
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

// Helpers for angle calculation
fileprivate extension Double {
    var degreesToRadians: Double { self * .pi / 180 }
    var radiansToDegrees: Double { self * 180 / .pi }
}

// MARK: - Custom Point Annotation Model
class CustomPointAnnotation: MKPointAnnotation {
    enum PinType {
        case agent
        case customer
    }
    var pinType: PinType = .agent
}
