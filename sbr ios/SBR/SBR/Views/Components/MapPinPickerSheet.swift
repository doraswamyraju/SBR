import SwiftUI
import MapKit
import CoreLocation
import Combine

// Dedicated One-Shot GPS Location Provider
class SingleLocationFetcher: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    @Published var userLocation: CLLocationCoordinate2D? = nil
    @Published var isLocating = false
    @Published var locationError: String? = nil
    
    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }
    
    func requestGPSLocation() {
        isLocating = true
        locationError = nil
        let status = manager.authorizationStatus
        if status == .notDetermined {
            manager.requestWhenInUseAuthorization()
        } else if status == .denied || status == .restricted {
            isLocating = false
            locationError = "Location access denied. Please allow location permissions in device Settings."
        } else {
            manager.requestLocation()
        }
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
            manager.requestLocation()
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        DispatchQueue.main.async {
            self.isLocating = false
            if let loc = locations.last {
                self.userLocation = loc.coordinate
            }
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        DispatchQueue.main.async {
            self.isLocating = false
            self.locationError = error.localizedDescription
        }
    }
}

struct MapPinPickerSheet: View {
    @Environment(\.dismiss) var dismiss
    @Binding var latitude: Double?
    @Binding var longitude: Double?
    let addressString: String
    
    @StateObject private var locationFetcher = SingleLocationFetcher()
    
