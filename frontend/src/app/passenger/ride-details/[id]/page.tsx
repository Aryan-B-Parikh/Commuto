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
import { MapPin, Users, Clock, Shield, ArrowLeft, MessageCircle, ChevronRight, UserPlus } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import dynamic from 'next/dynamic';

const MapWidget = dynamic(() => import('@/components/map/MapWidget').then(mod => mod.MapWidget), { ssr: false });

export default function RideDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast() as any;
    const tripId = params.id as string;

    const [trip, setTrip] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);

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

    // Handle real-time updates from WebSocket
    useEffect(() => {
        if (availableSeats !== null && trip) {
            setTrip((prev: any) => ({ ...prev, available_seats: availableSeats }));
        }
    }, [availableSeats]);

    useEffect(() => {
        if (newPassenger && trip) {
            // Check if already in list to avoid duplicates
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
            // Details will update via WebSocket or we can re-fetch
            const updatedData = await tripsAPI.getTripDetails(tripId);
            setTrip(updatedData);
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'Failed to join ride.');
        } finally {
            setIsJoining(false);
        }
    };

    if (isLoading) return <div className="p-20 text-center animate-pulse">Loading adventure details...</div>;
    if (!trip) return null;

    const isMember = trip.passengers.some((p: any) => p.id === user?.id) || trip.creator_passenger_id === user?.id;

    return (
        <DashboardLayout userType="passenger" title="Ride Details">
            <div className="max-w-6xl mx-auto px-4 pb-20">

                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="rounded-xl border-card-border/50 hover:bg-card"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    {isConnected && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold ring-1 ring-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Updates Active
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Route & Map */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="overflow-hidden border-0 shadow-2xl shadow-indigo-500/5">
                            <div className="h-[400px] w-full relative">
                                <MapWidget />
                            </div>
                            <div className="p-8 bg-card">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 flex flex-col items-center">
                                            <div className="w-4 h-4 rounded-full border-2 border-indigo-500 bg-background" />
                                            <div className="w-0.5 h-12 bg-slate-100 my-1" />
                                            <MapPin className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="mb-8">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Pickup</p>
                                                <p className="text-lg font-bold text-foreground">{trip.origin_address}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Destination</p>
                                                <p className="text-lg font-bold text-foreground">{trip.dest_address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Departure</p>
                                        <p className="font-bold text-foreground">
                                            {new Date(trip.start_time).toLocaleDateString()} at {new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Safety Status</p>
                                        <p className="font-bold text-foreground">Verified Creator</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column: Passengers & Actions */}
                    <div className="space-y-8">

                        {/* Price & Join Card */}
                        <Card className="p-8 border-t-8 border-t-indigo-500 shadow-xl shadow-indigo-500/10">
                            <div className="text-center mb-8">
                                <p className="text-5xl font-black text-indigo-600 mb-2">
                                    {formatCurrency(trip.price_per_seat)}
                                </p>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Fair Share Price</p>
                            </div>

                            <div className="space-y-4">
                                {isMember ? (
                                    <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 font-bold text-lg rounded-2xl cursor-default">
                                        Joined Successfully
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleJoin}
                                        disabled={isJoining || trip.available_seats === 0}
                                        className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 font-bold text-lg rounded-2xl shadow-lg shadow-indigo-500/20"
                                    >
                                        {isJoining ? 'Processing...' : trip.available_seats > 0 ? 'Join This Ride' : 'Ride is Full'}
                                    </Button>
                                )}
                                <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-tighter">
                                    By joining, you agree to the shared travel guidelines
                                </p>
                            </div>
                        </Card>

                        {/* Passenger List */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" /> Travelers
                                </h3>
                                <div className="px-2 py-1 bg-muted rounded-lg text-[10px] font-black uppercase text-muted-foreground">
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
                                            <p className="text-sm font-bold text-foreground">{trip.creator?.full_name || 'Creator'}</p>
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase">Host</p>
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
                                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
                                                {passenger.full_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{passenger.full_name}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Passenger</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                    </motion.div>
                                ))}

                                {/* Empty Slots */}
                                {Array.from({ length: trip.available_seats }).map((_, i) => (
                                    <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-card-border/50 opacity-50">
                                        <div className="w-10 h-10 rounded-xl border border-dashed border-card-border flex items-center justify-center">
                                            <UserPlus className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground italic">Available Slot</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
