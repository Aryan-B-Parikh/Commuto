'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/hooks/useToast';
import { bidsAPI } from '@/services/api';
import { calculateDistance } from '@/utils/geoUtils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import type { DriverBidWithTrip } from '@/types/api';
import {
    Clock,
    Navigation,
    Users,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    Inbox,
    TrendingUp,
    ChevronRight,
    MessageSquare
} from 'lucide-react';

export default function MyBidsPage() {
    const { showToast } = useToast() as any;
    const [bids, setBids] = useState<DriverBidWithTrip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

    // === BUSINESS LOGIC (UNCHANGED) ===
    useEffect(() => {
        fetchBids();
    }, []);

    const fetchBids = async () => {
        try {
            setIsLoading(true);
            const data = await bidsAPI.getMyBids();
            setBids(data);
        } catch (error: any) {
            if (error?.response?.status !== 401) {
                console.error('Failed to fetch bids:', error);
                showToast('error', 'Failed to load your bids.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = filter === 'all' ? bids : bids.filter(b => b.status === filter);

    const statusConfig: Record<string, { bg: string, text: string, icon: React.ReactNode, accent: string }> = {
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: <Clock size={14} />, accent: 'border-l-amber-500' },
        accepted: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: <CheckCircle2 size={14} />, accent: 'border-l-emerald-500' },
        rejected: { bg: 'bg-red-500/10', text: 'text-red-400', icon: <XCircle size={14} />, accent: 'border-l-red-400' },
    };

    const tripStatusConfig: Record<string, { bg: string, text: string }> = {
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
        active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
        completed: { bg: 'bg-muted', text: 'text-muted-foreground' },
        cancelled: { bg: 'bg-red-500/10', text: 'text-red-400' },
        bid_accepted: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
        driver_assigned: { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
    };

    const pendingCount = bids.filter(b => b.status === 'pending').length;
    const acceptedCount = bids.filter(b => b.status === 'accepted').length;
    const rejectedCount = bids.filter(b => b.status === 'rejected').length;

    const filterTabs = [
        { key: 'all' as const, label: 'All', count: bids.length },
        { key: 'pending' as const, label: 'Pending', count: pendingCount },
        { key: 'accepted' as const, label: 'Accepted', count: acceptedCount },
        { key: 'rejected' as const, label: 'Rejected', count: rejectedCount },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0 }
    };

    // ========================= RENDER =========================
    return (
        <RoleGuard allowedRoles={['driver']}>

            {/* ═══════════════════════ MOBILE LAYOUT ═══════════════════════ */}
            <div className="md:hidden min-h-screen bg-background pb-24">
                <DashboardLayout userType="driver" title="My Trips">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-1">

                        {/* ── Page Heading ── */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-black text-foreground tracking-tight">My Trips</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">{bids.length} total bid{bids.length !== 1 ? 's' : ''}</p>
                        </div>

                        {/* ── Mobile Stats: 2×2 Grid ── */}
                        <div className="mb-6">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Total Bids */}
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <div className="bg-gradient-to-br from-indigo-500/15 to-indigo-600/5 rounded-2xl p-5 border border-indigo-500/20 h-full">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-3">
                                            <TrendingUp size={20} className="text-indigo-400" />
                                        </div>
                                        <p className="text-3xl font-black text-foreground leading-none">{bids.length}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Total Bids</p>
                                    </div>
                                </motion.div>
                                {/* Pending */}
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 rounded-2xl p-5 border border-amber-500/20 h-full">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center mb-3">
                                            <Clock size={20} className="text-amber-400" />
                                        </div>
                                        <p className="text-3xl font-black text-amber-400 leading-none">{pendingCount}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Pending</p>
                                    </div>
                                </motion.div>
                                {/* Accepted */}
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 rounded-2xl p-5 border border-emerald-500/20 h-full">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
                                            <CheckCircle2 size={20} className="text-emerald-400" />
                                        </div>
                                        <p className="text-3xl font-black text-emerald-400 leading-none">{acceptedCount}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Accepted</p>
                                    </div>
                                </motion.div>
                                {/* Rejected */}
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <div className="bg-gradient-to-br from-red-500/15 to-red-600/5 rounded-2xl p-5 border border-red-500/20 h-full">
                                        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center mb-3">
                                            <XCircle size={20} className="text-red-400" />
                                        </div>
                                        <p className="text-3xl font-black text-red-400 leading-none">{rejectedCount}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Rejected</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* ── Mobile Filter Tabs: Scrollable Pills ── */}
                        <div className="mb-5 flex items-center gap-2">
                            <div className="flex-1 overflow-x-auto no-scrollbar">
                                <div className="flex gap-2">
                                    {filterTabs.map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setFilter(tab.key)}
                                            className={`relative px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${filter === tab.key
                                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                                : 'bg-card text-muted-foreground border border-border'
                                                }`}
                                        >
                                            {tab.label}
                                            <span className={`ml-1.5 ${filter === tab.key ? 'text-indigo-100' : 'text-muted-foreground/60'}`}>
                                                {tab.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={fetchBids}
                                className="w-10 h-10 rounded-xl bg-card hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0 active:scale-90 transition-all"
                            >
                                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {/* ── Mobile Bid Cards ── */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 size={28} className="animate-spin text-indigo-400 mb-3" />
                                <p className="text-xs text-[#6B7280] font-bold uppercase tracking-widest">Loading trips...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            /* Mobile Empty State */
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="bg-card rounded-2xl border border-border py-16 px-6 text-center">
                                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Inbox size={28} className="text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">
                                        {filter === 'all' ? 'No trips yet' : `No ${filter} trips`}
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                        {filter === 'all'
                                            ? 'Start bidding on ride requests to see your trips here.'
                                            : `You don't have any ${filter} bids right now.`}
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {filtered.map(bid => {
                                        const st = statusConfig[bid.status] || statusConfig.pending;
                                        const ts = tripStatusConfig[bid.trip_status] || tripStatusConfig.pending;
                                        const dist = calculateDistance(
                                            { lat: bid.origin_lat, lng: bid.origin_lng },
                                            { lat: bid.dest_lat, lng: bid.dest_lng }
                                        ).toFixed(1);

                                        return (
                                            <motion.div
                                                key={bid.id}
                                                variants={itemVariants}
                                                layout
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {/* Premium Mobile Trip Card */}
                                                <div className={`bg-card rounded-2xl border border-border overflow-hidden border-l-[3px] ${st.accent} hover:border-accent/20 transition-colors`}>
                                                    {/* Card Header: Status + Bid Amount */}
                                                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${st.bg}`}>
                                                                {st.icon}
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${st.text}`}>
                                                                    {bid.status}
                                                                </span>
                                                            </div>
                                                            <div className={`px-2 py-1 rounded-full ${ts.bg}`}>
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${ts.text}`}>
                                                                    {bid.trip_status.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-xl font-black tracking-tight ${bid.status === 'accepted' ? 'text-emerald-400' :
                                                                bid.status === 'rejected' ? 'text-red-400 line-through' : 'text-indigo-400'
                                                                }`}>
                                                                {formatCurrency(bid.bid_amount)}
                                                            </p>
                                                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">per seat</p>
                                                        </div>
                                                    </div>

                                                    {/* Route Visualization */}
                                                    <div className="px-4 py-3">
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-border/50">
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center pt-0.5">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                                                                    <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-500/40 to-red-500/40 my-1 min-h-[20px]" />
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20" />
                                                                </div>
                                                                <div className="flex-1 min-w-0 space-y-2.5">
                                                                    <div>
                                                                        <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Pickup</p>
                                                                        <p className="text-sm text-foreground font-medium truncate">{bid.origin_address}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider">Drop-off</p>
                                                                        <p className="text-sm text-foreground font-medium truncate">{bid.dest_address}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Meta Row */}
                                                    <div className="px-4 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
                                                        <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 shrink-0">
                                                            <Navigation size={11} className="text-indigo-500" />
                                                            <span className="text-[11px] font-semibold text-muted-foreground">{dist} km</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 shrink-0">
                                                            <Users size={11} className="text-indigo-500" />
                                                            <span className="text-[11px] font-semibold text-muted-foreground">{bid.total_seats} seats</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 shrink-0">
                                                            <Clock size={11} className="text-indigo-500" />
                                                            <span className="text-[11px] font-semibold text-muted-foreground">
                                                                {new Date(bid.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {new Date(bid.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Passenger Notes */}
                                                    {bid.passenger_notes && bid.passenger_notes.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {bid.passenger_notes.map((pn, idx) => (
                                                                <div key={idx} className="flex items-start gap-2 bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
                                                                    <MessageSquare size={11} className="text-indigo-400 mt-0.5 shrink-0" />
                                                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                                        <span className="font-bold text-foreground">{pn.passenger_name}:</span> {pn.notes}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </motion.div>
                </DashboardLayout>
            </div>

            {/* ═══════════════════════ DESKTOP LAYOUT (UNCHANGED) ═══════════════════════ */}
            <div className="hidden md:block">
                <DashboardLayout userType="driver" title="My Bids">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-5xl mx-auto space-y-8"
                    >
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="p-4 border-none shadow-sm text-center">
                                <p className="text-3xl font-black text-foreground">{bids.length}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Bids</p>
                            </Card>
                            <Card className="p-4 border-none shadow-sm text-center">
                                <p className="text-3xl font-black text-amber-400">{pendingCount}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Pending</p>
                            </Card>
                            <Card className="p-4 border-none shadow-sm text-center">
                                <p className="text-3xl font-black text-emerald-400">{acceptedCount}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Accepted</p>
                            </Card>
                            <Card className="p-4 border-none shadow-sm text-center">
                                <p className="text-3xl font-black text-red-400">{rejectedCount}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Rejected</p>
                            </Card>
                        </div>

                        {/* Filter Tabs + Refresh */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {['all', 'pending', 'accepted', 'rejected'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f as any)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === f
                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                            : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                                            }`}
                                    >
                                        {f} {f === 'all' ? `(${bids.length})` : `(${bids.filter(b => b.status === f).length})`}
                                    </button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                onClick={fetchBids}
                                className="text-xs font-bold uppercase tracking-widest gap-2"
                            >
                                <RefreshCw size={14} />
                                Refresh
                            </Button>
                        </div>

                        {/* Bids List */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24">
                                <Loader2 size={32} className="animate-spin text-indigo-400 mb-4" />
                                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Loading your bids...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <Card className="text-center py-20 border-none shadow-sm">
                                <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                                    <Inbox size={36} className="text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">
                                    {filter === 'all' ? 'No bids yet' : `No ${filter} bids`}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    {filter === 'all'
                                        ? 'Start bidding on passenger ride requests from the Route Requests page.'
                                        : `You don't have any ${filter} bids at the moment.`
                                    }
                                </p>
                            </Card>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="space-y-4"
                            >
                                <AnimatePresence mode="popLayout">
                                    {filtered.map(bid => {
                                        const st = statusConfig[bid.status] || statusConfig.pending;
                                        const ts = tripStatusConfig[bid.trip_status] || tripStatusConfig.pending;
                                        const dist = calculateDistance(
                                            { lat: bid.origin_lat, lng: bid.origin_lng },
                                            { lat: bid.dest_lat, lng: bid.dest_lng }
                                        ).toFixed(1);

                                        return (
                                            <motion.div key={bid.id} variants={itemVariants} layout>
                                                <Card className="border-none shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden">
                                                    {/* Left accent */}
                                                    <div className={`absolute top-0 left-0 w-1 h-full rounded-r-full ${bid.status === 'accepted' ? 'bg-emerald-500' :
                                                        bid.status === 'rejected' ? 'bg-red-400' : 'bg-indigo-500'
                                                        }`} />

                                                    <div className="flex items-start justify-between gap-6">
                                                        {/* Left: Route Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${st.bg}`}>
                                                                    {st.icon}
                                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${st.text}`}>
                                                                        {bid.status}
                                                                    </span>
                                                                </div>
                                                                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${ts.bg}`}>
                                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${ts.text}`}>
                                                                        Trip: {bid.trip_status.replace('_', ' ')}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Route */}
                                                            <div className="space-y-2 mb-4">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-500/20" />
                                                                    <p className="text-sm font-bold text-foreground truncate">{bid.origin_address}</p>
                                                                </div>
                                                                <div className="ml-[5px] w-[1px] h-3 bg-gradient-to-b from-indigo-400 to-red-400" />
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20" />
                                                                    <p className="text-sm font-bold text-foreground truncate">{bid.dest_address}</p>
                                                                </div>
                                                            </div>

                                                            {/* Meta */}
                                                            <div className="flex items-center gap-4 text-[#9CA3AF]">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Navigation size={12} className="text-indigo-400" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{dist} km</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Users size={12} className="text-indigo-400" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{bid.total_seats} Seats</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock size={12} className="text-indigo-400" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                                                        {new Date(bid.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {new Date(bid.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Passenger Notes */}
                                                            {bid.passenger_notes && bid.passenger_notes.length > 0 && (
                                                                <div className="mt-3 space-y-1.5">
                                                                    {bid.passenger_notes.map((pn, idx) => (
                                                                        <div key={idx} className="flex items-start gap-2 bg-[#1E293B]/40 rounded-xl px-3 py-2.5 border border-[#1E293B]/30">
                                                                            <MessageSquare size={12} className="text-indigo-400 mt-0.5 shrink-0" />
                                                                            <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
                                                                                <span className="font-bold text-[#F9FAFB]">{pn.passenger_name}:</span> {pn.notes}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Right: Bid Amount */}
                                                        <div className="text-right shrink-0">
                                                            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1">Your Bid</p>
                                                            <p className={`text-3xl font-black tracking-tight ${bid.status === 'accepted' ? 'text-emerald-400' :
                                                                bid.status === 'rejected' ? 'text-red-400 line-through' : 'text-indigo-400'
                                                                }`}>
                                                                {formatCurrency(bid.bid_amount)}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Per Seat</p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </motion.div>
                </DashboardLayout>
            </div>

        </RoleGuard>
    );
}
