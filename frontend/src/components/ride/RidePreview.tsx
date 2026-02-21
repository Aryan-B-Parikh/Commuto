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
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                    <Map className="w-12 h-12 text-slate-700 animate-pulse" />
                </div>
                {/* Overlay Elements */}
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                    <div className="px-3 py-1.5 bg-background/80 backdrop-blur-md rounded-lg border border-card-border/50 text-[10px] font-black uppercase tracking-widest text-indigo-500">
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
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Trip Summary</h4>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-2xl border border-card-border/30">
                        <div className="flex items-center gap-2 mb-1">
                            <Navigation className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Distance</span>
                        </div>
                        <p className="text-lg font-black text-foreground italic">{distance}</p>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-2xl border border-card-border/30">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Est. Time</span>
                        </div>
                        <p className="text-lg font-black text-foreground italic">{eta}</p>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-2xl border border-card-border/30">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Est. Fare</span>
                        </div>
                        <p className="text-lg font-black text-foreground italic">₹{fare}</p>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-2xl border border-card-border/30">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Nearby</span>
                        </div>
                        <p className="text-lg font-black text-foreground italic">{driversNearby} Drivers</p>
                    </div>
                </div>

                <div className="pt-2 border-t border-card-border/30">
                    <p className="text-[10px] font-medium text-muted-foreground italic leading-relaxed">
                        * Estimates are subject to traffic conditions and actual route taken by the driver.
                    </p>
                </div>
            </Card>
        </div>
    );
};
