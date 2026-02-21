"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface ActiveTripCardProps {
    id: string;
    status: 'Searching' | 'Driver Found' | 'In Progress' | 'Completed' | 'Pending' | 'Cancelled';
    pickup: string;
    dropoff: string;
    distance: string;
    estimatedTime: string;
    driverName?: string;
    price?: string;
}

export function ActiveTripCard({
    id,
    status,
    pickup,
    dropoff,
    distance,
    estimatedTime,
    driverName,
    price
}: ActiveTripCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-5 border border-card-border shadow-sm min-w-[320px] max-w-sm"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trip ID: {id}</span>
                    <h3 className="text-lg font-bold text-foreground mt-1">{status}</h3>
                </div>
                <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 text-indigo-500" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="200" strokeDashoffset="100" strokeLinecap="round" className="animate-[spin_3s_linear_infinite]" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        50%
                    </div>
                </div>
            </div>

            {/* Route */}
            <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-500/10" />
                    <div>
                        <p className="text-xs text-muted-foreground">Pickup</p>
                        <p className="text-sm font-medium text-foreground truncate">{pickup}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-500/10" />
                    <div>
                        <p className="text-xs text-muted-foreground">In Transit</p>
                        <p className="text-sm font-medium text-foreground truncate">{dropoff}</p>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="bg-muted/50 rounded-xl p-3 flex justify-between items-center">
                <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-sm font-semibold text-foreground">{distance}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Est. Time</p>
                    <p className="text-sm font-semibold text-foreground">{estimatedTime}</p>
                </div>
                {price && (
                    <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="text-sm font-semibold text-foreground">{price}</p>
                    </div>
                )}
            </div>

            {driverName && (
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-card-border">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium text-foreground">{driverName}</p>
                        <p className="text-xs text-muted-foreground">Driver</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
