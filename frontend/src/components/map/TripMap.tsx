"use client";

import React, { useEffect, useRef, useState } from 'react';

const OLA_API_KEY = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY || '';

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
    center = [23.0225, 72.5714], // [lat, lng]
    zoom = 13
}: TripMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [fullRouteCoords, setFullRouteCoords] = useState<any>(null);

    // Fetch route from Ola Maps Directions API
    const fetchRoute = async (start: [number, number], end: [number, number]) => {
        if (!OLA_API_KEY) return null;
        try {
            const response = await fetch(
                `https://api.olamaps.io/routing/v1/directions?origin=${start[0]},${start[1]}&destination=${end[0]},${end[1]}&api_key=${OLA_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'X-Request-Id': crypto.randomUUID() }
                }
            );
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                // Decode overview_polyline or similar if needed. 
                // Ola Maps sometimes returns points directly in legs.
                // For simplicity, we'll assume a standard GeoJSON format if available or skip if complex.
                return data.routes[0];
            }
        } catch (err) {
            console.error('Ola Maps Routing failed:', err);
        }
        return null;
    };

    useEffect(() => {
        const initMap = async () => {
            if (!mapContainerRef.current || mapRef.current || !OLA_API_KEY) return;

            try {
                // MapLibre is now loaded globally in layout.tsx via next/script
                let maplibregl = (window as any).maplibregl;

                if (!maplibregl) {
                    let attempts = 0;
                    while (!(window as any).maplibregl && attempts < 50) {
                        await new Promise(r => setTimeout(r, 100));
                        attempts++;
                    }
                    maplibregl = (window as any).maplibregl;
                }

                if (!maplibregl) throw new Error('MapLibre GL not available');

                // Fetch and patch the style
                const styleUrl = `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json?api_key=${OLA_API_KEY}`;
                const response = await fetch(styleUrl);
                const style = await response.json();

                if (style.layers) {
                    style.layers = style.layers.filter((l: any) => l.id !== '3d_model_data');
                }

                const map = new maplibregl.Map({
                    container: mapContainerRef.current,
                    style: style,
                    center: [center[1], center[0]], // [lng, lat]
                    zoom: zoom,
                    attributionControl: false,
                    transformRequest: (url: string) => {
                        if (url.includes('api.olamaps.io')) {
                            return {
                                url: url.includes('?') ? `${url}&api_key=${OLA_API_KEY}` : `${url}?api_key=${OLA_API_KEY}`
                            };
                        }
                        return { url };
                    }
                });

                map.on('load', () => {
                    map.resize();

                    // Add markers
                    if (passengerPos) {
                        new maplibregl.Marker({ color: '#10b981' })
                            .setLngLat([passengerPos[1], passengerPos[0]])
                            .addTo(map);
                    }

                    if (driverPos) {
                        new maplibregl.Marker({ color: '#6366f1' })
                            .setLngLat([driverPos[1], driverPos[0]])
                            .addTo(map);
                    }

                    if (destinationPos) {
                        new maplibregl.Marker({ color: '#ef4444' })
                            .setLngLat([destinationPos[1], destinationPos[0]])
                            .addTo(map);
                    }
                });

                mapRef.current = map;
            } catch (err) {
                console.error('Ola Trip Map fail:', err);
            }
        };

        const timer = setTimeout(initMap, 100);
        return () => {
            clearTimeout(timer);
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden border border-[#1E293B] shadow-sm relative z-0">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            <div className="absolute bottom-4 left-4 z-10">
                <div className="bg-[#111827]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#1E293B] shadow-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Ola Live Tracking</span>
                </div>
            </div>
        </div>
    );
}
