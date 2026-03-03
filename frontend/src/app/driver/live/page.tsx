"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Navigation,
    CheckCircle,
    Car,
    Flag,
    Phone,
    MessageSquare,
    MapPin,
    Clock,
    User,
    Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTripWebSocket } from '@/hooks/useTripWebSocket';
import { calculateDistance } from '@/utils/geoUtils';
import { otpAPI, tripsAPI } from '@/services/api';
import { VerifyOTPModal } from '@/components/ride/VerifyOTPModal';
import { TripResponse } from '@/types/api';
import { useToast } from '@/hooks/useToast';
import dynamic from 'next/dynamic';

const MapWidget = dynamic(() => import('@/components/map/MapWidget').then(mod => mod.MapWidget), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#0B1020] animate-pulse flex items-center justify-center text-[#9CA3AF]">Loading Navigation...</div>
});

export default function DriverLivePage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { showToast } = useToast() as any;
    const router = useRouter();
    const [trip, setTrip] = useState<TripResponse | null>(null);
    const [isFetchingTrip, setIsFetchingTrip] = useState(true);
    const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [isCompletingTrip, setIsCompletingTrip] = useState(false);
    const [driverPos, setDriverPos] = useState<[number, number] | undefined>(undefined);
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
    const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const routeIndexRef = useRef<number>(0);

    useEffect(() => {
        const fetchActiveTrip = async () => {
            if (isAuthLoading || !user) return;

            try {
                const trips = await tripsAPI.getDriverTrips();
                const active = trips.find(t => ['active', 'driver_assigned', 'bid_accepted'].includes(t.status));
                if (active) {
                    setTrip(active);
                } else {
                    router.push('/driver/dashboard');
                }
            } catch (error: any) {
                if (error.response?.status !== 401) {
                    console.error('Failed to fetch active driver trip:', error);
                }
            } finally {
                setIsFetchingTrip(false);
            }
        };

        fetchActiveTrip();
    }, [router, user, isAuthLoading]);

    const {
        isConnected,
        sendLocation,
        updateStatus,
        tripStatus
    } = useTripWebSocket(trip?.id || null);

    useEffect(() => {
        if (tripStatus && trip && trip.status !== tripStatus) {
            setTrip({ ...trip, status: tripStatus } as TripResponse);
            if (tripStatus === 'completed') {
                setTimeout(() => router.push('/driver/dashboard'), 3000);
            }
        }
    }, [tripStatus, trip, router]);

    useEffect(() => {
        const fetchRoute = async () => {
            if (!trip) return;
            const start = driverPos || [Number(trip.origin_lat) + 0.005, Number(trip.origin_lng) + 0.005];
            const end = trip.status === 'active' ? [Number(trip.dest_lat), Number(trip.dest_lng)] : [Number(trip.origin_lat), Number(trip.origin_lng)];

            try {
                const query = await fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/driving/${start[1]},${start[0]};${end[1]},${end[0]}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
                );
                const json = await query.json();
                if (json.routes && json.routes.length > 0) {
                    const coords = json.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
                    setRouteCoords(coords);
                    routeIndexRef.current = 0;
                    if (!driverPos) setDriverPos(coords[0]);
                }
            } catch (err) {
                console.error("Failed to fetch route for simulation:", err);
            }
        };

        if (trip) fetchRoute();
    }, [trip?.status, !!trip]);

    useEffect(() => {
        if (isConnected && trip && routeCoords.length > 0) {
            console.log("Starting road-aware location broadcaster...");

            locationIntervalRef.current = setInterval(() => {
                if (routeIndexRef.current < routeCoords.length - 1) {
                    routeIndexRef.current += 1;
                    const nextPos = routeCoords[routeIndexRef.current];
                    setDriverPos(nextPos);
                    sendLocation(nextPos[0], nextPos[1]);
                }
            }, 3000);
        }

        return () => {
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }
        };
    }, [isConnected, trip, sendLocation]);

    const passengerPos = useMemo(() => {
        if (!trip) return undefined;
        return [Number(trip.origin_lat), Number(trip.origin_lng)] as [number, number];
    }, [trip]);

    const destinationPos = useMemo(() => {
        if (!trip) return undefined;
        return [Number(trip.dest_lat), Number(trip.dest_lng)] as [number, number];
    }, [trip]);

    if (isFetchingTrip) return <div className="p-8 text-center text-[#9CA3AF]">Locating Trip...</div>;
    if (!trip) return null;

    const currentStatus = trip.status;

    return (
        <RoleGuard allowedRoles={['driver']}>
            <DashboardLayout userType="driver" title="Live Navigation" immersive={true}>
                <div className="relative h-screen w-full bg-[#0B1020] overflow-hidden">
                    {/* Immersive Map */}
                    <div className="absolute inset-0 z-0">
                        <MapWidget
                            driverPos={driverPos}
                            driverHeading={routeCoords[routeIndexRef.current] ? 90 : 0} // Simplified heading
                            pickup={passengerPos}
                            destination={destinationPos}
                            showRoute={true}
                        />
                    </div>

                    {/* 1️⃣ TOP FLOATING INFO CARD (Mobile & Desktop) */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex justify-center">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="w-full max-w-xl"
                        >
                            <div className="bg-[#111827]/90 backdrop-blur-xl border border-[#1E293B] rounded-2xl p-4 shadow-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Pickup Passenger</p>
                                        <h4 className="font-bold text-[#F9FAFB] text-sm truncate max-w-[150px] md:max-w-none">
                                            {trip.passenger_notes?.[0]?.passenger_name || 'Rider'}
                                        </h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="w-10 h-10 rounded-xl bg-[#1E293B] flex items-center justify-center text-[#F9FAFB] hover:bg-[#334155] transition-colors">
                                        <Phone size={18} />
                                    </button>
                                    <button className="w-10 h-10 rounded-xl bg-[#1E293B] flex items-center justify-center text-[#F9FAFB] hover:bg-[#334155] transition-colors">
                                        <MessageSquare size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* 2️⃣ BOTTOM ACTION PANEL (Uber Style) */}
                    <div className="absolute bottom-6 left-4 right-4 z-20 flex justify-center">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="w-full max-w-xl"
                        >
                            <div className="bg-[#111827] border border-[#1E293B] rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1">Destination</p>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-red-500" />
                                            <p className="font-bold text-[#F9FAFB] text-base truncate">
                                                {trip.dest_address.split(',')[0]}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1">Distance</p>
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Navigation size={14} className="text-indigo-400" />
                                            <p className="font-black text-indigo-400 text-base">
                                                {calculateDistance(
                                                    { lat: trip.origin_lat, lng: trip.origin_lng },
                                                    { lat: trip.dest_lat, lng: trip.dest_lng }
                                                ).toFixed(1)} km
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Google Maps Nav Icon */}
                                    <button
                                        onClick={() => {
                                            const targetLat = currentStatus === 'active' ? trip.dest_lat : trip.origin_lat;
                                            const targetLng = currentStatus === 'active' ? trip.dest_lng : trip.origin_lng;
                                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}&travelmode=driving`, '_blank');
                                        }}
                                        className="w-14 h-14 rounded-2xl bg-[#1E293B] flex items-center justify-center text-[#F9FAFB] shrink-0 border border-[#374151] active:scale-95 transition-transform"
                                    >
                                        <Navigation size={24} className="rotate-45" />
                                    </button>

                                    {/* Main Dynamic Action Button */}
                                    {currentStatus === 'bid_accepted' && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await updateStatus('driver_assigned');
                                                    showToast('success', "Status updated: You've arrived!");
                                                } catch (err) {
                                                    showToast('error', "Failed to update arrival status");
                                                }
                                            }}
                                            className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all"
                                        >
                                            I HAVE ARRIVED
                                        </button>
                                    )}
                                    {currentStatus === 'driver_assigned' && (
                                        <button
                                            onClick={() => setIsOTPModalOpen(true)}
                                            className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                        >
                                            <Car size={20} />
                                            START TRIP
                                        </button>
                                    )}
                                    {currentStatus === 'active' && (
                                        <button
                                            disabled={isCompletingTrip}
                                            onClick={async () => {
                                                if (!confirm('Are you sure you want to complete this trip?')) return;
                                                setIsCompletingTrip(true);
                                                try {
                                                    await otpAPI.completeRide(trip.id);
                                                    showToast('success', "Trip completed!");
                                                } catch (err: any) {
                                                    showToast('error', err.response?.data?.detail || "Failed to complete trip");
                                                } finally {
                                                    setIsCompletingTrip(false);
                                                }
                                            }}
                                            className="flex-1 h-14 bg-white text-[#0B1020] rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            {isCompletingTrip ? 'COMPLETING...' : 'COMPLETE TRIP'}
                                        </button>
                                    )}
                                    {currentStatus === 'completed' && (
                                        <div className="flex-1 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center font-black uppercase tracking-widest text-sm italic">
                                            TRIP FINISHED
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* 💻 DESKTOP ONLY: SIDE FLOATING PANEL */}
                    <div className="hidden lg:block absolute right-6 top-24 bottom-24 w-80 z-20">
                        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                            <Card className="h-full bg-[#111827]/95 border-none shadow-2xl backdrop-blur-xl p-6 flex flex-col gap-8">
                                <div>
                                    <h3 className="text-sm font-black text-[#F9FAFB] uppercase tracking-[0.2em] mb-4">Trip Timeline</h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${['bid_accepted', 'driver_assigned', 'active'].includes(currentStatus) ? 'bg-indigo-500 ring-4 ring-indigo-500/20' : 'bg-[#1E293B]'}`} />
                                                <div className="w-0.5 h-10 bg-[#1E293B]" />
                                            </div>
                                            <p className={`text-xs font-bold ${currentStatus === 'bid_accepted' ? 'text-indigo-400' : 'text-[#6B7280]'}`}>Driver Heading to Pickup</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${['driver_assigned', 'active'].includes(currentStatus) ? 'bg-indigo-500 ring-4 ring-indigo-500/20' : 'bg-[#1E293B]'}`} />
                                                <div className="w-0.5 h-10 bg-[#1E293B]" />
                                            </div>
                                            <p className={`text-xs font-bold ${currentStatus === 'driver_assigned' ? 'text-indigo-400' : 'text-[#6B7280]'}`}>Arrived at Location</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${currentStatus === 'active' ? 'bg-indigo-500 ring-4 ring-indigo-500/20' : 'bg-[#1E293B]'}`} />
                                            </div>
                                            <p className={`text-xs font-bold ${currentStatus === 'active' ? 'text-indigo-400' : 'text-[#6B7280]'}`}>Live Trip in Progress</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto border-t border-[#1E293B] pt-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Shield className="text-emerald-400" size={16} />
                                        <span className="text-[10px] font-black text-[#F9FAFB] uppercase tracking-widest">Safety Active</span>
                                    </div>
                                    <p className="text-[10px] text-[#6B7280] leading-relaxed">Your location is being broadcasted to our safety center.</p>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    <VerifyOTPModal
                        isOpen={isOTPModalOpen}
                        onClose={() => setIsOTPModalOpen(false)}
                        isVerifying={isVerifyingOTP}
                        onVerify={async (otp) => {
                            setIsVerifyingOTP(true);
                            try {
                                await otpAPI.verifyOTP(trip.id, otp);
                                showToast('success', "OTP Verified! Trip started.");
                                setIsOTPModalOpen(false);
                            } catch (err: any) {
                                showToast('error', err.response?.data?.detail || "Invalid OTP. Please try again.");
                            } finally {
                                setIsVerifyingOTP(false);
                            }
                        }}
                    />
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
