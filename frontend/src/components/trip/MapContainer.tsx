'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import LeafletMap with no SSR to avoid "window is not defined"
const LeafletMap = dynamic(() => import('./LeafletMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Loading Map...</div>
});

interface MapContainerProps {
    className?: string;
    showRoute?: boolean;
    overlay?: React.ReactNode;
    interactive?: boolean;
    // New optional props for real data
    center?: [number, number];
    markers?: { lat: number; lng: number; title?: string }[];
}

export const MapContainer: React.FC<MapContainerProps> = ({
    className = '',
    showRoute = false,
    overlay,
    interactive = true,
    center,
    markers,
}) => {
    return (
        <div className={`relative bg-gray-100 overflow-hidden ${className}`}>
            <LeafletMap
                className="absolute inset-0"
                showRoute={showRoute}
                center={center}
                markers={markers}
            />

            {/* Overlay content */}
            {overlay && (
                <div className="absolute inset-0 pointer-events-none z-[400]">
                    <div className="pointer-events-auto w-full h-full">
                        {overlay}
                    </div>
                </div>
            )}

            {/* Attribution/Badge */}
            <div className="absolute bottom-1 left-1 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-gray-500 shadow-sm z-[400]">
                © OpenStreetMap
            </div>
        </div>
    );
};

