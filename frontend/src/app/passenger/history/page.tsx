'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';
import { tripsAPI } from '@/services/api';
import { transformTripResponses } from '@/utils/tripTransformers';
import { formatDate, formatCurrency } from '@/utils/formatters';
import type { Trip } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

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
        <DashboardLayout userType="passenger" title="Trip History">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: History Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-foreground">Recent Rides</h2>
                        <div className="flex gap-2">
                            <span className="text-sm font-bold text-indigo-600 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">{completedTrips.length} Completed</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Card key={i} className="h-28 animate-pulse bg-gray-100 dark:bg-gray-800/50 rounded-2xl border-none" />)}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {trips.length > 0 ? (
                                trips.map((trip, index) => (
                                    <motion.div
                                        key={trip.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link href={`/passenger/trip/${trip.id}`}>
                                            <Card hoverable className="border-none shadow-sm dark:glass px-6 py-5">
                                                <div className="flex items-center gap-6">
                                                    <div className="relative">
                                                        {trip.driver.avatar ? (
                                                            <img src={trip.driver.avatar} alt={trip.driver.name} className="w-14 h-14 rounded-2xl object-cover" />
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl font-bold">
                                                                {trip.driver.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                                                            <span className="text-[10px]">🚗</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="font-bold text-gray-900 dark:text-white truncate">{trip.driver.name}</h3>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${trip.status === 'completed' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                                trip.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                                                }`}>
                                                                {trip.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-1">
                                                            <span className="truncate">{trip.from.name}</span>
                                                            <span className="text-gray-300">→</span>
                                                            <span className="truncate">{trip.to.name}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 font-bold">{formatDate(trip.date)}</p>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-foreground">{formatCurrency(trip.pricePerSeat)}</p>
                                                        {trip.status === 'completed' && <RatingStars rating={4.5} size="sm" />}
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))
                            ) : (
                                <Card className="text-center py-20 dark:glass">
                                    <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center mx-auto mb-6 text-3xl">📭</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No trips yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Your ride history will appear here once you take your first ride.</p>
                                    <Link href="/passenger/create" className="inline-block mt-8">
                                        <Button variant="primary" className="px-8">Book a Ride</Button>
                                    </Link>
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Lifetime Stats */}
                <div className="space-y-6">
                    <Card className="dark:glass overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                        <h3 className="text-lg font-bold text-foreground mb-6">Lifetime Impact</h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">💰</div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Total Spent</p>
                                </div>
                                <p className="text-xl font-black text-foreground">{formatCurrency(totalSpent)}</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">📉</div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">CO₂ Saved</p>
                                </div>
                                <p className="text-xl font-black text-foreground">12.5 kg</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">🤝</div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Co-riders</p>
                                </div>
                                <p className="text-xl font-black text-foreground">42</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-400 font-bold mb-4 uppercase tracking-tighter text-center">Your Rating</p>
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-black text-foreground mb-1">4.9</span>
                                <RatingStars rating={4.9} size="sm" />
                                <p className="text-[10px] text-gray-400 mt-2">Based on 12 reviews</p>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative group">
                        <div className="relative z-10">
                            <h4 className="font-black text-xl mb-2 italic tracking-tighter">FREE TRIP AWAITS!</h4>
                            <p className="text-sm text-blue-100 leading-snug mb-4">Complete 3 more rides this month to unlock your 50% discount voucher.</p>
                            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full" style={{ width: '66%' }} />
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:rotate-12 transition-transform">🎁</div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
