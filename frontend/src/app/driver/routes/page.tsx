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
    MapPin,
    Navigation,
    Users,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    CircleDot,
    Inbox
} from 'lucide-react';

export default function MyBidsPage() {
    const { showToast } = useToast() as any;
    const [bids, setBids] = useState<DriverBidWithTrip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

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

    const statusConfig: Record<string, { bg: string, text: string, icon: React.ReactNode }> = {
        pending: { bg: 'bg-amber-50', text: 'text-amber-600', icon: <Clock size={14} /> },
        accepted: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle2 size={14} /> },
        rejected: { bg: 'bg-red-50', text: 'text-red-500', icon: <XCircle size={14} /> },
    };

    const tripStatusConfig: Record<string, { bg: string, text: string }> = {
        pending: { bg: 'bg-amber-50', text: 'text-amber-600' },
        active: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
        completed: { bg: 'bg-slate-100', text: 'text-slate-600' },
        cancelled: { bg: 'bg-red-50', text: 'text-red-500' },
        bid_accepted: { bg: 'bg-blue-50', text: 'text-blue-600' },
        driver_assigned: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    };

    const pendingCount = bids.filter(b => b.status === 'pending').length;
    const acceptedCount = bids.filter(b => b.status === 'accepted').length;
    const rejectedCount = bids.filter(b => b.status === 'rejected').length;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <RoleGuard allowedRoles={['driver']}>
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
                            <p className="text-3xl font-black text-amber-500">{pendingCount}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Pending</p>
                        </Card>
                        <Card className="p-4 border-none shadow-sm text-center">
                            <p className="text-3xl font-black text-emerald-500">{acceptedCount}</p>
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
                                        : 'bg-card text-muted-foreground hover:bg-muted border border-card-border'
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
                            <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
                            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Loading your bids...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <Card className="text-center py-20 border-none shadow-sm">
                            <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6">
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
                                                            {/* Bid Status */}
                                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${st.bg}`}>
                                                                {st.icon}
                                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${st.text}`}>
                                                                    {bid.status}
                                                                </span>
                                                            </div>
                                                            {/* Trip Status */}
                                                            <div className={`flex items-center gap-1  px-2.5 py-1 rounded-full ${ts.bg}`}>
                                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${ts.text}`}>
                                                                    Trip: {bid.trip_status.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Route */}
                                                        <div className="space-y-2 mb-4">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-100" />
                                                                <p className="text-sm font-bold text-foreground truncate">{bid.origin_address}</p>
                                                            </div>
                                                            <div className="ml-[5px] w-[1px] h-3 bg-gradient-to-b from-indigo-300 to-red-300" />
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100" />
                                                                <p className="text-sm font-bold text-foreground truncate">{bid.dest_address}</p>
                                                            </div>
                                                        </div>

                                                        {/* Meta */}
                                                        <div className="flex items-center gap-4 text-muted-foreground">
                                                            <div className="flex items-center gap-1.5">
                                                                <Navigation size={12} className="text-indigo-500" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest">{dist} km</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Users size={12} className="text-indigo-500" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest">{bid.total_seats} Seats</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock size={12} className="text-indigo-500" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                                                    {new Date(bid.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {new Date(bid.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right: Bid Amount */}
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Your Bid</p>
                                                        <p className={`text-3xl font-black tracking-tight ${bid.status === 'accepted' ? 'text-emerald-600' :
                                                            bid.status === 'rejected' ? 'text-red-400 line-through' : 'text-indigo-600'
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
        </RoleGuard>
    );
}
