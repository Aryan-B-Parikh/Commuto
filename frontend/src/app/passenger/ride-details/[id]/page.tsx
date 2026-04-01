'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { tripsAPI, bidsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useTripWebSocket } from '@/hooks/useTripWebSocket';
import { useCounterBid } from '@/hooks/useCounterBid';
import { MapPin, Users, Clock, Shield, ShieldCheck, ArrowLeft, MessageCircle, MessageSquare, ChevronRight, UserPlus, CheckCircle2, DollarSign, Star, LogOut } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { RoleGuard } from '@/components/auth/RoleGuard';
import dynamic from 'next/dynamic';

const MapWidget = dynamic(() => import('@/components/map/MapWidget').then(mod => mod.MapWidget), { ssr: false });
import { TripPaymentModal } from '@/components/ride/TripPaymentModal';
import CounterBidInput from '@/components/ride/CounterBidInput';

export default function RideDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast() as any;
    const tripId = params.id as string;

    const [trip, setTrip] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [joinNotes, setJoinNotes] = useState('');
    const [bids, setBids] = useState<any[]>([]);
    const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);

    const refreshBids = async () => {
        const updatedBids = await bidsAPI.getRideBids(tripId);
        setBids(updatedBids);
    };

    const {
        counterBidId,
        setCounterBidId,
        counterAmount,
        setCounterAmount,
        isCountering,
        handleCounterBid,
    } = useCounterBid({ onSuccess: refreshBids });

    const { isConnected, availableSeats, newPassenger } = useTripWebSocket(tripId);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await tripsAPI.getTripDetails(tripId);
                setTrip(data);
            } catch (error) {
                console.error('Failed to fetch trip details:', error);
                showToast('error', 'Trip not found or inaccessible.');
                router.push('/passenger/ride-sharing');
            } finally {
                setIsLoading(false);
            }
        };

        if (tripId) fetchDetails();
    }, [tripId, router]);

    useEffect(() => {
        if (availableSeats !== null && trip) {
            setTrip((prev: any) => ({ ...prev, available_seats: availableSeats }));
        }
    }, [availableSeats]);

    useEffect(() => {
        if (newPassenger && trip) {
            const exists = trip.passengers.some((p: any) => p.id === newPassenger.id);
            if (!exists) {
                setTrip((prev: any) => ({
                    ...prev,
                    passengers: [...prev.passengers, newPassenger]
                }));
                showToast('info', `${newPassenger.full_name} joined the ride!`);
            }
        }
    }, [newPassenger]);

    // Poll for trip status changes (e.g. driver completes the trip)
    useEffect(() => {
        if (!tripId || !trip) return;
        // Only poll if trip is active/confirmed (not yet completed/cancelled)
        if (['completed', 'cancelled'].includes(trip.status)) return;

        const interval = setInterval(async () => {
            try {
                const updatedData = await tripsAPI.getTripDetails(tripId);
                if (updatedData.status !== trip.status) {
                    setTrip(updatedData);
                    // Auto-open payment if trip just became completed and payment is pending
                    if (
                        updatedData.status === 'completed' &&
                        updatedData.user_booking?.payment_status === 'pending'
                    ) {
                        setIsPaymentModalOpen(true);
                    }
                }
            } catch { /* silent */ }
        }, 5000);

        return () => clearInterval(interval);
    }, [tripId, trip?.status]);

    const handleJoin = async () => {
        setIsJoining(true);
        try {
            await tripsAPI.joinRide(tripId, joinNotes.trim() || undefined);
            showToast('success', 'Joined ride successfully!');
            const updatedData = await tripsAPI.getTripDetails(tripId);
            setTrip(updatedData);
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'Failed to join ride.');
        } finally {
            setIsJoining(false);
        }
    };

    const isMember = trip?.passengers?.some((p: any) => p.id === user?.id) || trip?.creator_passenger_id === user?.id || false;
    const isCreator = trip?.creator_passenger_id === user?.id || false;

    // Fetch bids when user is a member
    useEffect(() => {
        if (isMember && trip?.status === 'pending') {
            bidsAPI.getRideBids(tripId)
                .then(data => setBids(data))
                .catch(() => setBids([]));
        }
    }, [isMember, tripId, trip?.status]);

    if (isLoading) return <div className="p-20 text-center animate-pulse text-[#9CA3AF]">Loading adventure details...</div>;
    if (!trip) return null;

    const handleAcceptBid = async (bidId: string) => {
        setAcceptingBidId(bidId);
        try {
            const result = await bidsAPI.acceptBid(bidId);
            showToast('success', `Bid accepted! OTP: ${result.otp}`);
            const updatedData = await tripsAPI.getTripDetails(tripId);
            setTrip(updatedData);
            setBids([]);
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'Failed to accept bid.');
        } finally {
            setAcceptingBidId(null);
        }
    };

    const handleLeaveRide = async () => {
        if (!confirm('Are you sure you want to leave this ride?')) return;
        setIsLeaving(true);
        try {
            await tripsAPI.leaveRide(tripId);
            showToast('success', 'You have left the ride.');
            router.push('/passenger/ride-sharing');
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'Failed to leave ride.');
        } finally {
            setIsLeaving(false);
        }
    };

    return (
        <RoleGuard allowedRoles={['passenger']}>
            {/* ====================== MOBILE LAYOUT (UBER STYLE) ====================== */}
            <div className="lg:hidden min-h-screen bg-[#0B1020] flex flex-col font-sans">
                {/* 1️⃣ Map Hero Section */}
                <div className="h-[40vh] w-full relative">
                    <MapWidget
                        pickup={[trip.origin_lat, trip.origin_lng]}
                        destination={[trip.dest_lat, trip.dest_lng]}
                        showRoute={true}
                    />
                    {/* Floating Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="absolute top-4 left-4 z-10 w-10 h-10 bg-[#0B1020]/80 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    {/* Live Updates Badge */}
                    {isConnected && (
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/90 text-white rounded-full text-xs font-bold shadow-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Live
                        </div>
                    )}
                </div>

                {/* 2️⃣ Bottom Sheet (Main Content) */}
                <div className="flex-1 bg-[#111827] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] -mt-6 relative z-20 px-5 pt-6 pb-28 flex flex-col gap-6">
                    {/* Handle bar for bottom sheet look */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[#1E293B] rounded-full" />

                    {/* Top Info Block: Route */}
                    <div>
                        <h2 className="text-xl font-black text-[#F9FAFB] leading-tight mb-2">
                            {trip.origin_address.split(',')[0]} <span className="text-[#6B7280] font-normal px-1">→</span> {trip.dest_address.split(',')[0]}
                        </h2>
                        <div className="flex items-center gap-3 text-sm font-bold text-[#9CA3AF]">
                            <div className="flex items-center gap-1.5 bg-[#1E293B] px-2.5 py-1 rounded-lg">
                                <Clock size={14} className="text-indigo-400" />
                                <span>{new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-[#1E293B] px-2.5 py-1 rounded-lg">
                                <Users size={14} className="text-indigo-400" />
                                <span>{trip.available_seats} seats left</span>
                            </div>
                        </div>
                    </div>

                    {/* Safety Info Inline */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Shield size={18} className="text-amber-400 flex-shrink-0" />
                        <p className="text-xs font-bold text-amber-400/90">Verified Creator • Secure Ride</p>
                    </div>

                    {/* Travelers Section */}
                    <div>
                        <h3 className="text-sm font-bold text-[#F9FAFB] mb-3 flex items-center gap-2">
                            <Users size={16} className="text-indigo-400" /> Travelers
                        </h3>
                        <div className="flex flex-col gap-2">
                            {/* Host */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B1020] border border-[#1E293B]">
                                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
                                    {trip.creator?.full_name?.[0] || 'C'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-[#F9FAFB]">{trip.creator?.full_name || 'Creator'}</p>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Host</p>
                                    {trip.passengers?.find((p: any) => p.id === trip.creator_passenger_id)?.notes && (
                                        <div className="flex items-start gap-1.5 mt-1.5">
                                            <MessageSquare size={10} className="text-indigo-400 mt-0.5 shrink-0" />
                                            <p className="text-[11px] text-[#9CA3AF] leading-snug line-clamp-2">{trip.passengers.find((p: any) => p.id === trip.creator_passenger_id)?.notes}</p>
                                        </div>
                                    )}
                                </div>
                                <MessageCircle size={18} className="text-[#6B7280]" />
                            </div>
                            {/* Passengers */}
                            {trip.passengers.filter((p: any) => p.id !== trip.creator_passenger_id).map((passenger: any) => (
                                <div key={passenger.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0B1020]/50 border border-[#1E293B]/50">
                                    <div className="w-10 h-10 rounded-full bg-[#374151] font-bold text-[#9CA3AF] flex items-center justify-center">
                                        {passenger.full_name?.[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[#F9FAFB]">{passenger.full_name}</p>
                                        <p className="text-[10px] font-bold text-[#6B7280] uppercase">Passenger</p>
                                        {passenger.notes && (
                                            <div className="flex items-start gap-1.5 mt-1.5">
                                                <MessageSquare size={10} className="text-indigo-400 mt-0.5 shrink-0" />
                                                <p className="text-[11px] text-[#9CA3AF] leading-snug line-clamp-2">{passenger.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {/* Empty Slots */}
                            {Array.from({ length: trip.available_seats }).map((_, i) => (
                                <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-[#1E293B] opacity-50">
                                    <div className="w-10 h-10 rounded-full border border-dashed border-[#4B5563] flex items-center justify-center">
                                        <UserPlus size={16} className="text-[#6B7280]" />
                                    </div>
                                    <p className="text-sm font-bold text-[#6B7280] italic">Available Slot</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Driver Bids Section (Mobile) */}
                {isMember && bids.length > 0 && trip.status === 'pending' && (
                    <div className="flex-1 bg-[#111827] px-5 pb-6">
                        <h3 className="text-sm font-bold text-[#F9FAFB] mb-3 flex items-center gap-2">
                            <DollarSign size={16} className="text-emerald-400" /> Driver Bids ({bids.length})
                        </h3>
                        <div className="flex flex-col gap-2">
                            {bids.map((bid: any) => (
                                <div key={bid.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0B1020] border border-[#1E293B]">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
                                        {bid.driver_name?.[0] || 'D'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#F9FAFB]">{bid.driver_name || 'Driver'}</p>
                                        <div className="flex items-center gap-2">
                                            {bid.driver_rating && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                                                    <Star size={10} fill="currentColor" /> {Number(bid.driver_rating).toFixed(1)}
                                                </span>
                                            )}
                                            <span className="text-lg font-black text-emerald-400">{formatCurrency(bid.bid_amount)}</span>
                                        </div>
                                        {bid.message && (
                                            <div className="flex items-start gap-1.5 mt-1.5 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                                <MessageSquare size={10} className="text-emerald-400 mt-0.5 shrink-0" />
                                                <p className="text-[10px] text-[#9CA3AF] leading-tight italic line-clamp-2">{bid.message}</p>
                                            </div>
                                        )}
                                    </div>
                                    {trip.creator_passenger_id === user?.id && (
                                        <div className="flex flex-col gap-1.5 shrink-0">
                                            {counterBidId === bid.id ? (
                                                <CounterBidInput
                                                    bidId={bid.id}
                                                    isActive={counterBidId === bid.id}
                                                    counterAmount={counterAmount}
                                                    onAmountChange={setCounterAmount}
                                                    isSubmitting={isCountering}
                                                    onSubmit={handleCounterBid}
                                                    onCancel={() => { setCounterBidId(null); setCounterAmount(''); }}
                                                    size="sm"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleAcceptBid(bid.id)}
                                                        disabled={acceptingBidId === bid.id}
                                                        className="px-3 h-9 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-transform text-white font-bold text-xs rounded-lg disabled:opacity-50"
                                                    >
                                                        {acceptingBidId === bid.id ? '...' : 'Accept'}
                                                    </button>
                                                    {!bid.is_counter_bid && (
                                                        <button
                                                            onClick={() => { setCounterBidId(bid.id); setCounterAmount(String(bid.bid_amount)); }}
                                                            className="px-3 h-9 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-xs rounded-lg"
                                                        >
                                                            Counter
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sticky Bottom Pricing & CTA */}
                <div className="fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-[#1E293B] p-4 flex flex-col gap-3 z-50 pb-safe">
                    {/* Mobile OTP display */}
                    {isMember && trip.start_otp && (!trip.otp_verified || trip.status === 'active') && (
                        <div className="flex flex-col items-center gap-1.5 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                                {trip.otp_verified ? 'Share this Drop OTP with your Driver' : 'Share this OTP with your Driver'}
                            </p>
                            <div className="flex gap-1.5">
                                {trip.start_otp.split('').map((digit: string, i: number) => (
                                    <span key={i} className="w-9 h-11 bg-[#1E293B] rounded-lg flex items-center justify-center text-lg font-black text-white border border-[#374151]">
                                        {digit}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {isMember && trip.otp_verified && (
                        <div className="flex items-center justify-center gap-2 p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Trip Active & Verified</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-black text-[#F9FAFB]">{formatCurrency(trip.price_per_seat)}</p>
                            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase">Per Seat</p>
                        </div>

                        {isMember ? (
                            trip.user_booking?.payment_status === 'pending' ? (
                                <button
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="px-6 h-12 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform text-white font-black italic rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center"
                                >
                                    Pay Now
                                </button>
                            ) : trip.user_booking?.payment_status === 'completed' ? (
                                <div className="flex items-center gap-2 px-4 h-12 bg-green-500/10 rounded-xl border border-green-500/20 text-green-400 font-bold text-sm">
                                    <CheckCircle2 size={16} /> Paid
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="px-4 h-12 bg-[#1E293B] flex items-center justify-center rounded-xl text-[#9CA3AF] font-bold text-sm">
                                        Joined
                                    </div>
                                    {!isCreator && (
                                        <button
                                            onClick={handleLeaveRide}
                                            disabled={isLeaving}
                                            className="px-3 h-12 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
                                        >
                                            <LogOut size={14} />
                                            {isLeaving ? '...' : 'Leave'}
                                        </button>
                                    )}
                                </div>
                            )
                        ) : (
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={joinNotes}
                                    onChange={(e) => setJoinNotes(e.target.value)}
                                    placeholder="Add a note... (optional)"
                                    maxLength={500}
                                    className="flex-1 h-12 px-4 bg-[#1E293B] border border-[#374151] rounded-xl text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-indigo-500 focus:outline-none"
                                />
                                <button
                                    onClick={handleJoin}
                                    disabled={isJoining || trip.available_seats === 0}
                                    className="px-6 h-12 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform text-white font-bold text-base rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center disabled:opacity-50 disabled:active:scale-100 shrink-0"
                                >
                                    {isJoining ? 'Joining...' : trip.available_seats > 0 ? 'Join Ride' : 'Full'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ====================== DESKTOP LAYOUT (UNCHANGED) ====================== */}
            <div className="hidden lg:block">
                <DashboardLayout userType="passenger" title="Ride Details">
                    <div className="max-w-6xl mx-auto px-4 pb-20">
                        <div className="flex items-center justify-between mb-6 lg:mb-8">
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                                className="rounded-xl border-[#1E293B]/50 hover:bg-[#1E293B]"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            {isConnected && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold ring-1 ring-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live Updates Active
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                            {/* Left Column: Route & Map */}
                            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                                <Card className="overflow-hidden border-0 shadow-2xl shadow-indigo-500/5">
                                    <div className="h-[300px] lg:h-[400px] w-full relative">
                                        <MapWidget
                                            pickup={[trip.origin_lat, trip.origin_lng]}
                                            destination={[trip.dest_lat, trip.dest_lng]}
                                            showRoute={true}
                                        />
                                    </div>
                                    <div className="p-6 lg:p-8 bg-[#111827]">
                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 flex flex-col items-center">
                                                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500 bg-[#0B1020]" />
                                                    <div className="w-0.5 h-12 bg-[#1E293B] my-1" />
                                                    <MapPin className="w-4 h-4 text-red-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="mb-8">
                                                        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-1">Pickup</p>
                                                        <p className="text-lg font-bold text-[#F9FAFB]">{trip.origin_address}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-1">Destination</p>
                                                        <p className="text-lg font-bold text-[#F9FAFB]">{trip.dest_address}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                    <Card className="p-5 lg:p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                <Clock className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">Departure</p>
                                                <p className="font-bold text-[#F9FAFB]">
                                                    {new Date(trip.start_time).toLocaleDateString()} at {new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-5 lg:p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">Safety Status</p>
                                                <p className="font-bold text-[#F9FAFB]">Verified Creator</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* Right Column: Passengers & Actions */}
                            <div className="space-y-6 lg:space-y-8">

                                {/* Price & Join Card */}
                                <Card className="p-6 lg:p-8 border-t-4 border-t-indigo-500 shadow-xl shadow-indigo-500/10">
                                    <div className="text-center mb-6 lg:mb-8">
                                        <p className="text-4xl lg:text-5xl font-black text-indigo-400 mb-2">
                                            {formatCurrency(trip.price_per_seat)}
                                        </p>
                                        <p className="text-sm font-bold text-[#9CA3AF] uppercase tracking-widest">Fair Share Price</p>
                                    </div>

                                    <div className="space-y-4">
                                        {isMember && trip.start_otp && (!trip.otp_verified || trip.status === 'active') && (
                                            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-center space-y-2">
                                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                                                    {trip.otp_verified ? 'Share this Drop OTP with Driver at destination' : 'Share this OTP with Driver at pickup'}
                                                </p>
                                                <div className="flex justify-center gap-2">
                                                    {trip.start_otp.split('').map((digit: string, i: number) => (
                                                        <span key={i} className="w-10 h-12 bg-[#1E293B] rounded-xl flex items-center justify-center text-xl font-black text-white border border-[#374151]">
                                                            {digit}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {isMember && trip.otp_verified && (
                                            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center flex items-center justify-center gap-2">
                                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Trip is Active & Verified</span>
                                            </div>
                                        )}

                                        {isMember ? (
                                            <div className="space-y-3">
                                                <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 font-bold text-lg rounded-2xl cursor-default">
                                                    Joined Successfully
                                                </Button>

                                                {!isCreator && (
                                                    <Button
                                                        onClick={handleLeaveRide}
                                                        disabled={isLeaving}
                                                        className="w-full h-12 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        {isLeaving ? 'Leaving...' : 'Leave This Ride'}
                                                    </Button>
                                                )}

                                                {trip.user_booking?.payment_status === 'pending' && (
                                                    <Button
                                                        onClick={() => setIsPaymentModalOpen(true)}
                                                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black italic tracking-widest uppercase rounded-xl shadow-lg shadow-indigo-500/20"
                                                    >
                                                        💳 Pay {formatCurrency(trip.price_per_seat)} Now
                                                    </Button>
                                                )}

                                                {trip.user_booking?.payment_status === 'completed' && (
                                                    <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                                        <Shield className="w-4 h-4 text-green-400" />
                                                        <span className="text-xs font-black text-green-400 uppercase tracking-widest">Payment Completed</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={joinNotes}
                                                    onChange={(e) => setJoinNotes(e.target.value)}
                                                    placeholder="Add a note for the driver... (optional)"
                                                    maxLength={500}
                                                    className="w-full px-4 py-3 bg-[#1E293B]/30 border border-[#1E293B]/50 rounded-xl text-sm text-[#F9FAFB] placeholder:text-[#6B7280] min-h-[60px] resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                />
                                                {joinNotes && (
                                                    <p className="text-[10px] text-[#6B7280] text-right -mt-2">{joinNotes.length}/500</p>
                                                )}
                                                <Button
                                                    onClick={handleJoin}
                                                    disabled={isJoining || trip.available_seats === 0}
                                                    className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 font-bold text-lg rounded-2xl shadow-lg shadow-indigo-500/20"
                                                >
                                                    {isJoining ? 'Processing...' : trip.available_seats > 0 ? 'Join This Ride' : 'Ride is Full'}
                                                </Button>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-center text-[#9CA3AF] uppercase font-bold tracking-tighter">
                                            By joining, you agree to the shared travel guidelines
                                        </p>
                                    </div>
                                </Card>

                                {/* Passenger List */}
                                <Card className="p-5 lg:p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-[#F9FAFB] flex items-center gap-2">
                                            <Users className="w-5 h-5 text-indigo-400" /> Travelers
                                        </h3>
                                        <div className="px-2 py-1 bg-[#1E293B] rounded-lg text-[10px] font-black uppercase text-[#9CA3AF]">
                                            {trip.total_seats - trip.available_seats} / {trip.total_seats} Filled
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Creator */}
                                        <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/5 ring-1 ring-indigo-500/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold">
                                                    {trip.creator?.full_name?.[0] || 'C'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#F9FAFB]">{trip.creator?.full_name || 'Creator'}</p>
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Host</p>
                                                    {trip.passengers?.find((p: any) => p.id === trip.creator_passenger_id)?.notes && (
                                                        <div className="flex items-start gap-1.5 mt-1">
                                                            <MessageSquare size={10} className="text-indigo-400 mt-0.5 shrink-0" />
                                                            <p className="text-[11px] text-[#9CA3AF] leading-snug line-clamp-2">{trip.passengers.find((p: any) => p.id === trip.creator_passenger_id)?.notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <MessageCircle className="w-4 h-4 text-indigo-400" />
                                        </div>

                                        {/* Others */}
                                        {trip.passengers.filter((p: any) => p.id !== trip.creator_passenger_id).map((passenger: any) => (
                                            <motion.div
                                                key={passenger.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#1E293B]/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-[#374151] flex items-center justify-center font-bold text-[#6B7280] text-sm">
                                                        {passenger.full_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#F9FAFB]">{passenger.full_name}</p>
                                                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase">Passenger</p>
                                                        {passenger.notes && (
                                                            <div className="flex items-start gap-1.5 mt-1">
                                                                <MessageSquare size={10} className="text-indigo-400 mt-0.5 shrink-0" />
                                                                <p className="text-[11px] text-[#9CA3AF] leading-snug line-clamp-2">{passenger.notes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-[#4B5563]" />
                                            </motion.div>
                                        ))}

                                        {/* Empty Slots */}
                                        {Array.from({ length: trip.available_seats }).map((_, i) => (
                                            <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-[#1E293B]/50 opacity-50">
                                                <div className="w-10 h-10 rounded-xl border border-dashed border-[#1E293B] flex items-center justify-center">
                                                    <UserPlus className="w-4 h-4 text-[#9CA3AF]" />
                                                </div>
                                                <p className="text-sm font-bold text-[#9CA3AF] italic">Available Slot</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Driver Bids (Desktop) */}
                                {isMember && bids.length > 0 && trip.status === 'pending' && (
                                    <Card className="p-5 lg:p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-[#F9FAFB] flex items-center gap-2">
                                                <DollarSign className="w-5 h-5 text-emerald-400" /> Driver Bids
                                            </h3>
                                            <div className="px-2 py-1 bg-emerald-500/10 rounded-lg text-[10px] font-black uppercase text-emerald-400">
                                                {bids.length} {bids.length === 1 ? 'Bid' : 'Bids'}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {bids.map((bid: any) => (
                                                <div key={bid.id} className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/5 ring-1 ring-emerald-500/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                                                            {bid.driver_name?.[0] || 'D'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#F9FAFB]">{bid.driver_name || 'Driver'}</p>
                                                            <div className="flex items-center gap-2">
                                                                {bid.driver_rating && (
                                                                    <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-bold">
                                                                        <Star size={10} fill="currentColor" /> {Number(bid.driver_rating).toFixed(1)}
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-[#9CA3AF]">
                                                                    {new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {bid.message && (
                                                            <div className="mt-2 flex items-start gap-1.5 bg-emerald-500/5 rounded-xl px-2.5 py-1.5 ring-1 ring-emerald-500/10">
                                                                <MessageSquare size={11} className="text-emerald-400 mt-0.5 shrink-0" />
                                                                <p className="text-[10px] text-[#9CA3AF] leading-tight italic line-clamp-2">{bid.message}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-xl font-black text-emerald-400">{formatCurrency(bid.bid_amount)}</p>
                                                        {trip.creator_passenger_id === user?.id && (
                                                            <div className="flex items-center gap-2">
                                                                {counterBidId === bid.id ? (
                                                                    <CounterBidInput
                                                                        bidId={bid.id}
                                                                        isActive={counterBidId === bid.id}
                                                                        counterAmount={counterAmount}
                                                                        onAmountChange={setCounterAmount}
                                                                        isSubmitting={isCountering}
                                                                        onSubmit={handleCounterBid}
                                                                        onCancel={() => { setCounterBidId(null); setCounterAmount(''); }}
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <Button
                                                                            onClick={() => handleAcceptBid(bid.id)}
                                                                            disabled={acceptingBidId === bid.id}
                                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 h-9 rounded-xl"
                                                                        >
                                                                            {acceptingBidId === bid.id ? 'Accepting...' : 'Accept'}
                                                                        </Button>
                                                                        {!bid.is_counter_bid && (
                                                                            <Button
                                                                                onClick={() => { setCounterBidId(bid.id); setCounterAmount(String(bid.bid_amount)); }}
                                                                                className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-xs px-4 h-9 rounded-xl"
                                                                            >
                                                                                Counter
                                                                            </Button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </div>

                        </div>
                    </div>

                    {trip.user_booking && (
                        <TripPaymentModal
                            isOpen={isPaymentModalOpen}
                            onClose={() => setIsPaymentModalOpen(false)}
                            tripId={tripId}
                            bookingId={trip.user_booking.id}
                            amount={trip.price_per_seat}
                            tripName={trip.dest_address.split(',')[0]}
                            onSuccess={async () => {
                                const updated = await tripsAPI.getTripDetails(tripId);
                                setTrip(updated);
                            }}
                        />
                    )}
                </DashboardLayout>
            </div>
        </RoleGuard>
    );
}
