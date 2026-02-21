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

// Dynamically import TripMap to avoid SSR issues with Leaflet
const TripMap = dynamic(() => import('@/components/map/TripMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">Loading Live Map...</div>
});

export default function PassengerLivePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [trip, setTrip] = useState<TripResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPanelExpanded, setIsPanelExpanded] = useState(true);

    // 1. Fetch active trip
    useEffect(() => {
        const fetchActiveTrip = async () => {
            try {
                const trips = await tripsAPI.getMyTrips();
                // Filter for a trip that is either active or driver_assigned
                const active = trips.find(t => ['active', 'driver_assigned', 'bid_accepted'].includes(t.status));
                if (active) {
                    setTrip(active);
                } else {
                    // No active trip, redirect back
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

    // 2. Connect to WebSocket
    const {
        isConnected,
        lastLocation,
        tripStatus
    } = useTripWebSocket(trip?.id || null);

    // Sync trip status from WebSocket
    useEffect(() => {
        if (tripStatus && trip && trip.status !== tripStatus) {
            setTrip({ ...trip, status: tripStatus } as TripResponse);
            if (tripStatus === 'completed') {
                // Redirect after a small delay
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
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!trip) return null;

    return (
        <RoleGuard allowedRoles={['passenger']}>
            <DashboardLayout userType="passenger" title="Real-Time Tracking">
                <div className="relative h-[calc(100vh-180px)] -mt-4 -mx-8 overflow-hidden">
                    {/* Live Map */}
                    <TripMap
                        passengerPos={passengerPos}
                        driverPos={driverPos}
                        destinationPos={destinationPos}
                        center={driverPos || passengerPos}
                    />

                    {/* Top Floating Driver Info */}
                    <div className="absolute top-6 left-6 right-6 z-10">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="max-w-xl mx-auto"
                        >
                            <Card className="p-4 border-none shadow-2xl bg-white/95 backdrop-blur-md flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden ring-2 ring-indigo-500/20">
                                            {trip.driver_avatar ? (
                                                <img src={trip.driver_avatar} alt="Driver" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Car size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 leading-none">
                                            {trip.driver_name || 'Assigned Driver'}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">
                                                ★ {trip.driver_rating || '5.0'}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {trip.vehicle_details || 'White Tesla Model 3'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-4 hidden sm:block">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Estimated Arrival</p>
                                        <p className="text-xl font-black text-indigo-600 italic tracking-tight leading-none">4 mins</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="rounded-xl hover:bg-indigo-50 px-2 h-10 w-10">
                                        <Phone size={20} className="text-indigo-600" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="rounded-xl hover:bg-indigo-50 px-2 h-10 w-10">
                                        <MessageSquare size={20} className="text-indigo-600" />
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Bottom Status Panel */}
                    <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-center">
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            className="w-full max-w-4xl"
                        >
                            <Card className="shadow-2xl border-none overflow-hidden bg-white/95 backdrop-blur-md">
                                <div className="p-6">
                                    {/* Progress Stepper */}
                                    <div className="flex items-center justify-between mb-8 relative">
                                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
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
                                                <div key={i} className="flex flex-col items-center gap-2 relative z-10">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
                                                        isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' :
                                                            'bg-slate-100 text-slate-400'
                                                        }`}>
                                                        {step.icon}
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-400'
                                                        }`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                                <Navigation size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">On Route To</p>
                                                <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{trip.dest_address}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-center">
                                            <div className="px-6 py-2 bg-slate-900 rounded-2xl text-white text-center">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Estimated Fare</p>
                                                <p className="text-xl font-bold italic tracking-tighter">${trip.price_per_seat || '24.50'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-3">
                                            <Button variant="outline" className="text-red-500 hover:bg-red-50 border-red-100 px-6 font-bold uppercase tracking-widest text-xs h-12">
                                                Cancel
                                            </Button>
                                            <Button className="bg-red-600 hover:bg-red-700 text-white px-6 font-bold uppercase tracking-widest text-xs h-12 flex items-center gap-2 group shadow-lg shadow-red-200">
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
