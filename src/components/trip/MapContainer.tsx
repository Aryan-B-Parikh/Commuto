'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MapContainerProps {
    className?: string;
    showRoute?: boolean;
    overlay?: React.ReactNode;
    interactive?: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = ({
    className = '',
    showRoute = false,
    overlay,
    interactive = true,
}) => {
    return (
        <div className={`relative bg-gray-100 overflow-hidden ${className}`}>
            {/* Simulated Map Background */}
            <div className="absolute inset-0">
                {/* Grid pattern to simulate map */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-green-50/50" />

                {/* Simulated roads */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#E5E7EB" />
                            <stop offset="100%" stopColor="#D1D5DB" />
                        </linearGradient>
                    </defs>

                    {/* Main roads */}
                    <path d="M0 200 L400 200" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                    <path d="M200 0 L200 400" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                    <path d="M50 100 L350 300" stroke="#E5E7EB" strokeWidth="4" fill="none" />
                    <path d="M100 50 L300 350" stroke="#E5E7EB" strokeWidth="4" fill="none" />

                    {/* Route line if enabled */}
                    {showRoute && (
                        <motion.path
                            d="M80 320 C120 280, 160 240, 200 200 C240 160, 280 120, 320 80"
                            stroke="#3B82F6"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray="10 5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: 'easeInOut' }}
                        />
                    )}

                    {/* Start marker */}
                    {showRoute && (
                        <motion.g
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                        >
                            <circle cx="80" cy="320" r="12" fill="#22C55E" />
                            <circle cx="80" cy="320" r="6" fill="white" />
                        </motion.g>
                    )}

                    {/* End marker */}
                    {showRoute && (
                        <motion.g
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.5, type: 'spring' }}
                        >
                            <circle cx="320" cy="80" r="12" fill="#EF4444" />
                            <circle cx="320" cy="80" r="6" fill="white" />
                        </motion.g>
                    )}
                </svg>

                {/* Location markers for visual interest */}
                <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-gray-300 rounded-full opacity-50" />
                <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-gray-300 rounded-full opacity-40" />
                <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-gray-300 rounded-full opacity-50" />
            </div>

            {/* Map Controls (decorative) */}
            {interactive && (
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>
                    <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Current location button */}
            {interactive && (
                <button className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            )}

            {/* Overlay content */}
            {overlay && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="pointer-events-auto">
                        {overlay}
                    </div>
                </div>
            )}

            {/* Google Maps placeholder text */}
            <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-gray-500 shadow-sm">
                Map placeholder • Google Maps API ready
            </div>
        </div>
    );
};
