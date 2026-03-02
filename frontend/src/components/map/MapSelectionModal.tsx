"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Check, Crosshair, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Dynamically import Mapbox to avoid SSR issues
let mapboxgl: any;
if (typeof window !== 'undefined') {
    import('mapbox-gl').then((m) => {
        mapboxgl = m.default;
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
    });
}

interface MapSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (address: string, lat: number, lng: number) => void;
    title: string;
    initialCoords?: [number, number]; // [lat, lng]
}

export function MapSelectionModal({
    isOpen,
    onClose,
    onSelect,
    title,
    initialCoords = [23.0225, 72.5714] // Ahmedabad default
}: MapSelectionModalProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    const [isReady, setIsReady] = useState(false);
    const [selectedPos, setSelectedPos] = useState<[number, number]>(initialCoords);
    const [address, setAddress] = useState('Loading address...');
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);

    // Fetch address from coordinates (Reverse Geocoding)
    const fetchAddress = async (lat: number, lng: number) => {
        setIsFetchingAddress(true);
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&limit=1`
            );
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                setAddress(data.features[0].place_name);
            } else {
                setAddress(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            setAddress(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setIsFetchingAddress(false);
        }
    };

    const initMap = useCallback(() => {
        if (!mapContainerRef.current || mapRef.current || !mapboxgl) return;

        // Ensure CSS is loaded
        if (!document.getElementById('mapbox-gl-css')) {
            const link = document.createElement('link');
            link.id = 'mapbox-gl-css';
            link.rel = 'stylesheet';
            link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.5.1/mapbox-gl.css';
            document.head.appendChild(link);
        }

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [selectedPos[1], selectedPos[0]],
            zoom: 14,
            attributionControl: false
        });

        map.on('load', () => {
            setIsReady(true);
            map.resize();

            // Marker logic
            const marker = new mapboxgl.Marker({
                draggable: true,
                color: '#6366F1'
            })
                .setLngLat([selectedPos[1], selectedPos[0]])
                .addTo(map);

            marker.on('dragend', () => {
                const lngLat = marker.getLngLat();
                setSelectedPos([lngLat.lat, lngLat.lng]);
                fetchAddress(lngLat.lat, lngLat.lng);
            });

            markerRef.current = marker;
        });

        map.on('click', (e: any) => {
            const { lng, lat } = e.lngLat;
            setSelectedPos([lat, lng]);
            markerRef.current?.setLngLat([lng, lat]);
            fetchAddress(lat, lng);
        });

        mapRef.current = map;
    }, [selectedPos]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                initMap();
                fetchAddress(selectedPos[0], selectedPos[1]);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
                setIsReady(false);
            }
        }
    }, [isOpen, initMap]);

    const handleConfirm = () => {
        onSelect(address, selectedPos[0], selectedPos[1]);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1020]/90 backdrop-blur-xl">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full h-full sm:w-[90vw] sm:h-[80vh] sm:max-w-4xl bg-[#111827] sm:rounded-3xl border border-[#1E293B] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 sm:p-6 border-b border-[#1E293B] flex items-center justify-between bg-[#111827]/80 backdrop-blur-md sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-[#F9FAFB]">{title}</h3>
                                <p className="text-xs text-[#9CA3AF] mt-1 font-medium italic">Drag marker or click map to select</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[#1E293B] rounded-full text-[#6B7280] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Map Container */}
                        <div className="flex-1 relative">
                            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

                            {!isReady && (
                                <div className="absolute inset-0 bg-[#0B1020] flex flex-col items-center justify-center z-10">
                                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                                    <span className="text-[#6B7280] text-xs font-bold uppercase tracking-wider">Loading Map...</span>
                                </div>
                            )}

                            {/* Center Pin Overlay (Optional visual cue) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
                                {/* Only show if not ready or something */}
                            </div>

                            {/* Floating Re-center Button */}
                            <button
                                onClick={() => {
                                    if (mapRef.current) {
                                        mapRef.current.flyTo({ center: [initialCoords[1], initialCoords[0]], zoom: 14 });
                                        setSelectedPos(initialCoords);
                                        markerRef.current?.setLngLat([initialCoords[1], initialCoords[0]]);
                                        fetchAddress(initialCoords[0], initialCoords[1]);
                                    }
                                }}
                                className="absolute bottom-24 right-4 p-3 bg-white text-[#111827] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all z-20"
                            >
                                <Crosshair size={22} />
                            </button>
                        </div>

                        {/* Selection Details Drawer */}
                        <div className="bg-[#111827] p-5 sm:p-8 border-t border-[#1E293B] space-y-5">
                            <div className="bg-[#0B1020] p-4 rounded-2xl border border-[#1E293B] flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                    {isFetchingAddress ? <Loader2 size={24} className="animate-spin" /> : <MapPin size={24} />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1">Selected Location</p>
                                    <p className="text-[#F9FAFB] text-sm font-bold truncate pr-2">
                                        {address}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 h-14 border-[#1E293B] text-[#9CA3AF] hover:bg-[#1E293B] font-bold rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={!isReady || isFetchingAddress}
                                    className="flex-[2] h-14 bg-indigo-500 hover:bg-indigo-600 font-bold text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                >
                                    <Check size={20} />
                                    Confirm Destination
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
