'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { tripsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useTripWebSocket } from '@/hooks/useTripWebSocket';
import { MapPin, Users, Clock, Shield, ArrowLeft, MessageCircle, ChevronRight, UserPlus, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { RoleGuard } from '@/components/auth/RoleGuard';
import dynamic from 'next/dynamic';

const MapWidget = dynamic(() => import('@/components/map/MapWidget').then(mod => mod.MapWidget), { ssr: false });
import { TripPaymentModal } from '@/components/ride/TripPaymentModal';

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

    const handleJoin = async () => {
        setIsJoining(true);
        try {
            await tripsAPI.joinRide(tripId);
            showToast('success', 'Joined ride successfully!');
            const updatedData = await tripsAPI.getTripDetails(tripId);
            setTrip(updatedData);
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'Failed to join ride.');
        } finally {
            setIsJoining(false);
        }
    };

    if (isLoading) return <div className="p-20 text-center animate-pulse text-[#9CA3AF]">Loading adventure details...</div>;
    if (!trip) return null;

    const isMember = trip.passengers.some((p: any) => p.id === user?.id) || trip.creator_passenger_id === user?.id;

    return (
        <RoleGuard allowedRoles={['passenger']}>
            {/* ====================== MOBILE LAYOUT (UBER STYLE) ====================== */}
            <div className="lg:hidden min-h-screen bg-[#0B1020] flex flex-col font-sans">
                {/* 1️⃣ Map Hero Section */}
                <div className="h-[40vh] w-full relative">
                    <MapWidget />
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
                                </div>
                                <MessageCircle size={18} className="text-[#6B7280]" />
                            </div>
                            {/* Passengers */}
                            {trip.passengers.filter((p: any) => p.id !== trip.creator_passenger_id).map((passenger: any) => (
                                <div key={passenger.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0B1020]/50 border border-[#1E293B]/50">
                                    <div className="w-10 h-10 rounded-full bg-[#374151] font-bold text-[#9CA3AF] flex items-center justify-center">
                                        {passenger.full_name?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#F9FAFB]">{passenger.full_name}</p>
                                        <p className="text-[10px] font-bold text-[#6B7280] uppercase">Passenger</p>
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

                {/* Sticky Bottom Pricing & CTA */}
                <div className="fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-[#1E293B] p-4 flex items-center justify-between z-50 pb-safe">
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
                            <div className="px-6 h-12 bg-[#1E293B] flex items-center justify-center rounded-xl text-[#9CA3AF] font-bold text-sm">
                                Joined
                            </div>
                        )
                    ) : (
                        <button
                            onClick={handleJoin}
                            disabled={isJoining || trip.available_seats === 0}
                            className="px-8 h-12 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform text-white font-bold text-base rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center disabled:opacity-50 disabled:active:scale-100"
                        >
                            {isJoining ? 'Joining...' : trip.available_seats > 0 ? 'Join Ride' : 'Full'}
                        </button>
                    )}
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
                                        <MapWidget />
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
                                        {isMember ? (
                                            <div className="space-y-3">
                                                <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 font-bold text-lg rounded-2xl cursor-default">
                                                    Joined Successfully
                                                </Button>

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
                                            <Button
                                                onClick={handleJoin}
                                                disabled={isJoining || trip.available_seats === 0}
                                                className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 font-bold text-lg rounded-2xl shadow-lg shadow-indigo-500/20"
                                            >
                                                {isJoining ? 'Processing...' : trip.available_seats > 0 ? 'Join This Ride' : 'Ride is Full'}
                                            </Button>
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
