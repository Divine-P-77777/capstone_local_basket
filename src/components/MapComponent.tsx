"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for missing marker icons in Leaflet with Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapComponent({ customerLocation, shopLocation }: { customerLocation: any, shopLocation: any }) {
  const [positions, setPositions] = useState<{ lat: number, lng: number }[]>([]);

  useEffect(() => {
    // Supabase returns PostGIS GEOMETRY columns as GeoJSON objects:
    // { type: "Point", coordinates: [longitude, latitude] }
    // But can also be a WKT string "POINT(lon lat)" as fallback
    const parsePoint = (point: any) => {
      if (!point) return null;

      // Handle GeoJSON object format (Supabase default for geometry columns)
      if (typeof point === 'object' && point.type === 'Point' && Array.isArray(point.coordinates)) {
        return { lat: point.coordinates[1], lng: point.coordinates[0] };
      }

      // Handle WKT string format "POINT(lon lat)"
      if (typeof point === 'string') {
        const match = point.match(/POINT\(([^ ]+)\s+([^)]+)\)/);
        if (match) {
          return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
        }
      }

      return null;
    };

    const newPositions = [];
    if (shopLocation) {
      const p = parsePoint(shopLocation);
      if (p) newPositions.push(p);
    }
    if (customerLocation) {
      const p = parsePoint(customerLocation);
      if (p) newPositions.push(p);
    }
    
    setPositions(newPositions);
  }, [customerLocation, shopLocation]);

  if (positions.length === 0) {
    return <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-medium">Map location unavailable</div>;
  }

  const center = positions[0];

  return (
    <div className="h-48 w-full rounded-xl overflow-hidden relative z-0 shadow-sm border border-gray-200">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.map((pos, i) => (
          <Marker key={i} position={pos} icon={customIcon}>
            <Popup>{i === 0 && positions.length === 2 ? "Shop" : "Delivery Address"}</Popup>
          </Marker>
        ))}
        {positions.length === 2 && (
          <Polyline positions={positions} color="#10b981" weight={3} dashArray="5, 10" />
        )}
      </MapContainer>
    </div>
  );
}
