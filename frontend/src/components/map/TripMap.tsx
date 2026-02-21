"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const DriverIcon = L.divIcon({
    className: 'custom-driver-icon',
    html: `<div class="w-10 h-10 bg-indigo-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const PassengerIcon = L.divIcon({
    className: 'custom-passenger-icon',
    html: `<div class="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const DestinationIcon = L.divIcon({
    className: 'custom-dest-icon',
    html: `<div class="w-8 h-8 bg-red-500 rounded-lg border-2 border-white shadow-lg flex items-center justify-center text-white rotate-45">
            <div class="-rotate-45">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 30]
});

// Component to handle auto-centering
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

interface TripMapProps {
    passengerPos?: [number, number];
    driverPos?: [number, number];
    destinationPos?: [number, number];
    center?: [number, number];
    zoom?: number;
}

export default function TripMap({
    passengerPos,
    driverPos,
    destinationPos,
    center = [23.0225, 72.5714],
    zoom = 13
}: TripMapProps) {

    // Calculate route if both posts provided (simplified line for now)
    const polyline: [number, number][] = [];
    if (driverPos && passengerPos) {
        polyline.push(driverPos);
        polyline.push(passengerPos);
    }
    if (passengerPos && destinationPos) {
        polyline.push(passengerPos);
        polyline.push(destinationPos);
    }

    return (
        <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`}
                    attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    tileSize={512}
                    zoomOffset={-1}
                />

                <ChangeView center={center} zoom={zoom} />

                {passengerPos && (
                    <Marker position={passengerPos} icon={PassengerIcon}>
                        <Popup>Pickup Point</Popup>
                    </Marker>
                )}

                {driverPos && (
                    <Marker position={driverPos} icon={DriverIcon}>
                        <Popup>Driver's Current Location</Popup>
                    </Marker>
                )}

                {destinationPos && (
                    <Marker position={destinationPos} icon={DestinationIcon}>
                        <Popup>Destination</Popup>
                    </Marker>
                )}

                {polyline.length > 1 && (
                    <Polyline
                        positions={polyline}
                        color="#4f46e5"
                        weight={4}
                        opacity={0.6}
                        dashArray="10, 10"
                    />
                )}
            </MapContainer>
        </div>
    );
}
