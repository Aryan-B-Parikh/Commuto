'use client';

import React, { useEffect } from 'react';
import { MapContainer as LMapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js/Webpack
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

interface LeafletMapProps {
    className?: string;
    showRoute?: boolean;
    center?: [number, number];
    zoom?: number;
    markers?: { lat: number; lng: number; title?: string }[];
    onLocationSelect?: (lat: number, lng: number) => void;
}

// Component to handle map events like clicks
function MapEvents({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            if (onLocationSelect) {
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

// Component to update map center when props change
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
    className = '',
    showRoute = false,
    center = [23.0225, 72.5714], // Ahmedabad, Gujarat
    zoom = 13,
    markers = [],
    onLocationSelect,
}) => {
    return (
        <LMapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={false}
            className={`w-full h-full z-0 ${className}`}
            style={{ minHeight: '100%', minWidth: '100%' }}
        >
            <ChangeView center={center} zoom={zoom} />
            <MapEvents onLocationSelect={onLocationSelect} />

            {/* Mapbox Tiles using the provided access token */}
            <TileLayer
                attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`}
                tileSize={512}
                zoomOffset={-1}
            />

            {markers.map((marker, idx) => (
                <Marker key={idx} position={[marker.lat, marker.lng]}>
                    {marker.title && <Popup>{marker.title}</Popup>}
                </Marker>
            ))}

            {/* Mock Route for demo if showRoute is true and no specific route provided */}
            {/* In a real app, we would calculate route using OSRM or GraphHopper */}
            {showRoute && markers.length >= 2 && (
                // Simple straight line for now
                <React.Fragment />
                // Polyline would require importing Polyline from react-leaflet, 
                // omitting for brevity unless specifically requested for routing visualization
            )}
        </LMapContainer>
    );
};

export default LeafletMap;
