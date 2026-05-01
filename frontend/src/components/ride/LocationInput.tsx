'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Circle, Navigation } from 'lucide-react';

const OLA_API_KEY = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY || '';

interface LocationInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type: 'pickup' | 'destination';
    onAutoDetect?: () => void;
    onMapClick?: () => void;
    onLocationSelect?: (address: string, lat: number, lng: number) => void;
    outsideServiceArea?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChange,
    placeholder,
    type,
    onAutoDetect,
    onMapClick,
    onLocationSelect,
    outsideServiceArea = false,
}) => {
    const isPickup = type === 'pickup';
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const justSelectedRef = useRef(false);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch autocomplete
    useEffect(() => {
        if (justSelectedRef.current) {
            justSelectedRef.current = false;
            return;
        }

        if (!value || value.length < 3) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(value)}&api_key=${OLA_API_KEY}`
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
    }, [value]);

    const handleSelect = async (prediction: any) => {
        justSelectedRef.current = true;
        onChange(prediction.description);
        setSuggestions([]);
        setShowSuggestions(false);

        if (onLocationSelect) {
            setIsResolving(true);
            try {
                let lat: number | null = null;
                let lng: number | null = null;

                if (prediction.geometry?.location) {
                    lat = prediction.geometry.location.lat;
                    lng = prediction.geometry.location.lng;
                } else {
                    const response = await fetch(
                        `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(prediction.description)}&api_key=${OLA_API_KEY}`
                    );
                    const data = await response.json();
                    if (data.geocodingResults && data.geocodingResults.length > 0) {
                        lat = data.geocodingResults[0].geometry.location.lat;
                        lng = data.geocodingResults[0].geometry.location.lng;
                    }
                }

                if (lat !== null && lng !== null) {
                    onLocationSelect(prediction.description, lat, lng);
                }
            } catch (err) {
                console.error('Failed to resolve location coords:', err);
            } finally {
                setIsResolving(false);
            }
        }
    };

    return (
        <div className="relative group" ref={containerRef}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                {isPickup ? (
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500 flex items-center justify-center bg-[#0B1020]">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>
                ) : (
                    <MapPin className="w-5 h-5 text-red-500" />
                )}
            </div>

            <input
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    if (e.target.value.length > 0) setShowSuggestions(true);
                }}
                onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder={placeholder}
                className={`w-full pl-12 pr-24 py-4 bg-[#1E293B]/30 border rounded-2xl text-[#F9FAFB] placeholder:text-[#6B7280]/50 focus:bg-[#111827] focus:ring-4 transition-all duration-300 outline-none font-medium ${
                    outsideServiceArea
                        ? 'border-amber-500/60 focus:ring-amber-500/20 focus:border-amber-500'
                        : 'border-[#1E293B]/50 focus:ring-indigo-500/10 focus:border-indigo-500'
                }`}
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
                {isResolving && (
                    <div className="w-4 h-4 mr-2 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                {isPickup && onAutoDetect && (
                    <button
                        type="button"
                        onClick={onAutoDetect}
                        className="p-2 text-[#9CA3AF] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                        title="Auto-detect current location"
                    >
                        <Navigation className="w-4 h-4" />
                    </button>
                )}
                {onMapClick && (
                    <button
                        type="button"
                        onClick={onMapClick}
                        className="p-2 text-[#9CA3AF] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                        title="Select on map"
                    >
                        <Circle size={14} className="fill-current opacity-20" />
                        <MapPin className="w-4 h-4 absolute inset-0 m-auto" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-[#111827]/95 backdrop-blur-2xl border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {suggestions.map((s, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelect(s)}
                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[#1E293B]/80 transition-colors text-left border-b border-[#1E293B]/50 last:border-0"
                            >
                                <div className="mt-0.5 w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-[#F9FAFB] truncate">{s.structured_formatting?.main_text || s.description}</p>
                                    <p className="text-[10px] text-[#9CA3AF] truncate">{s.structured_formatting?.secondary_text || ''}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
