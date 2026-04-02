"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone,
    MessageSquare,
    AlertTriangle,
    Car,
    Clock,
    Navigation,
    Shield,
    CheckCircle2,
    ArrowRight,
    Navigation2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTripWebSocket } from '@/hooks/useTripWebSocket';
import { tripsAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import type { Trip } from '@/types';
import { TripPaymentModal } from '@/components/ride/TripPaymentModal';
import { TripReceiptCard } from '@/components/trip/TripReceiptCard';
import { transformTripResponse } from '@/utils/tripTransformers';
import { calculateDistance } from '@/utils/geoUtils';
import { useRouteInfo } from '@/hooks/useRouteInfo';
import dynamic from 'next/dynamic';

const TripMap = dynamic(() => import('@/components/map/TripMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#1E293B] animate-pulse flex items-center justify-center text-[#6B7280]">Loading Live Map...</div>
});

export default function PassengerLivePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [trip, setTrip] = useState<TripResponse | null>(null);
    const [transformedTrip, setTransformedTrip] = useState<Trip | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [showCompletionScreen, setShowCompletionScreen] = useState(false);

    const {
        isConnected,
        lastLocation,
        tripStatus
    } = useTripWebSocket(trip?.id || null);

    const passengerPos = useMemo(() => {
        if (!trip) return undefined;
        return [Number(trip.origin_lat), Number(trip.origin_lng)] as [number, number];
    }, [trip]);

    const destinationPos = useMemo(() => {
        if (!trip) return undefined;
        return [Number(trip.dest_lat), Number(trip.dest_lng)] as [number, number];
    }, [trip]);

    const driverPos = useMemo(() => {
        if (lastLocation) return [lastLocation.lat, lastLocation.lng] as [number, number];
        return undefined;
    }, [lastLocation]);

    const targetCoords = useMemo((): [number, number] | undefined => {
        if (!trip) return undefined;
        const isStarted = trip.status === 'active';
        return isStarted ? destinationPos : passengerPos;
    }, [trip, destinationPos, passengerPos]);

    const { distanceKm, duration, routeName } = useRouteInfo(
        driverPos || passengerPos,
        targetCoords
    );

    useEffect(() => {
        const fetchActiveTrip = async () => {
            try {
                const trips = await tripsAPI.getMyTrips();
                const active = trips.find(t => ['active', 'driver_assigned', 'bid_accepted'].includes(t.status));
                if (active) {
                    setTrip(active);
                }
            } catch (error) {
                console.error('Failed to fetch active trip:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveTrip();
    }, [router]);

    // Re-fetch full trip data when status changes to completed
    const refetchTrip = async () => {
        try {
            const trips = await tripsAPI.getMyTrips();
            const latest = trips.find(t => t.id === trip?.id);
            if (latest) {
                setTrip(latest);
                setTransformedTrip(transformTripResponse(latest));
                return latest;
            }
        } catch (err) {
            console.error('Failed to refetch trip:', err);
        }
        return null;
    };

    useEffect(() => {
        if (tripStatus && trip && trip.status !== tripStatus) {
            setTrip({ ...trip, status: tripStatus } as TripResponse);
            if (tripStatus === 'completed') {
                // Don't auto-redirect — show payment + receipt instead
                setShowCompletionScreen(true);
                refetchTrip().then((latestTrip) => {
                    if (latestTrip?.booking_id && latestTrip?.booking_payment_status === 'pending') {
                        setIsPaymentModalOpen(true);
                    }
                });
            }
        }
    }, [tripStatus, trip]);



    if (isLoading) {
        return (
            <DashboardLayout userType="passenger" title="Live Tracking">
                <div className="flex items-center justify-center h-[70vh]">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!trip) {
        return (
            <RoleGuard allowedRoles={['passenger']}>
                <DashboardLayout userType="passenger" title="Active Trips">
                    <div className="max-w-2xl mx-auto py-20 px-4">
                        <Card className="p-8 text-center border border-card-border bg-card/70">
                            <h2 className="text-2xl font-black text-foreground mb-3">No Active Trip Right Now</h2>
                            <p className="text-sm text-muted-foreground mb-8">
                                Active Trips only appears when your trip status is bid accepted, driver assigned, or active.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Button onClick={() => router.push('/passenger/ride-sharing')} className="w-full sm:w-auto">
                                    Find a Ride
                                </Button>
                                <Button variant="outline" onClick={() => router.push('/passenger/history')} className="w-full sm:w-auto">
                                    View Trip History
                                </Button>
                            </div>
                        </Card>
                    </div>
                </DashboardLayout>
            </RoleGuard>
        );
    }

    return (
        <RoleGuard allowedRoles={['passenger']}>
            <DashboardLayout userType="passenger" title="Real-Time Tracking">
                <div className="relative h-[calc(100vh-180px)] -mt-4 -mx-4 lg:-mx-8 overflow-hidden">
                    {/* Live Map */}
                    <TripMap
                        passengerPos={passengerPos}
                        driverPos={driverPos}
                        destinationPos={destinationPos}
                        center={driverPos || passengerPos}
                    />

                    {/* Top Floating Driver Info */}
                    <div className="absolute top-4 lg:top-6 left-4 lg:left-6 right-4 lg:right-6 z-10">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="max-w-xl mx-auto"
                        >
                            <Card className="p-3 lg:p-4 border-none shadow-2xl bg-[#111827]/95 backdrop-blur-md flex items-center justify-between">
                                <div className="flex items-center gap-3 lg:gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-[#374151] overflow-hidden ring-2 ring-indigo-500/20">
                                            {trip.driver_avatar ? (
                                                <img src={trip.driver_avatar} alt="Driver" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#6B7280]">
                                                    <Car size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#111827]" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#F9FAFB] leading-none text-sm lg:text-base">
                                            {trip.driver_name || 'Assigned Driver'}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                                                ★ {trip.driver_rating || '5.0'}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest hidden sm:inline">
                                                {trip.vehicle_details || 'White Tesla Model 3'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-2 lg:mr-4 hidden sm:block">
                                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest leading-none mb-1">Estimated Arrival</p>
                                        <p className="text-lg lg:text-xl font-black text-indigo-400 italic tracking-tight leading-none">{duration}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="rounded-xl hover:bg-indigo-500/10 px-2 h-10 w-10">
                                        <Phone size={20} className="text-indigo-400" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="rounded-xl hover:bg-indigo-500/10 px-2 h-10 w-10">
                                        <MessageSquare size={20} className="text-indigo-400" />
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Bottom Status Panel */}
                    <div className="absolute bottom-4 lg:bottom-6 left-4 lg:left-6 right-4 lg:right-6 z-10 flex justify-center">
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            className="w-full max-w-4xl"
                        >
                            <Card className="shadow-2xl border-none overflow-hidden bg-[#111827]/95 backdrop-blur-md">
                                <div className="p-4 lg:p-6">
                                    {/* Progress Stepper */}
                                    <div className="flex items-center justify-between mb-6 lg:mb-8 relative">
                                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#1E293B] -translate-y-1/2 z-0" />
                                        {[
                                            { label: 'Confirmed', status: 'bid_accepted', icon: <Shield size={14} /> },
                                            { label: 'Assigned', status: 'driver_assigned', icon: <Car size={14} /> },
                                            { label: 'Active', status: 'active', icon: <Navigation size={14} /> },
                                            { label: 'Completed', status: 'completed', icon: <Clock size={14} /> }
                                        ].map((step, i) => {
                                            const statuses = ['bid_accepted', 'driver_assigned', 'active', 'completed'];
                                            const currentIndex = statuses.indexOf(trip.status || 'pending');
                                            const stepIndex = i;
                                            const isDone = stepIndex < currentIndex;
                                            const isActive = stepIndex === currentIndex;

                                            return (
                                                <div key={i} className="flex flex-col items-center gap-1 lg:gap-2 relative z-10">
                                                    <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                                        isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-110' :
                                                            'bg-[#1E293B] text-[#6B7280]'
                                                        }`}>
                                                        {step.icon}
                                                    </div>
                                                    <span className={`text-[8px] lg:text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-indigo-400' : 'text-[#6B7280]'
                                                        }`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-center">
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                                                <Navigation size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest leading-none mb-1">
                                                    {trip.status === 'active' ? 'On Route To' : 'Meeting Point'}
                                                </p>
                                                <p className="text-sm font-bold text-[#F9FAFB] truncate max-w-[150px]">
                                                    {trip.status === 'active' ? trip.dest_address : trip.origin_address}
                                                </p>
                                                {routeName && (
                                                    <p className="text-[10px] text-[#6B7280] font-medium mt-1 truncate max-w-[150px]">
                                                        {routeName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-center">
                                            <div className="px-5 lg:px-6 py-2 bg-[#1E293B] rounded-2xl text-center border border-[#374151] flex flex-col items-center min-w-[120px]">
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <Navigation2 size={10} className="text-[#6B7280]" />
                                                    <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-[0.2em]">Distance</p>
                                                </div>
                                                <p className="text-xl font-bold text-[#F9FAFB] italic tracking-tighter">{distanceKm} km</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-3">
                                            <Button variant="outline" className="text-red-400 hover:bg-red-500/10 border-red-500/20 px-4 lg:px-6 font-bold uppercase tracking-widest text-xs h-11 lg:h-12">
                                                Cancel
                                            </Button>
                                            <Button className="bg-red-600 hover:bg-red-700 text-white px-4 lg:px-6 font-bold uppercase tracking-widest text-xs h-11 lg:h-12 flex items-center gap-2 group shadow-lg shadow-red-500/20">
                                                <AlertTriangle size={16} className="group-hover:animate-bounce" />
                                                SOS
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* ── Trip Completed Overlay ── */}
                    <AnimatePresence>
                        {showCompletionScreen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-30 bg-[#0B1020]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-y-auto"
                            >
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                    className="w-full max-w-md space-y-6"
                                >
                                    {/* Success Header */}
                                    <div className="text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.1, stiffness: 200, damping: 15 }}
                                            className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4"
                                        >
                                            <CheckCircle2 size={40} className="text-emerald-400" />
                                        </motion.div>
                                        <h2 className="text-2xl font-black text-[#F9FAFB] mb-1">Trip Completed!</h2>
                                        <p className="text-sm text-[#6B7280]">Thank you for riding with Commuto</p>
                                    </div>

                                    {/* Payment Button (if pending) */}
                                    {trip?.booking_id && trip?.booking_payment_status === 'pending' && (
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <Card className="border-none shadow-lg p-5 text-center">
                                                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-3">Payment Pending</p>
                                                <p className="text-3xl font-black text-[#F9FAFB] mb-4">₹{(trip.booking_total_price ?? trip.price_per_seat ?? 0).toFixed(0)}</p>
                                                <button
                                                    onClick={() => setIsPaymentModalOpen(true)}
                                                    className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
                                                >
                                                    Pay Now
                                                </button>
                                            </Card>
                                        </motion.div>
                                    )}

                                    {/* Receipt Card (always shown on completion) */}
                                    {transformedTrip && trip && (
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <TripReceiptCard
                                                rawTrip={trip}
                                                trip={transformedTrip}
                                                tripId={trip.id}
                                                distance={distanceKm}
                                            />
                                        </motion.div>
                                    )}

                                    {/* Back to Dashboard */}
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <button
                                            onClick={() => router.push('/passenger/dashboard')}
                                            className="w-full h-14 bg-[#1E293B] hover:bg-[#374151] text-[#F9FAFB] rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            Back to Dashboard
                                            <ArrowRight size={16} />
                                        </button>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Payment Modal */}
                    {trip?.booking_id && (
                        <TripPaymentModal
                            isOpen={isPaymentModalOpen}
                            onClose={() => setIsPaymentModalOpen(false)}
                            tripId={trip.id}
                            bookingId={trip.booking_id}
                            amount={trip.booking_total_price ?? trip.price_per_seat ?? 0}
                            tripName={trip.dest_address?.split(',')[0] || 'Destination'}
                            onSuccess={() => {
                                refetchTrip();
                            }}
                        />
                    )}
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
