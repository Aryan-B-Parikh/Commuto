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
import { ActionResponse } from '@/types/api';
import { Trip } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { calculateDistance, estimateCO2Saved } from '@/utils/geoUtils';
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

    const { user } = useAuth();

    const completedTrips = trips.filter(t => t.status === 'completed');

    const stats = completedTrips.reduce((acc, trip) => {
        const distance = calculateDistance(trip.from as any, trip.to as any);
        const co2 = estimateCO2Saved(distance);

        return {
            totalSpent: acc.totalSpent + (trip.pricePerSeat || 0),
            totalCO2: acc.totalCO2 + co2,
            drivers: acc.drivers.add(trip.driver.id)
        };
    }, { totalSpent: 0, totalCO2: 0, drivers: new Set<string>() });

    const totalSpent = stats.totalSpent;
    const co2Saved = stats.totalCO2.toFixed(1);
    const coRiders = stats.drivers.size;

    return (
        <DashboardLayout userType="passenger" title="Trip History">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column: History Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center mb-4 lg:mb-6">
                        <h2 className="text-xl font-bold text-[#F9FAFB]">Recent Rides</h2>
                        <div className="flex gap-2">
                            <span className="text-sm font-bold text-indigo-400 px-3 py-1 bg-indigo-500/10 rounded-full">{completedTrips.length} Completed</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Card key={i} className="h-28 animate-pulse bg-[#1E293B] rounded-2xl border-none" />)}
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
                                            <Card hoverable className="border-none shadow-sm px-4 lg:px-6 py-4 lg:py-5">
                                                <div className="flex items-center gap-4 lg:gap-6">
                                                    <div className="relative flex-shrink-0">
                                                        {trip.driver.avatar ? (
                                                            <img src={trip.driver.avatar} alt={trip.driver.name} className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl object-cover" />
                                                        ) : (
                                                            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg lg:text-xl font-bold">
                                                                {trip.driver.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#111827] rounded-full flex items-center justify-center border-2 border-[#111827]">
                                                            <span className="text-[10px]">🚗</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="font-bold text-[#F9FAFB] truncate">
                                                                {trip.status === 'pending' ? `Request to ${trip.to.name}` : trip.driver.name}
                                                            </h3>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex-shrink-0 ml-2 ${trip.status === 'completed' ? 'bg-indigo-500/15 text-indigo-400' :
                                                                trip.status === 'active' ? 'bg-blue-500/15 text-blue-400' :
                                                                    'bg-[#1E293B] text-[#6B7280]'
                                                                }`}>
                                                                {trip.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-[#6B7280] font-medium mb-1">
                                                            <span className="truncate">{trip.from.name}</span>
                                                            <span className="text-[#374151]">→</span>
                                                            <span className="truncate">{trip.to.name}</span>
                                                        </div>
                                                        <p className="text-xs text-[#6B7280] font-bold">{formatDate(trip.date)}</p>
                                                    </div>

                                                    <div className="text-right flex-shrink-0 hidden sm:block">
                                                        <p className="text-lg font-black text-[#F9FAFB]">{formatCurrency(trip.pricePerSeat)}</p>
                                                        {trip.status === 'completed' && <RatingStars rating={4.5} size="sm" />}
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))
                            ) : (
                                <Card className="text-center py-16 lg:py-20">
                                    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6 text-3xl">📭</div>
                                    <h3 className="text-xl font-bold text-[#F9FAFB] mb-2">No trips yet</h3>
                                    <p className="text-[#6B7280]">Your ride history will appear here once you take your first ride.</p>
                                    <Link href="/passenger/ride-sharing" className="inline-block mt-8">
                                        <Button variant="primary" className="px-8">Book a Ride</Button>
                                    </Link>
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Lifetime Stats */}
                <div className="space-y-6">
                    <Card className="overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                        <h3 className="text-lg font-bold text-[#F9FAFB] mb-6">Lifetime Impact</h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">💰</div>
                                    <p className="text-sm font-bold text-[#6B7280] uppercase">Total Spent</p>
                                </div>
                                <p className="text-xl font-black text-[#F9FAFB]">{formatCurrency(totalSpent)}</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">📉</div>
                                    <p className="text-sm font-bold text-[#6B7280] uppercase">CO₂ Saved</p>
                                </div>
                                <p className="text-xl font-black text-[#F9FAFB]">{co2Saved} kg</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">🤝</div>
                                    <p className="text-sm font-bold text-[#6B7280] uppercase">Co-riders</p>
                                </div>
                                <p className="text-xl font-black text-[#F9FAFB]">{coRiders}</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[#1E293B]">
                            <p className="text-xs text-[#6B7280] font-bold mb-4 uppercase tracking-tighter text-center">Your Rating</p>
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-black text-[#F9FAFB] mb-1">{user?.rating || '5.0'}</span>
                                <RatingStars rating={user?.rating || 5.0} size="sm" />
                                <p className="text-[10px] text-[#6B7280] mt-2">Based on {user?.totalTrips || 0} reviews</p>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 lg:p-6 rounded-2xl text-white shadow-lg overflow-hidden relative group">
                        <div className="relative z-10">
                            <h4 className="font-black text-xl mb-2 italic tracking-tighter">FREE TRIP AWAITS!</h4>
                            <p className="text-sm text-indigo-200 leading-snug mb-4">Complete 3 more rides this month to unlock your 50% discount voucher.</p>
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
