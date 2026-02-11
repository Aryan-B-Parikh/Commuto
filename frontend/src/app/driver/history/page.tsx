'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import { DriverBottomNav } from '@/components/layout/DriverBottomNav';
import { Button } from '@/components/ui/Button';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { tripsAPI } from '@/services/api';

export default function DriverHistoryPage() {
    const [completedTrips, setCompletedTrips] = useState([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTripHistory = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch driver's completed trips
                const tripsResponse = await tripsAPI.getDriverTrips();
                const completedTripsData = tripsResponse.filter(trip => trip.status === 'completed');
                setCompletedTrips(completedTripsData);
                
                // Calculate total earnings from completed trips
                const earnings = completedTripsData.reduce((sum, trip) => {
                    return sum + (trip.pricePerSeat * trip.passengers.length);
                }, 0);
                setTotalEarnings(earnings);
                
            } catch (err) {
                console.error('Failed to fetch trip history:', err);
                setError('Failed to load trip history. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchTripHistory();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading trip history...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="text-center py-6 max-w-md">
                    <p className="text-red-500 mb-3">⚠️ {error}</p>
                    <Button size="sm" variant="primary" onClick={() => window.location.reload()}>Retry</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b px-4 py-4">
                <h1 className="text-xl font-semibold text-gray-900">Trip History</h1>
                <p className="text-sm text-gray-500">Your completed trips</p>
            </div>

            <div className="px-4 py-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card className="text-center">
                        <p className="text-2xl font-bold text-green-600">{completedTrips.length}</p>
                        <p className="text-sm text-gray-500">Trips Completed</p>
                    </Card>
                    <Card className="text-center">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
                        <p className="text-sm text-gray-500">Total Earned</p>
                    </Card>
                </div>

                <h2 className="font-semibold text-gray-900 mb-4">All Trips</h2>
                <div className="space-y-4">
                    {completedTrips.map((trip, index) => (
                        <motion.div
                            key={trip.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card hoverable>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{trip.from.name} → {trip.to.name}</p>
                                        <p className="text-sm text-gray-500">{formatDate(trip.date)} • {trip.passengers.length} passengers</p>
                                    </div>
                                    <span className="text-lg font-bold text-green-600">+{formatCurrency(trip.pricePerSeat * trip.passengers.length)}</span>
                                </div>
                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                    <div className="flex -space-x-2">
                                        {trip.passengers.slice(0, 3).map((p) => (
                                            <img key={p.id} src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full border-2 border-white" />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1 ml-auto">
                                        <RatingStars rating={4.8} size="sm" />
                                        <span className="text-sm text-gray-500">4.8</span>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            <DriverBottomNav />
        </div>
    );
}
