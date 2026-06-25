import SwiftUI
import MapKit
import CoreLocation

struct MapPinPickerSheet: View {
    @Environment(\.dismiss) var dismiss
    @Binding var latitude: Double?
    @Binding var longitude: Double?
    let addressString: String
    
    // Default region (Bangalore, India or fallback)
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 12.9716, longitude: 77.5946),
        span: MKCoordinateSpan(latitudeDelta: 0.005, longitudeDelta: 0.005)
    )
    
    var body: some View {
        NavigationView {
            ZStack {
                // Map that tracks center changes
                Map(coordinateRegion: $region)
                    .ignoresSafeArea(edges: .bottom)
                
                // Static custom marker in center of Map view
                VStack {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 44, weight: .bold))
                        .foregroundColor(.red)
                        .background(Color.white.clipShape(Circle()))
                        .shadow(color: Color.black.opacity(0.25), radius: 4, x: 0, y: 2)
                    
                    // Small offset to point exactly to the center
                    Spacer()
                        .frame(height: 24)
                }
                
                // Confirm action bar at the bottom
                VStack {
                    Spacer()
                    
                    VStack(spacing: 16) {
                        VStack(spacing: 6) {
                            Text("Adjust Map to Align Location Pin")
                                .font(.headline)
                                .foregroundColor(SBRColors.textPrimary)
                            
                            Text("Drag the map to place the pin precisely on the desired service location.")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .multilineTextAlignment(.center)
                        }
                        
                        Divider()
                        
                        HStack {
                            Label(
                                title: {
                                    Text(String(format: "Lat: %.5f", region.center.latitude))
                                        .font(.system(.footnote, design: .monospaced))
                                        .fontWeight(.semibold)
                                },
                                icon: { Image(systemName: "latitude") }
                            )
                            .foregroundColor(SBRColors.textSecondary)
                            
                            Spacer()
                            
                            Label(
                                title: {
                                    Text(String(format: "Lng: %.5f", region.center.longitude))
                                        .font(.system(.footnote, design: .monospaced))
                                        .fontWeight(.semibold)
                                },
                                icon: { Image(systemName: "longitude") }
                            )
                            .foregroundColor(SBRColors.textSecondary)
                        }
                        .padding(.horizontal, 8)
                        
                        Button(action: {
                            latitude = region.center.latitude
                            longitude = region.center.longitude
                            dismiss()
                        }) {
                            Text("Set Pin Location")
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(SBRColors.primaryBlue)
                                .cornerRadius(12)
                                .shadow(color: SBRColors.primaryBlue.opacity(0.2), radius: 5, x: 0, y: 3)
                        }
                    }
                    .padding()
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
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                if let lat = latitude, let lng = longitude, lat != 0, lng != 0 {
                    region.center = CLLocationCoordinate2D(latitude: lat, longitude: lng)
                } else if !addressString.isEmpty {
                    CLGeocoder().geocodeAddressString(addressString) { placemarks, error in
                        if let coord = placemarks?.first?.location?.coordinate {
                            DispatchQueue.main.async {
                                self.region.center = coord
                            }
                        }
                    }
                }
            }
        }
    }
}
