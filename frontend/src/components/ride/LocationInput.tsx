'use client';

import React from 'react';
import { MapPin, Circle, Navigation } from 'lucide-react';

interface LocationInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type: 'pickup' | 'destination';
    onAutoDetect?: () => void;
}

export const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChange,
    placeholder,
    type,
    onAutoDetect,
}) => {
    const isPickup = type === 'pickup';

    return (
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                {isPickup ? (
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500 flex items-center justify-center bg-background">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>
                ) : (
                    <MapPin className="w-5 h-5 text-red-500" />
                )}
            </div>

            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-12 pr-12 py-4 bg-muted/30 border border-card-border/50 rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:bg-card focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 outline-none font-medium"
            />

            {isPickup && onAutoDetect && (
                <button
                    type="button"
                    onClick={onAutoDetect}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all"
                    title="Auto-detect current location"
                >
                    <Navigation className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};
