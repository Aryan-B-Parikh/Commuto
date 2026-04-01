'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Navigation,
    Clock,
    Users,
    CheckCircle2,
    Loader2,
    Shield,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { tripsAPI, bidsAPI } from '@/services/api';
import { transformTripResponse } from '@/utils/tripTransformers';
import { calculateDistance } from '@/utils/geoUtils';
import type { TripResponse, BidResponse } from '@/types/api';
import type { Trip } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { useSocketEvent } from '@/hooks/useWebSocket';
import { useRouteInfo } from '@/hooks/useRouteInfo';
import dynamic from 'next/dynamic';
import { TripReceiptCard } from '@/components/trip/TripReceiptCard';
import { BiddingSection } from '@/components/trip/BiddingSection';
import { TripPaymentModal } from '@/components/ride/TripPaymentModal';

const MapWidget = dynamic(
    () => import('@/components/map/MapWidget').then(mod => mod.MapWidget),
    { ssr: false, loading: () => <div className="w-full h-full bg-[#1E293B] animate-pulse rounded-2xl" /> }
);

export default function PassengerTripDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast() as any;
    const { user } = useAuth() as any;
    const [isLoading, setIsLoading] = useState(true);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [rawTrip, setRawTrip] = useState<TripResponse | null>(null);
    const [bids, setBids] = useState<BidResponse[]>([]);
    const [isAccepting, setIsAccepting] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

    // Poll for trip status changes (e.g. driver completes the trip)
    useEffect(() => {
        if (!tripId || !rawTrip) return;
        // Only poll if trip is active (not yet completed/cancelled)
        if (['completed', 'cancelled'].includes(rawTrip.status)) return;

        const interval = setInterval(async () => {
            try {
                const allTrips = await tripsAPI.getMyTrips();
                const latest = allTrips.find(t => t.id === tripId);
                if (latest && latest.status !== rawTrip.status) {
                    setRawTrip(latest);
                    setTrip(transformTripResponse(latest));
                }
            } catch { /* silent */ }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [tripId, rawTrip?.status]);

    // Auto-open payment modal when trip becomes completed with pending payment
    useEffect(() => {
        if (
            rawTrip?.status === 'completed' &&
            rawTrip?.booking_payment_status === 'pending' &&
            rawTrip?.booking_id
        ) {
            setIsPaymentModalOpen(true);
        }
    }, [rawTrip?.status, rawTrip?.booking_payment_status]);

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
            const result = await bidsAPI.acceptBid(bidId);
            showToast('success', `Driver accepted! Your ride OTP: ${result.otp}`);
            await fetchData();
        } catch (error) {
            console.error('Failed to accept bid:', error);
            showToast('error', 'Failed to accept bid. Please try again.');
        } finally {
            setIsAccepting(null);
        }
    };

    const passengerPos = useMemo(() => {
        if (!rawTrip) return undefined;
        return [Number(rawTrip.origin_lat), Number(rawTrip.origin_lng)] as [number, number];
    }, [rawTrip]);

    const destinationPos = useMemo(() => {
        if (!rawTrip) return undefined;
        return [Number(rawTrip.dest_lat), Number(rawTrip.dest_lng)] as [number, number];
    }, [rawTrip]);

    const { distanceKm, duration, routeName } = useRouteInfo(
        passengerPos,
        destinationPos
    );

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

                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Map & Route Info */}
                        <div className="space-y-6">
                            {/* Map */}
                            <Card className="p-0 border-none shadow-lg overflow-hidden rounded-2xl">
                                <div className="h-[250px] lg:h-[400px] relative">
                                    <MapWidget
                                        pickup={passengerPos}
                                        destination={destinationPos}
                                        showRoute={true}
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
                                        <p className="text-lg font-black text-[#F9FAFB]">{distanceKm} km</p>
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

                            {/* OTP Display (after bid accepted) */}
                            {rawTrip?.start_otp && (!rawTrip?.otp_verified || rawTrip?.status === 'active') && (
                                <Card className="border-none shadow-sm p-5 lg:p-6">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">
                                        {rawTrip.otp_verified ? 'Share this Drop OTP with your Driver at destination' : 'Share this OTP with your Driver at pickup'}
                                    </p>
                                    <div className="flex justify-center gap-2">
                                        {rawTrip.start_otp.split('').map((digit: string, i: number) => (
                                            <span key={i} className="w-12 h-14 bg-[#1E293B] rounded-xl flex items-center justify-center text-2xl font-black text-white border border-[#374151]">
                                                {digit}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-[#6B7280] text-center mt-3">
                                        {rawTrip.otp_verified ? 'Only share when you have reached your destination' : 'Only share when you are seated in the vehicle'}
                                    </p>
                                </Card>
                            )}

                            {/* OTP Verified badge */}
                            {rawTrip?.otp_verified && rawTrip?.status !== 'completed' && (
                                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Trip is Live & Verified</span>
                                </div>
                            )}

                            {/* Driver Bids */}
                            {bids.length > 0 && rawTrip?.status === 'pending' && rawTrip?.creator_passenger_id === user?.id && (
                                <BiddingSection
                                    bids={bids}
                                    isAccepting={isAccepting}
                                    onAcceptBid={handleAcceptBid}
                                    onRefetch={fetchData}
                                />
                            )}
                            {/* Post-ride Receipt (completed trips) */}
                            {rawTrip?.status === 'completed' && (
                                <TripReceiptCard
                                    rawTrip={rawTrip}
                                    trip={trip}
                                    tripId={tripId}
                                    distance={distanceKm}
                                />
                            )}
                        </div>
                    </div>

                    {/* Auto-Payment Modal */}
                    {rawTrip?.booking_id && (
                        <TripPaymentModal
                            isOpen={isPaymentModalOpen}
                            onClose={() => setIsPaymentModalOpen(false)}
                            tripId={tripId}
                            bookingId={rawTrip.booking_id}
                            amount={rawTrip.booking_total_price ?? rawTrip.price_per_seat ?? 0}
                            tripName={rawTrip.dest_address?.split(',')[0] || 'Destination'}
                            onSuccess={() => {
                                fetchData(); // Refresh trip data after payment
                            }}
                        />
                    )}
                </motion.div>
            </DashboardLayout>
        </RoleGuard>
    );
}
