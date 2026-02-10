import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { DriverBottomNav } from '@/components/layout/DriverBottomNav';
import { useToast } from '@/hooks/useToast';
import { tripsAPI, bidsAPI } from '@/services/api';
import { transformTripResponses } from '@/utils/tripTransformers';
import type { Trip } from '@/types';
import { useWebSocket } from '@/context/WebSocketContext';

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

    const { lastMessage } = useWebSocket();

    // Listen for real-time new ride requests
    useEffect(() => {
        if (lastMessage && lastMessage.type === 'new_ride_request') {
            console.log('New ride request received:', lastMessage);
            showToast('info', 'New ride request available!');
            fetchRoutes();
        }
    }, [lastMessage]);

    const handlePlaceBid = async (tripId: string) => {
        const amount = bidAmounts[tripId] || 25; // Default 25 if not set
        try {
            await bidsAPI.placeBid(tripId, { amount: amount });
            showToast('success', `Bid placed for ${formatCurrency(amount)}`);
            // Remove from list or mark as bidded
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Map Header Section */}
            <div className="relative h-[40vh] w-full">
                <MapContainer className="h-full" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />

                {/* Floating Stats */}
                <div className="absolute top-4 left-4 right-4 z-10 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <Card variant="glass" padding="sm" className="whitespace-nowrap flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <p className="text-xs font-semibold text-gray-700">{routes.length} New Routes Found</p>
                        </div>
                    </Card>
                    <Card variant="glass" padding="sm" className="whitespace-nowrap flex-shrink-0">
                        <p className="text-xs font-semibold text-blue-600">Avg. Earnings: $35.00</p>
                    </Card>
                </div>
            </div>

            {/* Routes List Section */}
            <div className="flex-1 px-4 py-6 -mt-10 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Available Routes</h1>
                    <button onClick={fetchRoutes} className="text-sm text-blue-600 font-medium hover:underline">Refresh</button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <Card key={i} className="h-40 animate-pulse bg-gray-100" />)}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {routes.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-gray-500">No available rides at the moment.</p>
                            </div>
                        ) : routes.map((route, index) => (
                            <motion.div
                                key={route.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card hoverable className="overflow-hidden border-0 shadow-lg shadow-blue-500/5">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{route.to.name}</h3>
                                                <p className="text-sm text-gray-500">From: {route.from.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Distance</p>
                                                <span className="font-bold text-gray-900">{route.distance || '5 km'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl">
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 mb-1">Your Bid</p>
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="5"
                                                    value={bidAmounts[route.id] || 25}
                                                    onChange={(e) => updateBidAmount(route.id, parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex-1 text-right">
                                                <p className="text-xs text-gray-500 mb-1">Seats</p>
                                                <p className="font-bold text-gray-900">{route.seatsAvailable} / {route.totalSeats}</p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="primary"
                                            fullWidth
                                            className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                                            onClick={() => handlePlaceBid(route.id)}
                                        >
                                            Place Bid
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* App Padding for Bottom Nav */}
            <DriverBottomNav />
        </div>
    );
}
