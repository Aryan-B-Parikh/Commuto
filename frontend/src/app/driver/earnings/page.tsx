'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    const { showToast } = useToast();
    const [data, setData] = useState<EarningsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // === BUSINESS LOGIC (UNCHANGED) ===
    const fetchEarnings = useCallback(async () => {
        try {
            setIsLoading(true);
            const earnings = await tripsAPI.getDriverEarnings();
            setData(earnings);
        } catch (error: unknown) {
            const status = typeof error === 'object' && error !== null && 'response' in error
                ? (error as { response?: { status?: number } }).response?.status
                : undefined;
            if (status !== 401) {
                console.error('Failed to fetch earnings:', error);
                showToast('error', 'Failed to load earnings.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchEarnings();
    }, [fetchEarnings]);

    if (isLoading) {
        return (
            <RoleGuard allowedRoles={['driver']}>
                <DashboardLayout userType="driver" title="Earnings">
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 size={32} className="animate-spin text-indigo-400 mb-4" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading earnings...</p>
                    </div>
                </DashboardLayout>
            </RoleGuard>
        );
    }

    const stats = data || { today: 0, this_week: 0, this_month: 0, total: 0, total_trips: 0, avg_per_trip: 0, recent_trips: [] };

    return (
        <RoleGuard allowedRoles={['driver']}>

            {/* MOBILE LAYOUT */}
            <div className="md:hidden min-h-screen bg-[#0B1020] pb-24">
                <DashboardLayout userType="driver" title="Earnings">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-1">

                        {/* Page Heading */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-black text-[#F9FAFB] tracking-tight">Earnings</h1>
                            <p className="text-sm text-[#6B7280] mt-0.5">Your revenue overview</p>
                        </div>

                        {/* Revenue Card */}
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

                        {/* Performance */}
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

                        {/* Recent Activity */}
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
                                                                {new Date(trip.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} | {new Date(trip.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} | {trip.total_seats} pax
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

            {/* DESKTOP LAYOUT */}
            <div className="hidden md:block">
                <DashboardLayout userType="driver" title="Earnings History">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-6xl mx-auto"
                    >
                        <div className="space-y-8">
                            <Card className="relative overflow-hidden border-none bg-[linear-gradient(135deg,#0f1f38,#0b3a73_58%,#1d74ff)] text-white shadow-[0_28px_54px_rgba(15,111,255,0.24)]" padding="lg">
                                <div className="absolute -right-16 -top-14 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
                                <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-sky-300/20 blur-3xl" />
                                <div className="relative z-10 grid gap-8 xl:grid-cols-[1.35fr_0.65fr] xl:items-end">
                                    <div>
                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em]">
                                            <DollarSign size={14} />
                                            Revenue Pulse
                                        </span>
                                        <p className="mt-5 text-sm text-white/80">Revenue this month</p>
                                        <h2 className="mt-1 text-6xl font-black tracking-tight">{formatCurrency(stats.this_month)}</h2>
                                        <p className="mt-3 max-w-2xl text-sm text-white/80">
                                            Keep your momentum high with one command view for daily cashflow, weekly trend, and lifetime earnings.
                                        </p>

                                        <div className="mt-7 grid gap-3 sm:grid-cols-3">
                                            {[
                                                { label: 'Today', value: formatCurrency(stats.today) },
                                                { label: 'This Week', value: formatCurrency(stats.this_week) },
                                                { label: 'All Time', value: formatCurrency(stats.total) },
                                            ].map((item) => (
                                                <div key={item.label} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">{item.label}</p>
                                                    <p className="mt-2 text-2xl font-black">{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-[26px] border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">Mission Board</p>
                                        <div className="mt-5 space-y-4">
                                            <div>
                                                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                                                    <span>Total Trips</span>
                                                    <span className="text-base text-white">{stats.total_trips}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-white/15">
                                                    <div className="h-full rounded-full bg-sky-300" style={{ width: `${Math.min(stats.total_trips * 2, 100)}%` }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                                                    <span>Avg / Trip</span>
                                                    <span className="text-base text-white">{formatCurrency(stats.avg_per_trip)}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-white/15">
                                                    <div className="h-full rounded-full bg-violet-300" style={{ width: `${Math.min((stats.avg_per_trip / 50) * 100, 100)}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div>
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-display font-bold text-foreground">Recent Activity</h2>
                                    <Button variant="ghost" size="sm" onClick={fetchEarnings} className="gap-2 text-primary">
                                        <RefreshCw size={14} />
                                        Refresh
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {stats.recent_trips.length > 0 ? (
                                        stats.recent_trips.map((trip, index) => (
                                            <motion.div
                                                key={trip.id}
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.06 }}
                                            >
                                                <Card hoverable className="border-none px-5 py-5">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="min-w-0 flex items-center gap-4">
                                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                                <Car size={20} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                                                    <MapPin size={13} className="text-emerald-400" />
                                                                    <p className="truncate">{trip.origin_address}</p>
                                                                </div>
                                                                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Navigation size={13} className="text-rose-400" />
                                                                    <p className="truncate">{trip.dest_address}</p>
                                                                </div>
                                                                <p className="mt-2 text-xs font-medium text-muted-foreground">
                                                                    {new Date(trip.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} | {new Date(trip.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} | {trip.total_seats} pax
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-500">Earned</span>
                                                            <p className="mt-2 text-2xl font-black text-emerald-500">+{formatCurrency(trip.earning)}</p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <Card className="text-center py-16 border-none shadow-sm">
                                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                                <Inbox size={28} className="text-primary" />
                                            </div>
                                            <h3 className="text-lg font-bold text-foreground mb-1">No trips yet</h3>
                                            <p className="text-sm text-muted-foreground">Complete trips to start earning.</p>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </DashboardLayout>
            </div>

        </RoleGuard>
    );
}
