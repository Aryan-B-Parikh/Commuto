'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import { PassengerBottomNav } from '@/components/layout/PassengerBottomNav';
import { tripsAPI } from '@/services/api';
import { transformTripResponses } from '@/utils/tripTransformers';
import { formatDate, formatCurrency } from '@/utils/formatters';
import type { Trip } from '@/types';

export default function PassengerHistoryPage() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        try {
            const data = await tripsAPI.getMyTrips();
            setTrips(transformTripResponses(data));
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const completedTrips = trips.filter(t => t.status === 'completed');

    // Calculate Total Spent (assuming pricePerSeat is the cost)
    const totalSpent = completedTrips.reduce((acc, trip) => {
        return acc + (trip.pricePerSeat || 0);
    }, 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b px-4 py-4">
                <h1 className="text-xl font-semibold text-gray-900">Trip History</h1>
                <p className="text-sm text-gray-500">Your past rides</p>
            </div>

            <div className="px-4 py-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{completedTrips.length}</p>
                        <p className="text-sm text-gray-500">Completed Trips</p>
                    </Card>
                    <Card className="text-center">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSpent)}</p>
                        <p className="text-sm text-gray-500">Total Spent</p>
                    </Card>
                </div>

                {/* Trip List */}
                <h2 className="font-semibold text-gray-900 mb-4">All Trips</h2>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-gray-100" />)}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trips.length > 0 ? (
                            trips.map((trip, index) => (
                                <motion.div
                                    key={trip.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link href={`/passenger/trip/${trip.id}`}>
                                        <Card hoverable>
                                            <div className="flex items-start gap-4">
                                                {trip.driver.avatar ? (
                                                    <img src={trip.driver.avatar} alt={trip.driver.name} className="w-12 h-12 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                        {trip.driver.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-semibold text-gray-900">{trip.driver.name}</p>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${trip.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                trip.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                                                    trip.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                        'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-1">{formatDate(trip.date)}</p>
                                                    <p className="text-sm text-gray-800 font-medium truncate">{trip.from.name} → {trip.to.name}</p>

                                                    {trip.pricePerSeat > 0 && (
                                                        <div className="flex items-center justify-end mt-2">
                                                            <span className="font-bold text-gray-900">{formatCurrency(trip.pricePerSeat)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                No trips found.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <PassengerBottomNav />
        </div>
    );
}
