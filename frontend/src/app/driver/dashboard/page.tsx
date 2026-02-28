"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { MapWidget } from '@/components/map/MapWidget';
import { tripsAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/formatters';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { DriverBottomNav } from '@/components/layout/DriverBottomNav';
import { ChevronUp, Navigation, DollarSign, Car, Star, Bell, MapPin } from 'lucide-react';

export default function DriverDashboard() {
    const router = useRouter();
    const [requests, setRequests] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { showToast } = useToast() as any;
    const [earnings, setEarnings] = useState<any>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [sheetExpanded, setSheetExpanded] = useState(false);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const driverTrips = await tripsAPI.getDriverTrips();
                const activeTrip = driverTrips.find((t: TripResponse) => ['active', 'driver_assigned', 'bid_accepted'].includes(t.status));
                if (activeTrip) {
                    router.push('/driver/live');
                    return;
                }

                let ignoredIds: string[] = [];
                try {
                    ignoredIds = JSON.parse(localStorage.getItem('ignored_requests') || '[]');
                } catch { ignoredIds = []; }

                const [data, earningsData] = await Promise.all([
                    tripsAPI.getOpenRides(),
                    tripsAPI.getDriverEarnings(),
                ]);
                setRequests(data.filter(r => !ignoredIds.includes(r.id)));
                setEarnings(earningsData);
            } catch (error: any) {
                if (error?.response?.status !== 401) {
                    console.error('Failed to fetch requests:', error);
                    showToast('error', 'Failed to load requests.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, []);

    return (
        <RoleGuard allowedRoles={['driver']}>

            {/* ====================== MOBILE LAYOUT ====================== */}
            <div className="lg:hidden min-h-screen bg-[#0B1020] flex flex-col relative">

                {/* 1️⃣ Mobile Header */}
                <div className="sticky top-0 z-30 bg-[#0B1020] border-b border-[#1E293B] px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-indigo-400">
                                {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#F9FAFB] leading-tight">
                                {user?.name ? `Hey, ${user.name.split(' ')[0]}` : 'Driver'}
                            </p>
                            <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wider">
                                {isOnline ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <button className="relative p-2 hover:bg-[#1E293B] rounded-xl transition-colors">
                        <Bell size={20} className="text-[#9CA3AF]" />
                        {requests.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                    </button>
                </div>

                {/* 2️⃣ Floating Status Bar */}
                <div className="absolute top-16 left-4 right-4 z-20">
                    <div className="bg-[#111827]/90 backdrop-blur-xl rounded-2xl px-4 py-3 border border-[#1E293B] shadow-lg shadow-black/20">
                        <div className="flex items-center justify-between">
                            {/* Online Toggle */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsOnline(!isOnline)}
                                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${isOnline ? 'bg-emerald-500' : 'bg-[#374151]'}`}
                                >
                                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${isOnline ? 'left-[22px]' : 'left-0.5'}`} />
                                </button>
                                <div>
                                    <p className="text-xs font-bold text-[#F9FAFB]">{isOnline ? 'Online' : 'Offline'}</p>
                                    <p className="text-[10px] text-[#6B7280]">{isOnline ? 'Accepting rides' : 'Not accepting'}</p>
                                </div>
                            </div>

                            {/* Today's Earnings */}
                            <div className="flex items-center gap-2 bg-[#1E293B]/80 rounded-xl px-3 py-2">
                                <DollarSign size={14} className="text-emerald-400" />
                                <div>
                                    <p className="text-xs font-black text-emerald-400 leading-tight">{formatCurrency(earnings?.today || 0)}</p>
                                    <p className="text-[9px] text-[#6B7280] uppercase tracking-wider">Today</p>
                                </div>
                            </div>

                            {/* Status Indicator */}
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2.5 w-2.5">
                                    {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-[#374151]'}`} />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3️⃣ MAP — Main Hero Section */}
                <div className="flex-1 relative min-h-[65vh]">
                    <MapWidget />

                    {/* Scanning Overlay */}
                    {isOnline && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-indigo-500/90 backdrop-blur-sm text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 border border-indigo-400/30"
                            >
                                <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Scanning Area...
                            </motion.button>
                        </div>
                    )}
                </div>

                {/* 4️⃣ Mobile Bottom Sheet */}
                <motion.div
                    className="fixed bottom-0 left-0 right-0 z-20 bg-[#111827] rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)] border-t border-[#1E293B]"
                    animate={{
                        height: sheetExpanded ? '70vh' : requests.length > 0 ? '280px' : '220px',
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Handle */}
                    <button
                        onClick={() => setSheetExpanded(!sheetExpanded)}
                        className="w-full flex flex-col items-center pt-3 pb-2"
                    >
                        <div className="w-10 h-1 rounded-full bg-[#374151] mb-1" />
                        <ChevronUp
                            size={16}
                            className={`text-[#6B7280] transition-transform duration-200 ${sheetExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>

                    <div className="px-5 pb-20 overflow-y-auto max-h-[calc(70vh-48px)]">

                        {/* Section A: Incoming Requests */}
                        {requests.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-[#F9FAFB]">Incoming Requests</h3>
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {requests.length}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {requests.slice(0, sheetExpanded ? 5 : 2).map((request, idx) => (
                                        <motion.div
                                            key={request.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Link href="/driver/requests">
                                                <div className="bg-[#111827] p-3 rounded-xl border border-[#1E293B] active:scale-[0.98] transition-transform flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-sm shrink-0">
                                                        {request.seats_requested}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                                            <p className="text-sm font-medium text-[#F9FAFB] truncate">{request.origin_address}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                                            <p className="text-xs text-[#6B7280] truncate">{request.dest_address}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-xs font-bold text-[#9CA3AF]">
                                                            {new Date(request.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="space-y-3 mb-5">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-16 bg-[#0B1020] animate-pulse rounded-2xl border border-[#1E293B]" />
                                ))}
                            </div>
                        )}

                        {!isLoading && requests.length === 0 && (
                            <div className="text-center py-6 mb-4">
                                <p className="text-[#6B7280] text-sm">No incoming requests right now</p>
                            </div>
                        )}

                        {/* Section B: Quick Stats Row — Compact Pills */}
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <motion.div whileTap={{ scale: 0.95 }} className="bg-[#111827] rounded-xl p-3 border border-[#1E293B] text-center flex flex-col items-center justify-center h-[76px]">
                                <DollarSign size={16} className="text-indigo-400 mb-1" />
                                <p className="text-sm font-black text-[#F9FAFB] leading-none mb-0.5">{formatCurrency(earnings?.this_month || 0)}</p>
                                <p className="text-[9px] text-[#6B7280] uppercase tracking-wider font-bold">This Month</p>
                            </motion.div>
                            <motion.div whileTap={{ scale: 0.95 }} className="bg-[#111827] rounded-xl p-3 border border-[#1E293B] text-center flex flex-col items-center justify-center h-[76px]">
                                <Car size={16} className="text-blue-400 mb-1" />
                                <p className="text-sm font-black text-[#F9FAFB] leading-none mb-0.5">{earnings?.total_trips || 0}</p>
                                <p className="text-[9px] text-[#6B7280] uppercase tracking-wider font-bold">Total Trips</p>
                            </motion.div>
                            <motion.div whileTap={{ scale: 0.95 }} className="bg-[#111827] rounded-xl p-3 border border-[#1E293B] text-center flex flex-col items-center justify-center h-[76px]">
                                <Star size={16} className="text-amber-400 mb-1" />
                                <p className="text-sm font-black text-[#F9FAFB] leading-none mb-0.5">{formatCurrency(earnings?.avg_per_trip || 0)}</p>
                                <p className="text-[9px] text-[#6B7280] uppercase tracking-wider font-bold">Avg / Trip</p>
                            </motion.div>
                        </div>

                        {/* Section C: Primary Action Area */}
                        <div className="flex flex-col gap-3">
                            <Link href="/driver/requests" className="w-full">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full h-[52px] bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-[14px] text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center"
                                >
                                    View Requests
                                </motion.button>
                            </Link>
                            <Link href="/driver/earnings" className="w-full">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full h-[52px] bg-[#0B1020] text-[#F9FAFB] font-bold rounded-[14px] text-sm border border-indigo-500/30 flex items-center justify-center"
                                >
                                    Earnings
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* 5️⃣ Bottom Navigation */}
                <DriverBottomNav />
            </div>

            {/* ====================== DESKTOP LAYOUT (UNCHANGED) ====================== */}
            <div className="hidden lg:block">
                <DashboardLayout userType="driver" title="Driver Command Center">

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            label="Today's Earnings"
                            value={formatCurrency(earnings?.today || 0)}
                            trend={(earnings?.today ?? 0) > 0 ? "Active today" : "No earnings yet"}
                            trendUp={(earnings?.today ?? 0) > 0}
                            icon={<span className="text-2xl">💰</span>}
                            color="indigo"
                        />
                        <StatCard
                            label="Rides Completed"
                            value={(earnings?.total_trips || 0).toString()}
                            trend="Lifetime trips"
                            trendUp={true}
                            icon={<span className="text-2xl">🚗</span>}
                            color="blue"
                        />
                        <StatCard
                            label="This Month"
                            value={formatCurrency(earnings?.this_month || 0)}
                            trend="Monthly revenue"
                            icon={<span className="text-2xl">📊</span>}
                            color="purple"
                        />
                        <StatCard
                            label="Avg / Trip"
                            value={formatCurrency(earnings?.avg_per_trip || 0)}
                            trend={(earnings?.avg_per_trip ?? 0) > 0 ? "Per ride average" : "Complete trips to see"}
                            trendUp={(earnings?.avg_per_trip ?? 0) > 0}
                            icon={<span className="text-2xl">⭐</span>}
                            color="orange"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Main Map Area */}
                        <div className="lg:col-span-2 h-[500px] rounded-2xl overflow-hidden border border-[#1E293B] shadow-sm relative z-0">
                            <div className="absolute top-4 left-4 z-[10] bg-[#111827]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-[#1E293B] shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                    </span>
                                    <span className="text-sm font-semibold text-[#F9FAFB]">You are Online</span>
                                </div>
                            </div>

                            <MapWidget />

                            {/* "Scan for Riders" Overlay */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
                                <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-500/40 transition-all flex items-center gap-2">
                                    <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Scanning Area...
                                </button>
                            </div>
                        </div>

                        {/* Requests Side Panel */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-[#F9FAFB]">Incoming Requests</h2>
                                {requests.length > 0 && (
                                    <span className="bg-red-500/15 text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                                        {requests.length} New
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {isLoading ? (
                                    [1, 2].map(i => (
                                        <div key={i} className="h-[200px] w-full bg-[#111827]/50 animate-pulse rounded-2xl border border-[#1E293B]" />
                                    ))
                                ) : requests.length > 0 ? (
                                    requests.slice(0, 3).map((request) => (
                                        <div key={request.id} className="bg-[#111827] p-5 rounded-2xl border border-[#1E293B] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>

                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-xs">
                                                        {request.seats_requested}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#F9FAFB]">Passenger ID: {request.id.substring(0, 5)}</p>
                                                        <p className="text-xs text-[#9CA3AF]">Pending Approval</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-[#9CA3AF]">
                                                    {new Date(request.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <div className="space-y-3 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                    <p className="text-sm text-[#9CA3AF] truncate">{request.origin_address}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <p className="text-sm text-[#9CA3AF] truncate">{request.dest_address}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Link href="/driver/requests" className="flex-1">
                                                    <button className="w-full bg-indigo-500 text-white font-bold py-2 rounded-xl hover:bg-indigo-600 transition-colors shadow-sm text-sm">
                                                        Review Details
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 bg-[#1E293B]/10 rounded-2xl border-2 border-dashed border-[#1E293B]">
                                        <p className="text-[#9CA3AF] text-sm">No incoming requests</p>
                                    </div>
                                )}

                                {requests.length > 3 && (
                                    <Link href="/driver/requests" className="block text-center text-sm font-bold text-indigo-400 hover:underline pt-2">
                                        View all {requests.length} requests
                                    </Link>
                                )}
                            </div>

                        </div>
                    </div>
                </DashboardLayout>
            </div>

        </RoleGuard>
    );
}
