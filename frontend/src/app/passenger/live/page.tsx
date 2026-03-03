"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone,
    MessageSquare,
    AlertTriangle,
    X,
    ChevronUp,
    Car,
    Clock,
    Navigation,
    Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTripWebSocket } from '@/hooks/useTripWebSocket';
import { tripsAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import dynamic from 'next/dynamic';

const TripMap = dynamic(() => import('@/components/map/TripMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#1E293B] animate-pulse flex items-center justify-center text-[#6B7280]">Loading Live Map...</div>
});

export default function PassengerLivePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [trip, setTrip] = useState<TripResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPanelExpanded, setIsPanelExpanded] = useState(true);

    useEffect(() => {
        const fetchActiveTrip = async () => {
            try {
                const trips = await tripsAPI.getMyTrips();
                const active = trips.find(t => ['active', 'driver_assigned', 'bid_accepted'].includes(t.status));
                if (active) {
                    setTrip(active);
                } else {
                    router.push('/passenger/dashboard');
                }
            } catch (error) {
                console.error('Failed to fetch active trip:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveTrip();
    }, [router]);

    const {
        isConnected,
        lastLocation,
        tripStatus
    } = useTripWebSocket(trip?.id || null);

    useEffect(() => {
        if (tripStatus && trip && trip.status !== tripStatus) {
            setTrip({ ...trip, status: tripStatus } as TripResponse);
            if (tripStatus === 'completed') {
                setTimeout(() => router.push('/passenger/dashboard'), 3000);
            }
        }
    }, [tripStatus, trip, router]);

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

    if (isLoading) {
        return (
            <DashboardLayout userType="passenger" title="Live Tracking">
                <div className="flex items-center justify-center h-[70vh]">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!trip) return null;

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
                                        <p className="text-lg lg:text-xl font-black text-indigo-400 italic tracking-tight leading-none">4 mins</p>
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
                                                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest leading-none mb-1">On Route To</p>
                                                <p className="text-sm font-bold text-[#F9FAFB] truncate max-w-[150px]">{trip.dest_address}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-center">
                                            <div className="px-5 lg:px-6 py-2 bg-[#1E293B] rounded-2xl text-center border border-[#374151]">
                                                <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-[0.2em] mb-0.5">Estimated Fare</p>
                                                <p className="text-xl font-bold text-[#F9FAFB] italic tracking-tighter">${trip.price_per_seat || '24.50'}</p>
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
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
