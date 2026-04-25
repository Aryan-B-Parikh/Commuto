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
    driverPos?: [number, number]; // [lat, lng]
    driverHeading?: number;
    showRoute?: boolean;
    showSearch?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
}

export function MapWidget({
    className = '',
    center = [23.0225, 72.5714], // Ahmedabad default
    zoom = 12,
    interactive = true,
    pickup,
    destination,
    driverPos,
    driverHeading,
    showRoute = false,
    showSearch = false,
    searchValue,
    onSearchChange
}: MapWidgetProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const driverMarkerRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const searchQuery = searchValue !== undefined ? searchValue : localSearchQuery;

    const setSearchQuery = (val: string) => {
        setLocalSearchQuery(val);
        if (onSearchChange) onSearchChange(val);
    };

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const justSelectedRef = useRef(false);
    const searchMarkerRef = useRef<any>(null);

    // Handle clicks outside search suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch autocomplete suggestions
    useEffect(() => {
        if (justSelectedRef.current) {
            justSelectedRef.current = false;
            return;
        }
        if (!searchQuery || searchQuery.length < 3) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(searchQuery)}&api_key=${OLA_API_KEY}`
                );
                const data = await response.json();
                if (data.predictions) {
                    setSuggestions(data.predictions);
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error('Autocomplete failed:', err);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectLocation = async (prediction: any) => {
        justSelectedRef.current = true;
        setSearchQuery(prediction.description);
        setSuggestions([]);
        setShowSuggestions(false);
        setIsSearching(true);

        try {
            let lat: number | null = null;
            let lng: number | null = null;

            // 1. Use coordinates directly from autocomplete prediction (most accurate)
            if (prediction.geometry?.location) {
                lat = prediction.geometry.location.lat;
                lng = prediction.geometry.location.lng;
            }

            // 2. Fallback: geocode by address
            if (lat === null || lng === null) {
                const response = await fetch(
                    `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(prediction.description)}&api_key=${OLA_API_KEY}`
                );
                const data = await response.json();
                if (data.geocodingResults && data.geocodingResults.length > 0) {
                    lat = data.geocodingResults[0].geometry.location.lat;
                    lng = data.geocodingResults[0].geometry.location.lng;
                }
            }

            if (lat !== null && lng !== null && mapRef.current) {
                // Remove previous search marker
                if (searchMarkerRef.current) {
                    searchMarkerRef.current.remove();
                    searchMarkerRef.current = null;
                }

                mapRef.current.flyTo({
                    center: [lng, lat],
                    zoom: 14,
                    duration: 2000
                });

                // Add marker and track it for cleanup
                searchMarkerRef.current = new (window as any).maplibregl.Marker({ color: '#6366F1' })
                    .setLngLat([lng, lat])
                    .addTo(mapRef.current);
            }
        } catch (err) {
            console.error('Location search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    // Dynamically import mapbox-gl only on client side to avoid SSR issues
    const initMap = useCallback(async () => {
        const containerEl = mapContainerRef.current;
        if (!containerEl || mapRef.current) return;
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
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Invalid Ola Maps API key');
                }
                throw new Error(`Failed to load Ola Maps style: ${response.status} ${response.statusText}`);
            }

            let style: any;
            try {
                style = await response.json();
            } catch (error) {
                throw new Error('Failed to parse Ola Maps style response');
            }

            if (!style || typeof style.version === 'undefined') {
                throw new Error('Received malformed Ola Maps style JSON');
            }

            if (style.layers) {
                style.layers = style.layers.filter((l: any) => l.id !== '3d_model_data');
            }

            // In React strict mode/navigation transitions, async init may finish after unmount.
            // Re-validate container before constructing the map instance.
            if (!(containerEl instanceof HTMLElement) || !containerEl.isConnected || mapContainerRef.current !== containerEl) {
                return;
            }

            const map = new maplibregl.Map({
                container: containerEl,
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

                    // Render Driver Marker (managed separately via ref for live updates)
                    if (driverPos) {
                        const el = _createDriverMarkerEl(driverHeading);
                        driverMarkerRef.current = new maplibregl.Marker({ element: el })
                            .setLngLat([driverPos[1], driverPos[0]])
                            .addTo(map);
                    }

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

                    if (driverPos) {
                        bounds.extend([driverPos[1], driverPos[0]]);
                    }

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
                }
            });

            mapRef.current = map;
        } catch (err: any) {
            console.warn('Ola Maps init failed:', err.message);
            setError(err.message === 'Invalid Ola Maps API Key or style response' ? 'Invalid Ola Maps API Key. Check .env.local' : 'Failed to load map. Please refresh.');
        }
    }, [center, zoom, interactive]);

    // ── Live driver marker position update ──────────────────────────────────
    useEffect(() => {
        if (!driverPos || !mapRef.current || !isReady) return;

        const maplibregl = (window as any).maplibregl;
        if (!maplibregl) return;

        if (driverMarkerRef.current) {
            // Smoothly update existing marker position
            driverMarkerRef.current.setLngLat([driverPos[1], driverPos[0]]);
            // Update heading rotation
            const el = driverMarkerRef.current.getElement();
            if (el) {
                el.style.transform = `rotate(${driverHeading || 0}deg)`;
                el.style.transition = 'transform 0.5s ease';
            }
        } else {
            // Create marker for first time (if map loaded after first driverPos)
            const el = _createDriverMarkerEl(driverHeading);
            driverMarkerRef.current = new maplibregl.Marker({ element: el })
                .setLngLat([driverPos[1], driverPos[0]])
                .addTo(mapRef.current);
        }
    }, [driverPos, driverHeading, isReady]);

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

            {/* Search Overlay */}
            {isReady && showSearch && (
                <div ref={searchRef} className="absolute top-4 left-4 right-4 md:right-auto md:w-80 z-20">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className={`h-4 w-4 transition-colors ${isSearching ? 'text-indigo-500 animate-spin' : 'text-muted-foreground group-focus-within:text-indigo-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isSearching ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                )}
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            className="block w-full pl-11 pr-12 py-3 bg-card/90 backdrop-blur-xl border border-card-border rounded-2xl shadow-xl shadow-black/20 text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
                            placeholder="Explore destinations..."
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-3 flex items-center p-2 text-muted-foreground hover:text-foreground"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-card/95 backdrop-blur-2xl border border-card-border rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
                            <div className="max-h-64 overflow-y-auto">
                                {suggestions.map((s, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectLocation(s)}
                                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted transition-colors text-left border-b border-card-border/50 last:border-0"
                                    >
                                        <div className="mt-0.5 w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate">{s.structured_formatting?.main_text || s.description}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{s.structured_formatting?.secondary_text || ''}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

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

// Helper to create a styled driver marker element
function _createDriverMarkerEl(heading?: number): HTMLDivElement {
    const el = document.createElement('div');
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.background = '#6366F1';
    el.style.borderRadius = '50%';
    el.style.border = '4px solid white';
    el.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.5)';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.transform = `rotate(${heading || 0}deg)`;
    el.style.transition = 'transform 0.5s ease';
    el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`;
    return el;
}

// Polyline decoder helper
function decodePolyline(encoded: string) {
    if (!encoded) return [];
    let index = 0; const len = encoded.length;
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
