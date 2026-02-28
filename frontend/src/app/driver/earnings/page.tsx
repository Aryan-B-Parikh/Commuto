'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { tripsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import {
    TrendingUp,
    Calendar,
    Car,
    Loader2,
    Inbox,
    RefreshCw,
    DollarSign,
    MapPin,
    Navigation,
    Wallet
} from 'lucide-react';

interface EarningsTrip {
    id: string;
    origin_address: string;
    dest_address: string;
    start_time: string;
    total_seats: number;
    earning: number;
    status: string;
}

interface EarningsData {
    today: number;
    this_week: number;
    this_month: number;
    total: number;
    total_trips: number;
    avg_per_trip: number;
    recent_trips: EarningsTrip[];
}

export default function DriverEarningsPage() {
    const { showToast } = useToast() as any;
    const [data, setData] = useState<EarningsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // === BUSINESS LOGIC (UNCHANGED) ===
    const fetchEarnings = async () => {
        try {
            setIsLoading(true);
            const earnings = await tripsAPI.getDriverEarnings();
            setData(earnings);
        } catch (error: any) {
            if (error?.response?.status !== 401) {
                console.error('Failed to fetch earnings:', error);
                showToast('error', 'Failed to load earnings.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEarnings();
    }, []);

    if (isLoading) {
        return (
            <RoleGuard allowedRoles={['driver']}>
                <DashboardLayout userType="driver" title="Earnings">
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 size={32} className="animate-spin text-indigo-400 mb-4" />
                        <p className="text-sm font-bold text-[#9CA3AF] uppercase tracking-widest">Loading earnings...</p>
                    </div>
                </DashboardLayout>
            </RoleGuard>
        );
    }

    const stats = data || { today: 0, this_week: 0, this_month: 0, total: 0, total_trips: 0, avg_per_trip: 0, recent_trips: [] };

    return (
        <RoleGuard allowedRoles={['driver']}>

            {/* ═══════════════════════ MOBILE LAYOUT ═══════════════════════ */}
            <div className="md:hidden min-h-screen bg-[#0B1020] pb-24">
                <DashboardLayout userType="driver" title="Earnings">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-1">

                        {/* ── Page Heading ── */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-black text-[#F9FAFB] tracking-tight">Earnings</h1>
                            <p className="text-sm text-[#6B7280] mt-0.5">Your revenue overview</p>
                        </div>

                        {/* ── 1️⃣ Revenue Card — Hero Section ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6"
                        >
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-6 shadow-xl shadow-indigo-500/20">
                                {/* Decorative glow circles */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-16 -mb-16" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                                            <Wallet size={16} className="text-white" />
                                        </div>
                                        <p className="text-sm font-bold text-white/70 uppercase tracking-wider">Revenue This Month</p>
                                    </div>
                                    <p className="text-4xl font-black text-white mb-6 tracking-tight">{formatCurrency(stats.this_month)}</p>

                                    {/* Stats Row: 3 mini cards */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                                            <p className="text-lg font-black text-white leading-none">{formatCurrency(stats.today)}</p>
                                            <p className="text-[9px] text-white/60 uppercase tracking-wider mt-1 font-bold">Today</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                                            <p className="text-lg font-black text-white leading-none">{formatCurrency(stats.this_week)}</p>
                                            <p className="text-[9px] text-white/60 uppercase tracking-wider mt-1 font-bold">This Week</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                                            <p className="text-lg font-black text-white leading-none">{formatCurrency(stats.total)}</p>
                                            <p className="text-[9px] text-white/60 uppercase tracking-wider mt-1 font-bold">All Time</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── 2️⃣ Performance — Compact Row ── */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/5 rounded-2xl p-5 border border-blue-500/20 h-full">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-3">
                                        <Calendar size={20} className="text-blue-400" />
                                    </div>
                                    <p className="text-3xl font-black text-[#F9FAFB] leading-none">{stats.total_trips}</p>
                                    <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mt-1.5">Total Trips</p>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 rounded-2xl p-5 border border-emerald-500/20 h-full">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
                                        <TrendingUp size={20} className="text-emerald-400" />
                                    </div>
                                    <p className="text-3xl font-black text-emerald-400 leading-none">{formatCurrency(stats.avg_per_trip)}</p>
                                    <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mt-1.5">Avg / Trip</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* ── 3️⃣ Recent Activity ── */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-[#F9FAFB]">Recent Activity</h2>
                                <button
                                    onClick={fetchEarnings}
                                    className="w-9 h-9 rounded-xl bg-[#1E293B] hover:bg-[#374151] flex items-center justify-center text-[#9CA3AF] active:scale-90 transition-all"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {stats.recent_trips.length > 0 ? (
                                    stats.recent_trips.map((trip, index) => (
                                        <motion.div
                                            key={trip.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + index * 0.06 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="bg-[#111827] rounded-2xl border border-[#1E293B] p-4 hover:border-[#374151] transition-colors">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                                            <Car size={18} className="text-indigo-400" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            {/* Route */}
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <MapPin size={10} className="text-emerald-400 shrink-0" />
                                                                <p className="text-sm font-semibold text-[#F9FAFB] truncate">{trip.origin_address}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Navigation size={10} className="text-red-400 shrink-0" />
                                                                <p className="text-xs text-[#6B7280] truncate">{trip.dest_address}</p>
                                                            </div>
                                                            {/* Meta */}
                                                            <p className="text-[10px] text-[#4B5563] mt-1.5">
                                                                {new Date(trip.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {new Date(trip.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • {trip.total_seats} pax
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* Earning amount */}
                                                    <div className="shrink-0 text-right">
                                                        <p className="text-lg font-black text-emerald-400 leading-none">+{formatCurrency(trip.earning)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="bg-[#111827] rounded-2xl border border-[#1E293B] py-14 px-6 text-center">
                                        <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                                            <Inbox size={24} className="text-indigo-400" />
                                        </div>
                                        <h3 className="text-base font-bold text-[#F9FAFB] mb-1">No trips yet</h3>
                                        <p className="text-sm text-[#6B7280]">Complete trips to start earning.</p>
                                    </div>
                                )}
                            </div>
                        </div>



                    </motion.div>
                </DashboardLayout>
            </div>

            {/* ═══════════════════════ DESKTOP LAYOUT (UNCHANGED) ═══════════════════════ */}
            <div className="hidden md:block">
                <DashboardLayout userType="driver" title="Earnings History">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-5xl mx-auto"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Stats Column */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Monthly Overview Card */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className="relative overflow-hidden border-none shadow-sm">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

                                        <div className="flex flex-col items-center py-8">
                                            <p className="text-sm font-bold text-[#9CA3AF] mb-2 uppercase tracking-widest">Revenue This Month</p>
                                            <p className="text-5xl font-black text-indigo-400">{formatCurrency(stats.this_month)}</p>
                                        </div>

                                        <div className="grid grid-cols-3 border-t border-[#1E293B]">
                                            <div className="p-6 text-center border-r border-[#1E293B]">
                                                <p className="text-2xl font-black text-[#F9FAFB]">{formatCurrency(stats.today)}</p>
                                                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-1">Today</p>
                                            </div>
                                            <div className="p-6 text-center border-r border-[#1E293B]">
                                                <p className="text-2xl font-black text-[#F9FAFB]">{formatCurrency(stats.this_week)}</p>
                                                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-1">This Week</p>
                                            </div>
                                            <div className="p-6 text-center">
                                                <p className="text-2xl font-black text-[#F9FAFB]">{formatCurrency(stats.total)}</p>
                                                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-1">All Time</p>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>

                                {/* Recent Transactions */}
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-[#F9FAFB]">Recent Activity</h2>
                                        <button
                                            onClick={fetchEarnings}
                                            className="text-sm font-bold text-indigo-400 hover:underline flex items-center gap-1.5"
                                        >
                                            <RefreshCw size={14} />
                                            Refresh
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {stats.recent_trips.length > 0 ? (
                                            stats.recent_trips.map((trip, index) => (
                                                <motion.div
                                                    key={trip.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.08 }}
                                                >
                                                    <Card hoverable className="border-none shadow-sm px-6 py-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                                    <Car size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-[#F9FAFB] leading-tight text-sm">
                                                                        {trip.origin_address} → {trip.dest_address}
                                                                    </p>
                                                                    <p className="text-xs text-[#9CA3AF] font-medium mt-0.5">
                                                                        {new Date(trip.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {new Date(trip.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • {trip.total_seats} pax
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="text-xl font-black text-emerald-400">
                                                                +{formatCurrency(trip.earning)}
                                                            </span>
                                                        </div>
                                                    </Card>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <Card className="text-center py-16 border-none shadow-sm">
                                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                                    <Inbox size={28} className="text-indigo-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-[#F9FAFB] mb-1">No trips yet</h3>
                                                <p className="text-sm text-[#9CA3AF]">Complete trips to start earning.</p>
                                            </Card>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Column */}
                            <div className="space-y-6">
                                {/* Performance Metrics */}
                                <Card className="border-none shadow-sm">
                                    <h3 className="text-lg font-bold text-[#F9FAFB] mb-6">Performance</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <Calendar size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-end mb-1">
                                                    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Total Trips</p>
                                                    <p className="text-lg font-black text-[#F9FAFB]">{stats.total_trips}</p>
                                                </div>
                                                <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(stats.total_trips * 2, 100)}%` }} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                <TrendingUp size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-end mb-1">
                                                    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Avg / Trip</p>
                                                    <p className="text-lg font-black text-[#F9FAFB]">{formatCurrency(stats.avg_per_trip)}</p>
                                                </div>
                                                <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((stats.avg_per_trip / 50) * 100, 100)}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>


                            </div>
                        </div>
                    </motion.div>
                </DashboardLayout>
            </div>

        </RoleGuard>
    );
}
