"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

const ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapWidgetProps {
    className?: string;
    center?: [number, number];
    zoom?: number;
    interactive?: boolean;
}

export function MapWidget({
    className = '',
    center = [72.5714, 23.0225],
    zoom = 12,
    interactive = true,
}: MapWidgetProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dynamically import mapbox-gl only on client side to avoid SSR issues
    const initMap = useCallback(async () => {
        if (!mapContainerRef.current || mapRef.current) return;
        if (!ACCESS_TOKEN) {
            setError('Mapbox Access Token missing. Check your .env.local file.');
            return;
        }

        try {
            // Dynamic import — prevents SSR crash in Next.js App Router
            const mapboxgl = (await import('mapbox-gl')).default;

            // Inject CSS via link tag if not already present
            if (!document.getElementById('mapbox-gl-css')) {
                const link = document.createElement('link');
                link.id = 'mapbox-gl-css';
                link.rel = 'stylesheet';
                link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.5.1/mapbox-gl.css';
                document.head.appendChild(link);
            }

            mapboxgl.accessToken = ACCESS_TOKEN;

            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: center,
                zoom: zoom,
                attributionControl: false,
                interactive: interactive,
            });

            map.on('load', () => {
                setIsReady(true);
                // Force resize to fill container properly
                map.resize();
            });

            // Navigation controls
            map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

            // Driver location marker
            new mapboxgl.Marker({ color: '#6366F1' })
                .setLngLat(center)
                .addTo(map);

            mapRef.current = map;
        } catch (err) {
            console.error('Mapbox init failed:', err);
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
                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Mapbox Active</span>
                    </div>
                </div>
            )}
        </div>
    );
}
