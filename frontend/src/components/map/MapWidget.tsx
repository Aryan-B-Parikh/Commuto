"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export function MapWidget() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [lng] = useState(72.5714);
    const [lat] = useState(23.0225);
    const [zoom] = useState(12);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted || !mapContainer.current || !ACCESS_TOKEN) return;
        if (map.current) return; // initialize map only once

        mapboxgl.accessToken = ACCESS_TOKEN;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [lng, lat],
            zoom: zoom,
            attributionControl: false
        });

        // Add navigation controls (zoom in/out)
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        const mainMarker = new mapboxgl.Marker({ color: '#10b981' })
            .setLngLat([lng, lat])
            .addTo(map.current);

        map.current.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            mainMarker.setLngLat([lng, lat]);
            console.log(`Location selected: ${lat}, ${lng}`);
            // Future: add onLocationSelect prop to MapWidget if needed
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [isMounted, lng, lat, zoom]);

    if (!isMounted) {
        return (
            <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center min-h-[400px]">
                <span className="text-slate-500 animate-pulse">Initializing Map...</span>
            </div>
        );
    }

    if (!ACCESS_TOKEN) {
        return (
            <div className="w-full h-full bg-red-900/10 border border-red-900/20 rounded-2xl flex items-center justify-center min-h-[400px] p-6 text-center">
                <span className="text-red-400 font-medium tracking-tight">Mapbox Access Token missing. Please check your .env.local file.</span>
            </div>
        );
    }

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden dark:glass border border-gray-100 dark:border-card-border relative min-h-[400px] shadow-sm">
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

            {/* Legend/Info Badge */}
            <div className="absolute bottom-4 left-4 z-10">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 dark:border-slate-800 shadow-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Mapbox Active</span>
                </div>
            </div>
        </div>
    );
}