    // Default region (Bangalore, India or fallback)
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 12.9716, longitude: 77.5946),
        span: MKCoordinateSpan(latitudeDelta: 0.005, longitudeDelta: 0.005)
    )
    
    @State private var searchText = ""
    @State private var isSearching = false
    @State private var detectedAddress = ""
    @State private var showAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationView {
            ZStack {
                // Interactive map tracking center coordinates
                Map(coordinateRegion: $region)
                    .ignoresSafeArea(edges: .bottom)
                
                // Static custom marker centered on map
                VStack {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 46, weight: .bold))
                        .foregroundColor(.red)
                        .background(Color.white.clipShape(Circle()))
                        .shadow(color: Color.black.opacity(0.3), radius: 5, x: 0, y: 3)
                    
                    Spacer().frame(height: 24)
                }
                
                // Top Search Bar & Floating GPS Locate Me button
                VStack {
                    HStack(spacing: 8) {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.gray)
                            TextField("Search address, area or landmark", text: $searchText, onCommit: searchAddress)
                                .font(.subheadline)
                                .foregroundColor(SBRColors.textPrimary)
                            if !searchText.isEmpty {
                                Button(action: { searchText = "" }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                        .padding(10)
                        .background(Color.white)
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.12), radius: 4, x: 0, y: 2)
                        
                        Button(action: searchAddress) {
                            if isSearching {
                                ProgressView()
                                    .padding(10)
                                    .background(Color.white)
                                    .clipShape(Circle())
                            } else {
                                Image(systemName: "arrow.right.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(SBRColors.primaryBlue)
                                    .background(Color.white.clipShape(Circle()))
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                    
                    Spacer()
                    
                    // Floating "Locate Me" GPS Quick Action Button
                    HStack {
                        Spacer()
                        Button(action: locateUsingGPS) {
                            HStack(spacing: 6) {
                                if locationFetcher.isLocating {
                                    ProgressView()
                                        .tint(SBRColors.primaryBlue)
                                } else {
                                    Image(systemName: "location.fill")
                                        .foregroundColor(SBRColors.primaryBlue)
                                }
                                Text("Use GPS Location")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(SBRColors.primaryBlue)
                            }
                            .padding(.vertical, 10)
                            .padding(.horizontal, 14)
                            .background(Color.white)
                            .cornerRadius(24)
                            .shadow(color: Color.black.opacity(0.18), radius: 6, x: 0, y: 3)
                        }
                        .padding(.trailing)
                        .padding(.bottom, 8)
                    }
                    
                    // Bottom Confirmation & Coordinates Card
                    VStack(spacing: 14) {
                        VStack(spacing: 4) {
                            Text("Adjust Map to Align Location Pin")
                                .font(.headline)
                                .foregroundColor(SBRColors.textPrimary)
                            
                            Text("Drag the map manually to align the pin or tap 'Use GPS Location'.")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .multilineTextAlignment(.center)
                        }
                        
                        if !detectedAddress.isEmpty {
                            HStack {
                                Image(systemName: "mappin.and.ellipse")
                                    .font(.caption)
                                    .foregroundColor(SBRColors.primaryBlue)
                                Text(detectedAddress)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .foregroundColor(SBRColors.textPrimary)
                                    .lineLimit(2)
                            }
                            .padding(8)
                            .background(SBRColors.primaryBlue.opacity(0.08))
                            .cornerRadius(8)
                        }
                        
                        Divider()
                        
                        HStack {
                            Label(
                                title: {
                                    Text(String(format: "Lat: %.5f", region.center.latitude))
                                        .font(.system(.footnote, design: .monospaced))
                                        .fontWeight(.semibold)
                                },
                                icon: { Image(systemName: "location.circle") }
                            )
                            .foregroundColor(SBRColors.textSecondary)
                            
                            Spacer()
                            
                            Label(
                                title: {
                                    Text(String(format: "Lng: %.5f", region.center.longitude))
                                        .font(.system(.footnote, design: .monospaced))
                                        .fontWeight(.semibold)
                                },
                                icon: { Image(systemName: "location.circle") }
                            )
                            .foregroundColor(SBRColors.textSecondary)
                        }
                        .padding(.horizontal, 8)
                        
                        HStack(spacing: 12) {
                            Button(action: locateUsingGPS) {
                                HStack(spacing: 6) {
                                    Image(systemName: "location.circle.fill")
                                    Text("GPS Locate")
                                }
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(SBRColors.primaryBlue)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(SBRColors.primaryBlue.opacity(0.12))
                                .cornerRadius(12)
                            }
                            
                            Button(action: confirmPinLocation) {
                                Text("Set Pin Location")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(SBRColors.primaryBlue)
                                    .cornerRadius(12)
                                    .shadow(color: SBRColors.primaryBlue.opacity(0.25), radius: 5, x: 0, y: 3)
                            }
                        }
                    }
                    .padding(16)
                    .background(Color.white)
                    .cornerRadius(18)
                    .shadow(color: Color.black.opacity(0.15), radius: 10, x: 0, y: 4)
                    .padding()
                }
            }
            .navigationTitle("Drop Location Pin")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onAppear {
                initLocation()
            }
            .onReceive(locationFetcher.$userLocation) { newLoc in
                if let loc = newLoc {
                    withAnimation(.easeInOut(duration: 0.6)) {
                        region.center = loc
                        region.span = MKCoordinateSpan(latitudeDelta: 0.003, longitudeDelta: 0.003)
                    }
                    reverseGeocode(coordinate: loc)
                }
            }
            .onReceive(locationFetcher.$locationError) { err in
                if let err = err {
                    self.alertMessage = err
                    self.showAlert = true
                }
            }
            .alert("Location Notice", isPresented: $showAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(alertMessage)
            }
        }
    }
    
    private func initLocation() {
        if let lat = latitude, let lng = longitude, lat != 0, lng != 0 {
            region.center = CLLocationCoordinate2D(latitude: lat, longitude: lng)
            reverseGeocode(coordinate: region.center)
        } else if !addressString.isEmpty {
            searchText = addressString
            searchAddress()
        } else {
            // Auto-locate GPS on open if no coordinates exist
            locateUsingGPS()
        }
    }
    
    private func locateUsingGPS() {
        locationFetcher.requestGPSLocation()
    }
    
    private func searchAddress() {
        guard !searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        isSearching = true
        CLGeocoder().geocodeAddressString(searchText) { placemarks, error in
            DispatchQueue.main.async {
                self.isSearching = false
                if let coord = placemarks?.first?.location?.coordinate {
                    withAnimation(.easeInOut(duration: 0.6)) {
                        self.region.center = coord
                        self.region.span = MKCoordinateSpan(latitudeDelta: 0.005, longitudeDelta: 0.005)
                    }
                    if let placemark = placemarks?.first {
                        self.detectedAddress = [placemark.name, placemark.locality, placemark.administrativeArea].compactMap({ $0 }).joined(separator: ", ")
                    }
                } else {
                    self.alertMessage = "Could not find location for '\(searchText)'. Please drag the map or use GPS."
                    self.showAlert = true
                }
            }
        }
    }
    
    private func reverseGeocode(coordinate: CLLocationCoordinate2D) {
        let loc = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        CLGeocoder().reverseGeocodeLocation(loc) { placemarks, error in
            DispatchQueue.main.async {
                if let placemark = placemarks?.first {
                    self.detectedAddress = [placemark.name, placemark.subLocality, placemark.locality, placemark.administrativeArea].compactMap({ $0 }).joined(separator: ", ")
                }
            }
        }
    }
    
    private func confirmPinLocation() {
        latitude = region.center.latitude
        longitude = region.center.longitude
        dismiss()
    }
}

