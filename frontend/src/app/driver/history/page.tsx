'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { tripsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { calculateDistance } from '@/utils/geoUtils';
import { TripResponse } from '@/types/api';
import { Car, Loader2, Inbox, TrendingUp, Navigation, Calendar, Users } from 'lucide-react';

export default function DriverHistoryPage() {
    const { showToast } = useToast() as any;
    const [trips, setTrips] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [earnings, setEarnings] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [driverTrips, earningsData] = await Promise.all([
                    tripsAPI.getDriverTrips(),
                    tripsAPI.getDriverEarnings(),
                ]);
                setTrips(driverTrips);
                setEarnings(earningsData);
            } catch (error: any) {
                if (error?.response?.status !== 401) {
                    console.error('Failed to fetch history:', error);
                    showToast('error', 'Failed to load ride history.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const completedTrips = trips.filter(t => ['completed', 'active', 'bid_accepted', 'driver_assigned'].includes(t.status));

    if (isLoading) {
        return (
            <RoleGuard allowedRoles={['driver']}>
                <DashboardLayout userType="driver" title="Ride History">
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 size={32} className="animate-spin text-indigo-400 mb-4" />
                        <p className="text-sm font-bold text-[#9CA3AF] uppercase tracking-widest">Loading history...</p>
                    </div>
                </DashboardLayout>
            </RoleGuard>
        );
    }

    return (
        <RoleGuard allowedRoles={['driver']}>
            <DashboardLayout userType="driver" title="Ride History">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: History Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[#F9FAFB]">Past Missions</h2>
                            <div className="flex gap-2">
                                <span className="text-sm font-bold text-blue-400 px-3 py-1 bg-blue-500/10 rounded-full">{completedTrips.length} Rides</span>
                            </div>
                        </div>

                        {completedTrips.length > 0 ? (
                            <div className="space-y-4">
                                {completedTrips.map((trip, index) => {
                                    const dist = calculateDistance(
                                        { lat: trip.origin_lat, lng: trip.origin_lng },
                                        { lat: trip.dest_lat, lng: trip.dest_lng }
                                    ).toFixed(1);
                                    const earning = (trip.price_per_seat || 0) * (trip.total_seats || 1);
                                    const tripDate = new Date(trip.start_time || trip.created_at);

                                    return (
                                        <motion.div
                                            key={trip.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card hoverable className="border-none shadow-sm px-6 py-5">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex flex-col items-center justify-center text-indigo-400">
                                                        <span className="text-[10px] font-black leading-none uppercase">
                                                            {tripDate.toLocaleDateString('en-GB', { month: 'short' })}
                                                        </span>
                                                        <span className="text-xl font-black">{tripDate.getDate()}</span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="font-bold text-[#F9FAFB] truncate text-sm">
                                                                {trip.origin_address} <span className="text-[#9CA3AF] font-medium mx-1">→</span> {trip.dest_address}
                                                            </h3>
                                                            <span className="text-xl font-black text-emerald-400 shrink-0 ml-3">
                                                                +{formatCurrency(earning)}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-[#9CA3AF]">
                                                            <div className="flex items-center gap-1.5">
                                                                <Navigation size={12} className="text-indigo-400" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest">{dist} km</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Users size={12} className="text-indigo-400" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest">{trip.total_seats} seats</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar size={12} className="text-indigo-400" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                                                    {tripDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="text-center py-20 border-none shadow-sm">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Inbox size={28} className="text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-bold text-[#F9FAFB] mb-1">No rides yet</h3>
                                <p className="text-sm text-[#9CA3AF]">Complete trips to see your ride history here.</p>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Lifetime Stats */}
                    <div className="space-y-6">
                        <Card className="overflow-hidden relative border-none shadow-sm">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-600" />
                            <h3 className="text-lg font-bold text-[#F9FAFB] mb-6">Driver Overview</h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                            <TrendingUp size={18} />
                                        </div>
                                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Total Earned</p>
                                    </div>
                                    <p className="text-xl font-black text-[#F9FAFB]">{formatCurrency(earnings?.total || 0)}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Car size={18} />
                                        </div>
                                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Total Trips</p>
                                    </div>
                                    <p className="text-xl font-black text-[#F9FAFB]">{earnings?.total_trips || 0}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                            <Navigation size={18} />
                                        </div>
                                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Avg / Trip</p>
                                    </div>
                                    <p className="text-xl font-black text-[#F9FAFB]">{formatCurrency(earnings?.avg_per_trip || 0)}</p>
                                </div>
                            </div>
                        </Card>

                        <div className="bg-gradient-to-br from-indigo-500 to-blue-700 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative group">
                            <div className="relative z-10">
                                <h4 className="font-black text-lg mb-1 tracking-tight uppercase">Keep Going!</h4>
                                <p className="text-sm text-indigo-50 leading-snug">
                                    {completedTrips.length > 0
                                        ? `You've completed ${completedTrips.length} ride${completedTrips.length > 1 ? 's' : ''}. Keep accepting rides to grow your earnings!`
                                        : 'Start completing rides to build your history and unlock achievements.'
                                    }
                                </p>
                            </div>
                            <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform">🏆</div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
