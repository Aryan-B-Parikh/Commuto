'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/hooks/useToast';
import { tripsAPI, bidsAPI } from '@/services/api';
import { transformTripResponses } from '@/utils/tripTransformers';
import type { Trip } from '@/types';
import { useSocketEvent } from '@/hooks/useWebSocket';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function GroupedRoutesDashboard() {
    const { showToast } = useToast() as any;
    const [routes, setRoutes] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [bidAmounts, setBidAmounts] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            setIsLoading(true);
            const data = await tripsAPI.getOpenRides();
            setRoutes(transformTripResponses(data));
        } catch (error) {
            console.error('Failed to fetch routes:', error);
            showToast('error', 'Failed to load available routes');
        } finally {
            setIsLoading(false);
        }
    };

    // Real-time new ride requests
    useSocketEvent('new_ride_request', (data: any) => {
        console.log('New ride request:', data);
        showToast('info', 'New ride request available!');
        fetchRoutes();
    });

    const handlePlaceBid = async (tripId: string) => {
        const amount = bidAmounts[tripId] || 25; // Default 25 if not set
        try {
            await bidsAPI.placeBid(tripId, { amount: amount });
            showToast('success', `Bid placed for ${formatCurrency(amount)}`);
            setRoutes(prev => prev.filter(r => r.id !== tripId));
        } catch (error) {
            console.error('Failed to place bid:', error);
            showToast('error', 'Failed to place bid');
        }
    };

    const updateBidAmount = (tripId: string, amount: number) => {
        setBidAmounts(prev => ({ ...prev, [tripId]: amount }));
    };

    return (
        <DashboardLayout userType="driver" title="Available Routes">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: List of Routes */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-foreground">Nearby Trips</h2>
                        <button onClick={fetchRoutes} className="text-sm text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                            Refresh List
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Card key={i} className="h-44 animate-pulse bg-muted rounded-2xl border-none" />)}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {routes.length === 0 ? (
                                <Card className="text-center py-20">
                                    <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center mx-auto mb-6 text-3xl">📭</div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">No available rides</h3>
                                    <p className="text-muted-foreground">Check back later or refresh the list.</p>
                                    <Button variant="outline" className="mt-8" onClick={fetchRoutes}>Refresh Now</Button>
                                </Card>
                            ) : routes.map((route, index) => (
                                <motion.div
                                    key={route.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card hoverable className="overflow-hidden border-none shadow-sm">
                                        <div className="p-1">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="space-y-3 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                                        <p className="text-foreground font-bold truncate">{route.from.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                                                        <p className="text-foreground font-bold truncate">{route.to.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right pl-4">
                                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">${bidAmounts[route.id] || 25}</span>
                                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Suggested Bid</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-muted p-4 rounded-2xl border border-card-border">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-muted-foreground text-sm">📍</span>
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Distance</p>
                                                    </div>
                                                    <p className="text-lg font-black text-foreground">{route.distance || '5.2 km'}</p>
                                                </div>
                                                <div className="bg-muted p-4 rounded-2xl border border-card-border">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-muted-foreground text-sm">👥</span>
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Seats</p>
                                                    </div>
                                                    <p className="text-lg font-black text-foreground">{route.seatsAvailable} / {route.totalSeats}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        min="5"
                                                        value={bidAmounts[route.id] || 25}
                                                        onChange={(e) => updateBidAmount(route.id, parseFloat(e.target.value))}
                                                        className="w-full h-14 px-4 bg-muted border border-card-border rounded-xl text-lg font-bold text-foreground focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-muted-foreground"
                                                        placeholder="Your Bid"
                                                    />
                                                </div>
                                                <Button
                                                    variant="primary"
                                                    className="px-8 h-14 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 text-lg"
                                                    onClick={() => handlePlaceBid(route.id)}
                                                >
                                                    Place Bid
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}

                </div>

                {/* Right Column: Live Map & Stats */}
                <div className="space-y-6">
                    <Card padding="none" className="h-[300px] overflow-hidden rounded-2xl border-none shadow-sm dark:glass">
                        <MapContainer className="h-full" />
                    </Card>

                    <Card padding="md" className="dark:glass">
                        <h3 className="text-lg font-bold text-foreground mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Routes Found</span>
                                <span className="text-lg font-black text-blue-700 dark:text-blue-300">{routes.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Avg. Bid</span>
                                <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">$35.00</span>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20 overflow-hidden relative group">
                        <div className="relative z-10">
                            <h4 className="font-black text-xl mb-1 italic tracking-tighter">DRIVER PRO TIP</h4>
                            <p className="text-sm text-emerald-50/80 leading-snug">Higher ratings increase your chances of being selected by passengers. Keep up the great work!</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 text-6xl opacity-10 group-hover:scale-110 transition-transform">🌟</div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
