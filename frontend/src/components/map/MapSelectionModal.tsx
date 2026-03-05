"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Check, Crosshair, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// OLA Maps API Key
const OLA_API_KEY = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY || '';

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
    initialCoords
}: MapSelectionModalProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const justSelectedRef = useRef(false);

    const [isReady, setIsReady] = useState(false);
    const [selectedPos, setSelectedPos] = useState<[number, number] | null>(initialCoords || null);
    const [address, setAddress] = useState(initialCoords ? 'Loading address...' : 'Select a location on map');
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Handle click outside search results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch address from coordinates (Ola Maps Reverse Geocoding)
    const fetchAddress = async (lat: number, lng: number) => {
        if (!OLA_API_KEY) return;
        setIsFetchingAddress(true);
        try {
            const response = await fetch(
                `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${OLA_API_KEY}`,
                {
                    headers: { 'X-Request-Id': crypto.randomUUID() }
                }
            );
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                setAddress(data.results[0].formatted_address);
            } else if (data.plus_code) {
                setAddress(data.plus_code.compound_code || `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            } else {
                setAddress(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
        } catch (error) {
            console.error('Ola Maps reverse geocoding failed:', error);
            setAddress(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setIsFetchingAddress(false);
        }
    };

    // Ola Maps Autocomplete
    useEffect(() => {
        const fetchAutocomplete = async () => {
            if (justSelectedRef.current) {
                justSelectedRef.current = false;
                return;
            }
            if (searchQuery.length < 3) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(
                    `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(searchQuery)}&api_key=${OLA_API_KEY}`,
                    { headers: { 'X-Request-Id': crypto.randomUUID() } }
                );
                const data = await response.json();
                setSearchResults(data.predictions || []);
                setShowResults(true);
            } catch (error) {
                console.error('Autocomplete failed:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(fetchAutocomplete, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectResult = async (result: any) => {
        justSelectedRef.current = true;
        setSearchQuery(result.description);
        setSearchResults([]);
        setShowResults(false);
        setIsFetchingAddress(true);

        try {
            const response = await fetch(
                `https://api.olamaps.io/places/v1/details?place_id=${result.place_id}&api_key=${OLA_API_KEY}`,
                { headers: { 'X-Request-Id': crypto.randomUUID() } }
            );
            const data = await response.json();

            if (data.result && data.result.geometry && data.result.geometry.location) {
                const { lat, lng } = data.result.geometry.location;
                setSelectedPos([lat, lng]);
                setAddress(data.result.formatted_address || result.description);

                if (mapRef.current) {
                    mapRef.current.flyTo({ center: [lng, lat], zoom: 16 });

                    if (markerRef.current) {
                        markerRef.current.setLngLat([lng, lat]);
                    } else {
                        const maplibregl = (window as any).maplibregl;
                        if (maplibregl) {
                            const marker = new maplibregl.Marker({
                                draggable: true,
                                color: '#6366F1'
                            })
                                .setLngLat([lng, lat])
                                .addTo(mapRef.current);

                            marker.on('dragend', () => {
                                const mLat = marker.getLngLat().lat;
                                const mLng = marker.getLngLat().lng;
                                setSelectedPos([mLat, mLng]);
                                fetchAddress(mLat, mLng);
                            });
                            markerRef.current = marker;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Place details failed:', error);
        } finally {
            setIsFetchingAddress(false);
        }
    };

    const initMap = useCallback(async () => {
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

            // Fetch and patch the style to remove the broken 3D layer before initialization
            const styleUrl = `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json?api_key=${OLA_API_KEY}`;
            const response = await fetch(styleUrl);
            const style = await response.json();

            if (style.layers) {
                style.layers = style.layers.filter((l: any) => l.id !== '3d_model_data');
            }

            const map = new maplibregl.Map({
                container: mapContainerRef.current,
                style: style,
                center: selectedPos ? [selectedPos[1], selectedPos[0]] : [72.5714, 23.0225], // Use selected or Ahmedabad fallback
                zoom: 14,
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
                setIsReady(true);
                map.resize();

                // Only add marker if we have a position
                if (selectedPos) {
                    const marker = new maplibregl.Marker({
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
                }
            });

            map.on('click', (e: any) => {
                const { lng, lat } = e.lngLat;
                setSelectedPos([lat, lng]);

                if (markerRef.current) {
                    markerRef.current.setLngLat([lng, lat]);
                } else {
                    const marker = new maplibregl.Marker({
                        draggable: true,
                        color: '#6366F1'
                    })
                        .setLngLat([lng, lat])
                        .addTo(map);

                    marker.on('dragend', () => {
                        const mLat = marker.getLngLat().lat;
                        const mLng = marker.getLngLat().lng;
                        setSelectedPos([mLat, mLng]);
                        fetchAddress(mLat, mLng);
                    });
                    markerRef.current = marker;
                }

                fetchAddress(lat, lng);
            });

            mapRef.current = map;
        } catch (err) {
            console.error('Ola Maps Modal init failed:', err);
        }
    }, [selectedPos, OLA_API_KEY]); // Added OLA_API_KEY to dependencies

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                initMap();
                if (selectedPos) {
                    fetchAddress(selectedPos[0], selectedPos[1]);
                }
            }, 100);
            return () => clearTimeout(timer);
        } else {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
                setIsReady(false);
                setSearchQuery('');
                setSearchResults([]);
                if (!initialCoords) {
                    setSelectedPos(null);
                    setAddress('Select a location on map');
                }
            }
        }
    }, [isOpen, initMap, selectedPos, initialCoords]);

    const handleConfirm = () => {
        if (selectedPos) {
            onSelect(address, selectedPos[0], selectedPos[1]);
            onClose();
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const handleGetCurrentLocation = () => {
        if ("geolocation" in navigator) {
            setIsFetchingAddress(true);
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setSelectedPos([latitude, longitude]);

                if (mapRef.current) {
                    mapRef.current.flyTo({ center: [longitude, latitude], zoom: 16 });
                    markerRef.current?.setLngLat([longitude, latitude]);
                }
                fetchAddress(latitude, longitude);
            }, (err) => {
                console.error("Geolocation error:", err);
                setIsFetchingAddress(false);
            });
        }
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

                            {/* Search Overlay */}
                            <div ref={searchRef} className="absolute top-4 left-4 right-4 z-[30]">
                                <div className="relative group">
                                    <div className="flex items-center bg-[#111827]/90 backdrop-blur-xl border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden focus-within:border-indigo-500/50 transition-all">
                                        <div className="pl-4 text-[#9CA3AF]">
                                            <Search size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search for a location..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => setShowResults(true)}
                                            className="flex-1 bg-transparent px-4 py-4 text-sm text-white placeholder-[#6B7280] outline-none"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="p-4 text-[#6B7280] hover:text-white transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                        {isSearching && (
                                            <div className="pr-4">
                                                <Loader2 size={18} className="animate-spin text-indigo-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Search Results */}
                                    <AnimatePresence>
                                        {showResults && searchResults.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full mt-2 left-0 right-0 bg-[#111827]/95 backdrop-blur-2xl border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden z-40 max-h-[300px] overflow-y-auto"
                                            >
                                                {searchResults.map((result: any, idx: number) => (
                                                    <button
                                                        key={result.place_id || idx}
                                                        onClick={() => handleSelectResult(result)}
                                                        className="w-full p-4 border-b border-[#1E293B]/50 flex items-start gap-3 hover:bg-indigo-500/10 transition-colors text-left group"
                                                    >
                                                        <div className="mt-1 w-8 h-8 rounded-lg bg-[#0B1020] flex items-center justify-center text-[#9CA3AF] group-hover:text-indigo-400 shrink-0">
                                                            <MapPin size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-[#F9FAFB] truncate">
                                                                {result.structured_formatting?.main_text || result.description.split(',')[0]}
                                                            </p>
                                                            <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5">
                                                                {result.structured_formatting?.secondary_text || result.description}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {!isReady && (
                                <div className="absolute inset-0 bg-[#0B1020] flex flex-col items-center justify-center z-10">
                                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                                    <span className="text-[#6B7280] text-xs font-bold uppercase tracking-wider">Loading Ola Maps...</span>
                                </div>
                            )}

                            {/* Floating Re-center Button */}
                            <button
                                onClick={handleGetCurrentLocation}
                                className="absolute bottom-6 right-4 p-3 bg-indigo-500 text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all z-20 flex items-center gap-2 group"
                            >
                                <Crosshair size={22} className="group-hover:rotate-90 transition-transform duration-500" />
                                <span className="text-sm font-bold pr-1 text-white">Current Location</span>
                            </button>
                        </div>

                        {/* Selection Details Drawer */}
                        <div className="bg-[#111827] p-5 sm:p-8 border-t border-[#1E293B] space-y-5">
                            <div className="bg-[#0B1020] p-4 rounded-2xl border border-[#1E293B] flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                    {isFetchingAddress ? <Loader2 size={24} className="animate-spin" /> : <MapPin size={24} />}
                                </div>
                                <div className="min-w-0 flex-1">
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
                                    Confirm Location
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
