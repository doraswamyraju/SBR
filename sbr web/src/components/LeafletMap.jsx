import React, { useEffect, useRef } from 'react';

const LeafletMap = ({ agentLocation, locationPath, customerAddress }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const pathRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = () => {
      if (!window.L || !mapContainerRef.current) return;
      const L = window.L;

      // Clean up previous layers if map already exists
      if (mapRef.current) {
        // Update Agent Marker
        if (agentLocation && agentLocation.lat && agentLocation.lng) {
          const agentLatLng = [agentLocation.lat, agentLocation.lng];
          if (markerRef.current) {
            markerRef.current.setLatLng(agentLatLng);
          } else {
            markerRef.current = L.marker(agentLatLng, {
              icon: L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #6366f1; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(99, 102, 241, 0.8);"></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              })
            }).addTo(mapRef.current).bindPopup('Agent Current Location');
          }
        } else if (markerRef.current) {
          mapRef.current.removeLayer(markerRef.current);
          markerRef.current = null;
        }

        // Update Path
        if (locationPath && locationPath.length > 0) {
          const pathLatLngs = locationPath.map(p => [p.latitude, p.longitude]);
          if (pathRef.current) {
            pathRef.current.setLatLngs(pathLatLngs);
          } else {
            pathRef.current = L.polyline(pathLatLngs, { color: '#a78bfa', weight: 4, opacity: 0.8 }).addTo(mapRef.current);
          }
        } else if (pathRef.current) {
          mapRef.current.removeLayer(pathRef.current);
          pathRef.current = null;
        }

        // Adjust View
        if (agentLocation && agentLocation.lat && agentLocation.lng) {
          mapRef.current.setView([agentLocation.lat, agentLocation.lng], 14);
        }
        return;
      }

      // Initialize Map
      const initialLat = agentLocation?.lat || 12.9716; // default Bangalore
      const initialLng = agentLocation?.lng || 77.5946;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 14);
      mapRef.current = map;

      // Dark theme tiles for premium dashboard look
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Add Agent Marker
      if (agentLocation && agentLocation.lat && agentLocation.lng) {
        markerRef.current = L.marker([agentLocation.lat, agentLocation.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #6366f1; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(99, 102, 241, 0.8);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })
        }).addTo(map).bindPopup('Agent Current Location');
      }

      // Add Route Path
      if (locationPath && locationPath.length > 0) {
        const pathLatLngs = locationPath.map(p => [p.latitude, p.longitude]);
        pathRef.current = L.polyline(pathLatLngs, { color: '#a78bfa', weight: 4, opacity: 0.8 }).addTo(map);
      }
    };

    // Dynamically load Leaflet assets if they aren't loaded yet
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.async = true;
      script.onload = () => {
        if (isMounted) initMap();
      };
      document.body.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        customerMarkerRef.current = null;
        pathRef.current = null;
      }
    };
  }, [agentLocation, locationPath]);

  return (
    <div className="map-wrapper" style={{ position: 'relative' }}>
      <div 
        ref={mapContainerRef} 
        style={{ 
          height: '350px', 
          width: '100%', 
          borderRadius: '12px', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: '#14141e',
          zIndex: 1
        }} 
      />
      {customerAddress && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }}></span>
          Customer Address: <strong>{customerAddress}</strong>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
