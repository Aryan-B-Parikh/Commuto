'use client';

import React, { useEffect, useRef, useState } from 'react';

const OLA_API_KEY = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY || '';

interface LeafletMapProps {
    className?: string;
    showRoute?: boolean;
    center?: [number, number]; // [lat, lng]
    zoom?: number;
    markers?: { lat: number; lng: number; title?: string }[];
    onLocationSelect?: (lat: number, lng: number) => void;
}

const OlaMap: React.FC<LeafletMapProps> = ({
    className = '',
    center = [23.0225, 72.5714], // Ahmedabad, Gujarat
    zoom = 13,
    markers = [],
    onLocationSelect,
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

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
                    // Map is loaded
                });

                map.on('click', (e: any) => {
                    if (onLocationSelect) {
                        onLocationSelect(e.lngLat.lat, e.lngLat.lng);
                    }
                });

                mapRef.current = map;

                // Initial markers
                markers.forEach(m => {
                    const marker = new maplibregl.Marker()
                        .setLngLat([m.lng, m.lat])
                        .addTo(map);
                    markersRef.current.push(marker);
                });
            } catch (err) {
                console.error('Ola Map init fail:', err);
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

    // Update view when center changes
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.flyTo({ center: [center[1], center[0]], zoom });
        }
    }, [center, zoom]);

    // Update markers when props change
    useEffect(() => {
        if (!mapRef.current) return;

        // Clear existing markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        // Add new markers
        markers.forEach(m => {
            const marker = (window as any).maplibregl?.Marker ? new (window as any).maplibregl.Marker() : null;
            // Since we're importing dynamically, we might need a better way if they change often.
            // For now, let's keep it simple.
        });
    }, [markers]);

    return (
        <div ref={mapContainerRef} className={`w-full h-full relative ${className}`} />
    );
};

export default OlaMap;
