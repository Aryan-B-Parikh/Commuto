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
    User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTripWebSocket } from '@/hooks/useTripWebSocket';
import { tripsAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { calculateDistance } from '@/utils/geoUtils';
import dynamic from 'next/dynamic';

const TripMap = dynamic(() => import('@/components/map/TripMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#0B1020] animate-pulse flex items-center justify-center text-[#9CA3AF]">Loading Navigation...</div>
});

export default function DriverLivePage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [trip, setTrip] = useState<TripResponse | null>(null);
    const [isFetchingTrip, setIsFetchingTrip] = useState(true);
    const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        if (isConnected && trip?.status === 'active') {
            console.log("Starting location broadcaster...");

            let currentLat = Number(trip.origin_lat);
            let currentLng = Number(trip.origin_lng);
            const targetLat = Number(trip.dest_lat);
            const targetLng = Number(trip.dest_lng);

            locationIntervalRef.current = setInterval(() => {
                currentLat += (targetLat - currentLat) * 0.05;
                currentLng += (targetLng - currentLng) * 0.05;

                sendLocation(currentLat, currentLng);
            }, 5000);
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
            <DashboardLayout userType="driver" title="Live Navigation">
                <div className="relative h-[calc(100vh-180px)] -mt-4 -mx-8 overflow-hidden">
                    <TripMap
                        passengerPos={passengerPos}
                        destinationPos={destinationPos}
                        center={currentStatus === 'active' ? undefined : passengerPos}
                    />

                    {/* Floating Passenger Info Header */}
                    <div className="absolute top-6 left-6 right-6 z-10">
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-xl mx-auto">
                            <Card className="p-4 border-none shadow-2xl bg-[#0B1020]/95 backdrop-blur-md text-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#1E293B] flex items-center justify-center text-indigo-400 border border-[#374151]">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white leading-none">
                                            Pickup: {trip.origin_address.split(',')[0]}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                                                Passenger Assigned
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="rounded-xl hover:bg-white/10 text-white px-2 h-10 w-10">
                                        <Phone size={20} />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="rounded-xl hover:bg-white/10 text-white px-2 h-10 w-10">
                                        <MessageSquare size={20} />
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-center">
                        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="w-full max-w-4xl">
                            <Card className="shadow-2xl border-none p-6 bg-[#111827]/95 backdrop-blur-md">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Target Destination</p>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-red-500" />
                                                <p className="font-bold text-[#F9FAFB]">{trip.dest_address.split(',')[0]}</p>
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-[#1E293B]" />
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Distance</p>
                                            <div className="flex items-center gap-2">
                                                <Navigation size={16} className="text-indigo-400 font-bold" />
                                                <p className="font-bold text-[#F9FAFB] tracking-tight">
                                                    {calculateDistance(
                                                        { lat: trip.origin_lat, lng: trip.origin_lng },
                                                        { lat: trip.dest_lat, lng: trip.dest_lng }
                                                    ).toFixed(1)} km
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        {currentStatus === 'bid_accepted' && (
                                            <Button
                                                className="flex-1 md:flex-none h-14 bg-indigo-600 hover:bg-indigo-700 text-white px-10 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20"
                                                onClick={() => updateStatus('driver_assigned')}
                                            >
                                                I Have Arrived
                                            </Button>
                                        )}
                                        {currentStatus === 'driver_assigned' && (
                                            <Button
                                                className="flex-1 md:flex-none h-14 bg-emerald-600 hover:bg-emerald-700 text-white px-10 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 flex items-center gap-2"
                                                onClick={() => updateStatus('active')}
                                            >
                                                <Car size={18} />
                                                Start Trip
                                            </Button>
                                        )}
                                        {currentStatus === 'active' && (
                                            <Button
                                                className="flex-1 md:flex-none h-14 bg-[#F9FAFB] hover:bg-white text-[#0B1020] px-10 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center gap-2"
                                                onClick={() => updateStatus('completed')}
                                            >
                                                <CheckCircle size={18} />
                                                Complete Trip
                                            </Button>
                                        )}
                                        {currentStatus === 'completed' && (
                                            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs bg-emerald-500/10 px-6 py-4 rounded-2xl border border-emerald-500/20 animate-pulse">
                                                <Flag size={16} /> Trip Finished
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
