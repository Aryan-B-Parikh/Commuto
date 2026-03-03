"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

const OLA_API_KEY = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY || '';

interface MapWidgetProps {
    className?: string;
    center?: [number, number]; // [lat, lng]
    zoom?: number;
    interactive?: boolean;
    pickup?: [number, number]; // [lat, lng]
    destination?: [number, number]; // [lat, lng]
    showRoute?: boolean;
}

export function MapWidget({
    className = '',
    center = [23.0225, 72.5714], // Ahmedabad default
    zoom = 12,
    interactive = true,
    pickup,
    destination,
    showRoute = false
}: MapWidgetProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dynamically import mapbox-gl only on client side to avoid SSR issues
    const initMap = useCallback(async () => {
        if (!mapContainerRef.current || mapRef.current) return;
        if (!OLA_API_KEY) {
            setError('Ola Maps API Key missing. Check your .env.local file.');
            return;
        }

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

            // Fetch and patch the style to remove the broken 3D layer before initialization
            const styleUrl = `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json?api_key=${OLA_API_KEY}`;
            const response = await fetch(styleUrl);
            const style = await response.json();

            if (style.layers) {
                style.layers = style.layers.filter((l: any) => l.id !== '3d_model_data');
            }

            const map = new maplibregl.Map({
                container: mapContainerRef.current,
                style: style, // Use the patched style object
                center: [center[1], center[0]], // [lng, lat] for maplibre
                zoom: zoom,
                attributionControl: false,
                interactive: interactive,
                transformRequest: (url: string) => {
                    if (url.includes('api.olamaps.io')) {
                        return {
                            url: url.includes('?') ? `${url}&api_key=${OLA_API_KEY}` : `${url}?api_key=${OLA_API_KEY}`
                        };
                    }
                    return { url };
                }
            });

            map.on('load', async () => {
                setIsReady(true);
                map.resize();

                // Navigation controls
                map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

                // Handle markers and bounds
                if (pickup && destination) {
                    // Render Both Markers
                    new maplibregl.Marker({ color: '#6366F1' }) // Pickup - Indigo
                        .setLngLat([pickup[1], pickup[0]])
                        .addTo(map);

                    new maplibregl.Marker({ color: '#EF4444' }) // Destination - Red
                        .setLngLat([destination[1], destination[0]])
                        .addTo(map);

                    // Add Route if requested
                    if (showRoute) {
                        try {
                            const response = await fetch(
                                `https://api.olamaps.io/routing/v1/directions?origin=${pickup[0]},${pickup[1]}&destination=${destination[0]},${destination[1]}&api_key=${OLA_API_KEY}`,
                                {
                                    method: 'POST',
                                    headers: { 'X-Request-Id': crypto.randomUUID() }
                                }
                            );
                            const data = await response.json();

                            if (data.routes && data.routes.length > 0) {
                                const encoded = data.routes[0].overview_polyline;
                                if (encoded) {
                                    const coordinates = decodePolyline(encoded);

                                    map.addSource('route', {
                                        'type': 'geojson',
                                        'data': {
                                            'type': 'Feature',
                                            'properties': {},
                                            'geometry': {
                                                'type': 'LineString',
                                                'coordinates': coordinates
                                            }
                                        }
                                    });

                                    map.addLayer({
                                        'id': 'route',
                                        'type': 'line',
                                        'source': 'route',
                                        'layout': {
                                            'line-join': 'round',
                                            'line-cap': 'round'
                                        },
                                        'paint': {
                                            'line-color': '#6366F1',
                                            'line-width': 5,
                                            'line-opacity': 0.75
                                        }
                                    });
                                }
                            }
                        } catch (err) {
                            console.error('Failed to draw route:', err);
                        }
                    }

                    // Auto-fit bounds
                    const bounds = new maplibregl.LngLatBounds()
                        .extend([pickup[1], pickup[0]])
                        .extend([destination[1], destination[0]]);

                    map.fitBounds(bounds, { padding: 50, duration: 2000 });
                } else if (pickup) {
                    new maplibregl.Marker({ color: '#6366F1' })
                        .setLngLat([pickup[1], pickup[0]])
                        .addTo(map);
                    map.flyTo({ center: [pickup[1], pickup[0]], zoom: 14 });
                } else if (destination) {
                    new maplibregl.Marker({ color: '#EF4444' })
                        .setLngLat([destination[1], destination[0]])
                        .addTo(map);
                    map.flyTo({ center: [destination[1], destination[0]], zoom: 14 });
                } else {
                    // Default marker if no pickup/dest provided
                    new maplibregl.Marker({ color: '#6366F1' })
                        .setLngLat([center[1], center[0]])
                        .addTo(map);
                }
            });

            mapRef.current = map;
        } catch (err) {
            console.error('Ola Maps init failed:', err);
            setError('Failed to load map. Please refresh.');
        }
    }, [center, zoom, interactive]);

    useEffect(() => {
        // Small delay to ensure container is rendered and has dimensions
        const timer = setTimeout(() => {
            initMap();
        }, 100);

        return () => {
            clearTimeout(timer);
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle container resize
    useEffect(() => {
        if (!mapRef.current) return;

        const observer = new ResizeObserver(() => {
            mapRef.current?.resize();
        });

        if (mapContainerRef.current) {
            observer.observe(mapContainerRef.current);
        }

        return () => observer.disconnect();
    }, [isReady]);

    if (error) {
        return (
            <div className={`w-full h-full bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center justify-center min-h-[300px] p-6 text-center ${className}`}>
                <span className="text-red-400 font-medium text-sm">{error}</span>
            </div>
        );
    }

    return (
        <div className={`w-full h-full relative overflow-hidden ${className}`} style={{ minHeight: '300px' }}>
            {/* Map container — must have explicit dimensions */}
            <div
                ref={mapContainerRef}
                className="absolute inset-0 w-full h-full"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Loading overlay */}
            {!isReady && (
                <div className="absolute inset-0 bg-[#0B1020] flex flex-col items-center justify-center z-10 transition-opacity duration-500">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <span className="text-[#6B7280] text-xs font-medium uppercase tracking-wider animate-pulse">Loading Map...</span>
                </div>
            )}

            {/* Status badge */}
            {isReady && (
                <div className="absolute bottom-3 left-3 z-10">
                    <div className="bg-[#111827]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#1E293B] shadow-lg flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Ola Maps Active</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Polyline decoder helper
function decodePolyline(encoded: string) {
    if (!encoded) return [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    const coordinates = [];

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        coordinates.push([lng / 1e5, lat / 1e5]);
    }
    return coordinates;
}
