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
import { PassengerBottomNav } from '@/components/layout/PassengerBottomNav';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { ArrowLeft, MapPin, Navigation, History, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { normalizeRideStatus } from '@/utils/rideState';

export default function PassengerHistoryPage() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'cancelled' | 'upcoming'>('all');

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
    const userRating = typeof user?.rating === 'number' ? user.rating : 0;
    const hasUserRating = userRating > 0;

    const filteredTrips = trips.filter(trip => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'completed') return trip.status === 'completed';
        if (activeFilter === 'cancelled') return trip.status === 'cancelled';
        if (activeFilter === 'upcoming') return ['requested', 'accepted', 'started'].includes(normalizeRideStatus(trip.status));
        return true;
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: <CheckCircle2 size={12} /> };
            case 'cancelled': return { bg: 'bg-red-500/20', text: 'text-red-400', icon: <XCircle size={12} /> };
            case 'accepted':
            case 'started':
            case 'requested': return { bg: 'bg-teal-500/20', text: 'text-teal-400', icon: <Clock size={12} /> };
            default: return { bg: 'bg-[#1E293B]', text: 'text-[#9CA3AF]', icon: null };
        }
    };

    return (
        <RoleGuard allowedRoles={['passenger']}>

            {/* ====================== MOBILE LAYOUT (UBER STYLE) ====================== */}
            <div className="lg:hidden min-h-screen bg-[#0B1020] flex flex-col pb-24 font-sans -mt-6 -mx-4">
                {/* 1️⃣ Compact Header */}
                <div className="sticky top-0 z-40 bg-[#0B1020]/95 backdrop-blur-md px-4 h-[56px] flex items-center justify-between border-b border-[#1E293B]">
                    <button onClick={() => window.history.back()} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#F9FAFB] active:bg-[#1E293B] transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-[#F9FAFB] absolute left-1/2 -translate-x-1/2">Your Trips</h1>
                    <div className="w-10 flex items-center justify-end">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] active:bg-[#1E293B]">
                            <History size={20} />
                        </button>
                    </div>
                </div>

                {/* 2️⃣ Filter Chips Row */}
                <div className="bg-[#0B1020] pb-2 border-b border-[#1E293B] sticky top-[56px] z-30 pt-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 mask-fade-edges-right">
                        {['all', 'completed', 'upcoming', 'cancelled'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter as any)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold capitalize transition-colors border ${activeFilter === filter
                                    ? 'bg-teal-600 text-white border-teal-500'
                                    : 'bg-[#111827] text-[#9CA3AF] border-[#1E293B] hover:bg-[#1E293B]'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3️⃣ Scannable List View */}
                <div className="flex-1 px-4 mt-4 pb-28">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-20 bg-[#111827] animate-pulse rounded-2xl border border-[#1E293B]" />
                            ))}
                        </div>
                    ) : filteredTrips.length > 0 ? (
                        <div className="space-y-3">
                            {filteredTrips.map((trip, i) => {
                                const status = getStatusConfig(trip.status);
                                return (
                                    <Link key={trip.id} href={`/passenger/trip/${trip.id}`} className="block">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="bg-[#111827] rounded-sm p-4 flex items-center gap-4 border border-[#1E293B] shadow-sm relative overflow-hidden"
                                        >
                                            {/* Left: Icon Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-[#1E293B] flex items-center justify-center flex-shrink-0 text-[#9CA3AF] border border-[#374151]">
                                                {trip.status === 'completed' ? <CheckCircle2 size={24} className="text-emerald-400" /> : <Navigation size={22} className="text-teal-400" />}
                                            </div>

                                            {/* Center: Details */}
                                            <div className="flex-1 min-w-0 pr-2">
                                                <h3 className="text-[#F9FAFB] text-sm font-bold truncate">
                                                    {trip.to.name}
                                                </h3>
                                                <p className="text-[#6B7280] text-xs font-medium mt-0.5 truncate flex items-center gap-1.5">
                                                    {formatDate(trip.date)} • {trip.from.name.split(',')[0]}
                                                </p>
                                            </div>

                                            {/* Right: Price & Status */}
                                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                <p className="text-[#F9FAFB] text-[15px] font-black">{formatCurrency(trip.pricePerSeat)}</p>
                                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${status.bg} ${status.text}`}>
                                                    {status.icon}
                                                    {trip.status}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center bg-[#111827] border border-dashed border-[#1E293B] rounded-2xl">
                            <MapPin size={32} className="text-[#374151] mb-3" />
                            <h3 className="text-[#F9FAFB] text-sm font-bold">No trips found</h3>
                            <p className="text-[#6B7280] text-xs mt-1">Try changing your filter or book a ride.</p>
                        </div>
                    )}
                </div>

                <PassengerBottomNav />
            </div>

            {/* ====================== DESKTOP LAYOUT (UNCHANGED) ====================== */}
            <div className="hidden lg:block">
                <DashboardLayout userType="passenger" title="Trip History">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Left Column: History Items */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-center mb-4 lg:mb-6">
                                <h2 className="text-xl font-bold text-[#F9FAFB]">Recent Rides</h2>
                                <div className="flex gap-2">
                                    <span className="text-sm font-bold text-teal-400 px-3 py-1 bg-teal-500/10 rounded-full">{completedTrips.length} Completed</span>
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
                                                                        {normalizeRideStatus(trip.status) === 'requested' ? `Request to ${trip.to.name}` : trip.driver.name}
                                                                    </h3>
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex-shrink-0 ml-2 ${trip.status === 'completed' ? 'bg-teal-500/15 text-teal-400' :
                                                                        normalizeRideStatus(trip.status) === 'started' ? 'bg-blue-500/15 text-blue-400' :
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
                                                                {trip.status === 'completed' && trip.driver?.rating > 0 && (
                                                                    <RatingStars rating={trip.driver.rating} size="sm" />
                                                                )}
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
                                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">📉</div>
                                            <p className="text-sm font-bold text-[#6B7280] uppercase">CO₂ Saved</p>
                                        </div>
                                        <p className="text-xl font-black text-[#F9FAFB]">{co2Saved} kg</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">🤝</div>
                                            <p className="text-sm font-bold text-[#6B7280] uppercase">Co-riders</p>
                                        </div>
                                        <p className="text-xl font-black text-[#F9FAFB]">{coRiders}</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-[#1E293B]">
                                    <p className="text-xs text-[#6B7280] font-bold mb-4 uppercase tracking-tighter text-center">Your Rating</p>
                                    <div className="flex flex-col items-center">
                                        <span className="text-4xl font-black text-[#F9FAFB] mb-1">{hasUserRating ? userRating.toFixed(1) : '—'}</span>
                                        {hasUserRating ? (
                                            <RatingStars rating={userRating} size="sm" />
                                        ) : (
                                            <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">No ratings yet</p>
                                        )}
                                        <p className="text-[10px] text-[#6B7280] mt-2">Based on {user?.totalTrips || 0} reviews</p>
                                    </div>
                                </div>
                            </Card>

                            <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-5 lg:p-6 rounded-sm text-white shadow-lg overflow-hidden relative group">
                                <div className="relative z-10">
                                    <h4 className="font-black text-xl mb-2 italic tracking-tighter">FREE TRIP AWAITS!</h4>
                                    <p className="text-sm text-teal-200 leading-snug mb-4">Complete 3 more rides this month to unlock your 50% discount voucher.</p>
                                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full" style={{ width: '66%' }} />
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:rotate-12 transition-transform">🎁</div>
                            </div>
                        </div>
                    </div>
                </DashboardLayout>
            </div>
        </RoleGuard>
    );
}
