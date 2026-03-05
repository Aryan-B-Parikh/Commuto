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
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredRequests = requests.filter(request =>
        request.origin_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.dest_address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <RoleGuard allowedRoles={['driver']}>

            {/* ====================== MOBILE LAYOUT ====================== */}
            <div className="lg:hidden min-h-screen bg-background flex flex-col relative">

                {/* 1️⃣ Mobile Header */}
                <div className="sticky top-0 z-30 bg-background border-b border-card-border px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-indigo-400">
                                {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground leading-tight">
                                {user?.name ? `Hey, ${user.name.split(' ')[0]}` : 'Driver'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                {isOnline ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <button className="relative p-2 hover:bg-muted rounded-xl transition-colors">
                        <Bell size={20} className="text-muted-foreground" />
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
                                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${isOnline ? 'bg-emerald-500' : 'bg-muted'}`}
                                >
                                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${isOnline ? 'left-[22px]' : 'left-0.5'}`} />
                                </button>
                                <div>
                                    <p className="text-xs font-bold text-foreground">{isOnline ? 'Online' : 'Offline'}</p>
                                    <p className="text-[10px] text-muted-foreground/60">{isOnline ? 'Accepting rides' : 'Not accepting'}</p>
                                </div>
                            </div>

                            {/* Today's Earnings */}
                            <div className="flex items-center gap-2 bg-muted/80 rounded-xl px-3 py-2">
                                <DollarSign size={14} className="text-emerald-400" />
                                <div>
                                    <p className="text-xs font-black text-emerald-400 leading-tight">{formatCurrency(earnings?.today || 0)}</p>
                                    <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Today</p>
                                </div>
                            </div>

                            {/* Status Indicator */}
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2.5 w-2.5">
                                    {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-muted'}`} />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3️⃣ MAP — Main Hero Section */}
                <div className="flex-1 relative min-h-[65vh]">
                    <MapWidget showSearch={true} />

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
                    className="fixed bottom-0 left-0 right-0 z-20 bg-card rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)] border-t border-card-border"
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
                        <div className="w-10 h-1 rounded-full bg-muted mb-1" />
                        <ChevronUp
                            size={16}
                            className={`text-muted-foreground/60 transition-transform duration-200 ${sheetExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>

                    <div className="px-5 pb-20 overflow-y-auto max-h-[calc(70vh-48px)]">

                        {/* Section A: Incoming Requests */}
                        {requests.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-foreground">Incoming Requests</h3>
                                        <span className="bg-red-500/15 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {filteredRequests.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Mobile Search Bar */}
                                <div className="relative mb-4">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="block w-full pl-9 pr-4 py-2 bg-background border border-card-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        placeholder="Search by location..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    {filteredRequests.slice(0, sheetExpanded ? 10 : 2).map((request, idx) => (
                                        <motion.div
                                            key={request.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Link href="/driver/requests">
                                                <div className="bg-background p-4 rounded-2xl border border-card-border active:scale-[0.98] transition-transform relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-r" />
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-sm">
                                                            {request.seats_requested}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <MapPin size={10} className="text-indigo-400 shrink-0" />
                                                                <p className="text-sm font-medium text-foreground truncate">{request.origin_address}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Navigation size={10} className="text-red-400 shrink-0" />
                                                                <p className="text-xs text-muted-foreground/60 truncate">{request.dest_address}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-xs font-bold text-muted-foreground">
                                                                {new Date(request.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
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
                                    <div key={i} className="h-16 bg-background animate-pulse rounded-2xl border border-card-border" />
                                ))}
                            </div>
                        )}

                        {!isLoading && filteredRequests.length === 0 && (
                            <div className="text-center py-6 mb-4">
                                <p className="text-muted-foreground/60 text-sm">
                                    {searchQuery ? 'No matching requests' : 'No incoming requests right now'}
                                </p>
                            </div>
                        )}

                        {/* Section B: Quick Stats Row — Premium Cards */}
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            <motion.div whileTap={{ scale: 0.95 }} className="bg-gradient-to-br from-indigo-500/15 to-indigo-600/5 rounded-2xl p-4 border border-indigo-500/15 text-center">
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center mx-auto mb-2">
                                    <DollarSign size={18} className="text-indigo-400" />
                                </div>
                                <p className="text-xl font-black text-foreground leading-none">{formatCurrency(earnings?.this_month || 0)}</p>
                                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mt-1.5 font-bold">This Month</p>
                            </motion.div>
                            <motion.div whileTap={{ scale: 0.95 }} className="bg-gradient-to-br from-blue-500/15 to-blue-600/5 rounded-2xl p-4 border border-blue-500/15 text-center">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center mx-auto mb-2">
                                    <Car size={18} className="text-blue-400" />
                                </div>
                                <p className="text-xl font-black text-foreground leading-none">{earnings?.total_trips || 0}</p>
                                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mt-1.5 font-bold">Total Trips</p>
                            </motion.div>
                            <motion.div whileTap={{ scale: 0.95 }} className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 rounded-2xl p-4 border border-amber-500/15 text-center">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center mx-auto mb-2">
                                    <Star size={18} className="text-amber-400" />
                                </div>
                                <p className="text-xl font-black text-foreground leading-none">{formatCurrency(earnings?.avg_per_trip || 0)}</p>
                                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mt-1.5 font-bold">Avg / Trip</p>
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
                        <div className="lg:col-span-2 h-[500px] rounded-2xl overflow-hidden border border-card-border shadow-sm relative z-0">
                            <div className="absolute top-4 left-4 z-[10] bg-card/90 backdrop-blur-md px-4 py-2 rounded-xl border border-card-border shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">You are Online</span>
                                </div>
                            </div>

                            <MapWidget showSearch={true} />

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
                                <h2 className="text-lg font-bold text-foreground">Incoming Requests</h2>
                                {filteredRequests.length > 0 && (
                                    <span className="bg-red-500/15 text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                                        {filteredRequests.length} Result{filteredRequests.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            {/* Desktop Search Bar */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-muted-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 border border-card-border rounded-xl leading-5 bg-card focus:bg-card/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all duration-200 text-sm text-foreground placeholder:text-muted-foreground font-medium"
                                    placeholder="Search pickup or destination..."
                                />
                            </div>

                            <div className="space-y-4">
                                {isLoading ? (
                                    [1, 2].map(i => (
                                        <div key={i} className="h-[200px] w-full bg-card/50 animate-pulse rounded-2xl border border-card-border" />
                                    ))
                                ) : filteredRequests.length > 0 ? (
                                    filteredRequests.slice(0, 5).map((request) => (
                                        <div key={request.id} className="bg-card p-5 rounded-2xl border border-card-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>

                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-xs">
                                                        {request.seats_requested}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">Passenger ID: {request.id.substring(0, 5)}</p>
                                                        <p className="text-xs text-muted-foreground">Pending Approval</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground">
                                                    {new Date(request.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <div className="space-y-3 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                    <p className="text-sm text-muted-foreground truncate">{request.origin_address}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <p className="text-sm text-muted-foreground truncate">{request.dest_address}</p>
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
                                    <div className="text-center py-10 bg-muted/10 rounded-2xl border-2 border-dashed border-card-border">
                                        <p className="text-muted-foreground text-sm">
                                            {searchQuery ? 'No matching requests found' : 'No incoming requests'}
                                        </p>
                                    </div>
                                )}

                                {filteredRequests.length > 5 && (
                                    <Link href="/driver/requests" className="block text-center text-sm font-bold text-indigo-400 hover:underline pt-2">
                                        View all {filteredRequests.length} results
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
