"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
import { calculateDistance } from '@/utils/geoUtils';
import { otpAPI, tripsAPI } from '@/services/api';
import { VerifyOTPModal } from '@/components/ride/VerifyOTPModal';
import { TripResponse } from '@/types/api';
import { useToast } from '@/hooks/useToast';
import { useRouteInfo } from '@/hooks/useRouteInfo';
import dynamic from 'next/dynamic';
import { normalizeRideStatus, isRideStarted } from '@/utils/rideState';

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
    const [isStartOTPModalOpen, setIsStartOTPModalOpen] = useState(false);
    const [isEndOTPModalOpen, setIsEndOTPModalOpen] = useState(false);
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [isCompletingTrip, setIsCompletingTrip] = useState(false);
    const [driverPos, setDriverPos] = useState<[number, number] | undefined>(undefined);
    const [heading, setHeading] = useState<number>(0);
    const locationWatchRef = useRef<number | null>(null);
    const hasCompletedRef = useRef<boolean>(false);
    const hasShownGpsErrorRef = useRef<boolean>(false);
    const completionRedirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasShownRateLimitRef = useRef<boolean>(false);
    const tripRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [tripFetchRetryTick, setTripFetchRetryTick] = useState(0);
    const hasShownDestinationPromptRef = useRef<boolean>(false);

    const targetCoords = useMemo((): [number, number] | undefined => {
        if (!trip) return undefined;
        const isStarted = isRideStarted(trip.status);
        return isStarted
            ? [Number(trip.dest_lat), Number(trip.dest_lng)]
            : [Number(trip.origin_lat), Number(trip.origin_lng)];
    }, [trip]);

    const { distanceKm, duration, routeName } = useRouteInfo(
        driverPos ? [driverPos[0], driverPos[1]] : undefined,
        targetCoords
    );

    useEffect(() => {
        const fetchActiveTrip = async () => {
            if (isAuthLoading || !user) return;

            try {
                const trips = await tripsAPI.getDriverTrips();
                hasShownRateLimitRef.current = false;
                const currentTrip = trips.find(t => ['accepted', 'started', 'completed'].includes(normalizeRideStatus(t.status)));
                if (currentTrip) {
                    setTrip(currentTrip);
                } else {
                    router.replace('/driver/requests');
                }
            } catch (error: any) {
                if (error.response?.status === 429) {
                    if (!hasShownRateLimitRef.current) {
                        showToast('error', 'Too many requests. Retrying live trip sync...');
                        hasShownRateLimitRef.current = true;
                    }
                    tripRetryTimeoutRef.current = setTimeout(() => {
                        setTripFetchRetryTick((v) => v + 1);
                    }, 1500);
                    return;
                }

                if (error.response?.status !== 401) {
                    console.error('Failed to fetch active driver trip:', error);
                }
            } finally {
                setIsFetchingTrip(false);
            }
        };

        fetchActiveTrip();
        return () => {
            if (tripRetryTimeoutRef.current) {
                clearTimeout(tripRetryTimeoutRef.current);
                tripRetryTimeoutRef.current = null;
            }
        };
    }, [router, user, isAuthLoading, tripFetchRetryTick]);

    const {
        isConnected,
        sendLocation,
        tripStatus
    } = useTripWebSocket(trip?.id || null);

    const completeRideWithOtp = async (otp: string) => {
        if (!trip) return;

        setIsCompletingTrip(true);
        try {
            await otpAPI.completeRide(trip.id, otp);
            setTrip(prev => (prev ? { ...prev, status: 'completed' } as TripResponse : prev));
            setIsEndOTPModalOpen(false);
            showToast('success', "Trip completed!");
        } catch (err: any) {
            showToast('error', err.response?.data?.detail || "Failed to complete trip");
        } finally {
            setIsCompletingTrip(false);
        }
    };

    useEffect(() => {
        if (tripStatus && trip && trip.status !== tripStatus) {
            setTrip({ ...trip, status: tripStatus } as TripResponse);
        }
    }, [tripStatus, trip, router]);

    useEffect(() => {
        if (trip?.status !== 'completed' || completionRedirectTimeoutRef.current) {
            return;
        }

        completionRedirectTimeoutRef.current = setTimeout(() => {
            router.replace('/driver/dashboard');
        }, 1200);

        return () => {
            if (completionRedirectTimeoutRef.current) {
                clearTimeout(completionRedirectTimeoutRef.current);
                completionRedirectTimeoutRef.current = null;
            }
        };
    }, [trip?.status, router]);

    useEffect(() => {
        if (!trip || !isRideStarted(trip.status)) return;

        const warnBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = 'Ride is in progress. You cannot leave this screen.';
            return event.returnValue;
        };

        window.addEventListener('beforeunload', warnBeforeUnload);
        return () => window.removeEventListener('beforeunload', warnBeforeUnload);
    }, [trip?.status]);

    useEffect(() => {
        if (!isConnected || !trip || hasCompletedRef.current) return;

        if (!("geolocation" in navigator)) {
            showToast('error', "Geolocation is not supported by your browser");
            return;
        }

        if (!driverPos && trip.status !== 'completed') {
            setDriverPos([Number(trip.origin_lat), Number(trip.origin_lng)]);
        }

        locationWatchRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude, heading: newHeading } = position.coords;
                const newPos: [number, number] = [latitude, longitude];
                hasShownGpsErrorRef.current = false;

                setDriverPos(newPos);
                if (newHeading !== null) {
                    setHeading(newHeading);
                }

                sendLocation(latitude, longitude);

                if (isRideStarted(trip.status) && !hasCompletedRef.current) {
                    const distToDest = calculateDistance(
                        { lat: latitude, lng: longitude },
                        { lat: Number(trip.dest_lat), lng: Number(trip.dest_lng) }
                    );

                    if (distToDest <= 0.05) {
                        hasCompletedRef.current = true;
                        if (!hasShownDestinationPromptRef.current) {
                            hasShownDestinationPromptRef.current = true;
                            showToast('success', "Destination reached! Ask passenger for 6-digit drop OTP, then tap END TRIP.");
                        }
                    }
                }
            },
            (error: GeolocationPositionError) => {
                const gpsMessageByCode: Record<number, string> = {
                    1: 'Location permission denied. Please allow location access for live trip tracking.',
                    2: 'Location unavailable. Check GPS/network and try again.',
                    3: 'Location request timed out. Retrying...'
                };

                const friendlyMessage = gpsMessageByCode[error.code] || 'Unable to get GPS location.';

                // Some environments print GeolocationPositionError as {} in console.
                console.error('GPS Error:', {
                    code: error.code,
                    message: error.message || friendlyMessage,
                    friendlyMessage
                });

                if (!hasShownGpsErrorRef.current) {
                    showToast('error', friendlyMessage);
                    hasShownGpsErrorRef.current = true;
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 10000
            }
        );

        return () => {
            if (locationWatchRef.current !== null) {
                navigator.geolocation.clearWatch(locationWatchRef.current);
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

    const currentStatus = normalizeRideStatus(trip.status);

    return (
        <RoleGuard allowedRoles={['driver']}>
            <DashboardLayout userType="driver" title="Ride Details">
                <div className="max-w-6xl mx-auto pb-12 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Driver Live Navigation</div>
                        {isConnected && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold ring-1 ring-emerald-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live Updates Active
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="overflow-hidden border-0 shadow-2xl shadow-indigo-500/5">
                                <div className="h-[300px] lg:h-[430px] w-full relative">
                                    <MapWidget
                                        driverPos={driverPos}
                                        driverHeading={heading}
                                        pickup={passengerPos}
                                        destination={destinationPos}
                                        showRoute={true}
                                    />

                                    <div className="absolute top-4 left-4 right-4">
                                        <div className="bg-[#111827]/90 backdrop-blur-xl border border-[#1E293B] rounded-2xl p-4 shadow-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Pickup Passenger</p>
                                                    <h4 className="font-bold text-[#F9FAFB] text-sm truncate max-w-[170px] md:max-w-none">
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
                                    </div>
                                </div>

                                <div className="p-5 lg:p-6 bg-[#111827] space-y-4">
                                    <div className="bg-[#0B1020] border border-[#1E293B] rounded-2xl p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MapPin size={14} className="text-red-500" />
                                                    <p className="font-bold text-[#F9FAFB] text-base truncate">
                                                        {currentStatus === 'started' ? trip.dest_address.split(',')[0] : 'To Pickup Point'}
                                                    </p>
                                                </div>
                                                {routeName && (
                                                    <p className="text-[10px] text-[#6B7280] font-medium truncate">
                                                        {routeName}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right border-l border-[#1E293B] pl-6 ml-6">
                                                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1">Arrival</p>
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Clock size={12} className="text-indigo-400" />
                                                        <p className="font-black text-indigo-400 text-lg leading-none italic">{duration}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Navigation2 size={10} className="text-[#6B7280]" />
                                                        <p className="text-[10px] font-bold text-[#6B7280]">{distanceKm} km</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                const targetLat = currentStatus === 'started' ? trip.dest_lat : trip.origin_lat;
                                                const targetLng = currentStatus === 'started' ? trip.dest_lng : trip.origin_lng;
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}&travelmode=driving`, '_blank');
                                            }}
                                            className="w-14 h-14 rounded-2xl bg-[#1E293B] flex items-center justify-center text-[#F9FAFB] shrink-0 border border-[#374151] active:scale-95 transition-transform"
                                        >
                                            <Navigation size={24} className="rotate-45" />
                                        </button>

                                        {currentStatus === 'accepted' && (
                                            <button
                                                onClick={() => setIsStartOTPModalOpen(true)}
                                                className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all"
                                            >
                                                START RIDE
                                            </button>
                                        )}
                                        {currentStatus === 'started' && (
                                            <button
                                                disabled={isCompletingTrip}
                                                onClick={() => setIsEndOTPModalOpen(true)}
                                                className="flex-1 h-14 bg-white text-[#0B1020] rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                                            >
                                                {isCompletingTrip ? 'ENDING...' : 'END TRIP'}
                                            </button>
                                        )}
                                        {currentStatus === 'completed' && (
                                            <div className="flex-1 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center font-black uppercase tracking-widest text-sm italic">
                                                TRIP FINISHED
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                            <Card className="bg-[#111827]/95 border-none shadow-2xl backdrop-blur-xl p-6 flex flex-col gap-8">
                                <div>
                                    <h3 className="text-sm font-black text-[#F9FAFB] uppercase tracking-[0.2em] mb-4">Trip Timeline</h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${['accepted', 'started'].includes(currentStatus) ? 'bg-indigo-500 ring-4 ring-indigo-500/20' : 'bg-[#1E293B]'}`} />
                                                <div className="w-0.5 h-10 bg-[#1E293B]" />
                                            </div>
                                            <p className={`text-xs font-bold ${currentStatus === 'accepted' ? 'text-indigo-400' : 'text-[#6B7280]'}`}>Driver Heading to Pickup</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${currentStatus === 'started' ? 'bg-indigo-500 ring-4 ring-indigo-500/20' : 'bg-[#1E293B]'}`} />
                                                <div className="w-0.5 h-10 bg-[#1E293B]" />
                                            </div>
                                            <p className={`text-xs font-bold ${currentStatus === 'started' ? 'text-indigo-400' : 'text-[#6B7280]'}`}>Live Trip in Progress</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${currentStatus === 'started' ? 'bg-indigo-500 ring-4 ring-indigo-500/20' : 'bg-[#1E293B]'}`} />
                                            </div>
                                            <p className={`text-xs font-bold ${currentStatus === 'started' ? 'text-indigo-400' : 'text-[#6B7280]'}`}>Destination Bound</p>
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
                            <Card className="p-5 lg:p-6 border-t-4 border-t-indigo-500 shadow-xl shadow-indigo-500/10">
                                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">Trip Status</p>
                                <p className="text-2xl font-black text-indigo-400 uppercase tracking-wide mb-4">{currentStatus.replace('_', ' ')}</p>
                                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                                        {currentStatus === 'completed' ? 'Trip Closed' : currentStatus === 'started' ? 'Live Tracking Enabled' : 'Ready to Start'}
                                    </span>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                <VerifyOTPModal
                    isOpen={isStartOTPModalOpen}
                    onClose={() => setIsStartOTPModalOpen(false)}
                    isVerifying={isVerifyingOTP}
                    title="Verify Start OTP"
                    subtitle="Ask passenger for the 6-digit pickup OTP"
                    verifyButtonText="Verify & Start Trip"
                    verifyingText="Starting trip..."
                    onVerify={async (otp) => {
                        setIsVerifyingOTP(true);
                        try {
                            await otpAPI.verifyOTP(trip.id, otp);
                            setTrip(prev => (prev ? { ...prev, status: 'started', otp_verified: true } as TripResponse : prev));
                            showToast('success', "OTP Verified! Trip started. End trip will require drop OTP.");
                            setIsStartOTPModalOpen(false);
                        } catch (err: any) {
                            if (err.response?.status === 401) {
                                showToast('error', "Your session has expired. Please refresh the page or login again.");
                            } else {
                                showToast('error', err.response?.data?.detail || "Invalid OTP. Please try again.");
                            }
                        } finally {
                            setIsVerifyingOTP(false);
                        }
                    }}
                />

                <VerifyOTPModal
                    isOpen={isEndOTPModalOpen}
                    onClose={() => setIsEndOTPModalOpen(false)}
                    isVerifying={isCompletingTrip}
                    title="Verify Drop OTP"
                    subtitle="Ask passenger for the 6-digit drop OTP to end this trip"
                    verifyButtonText="Verify & End Trip"
                    verifyingText="Ending trip..."
                    onVerify={async (otp) => {
                        await completeRideWithOtp(otp);
                    }}
                />
            </DashboardLayout>
        </RoleGuard>
    );
}
