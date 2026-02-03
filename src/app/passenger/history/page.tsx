'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import { PassengerBottomNav } from '@/components/layout/PassengerBottomNav';
import { mockTrips } from '@/data/trips';
import { formatDate, formatCurrency } from '@/utils/formatters';

export default function PassengerHistoryPage() {
    const completedTrips = mockTrips.filter(t => t.status === 'completed');

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
                        <p className="text-sm text-gray-500">Total Trips</p>
                    </Card>
                    <Card className="text-center">
                        <p className="text-2xl font-bold text-green-600">$156</p>
                        <p className="text-sm text-gray-500">Total Saved</p>
                    </Card>
                </div>

                {/* Trip List */}
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
                                <div className="flex items-start gap-4">
                                    <img src={trip.driver.avatar} alt={trip.driver.name} className="w-12 h-12 rounded-full" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold text-gray-900">{trip.driver.name}</p>
                                            <span className="text-sm text-gray-500">{formatDate(trip.date)}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">{trip.from.name} → {trip.to.name}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <RatingStars rating={trip.driver.rating} size="sm" />
                                            <span className="font-semibold text-blue-600">{formatCurrency(trip.pricePerSeat)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            <PassengerBottomNav />
        </div>
    );
}
