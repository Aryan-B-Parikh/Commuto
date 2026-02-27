'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { tripsAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { BidModal } from '@/components/ride/BidModal';
import { calculateDistance } from '@/utils/geoUtils';
import {
    MapPin,
    Navigation,
    Clock,
    Users,
    CheckCircle2,
    RefreshCw,
    Wifi,
    MapPinned,
    Sparkles,
    ChevronRight,
    X
} from 'lucide-react';

export default function DriverRequestsPage() {
    const router = useRouter();
    const { showToast } = useToast() as any;
    const [requests, setRequests] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTrip, setSelectedTrip] = useState<TripResponse | null>(null);
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);

    // === BUSINESS LOGIC (UNCHANGED) ===
    const getIgnoredIds = (): string[] => {
        try {
            return JSON.parse(localStorage.getItem('ignored_requests') || '[]');
        } catch {
            return [];
        }
    };

    const addIgnoredId = (id: string) => {
        const ignored = getIgnoredIds();
        if (!ignored.includes(id)) {
            ignored.push(id);
            localStorage.setItem('ignored_requests', JSON.stringify(ignored));
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setIsLoading(true);
            const data = await tripsAPI.getOpenRides();
            const ignored = getIgnoredIds();
            setRequests(data.filter(r => !ignored.includes(r.id)));
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            showToast('error', 'Failed to load requests.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = (id: string, action: 'approve' | 'reject') => {
        const trip = requests.find(r => r.id === id);
        if (action === 'approve' && trip) {
            setSelectedTrip(trip);
            setIsBidModalOpen(true);
        } else {
            addIgnoredId(id);
            showToast('info', 'Request ignored');
            setRequests(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleBidPlaced = () => {
        if (selectedTrip) {
            setRequests(prev => prev.filter(r => r.id !== selectedTrip.id));
        }
    };

    // Calculate time-ago for display
    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <RoleGuard allowedRoles={['driver']}>
            <DashboardLayout userType="driver" title="Ride Requests">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-2xl mx-auto px-4 pb-24"
                >
                    {/* ─── Header Section ─── */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-[#F9FAFB] tracking-tight">Ride Requests</h1>
                                <p className="text-sm text-[#6B7280] mt-0.5">
                                    {isLoading ? 'Loading...' : `${requests.length} pending request${requests.length !== 1 ? 's' : ''}`}
                                </p>
                            </div>
                            <button
                                onClick={fetchRequests}
                                className="w-10 h-10 rounded-xl bg-[#1E293B] hover:bg-[#374151] flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] transition-all active:scale-90"
                            >
                                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {/* Live indicator */}
                        {!isLoading && requests.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-xs font-medium text-emerald-400">Live • New requests available</span>
                            </motion.div>
                        )}
                    </div>

                    {/* ─── Content ─── */}
                    <AnimatePresence mode="popLayout">
                        {/* Loading Skeletons */}
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <motion.div
                                        key={`skeleton-${i}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="rounded-2xl border border-[#1E293B] overflow-hidden"
                                    >
                                        <div className="h-4 bg-[#1E293B]/50 w-1/3 rounded m-5 animate-pulse" />
                                        <div className="px-5 space-y-3 pb-5">
                                            <div className="h-12 bg-[#1E293B]/30 rounded-xl animate-pulse" />
                                            <div className="h-12 bg-[#1E293B]/30 rounded-xl animate-pulse" />
                                            <div className="flex gap-3 pt-2">
                                                <div className="h-12 flex-1 bg-[#1E293B]/30 rounded-xl animate-pulse" />
                                                <div className="h-12 flex-1 bg-[#1E293B]/30 rounded-xl animate-pulse" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            /* ─── Request Cards ─── */
                        ) : requests.length > 0 ? (
                            <div className="space-y-4">
                                {requests.map((request, index) => {
                                    const dist = calculateDistance(
                                        { lat: request.origin_lat, lng: request.origin_lng },
                                        { lat: request.dest_lat, lng: request.dest_lng }
                                    ).toFixed(1);
                                    const estimatedFare = (request.price_per_seat || 0) * (request.seats_requested || 1);

                                    return (
                                        <motion.div
                                            key={request.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100, scale: 0.95 }}
                                            transition={{ duration: 0.25, delay: index * 0.06 }}
                                            layout
                                        >
                                            <div className="bg-[#111827] rounded-2xl border border-[#1E293B] overflow-hidden hover:border-[#374151] transition-colors group">
                                                {/* Card Header — ID + Time + Seats */}
                                                <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                                                            <Users size={14} className="text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#F9FAFB]">
                                                                Rider #{request.id.substring(0, 6).toUpperCase()}
                                                            </p>
                                                            <p className="text-[10px] text-[#6B7280]">
                                                                {request.seats_requested} seat{request.seats_requested > 1 ? 's' : ''} requested
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-[#6B7280] bg-[#1E293B] px-2 py-1 rounded-lg uppercase tracking-wider">
                                                        {getTimeAgo(request.created_at || request.start_time)}
                                                    </span>
                                                </div>

                                                {/* Route Section */}
                                                <div className="px-5 pb-3">
                                                    <div className="bg-[#0B1020] rounded-xl p-3.5 border border-[#1E293B]/50">
                                                        <div className="flex gap-3">
                                                            {/* Route dots + line */}
                                                            <div className="flex flex-col items-center pt-1">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                                                                <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-500/40 to-red-500/40 my-1 min-h-[24px]" />
                                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20" />
                                                            </div>
                                                            {/* Addresses */}
                                                            <div className="flex-1 min-w-0 space-y-3">
                                                                <div>
                                                                    <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider mb-0.5">Pickup</p>
                                                                    <p className="text-sm text-[#F9FAFB] font-medium truncate">{request.origin_address}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-red-400/80 font-bold uppercase tracking-wider mb-0.5">Drop-off</p>
                                                                    <p className="text-sm text-[#F9FAFB] font-medium truncate">{request.dest_address}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Meta Row — Distance, Schedule, Fare */}
                                                <div className="px-5 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                                                    <div className="flex items-center gap-1.5 bg-[#1E293B]/50 rounded-lg px-2.5 py-1.5 shrink-0">
                                                        <Navigation size={12} className="text-indigo-400" />
                                                        <span className="text-[11px] font-semibold text-[#9CA3AF]">{dist} km</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-[#1E293B]/50 rounded-lg px-2.5 py-1.5 shrink-0">
                                                        <Clock size={12} className="text-indigo-400" />
                                                        <span className="text-[11px] font-semibold text-[#9CA3AF]">
                                                            {new Date(request.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    {estimatedFare > 0 && (
                                                        <div className="flex items-center gap-1.5 bg-emerald-500/10 rounded-lg px-2.5 py-1.5 shrink-0">
                                                            <span className="text-[11px] font-bold text-emerald-400">₹{estimatedFare.toFixed(0)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="px-5 pb-5 flex gap-3">
                                                    <button
                                                        onClick={() => handleAction(request.id, 'reject')}
                                                        className="flex-1 h-12 rounded-xl bg-[#1E293B] hover:bg-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB] font-bold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                                                    >
                                                        <X size={16} />
                                                        Decline
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(request.id, 'approve')}
                                                        className="flex-[2] h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all active:scale-[0.97] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                                    >
                                                        Accept & Bid
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            /* ─── Empty State ─── */
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="bg-[#111827] rounded-3xl border border-[#1E293B] overflow-hidden">
                                    {/* Decorative top glow */}
                                    <div className="h-32 bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-transparent flex items-center justify-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.2, stiffness: 200, damping: 15 }}
                                        >
                                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
                                                <CheckCircle2 size={36} className="text-emerald-400" />
                                                {/* Pulsing ring */}
                                                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
                                            </div>
                                        </motion.div>
                                    </div>

                                    <div className="px-6 pb-8 text-center -mt-2">
                                        <h3 className="text-xl font-black text-[#F9FAFB] mb-2">You're all caught up!</h3>
                                        <p className="text-sm text-[#6B7280] mb-6 max-w-xs mx-auto">
                                            No pending ride requests right now. New requests will appear here automatically.
                                        </p>

                                        {/* Tips */}
                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-center gap-3 bg-[#0B1020] rounded-xl px-4 py-3 text-left border border-[#1E293B]/50">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                    <Wifi size={14} className="text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#F9FAFB]">Stay online</p>
                                                    <p className="text-xs text-[#6B7280]">Keep your status online to receive new ride requests</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-[#0B1020] rounded-xl px-4 py-3 text-left border border-[#1E293B]/50">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                    <MapPinned size={14} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#F9FAFB]">Keep location active</p>
                                                    <p className="text-xs text-[#6B7280]">Enable GPS for accurate nearby ride matching</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-[#0B1020] rounded-xl px-4 py-3 text-left border border-[#1E293B]/50">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                                    <Sparkles size={14} className="text-amber-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#F9FAFB]">Peak hours</p>
                                                    <p className="text-xs text-[#6B7280]">More requests during 8–10 AM and 5–8 PM</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => router.push('/driver/dashboard')}
                                                className="flex-1 h-12 rounded-xl bg-[#1E293B] hover:bg-[#374151] text-[#F9FAFB] font-bold text-sm transition-all active:scale-[0.97]"
                                            >
                                                Dashboard
                                            </button>
                                            <button
                                                onClick={fetchRequests}
                                                className="flex-1 h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all active:scale-[0.97] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={16} />
                                                Refresh
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* BidModal — unchanged */}
                    <BidModal
                        isOpen={isBidModalOpen}
                        onClose={() => setIsBidModalOpen(false)}
                        trip={selectedTrip}
                        onBidPlaced={handleBidPlaced}
                    />
                </motion.div>
            </DashboardLayout>
        </RoleGuard>
    );
}
