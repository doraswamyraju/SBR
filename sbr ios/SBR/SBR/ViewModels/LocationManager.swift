import Foundation
import CoreLocation
import Combine

class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var activeRequestId: String?
    private var lastUploadedTime: Date?
    private var lastUploadedLocation: CLLocation?
    
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var lastLocation: CLLocation?
    @Published var isTracking = false
    
    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 10 // Trigger delegate update when user moves by 10 meters
        self.authorizationStatus = manager.authorizationStatus
        print("LocationManager: Initialized with status \(manager.authorizationStatus.rawValue)")
        
        // Auto-request location permission on initialization
        if manager.authorizationStatus == .notDetermined {
            print("LocationManager: Auto-requesting location permission on init")
            manager.requestWhenInUseAuthorization()
        }
    }
    
    func requestPermission() {
        print("LocationManager: requestPermission() called. Current status: \(manager.authorizationStatus.rawValue)")
        manager.requestWhenInUseAuthorization()
    }
    
    func startTracking(activeRequestId: String) {
        self.activeRequestId = activeRequestId
        self.isTracking = true
        
        // Enable background tracking capabilities
        manager.allowsBackgroundLocationUpdates = true
        manager.showsBackgroundLocationIndicator = true
        manager.pausesLocationUpdatesAutomatically = false
        
        // Start updates
        manager.startUpdatingLocation()
        manager.startMonitoringSignificantLocationChanges()
        
        // Force an initial update if we have a recent location
        if let location = manager.location {
            sendLocationToServer(location)
        }
    }
    
    func stopTracking() {
        manager.stopUpdatingLocation()
        manager.stopMonitoringSignificantLocationChanges()
        self.activeRequestId = nil
        self.isTracking = false
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        print("LocationManager: Delegate authorization status changed to \(manager.authorizationStatus.rawValue)")
        DispatchQueue.main.async {
            self.authorizationStatus = manager.authorizationStatus
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("LocationManager: Failed with error: \(error.localizedDescription)")
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        DispatchQueue.main.async {
            self.lastLocation = location
        }
        
        // Throttle uploads: upload if 10 seconds elapsed OR distance >= 10 meters
        let now = Date()
        let timeInterval = lastUploadedTime?.timeIntervalSince(now) ?? -999.0
        let distance = lastUploadedLocation?.distance(from: location) ?? 999.0
        
        if abs(timeInterval) >= 10.0 || distance >= 10.0 {
            sendLocationToServer(location)
        }
    }
    
    private func sendLocationToServer(_ location: CLLocation) {
        guard let requestId = activeRequestId else { return }
        
        lastUploadedTime = Date()
        lastUploadedLocation = location
        
        let lat = location.coordinate.latitude
        let lng = location.coordinate.longitude
        
        Task {
            // Update overall agent coordinates
            let agentBody = ["latitude": lat, "longitude": lng]
            struct LocationResponse: Decodable { let success: Bool }
            _ = try? await APIClient.shared.put(endpoint: "api/users/agent/location", body: agentBody, responseType: LocationResponse.self)
            
            // Append request coordinates trace path
            let requestBody = ["latitude": lat, "longitude": lng]
            _ = try? await APIClient.shared.post(endpoint: "api/requests/\(requestId)/location", body: requestBody, responseType: LocationResponse.self)
        }
    }
}
