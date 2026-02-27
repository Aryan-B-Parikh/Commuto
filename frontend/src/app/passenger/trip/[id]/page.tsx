'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    MapPin,
    Navigation,
    Clock,
    Users,
    Star,
    CheckCircle2,
    Loader2,
    Car,
    Shield,
    Zap,
    ChevronRight,
    CircleDot
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { tripsAPI, bidsAPI } from '@/services/api';
import { transformTripResponse } from '@/utils/tripTransformers';
import { calculateDistance } from '@/utils/geoUtils';
import type { TripResponse, BidResponse } from '@/types/api';
import type { Trip } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { useSocketEvent } from '@/hooks/useWebSocket';
import dynamic from 'next/dynamic';

const TripMap = dynamic(() => import('@/components/map/TripMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#1E293B] animate-pulse rounded-2xl" />
});

export default function PassengerTripDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast() as any;
    const [isLoading, setIsLoading] = useState(true);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [rawTrip, setRawTrip] = useState<TripResponse | null>(null);
    const [bids, setBids] = useState<BidResponse[]>([]);
    const [isAccepting, setIsAccepting] = useState<string | null>(null);

    const tripId = params.id as string;

    useEffect(() => {
        if (tripId) {
            fetchData();
        }
    }, [tripId]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const allTrips = await tripsAPI.getMyTrips();
            const foundTrip = allTrips.find(t => t.id === tripId);

            if (foundTrip) {
                setTrip(transformTripResponse(foundTrip));
                setRawTrip(foundTrip);

                if (foundTrip.status === 'pending') {
                    try {
                        const bidsData = await bidsAPI.getRideBids(tripId);
                        setBids(bidsData);
                    } catch (err) {
                        console.error('Failed to fetch bids:', err);
                    }
                }
            } else {
                showToast('error', 'Trip not found');
                router.push('/passenger/history');
            }
        } catch (error) {
            console.error('Failed to load trip details:', error);
            showToast('error', 'Failed to load trip details');
        } finally {
            setIsLoading(false);
        }
    };

    useSocketEvent('new_bid', (data: any) => {
        console.log('New bid received:', data);
        setBids(prev => {
            if (prev.find(b => b.id === data.id)) return prev;
            showToast('info', `New bid of ${formatCurrency(data.bid_amount)} received!`);
            return [data, ...prev];
        });
    });

    const handleAcceptBid = async (bidId: string) => {
        try {
            setIsAccepting(bidId);
            await bidsAPI.acceptBid(bidId);
            showToast('success', 'Driver accepted! Your ride is confirmed.');
            router.push('/passenger/live');
        } catch (error) {
            console.error('Failed to accept bid:', error);
            showToast('error', 'Failed to accept bid. Please try again.');
        } finally {
            setIsAccepting(null);
        }
    };

    const distance = useMemo(() => {
        if (!rawTrip) return '0.0';
        return calculateDistance(
            { lat: rawTrip.origin_lat, lng: rawTrip.origin_lng },
            { lat: rawTrip.dest_lat, lng: rawTrip.dest_lng }
        ).toFixed(1);
    }, [rawTrip]);

    const passengerPos = useMemo(() => {
        if (!rawTrip) return undefined;
        return [Number(rawTrip.origin_lat), Number(rawTrip.origin_lng)] as [number, number];
    }, [rawTrip]);

    const destinationPos = useMemo(() => {
        if (!rawTrip) return undefined;
        return [Number(rawTrip.dest_lat), Number(rawTrip.dest_lng)] as [number, number];
    }, [rawTrip]);

    const statusConfig: Record<string, { bg: string, text: string, label: string, dot: string }> = {
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Awaiting Bids', dot: 'bg-amber-500' },
        bid_accepted: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Driver Assigned', dot: 'bg-blue-500' },
        driver_assigned: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', label: 'Driver En Route', dot: 'bg-indigo-500' },
        active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'In Progress', dot: 'bg-emerald-500' },
        completed: { bg: 'bg-[#1E293B]', text: 'text-[#6B7280]', label: 'Completed', dot: 'bg-[#6B7280]' },
        cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Cancelled', dot: 'bg-red-500' },
    };

    const currentStatus = statusConfig[trip?.status || 'pending'] || statusConfig.pending;

    const formatDateTime = (dateStr: string, timeStr: string) => {
        const d = new Date(`${dateStr}T${timeStr}`);
        return {
            date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
            time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
    };

    if (isLoading) {
        return (
            <RoleGuard allowedRoles={['passenger']}>
                <DashboardLayout userType="passenger" title="Trip Details">
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 size={32} className="animate-spin text-indigo-400 mb-4" />
                        <p className="text-sm font-bold text-[#9CA3AF] uppercase tracking-widest">Loading trip details...</p>
                    </div>
                </DashboardLayout>
            </RoleGuard>
        );
    }

    if (!trip) return null;

    const dt = formatDateTime(trip.date, trip.time);

    return (
        <RoleGuard allowedRoles={['passenger']}>
            <DashboardLayout userType="passenger" title="Trip Details">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-6xl mx-auto space-y-6 lg:space-y-8 pb-12"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 lg:gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2.5 rounded-xl border border-[#1E293B] hover:bg-[#1E293B] transition-colors text-[#F9FAFB]"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h2 className="text-xl lg:text-2xl font-extrabold text-[#F9FAFB] tracking-tight">Trip Details</h2>
                                <p className="text-sm text-[#9CA3AF] font-medium">
                                    ID: {tripId.substring(0, 8).toUpperCase()}
                                </p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full ${currentStatus.bg}`}>
                            <div className={`w-2 h-2 rounded-full ${currentStatus.dot} animate-pulse`} />
                            <span className={`text-[10px] lg:text-xs font-bold uppercase tracking-widest ${currentStatus.text}`}>
                                {currentStatus.label}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                        {/* Left Column – Route & Map */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Map */}
                            <Card className="p-0 border-none shadow-lg overflow-hidden rounded-2xl">
                                <div className="h-[250px] lg:h-[350px] relative">
                                    <TripMap
                                        passengerPos={passengerPos}
                                        destinationPos={destinationPos}
                                    />
                                </div>
                            </Card>

                            {/* Route Info Card */}
                            <Card className="border-none shadow-sm p-5 lg:p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center pt-1">
                                        <div className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                                        <div className="w-0.5 h-16 bg-gradient-to-b from-indigo-500/30 to-red-500/30 my-1" />
                                        <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20" />
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1">Pickup</p>
                                            <p className="font-bold text-[#F9FAFB] text-sm leading-snug">{trip.from.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1">Destination</p>
                                            <p className="font-bold text-[#F9FAFB] text-sm leading-snug">{trip.to.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Strip */}
                                <div className="mt-6 pt-5 border-t border-[#1E293B] grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Navigation size={14} className="text-indigo-400" />
                                            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Distance</p>
                                        </div>
                                        <p className="text-lg font-black text-[#F9FAFB]">{distance} km</p>
                                    </div>
                                    <div className="text-center border-x border-[#1E293B]">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Clock size={14} className="text-indigo-400" />
                                            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Schedule</p>
                                        </div>
                                        <p className="text-lg font-black text-[#F9FAFB]">{dt.time}</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Users size={14} className="text-indigo-400" />
                                            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Seats</p>
                                        </div>
                                        <p className="text-lg font-black text-[#F9FAFB]">{trip.totalSeats}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Date & Trip Meta */}
                            <Card className="border-none shadow-sm p-4 lg:p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Scheduled For</p>
                                        <p className="font-bold text-[#F9FAFB] text-sm">{dt.date} at {dt.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full font-bold">
                                    <Shield size={14} />
                                    Verified Ride
                                </div>
                            </Card>
                        </div>

                        {/* Right Column – Bids & Actions */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Bids Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-[#9CA3AF] uppercase tracking-[0.15em] flex items-center gap-2">
                                    <Zap size={14} className="text-indigo-400" />
                                    Driver Offers
                                </h3>
                                {bids.length > 0 && (
                                    <span className="bg-indigo-500/15 text-indigo-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
                                        {bids.length} {bids.length === 1 ? 'Offer' : 'Offers'}
                                    </span>
                                )}
                            </div>

                            {/* Bids List */}
                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {bids.length > 0 ? (
                                        bids.map((bid, index) => (
                                            <motion.div
                                                key={bid.id}
                                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: index * 0.08 }}
                                            >
                                                <Card className="border-none shadow-sm hover:shadow-md transition-all p-5 relative overflow-hidden group">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-r-full" />

                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20">
                                                            <Car size={22} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-[#F9FAFB] text-sm">Driver #{bid.driver_id.toString().substring(0, 5)}</h4>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <div className="flex items-center gap-0.5 text-amber-400">
                                                                    <Star size={12} fill="currentColor" />
                                                                    <span className="text-[10px] font-bold">4.8</span>
                                                                </div>
                                                                <span className="text-[10px] text-[#9CA3AF] font-medium">• Verified</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-black text-indigo-400 tracking-tight">
                                                                {formatCurrency(bid.bid_amount)}
                                                            </p>
                                                            <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest">Per Seat</p>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        fullWidth
                                                        variant="primary"
                                                        isLoading={isAccepting === bid.id}
                                                        onClick={() => handleAcceptBid(bid.id)}
                                                        className="h-12 rounded-xl font-bold uppercase tracking-widest text-xs bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                                                    >
                                                        <CheckCircle2 size={16} className="mr-2" />
                                                        Accept This Offer
                                                    </Button>
                                                </Card>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <Card className="border-2 border-dashed border-[#1E293B] bg-[#1E293B]/20 text-center py-12 px-6">
                                                <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                                                    <div className="relative">
                                                        <CircleDot size={28} className="text-indigo-400" />
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping" />
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-[#F9FAFB] mb-1">Scanning for Drivers</h4>
                                                <p className="text-sm text-[#9CA3AF] font-medium max-w-[250px] mx-auto">
                                                    Your request is live. Drivers nearby will send offers shortly.
                                                </p>
                                                <div className="mt-6 flex items-center justify-center gap-2 text-indigo-400">
                                                    <Loader2 size={14} className="animate-spin" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Broadcasting...</span>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Safety Card */}
                            <Card className="border-none shadow-sm p-5 bg-[#111827] text-white relative overflow-hidden border border-[#1E293B]">
                                <div className="absolute top-0 right-0 opacity-5">
                                    <Shield size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield size={16} className="text-emerald-400" />
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Ride Protection</p>
                                    </div>
                                    <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                                        Every ride includes live GPS tracking, verified driver identity, and instant SOS access for your safety.
                                    </p>
                                    <div className="mt-4 flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            GPS Tracked
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            ID Verified
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Cancel Button (only if pending) */}
                            {trip.status === 'pending' && (
                                <Button
                                    fullWidth
                                    variant="outline"
                                    className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                                    onClick={async () => {
                                        try {
                                            await tripsAPI.cancelTrip(tripId);
                                            showToast('info', 'Trip cancelled successfully.');
                                            router.push('/passenger/history');
                                        } catch (e) {
                                            showToast('error', 'Failed to cancel trip.');
                                        }
                                    }}
                                >
                                    Cancel This Trip
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </DashboardLayout>
        </RoleGuard>
    );
}
