'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Map, Clock, Navigation, DollarSign, Users } from 'lucide-react';
import { Card } from '../ui/Card';

interface RidePreviewProps {
    distance?: string;
    eta?: string;
    fare?: string;
    driversNearby?: number;
}

export const RidePreview: React.FC<RidePreviewProps> = ({
    distance = '12.4 km',
    eta = '18 mins',
    fare = '450',
    driversNearby = 3,
}) => {
    return (
        <div className="sticky top-28 space-y-6">
            {/* Map Placeholder */}
            <Card variant="glass" padding="none" className="h-[400px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#0B1020] flex items-center justify-center">
                    <Map className="w-12 h-12 text-[#1E293B] animate-pulse" />
                </div>
                {/* Overlay Elements */}
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                    <div className="px-3 py-1.5 bg-[#0B1020]/80 backdrop-blur-md rounded-lg border border-[#1E293B]/50 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                        Live Preview
                    </div>
                </div>

                {/* Decorative Map Lines (SVG) */}
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,20 L100,20 M0,50 L100,50 M0,80 L100,80 M20,0 L20,100 M50,0 L50,100 M80,0 L80,100" stroke="currentColor" strokeWidth="0.5" fill="none" />
                </svg>
            </Card>

            {/* Trip Summary Card */}
            <Card className="space-y-6">
                <h4 className="text-xs font-black text-[#9CA3AF] uppercase tracking-[0.2em]">Trip Summary</h4>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#1E293B]/30 rounded-2xl border border-[#1E293B]/30">
                        <div className="flex items-center gap-2 mb-1">
                            <Navigation className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Distance</span>
                        </div>
                        <p className="text-lg font-black text-[#F9FAFB] italic">{distance}</p>
                    </div>

                    <div className="p-4 bg-[#1E293B]/30 rounded-2xl border border-[#1E293B]/30">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Est. Time</span>
                        </div>
                        <p className="text-lg font-black text-[#F9FAFB] italic">{eta}</p>
                    </div>

                    <div className="p-4 bg-[#1E293B]/30 rounded-2xl border border-[#1E293B]/30">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Est. Fare</span>
                        </div>
                        <p className="text-lg font-black text-[#F9FAFB] italic">₹{fare}</p>
                    </div>

                    <div className="p-4 bg-[#1E293B]/30 rounded-2xl border border-[#1E293B]/30">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Nearby</span>
                        </div>
                        <p className="text-lg font-black text-[#F9FAFB] italic">{driversNearby} Drivers</p>
                    </div>
                </div>

                <div className="pt-2 border-t border-[#1E293B]/30">
                    <p className="text-[10px] font-medium text-[#9CA3AF] italic leading-relaxed">
                        * Estimates are subject to traffic conditions and actual route taken by the driver.
                    </p>
                </div>
            </Card>
        </div>
    );
};
