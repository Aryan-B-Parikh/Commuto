'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { tripsAPI, otpAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { BidModal } from '@/components/ride/BidModal';
import { calculateDistance } from '@/utils/geoUtils';
import { useSocketEvent } from '@/hooks/useWebSocket';
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
    X,
    MessageSquare,
    Navigation2
} from 'lucide-react';
import { useRouteInfo } from '@/hooks/useRouteInfo';
import { useAuth } from '@/hooks/useAuth';
import { VerifyOTPModal } from '@/components/ride/VerifyOTPModal';
import { normalizeRideStatus } from '@/utils/rideState';

function RideRequestCard({ request, index, getTimeAgo, handleAction }: {
    request: TripResponse,
    index: number,
    getTimeAgo: (date: string) => string,
    handleAction: (id: string, action: 'approve' | 'reject') => void
}) {
    const origin = React.useMemo(() => [request.origin_lat, request.origin_lng] as [number, number], [request.origin_lat, request.origin_lng]);
    const destination = React.useMemo(() => [request.dest_lat, request.dest_lng] as [number, number], [request.dest_lat, request.dest_lng]);
    const { distanceKm } = useRouteInfo(origin, destination);

    return (
        <motion.div
            key={request.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group"
        >
            <div className="bg-card rounded-3xl border border-card-border overflow-hidden hover:border-indigo-500/30 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-500/5">
                {/* Header: Relative Time + Seats */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-card-border/70 bg-background/40">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Clock size={14} className="text-indigo-400" />
                        </div>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                            Shared • {getTimeAgo(request.created_at)}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                        <Users size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                            {request.total_seats} Seats
                        </span>
                    </div>
                </div>

                {/* Route Section */}
                <div className="p-5">
                    <div className="flex gap-4 mb-6">
                        <div className="flex flex-col items-center pt-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/10" />
                            <div className="w-0.5 flex-1 bg-linear-to-b from-indigo-500 to-red-500 my-1 min-h-8 opacity-20" />
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-red-500/10" />
                        </div>
                        <div className="flex-1 space-y-5">
                            <div>
                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Pickup Address</p>
                                <p className="text-sm font-bold text-foreground leading-snug line-clamp-1">{request.origin_address}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1.5">Destination</p>
                                <p className="text-sm font-bold text-foreground leading-snug line-clamp-1">{request.dest_address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-background/60 rounded-2xl p-3 border border-card-border/70 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400">
                                <Navigation2 size={16} />
                            </div>
                            <div>
                                <p className="text-[14px] font-black text-foreground">{distanceKm} km</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Road Dist.</p>
                            </div>
                        </div>
                        <div className="bg-background/60 rounded-2xl p-3 border border-card-border/70 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400">
                                <Clock size={16} />
                            </div>
                            <div>
                                <p className="text-[14px] font-black text-foreground">
                                    {new Date(request.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Pickup Time</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between group-hover:bg-emerald-500/10 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 shadow-sm">PASSENGER OFFER</span>
                            <span className="text-xs text-muted-foreground font-medium">Their suggested price for the ride</span>
                        </div>
                        <div className="text-2xl font-black text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl shadow-inner border border-emerald-500/20">
                            ₹{request.total_price || 0}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleAction(request.id, 'reject')}
                            className="w-12 h-12 rounded-2xl bg-muted hover:bg-red-500/10 text-muted-foreground hover:text-red-400 flex items-center justify-center transition-all active:scale-90 border border-transparent hover:border-red-500/20"
                        >
                            <X size={20} />
                        </button>
                        <button
                            onClick={() => handleAction(request.id, 'approve')}
                            className="flex-1 h-12 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group-hover:gap-3"
                        >
                            Place Your Bid
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function DriverRequestsPage() {
    const router = useRouter();
    const { role } = useAuth();
    const { showToast } = useToast() as any;
    const [requests, setRequests] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTrip, setSelectedTrip] = useState<TripResponse | null>(null);
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    const [acceptedTrip, setAcceptedTrip] = useState<TripResponse | null>(null);
    const [isStartRideModalOpen, setIsStartRideModalOpen] = useState(false);
    const [isStartingRide, setIsStartingRide] = useState(false);

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

    useSocketEvent('new_ride_available', (data: any) => {
        console.log('New ride available via websocket:', data);
        showToast('info', 'New ride request available!');
        fetchRequests();
    });

    const fetchRequests = async () => {
        try {
            setIsLoading(true);
            const data = await tripsAPI.getOpenRides();
            const ignored = getIgnoredIds();
            setRequests(data.filter(r => !ignored.includes(r.id)));
        } catch (error: any) {
            if (error?.response?.status === 403) {
                showToast('error', 'Access denied for ride requests. Redirecting...');
                if (role === 'passenger') {
                    router.replace('/passenger/dashboard');
                } else {
                    router.replace('/select-role');
                }
                return;
            }

            if (error?.response?.status === 429) {
                showToast('error', 'Too many requests. Please wait a few seconds and refresh.');
                return;
            }

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
        showToast('info', 'Bid placed. Waiting for passenger acceptance...');
    };

    useEffect(() => {
        const checkAcceptedTrip = async () => {
            try {
                const trips = await tripsAPI.getDriverTrips();
                const startedTrip = trips.find((t: TripResponse) => normalizeRideStatus(t.status) === 'started');
                const pendingStartTrip = trips.find((t: TripResponse) => normalizeRideStatus(t.status) === 'accepted');

                if (startedTrip) {
                    router.push('/driver/live');
                    return;
                }

                setAcceptedTrip(pendingStartTrip || null);
                if (pendingStartTrip) {
                    setIsStartRideModalOpen(false);
                }
            } catch (error: any) {
                // Ignore expected rate limits during background polling.
                if (error?.response?.status !== 429) {
                    console.error('Failed to check accepted trip:', error);
                }
            }
        };

        checkAcceptedTrip();
        const interval = setInterval(checkAcceptedTrip, 8000);

        return () => clearInterval(interval);
    }, [router]);

    const handleStartRide = async (otp: string) => {
        if (!acceptedTrip) return;

        setIsStartingRide(true);
        try {
            await otpAPI.verifyOTP(acceptedTrip.id, otp);
            setAcceptedTrip(prev => (prev ? { ...prev, status: 'started', otp_verified: true } as TripResponse : prev));
            setIsStartRideModalOpen(false);
            showToast('success', 'Ride started successfully. Opening live trip...');
            router.push('/driver/live');
        } catch (error: any) {
            showToast('error', error?.response?.data?.detail || 'Failed to start ride. Please try again.');
        } finally {
            setIsStartingRide(false);
        }
    };

    // Calculate time-ago for display
    const getTimeAgo = (dateStr: string) => {
        // Backend returns UTC timestamps without Z suffix — add it so JS parses correctly
        const utcStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
        const diff = Date.now() - new Date(utcStr).getTime();
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
                                <h1 className="text-2xl font-black text-foreground tracking-tight">Ride Requests</h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {isLoading ? 'Loading...' : `${requests.length} pending request${requests.length !== 1 ? 's' : ''}`}
                                </p>
                            </div>
                            <button
                                onClick={fetchRequests}
                                className="w-10 h-10 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90"
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

                    {/* Active ride card */}
                    {acceptedTrip && normalizeRideStatus(acceptedTrip.status) === 'accepted' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-5 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Ride accepted</p>
                                    <h2 className="mt-1 text-lg font-black text-foreground">Driver is on the way to pickup</h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Pickup: {acceptedTrip.origin_address}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Customer: {acceptedTrip.passenger_notes?.[0]?.passenger_name || 'Rider'}
                                    </p>
                                </div>
                                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                    Accepted
                                </span>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={() => setIsStartRideModalOpen(true)}
                                    className="flex-1 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                >
                                    Start Ride
                                </button>
                            </div>
                        </motion.div>
                    )}

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
                                        className="rounded-2xl border border-card-border overflow-hidden"
                                    >
                                        <div className="h-4 bg-muted/70 w-1/3 rounded m-5 animate-pulse" />
                                        <div className="px-5 space-y-3 pb-5">
                                            <div className="h-12 bg-muted/50 rounded-xl animate-pulse" />
                                            <div className="h-12 bg-muted/50 rounded-xl animate-pulse" />
                                            <div className="flex gap-3 pt-2">
                                                <div className="h-12 flex-1 bg-muted/50 rounded-xl animate-pulse" />
                                                <div className="h-12 flex-1 bg-muted/50 rounded-xl animate-pulse" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            /* ─── Request Cards ─── */
                        ) : requests.length > 0 ? (
                            <div className="space-y-4">
                                {requests.map((request, index) => (
                                    <RideRequestCard
                                        key={request.id}
                                        request={request}
                                        index={index}
                                        getTimeAgo={getTimeAgo}
                                        handleAction={handleAction}
                                    />
                                ))}
                            </div>

                            /* ─── Empty State ─── */
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="bg-card rounded-3xl border border-card-border overflow-hidden">
                                    {/* Decorative top glow */}
                                    <div className="h-32 bg-linear-to-b from-indigo-500/10 via-indigo-500/5 to-transparent flex items-center justify-center">
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
                                        <h3 className="text-xl font-black text-foreground mb-2">You&apos;re all caught up!</h3>
                                        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                                            No pending ride requests right now. New requests will appear here automatically.
                                        </p>

                                        {/* Tips */}
                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-center gap-3 bg-background rounded-xl px-4 py-3 text-left border border-card-border/70">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                    <Wifi size={14} className="text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">Stay online</p>
                                                    <p className="text-xs text-muted-foreground">Keep your status online to receive new ride requests</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-background rounded-xl px-4 py-3 text-left border border-card-border/70">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                    <MapPinned size={14} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">Keep location active</p>
                                                    <p className="text-xs text-muted-foreground">Enable GPS for accurate nearby ride matching</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-background rounded-xl px-4 py-3 text-left border border-card-border/70">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                                    <Sparkles size={14} className="text-amber-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">Peak hours</p>
                                                    <p className="text-xs text-muted-foreground">More requests during 8–10 AM and 5–8 PM</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => router.push('/driver/dashboard')}
                                                className="flex-1 h-12 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-sm transition-all active:scale-[0.97]"
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

                    <VerifyOTPModal
                        isOpen={isStartRideModalOpen}
                        onClose={() => setIsStartRideModalOpen(false)}
                        isVerifying={isStartingRide}
                        onVerify={handleStartRide}
                    />
                </motion.div>
            </DashboardLayout>
        </RoleGuard>
    );
}
