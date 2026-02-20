"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ActiveTripCard } from '@/components/trip/ActiveTripCard';
import { MapWidget } from '@/components/map/MapWidget';
import { tripsAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { useToast } from '@/hooks/useToast';

export default function PassengerDashboard() {
    const [trips, setTrips] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast() as any;

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const data = await tripsAPI.getMyTrips();
                setTrips(data);
            } catch (error) {
                console.error('Failed to fetch trips:', error);
                showToast('error', 'Failed to load your trips. Please check your connection.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrips();
    }, []);

    return (
        <DashboardLayout userType="passenger" title="Dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Active Trips & Quick Actions */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Active Trips Section */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-foreground">Active Trips</h2>
                            <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">View All</button>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide min-h-[150px]">
                            {isLoading ? (
                                <div className="flex gap-4 w-full">
                                    {[1, 2].map(i => (
                                        <div key={i} className="min-w-[320px] h-[180px] rounded-2xl bg-muted/50 animate-pulse border border-card-border" />
                                    ))}
                                </div>
                            ) : trips.length > 0 ? (
                                trips.map((trip) => (
                                    <ActiveTripCard
                                        key={trip.id}
                                        id={trip.id.substring(0, 8).toUpperCase()}
                                        status={trip.status.charAt(0).toUpperCase() + trip.status.slice(1) as any}
                                        pickup={trip.origin_address}
                                        dropoff={trip.dest_address}
                                        distance="Calculating..."
                                        estimatedTime={new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        driverName={trip.driver_name}
                                        price={trip.price_per_seat && trip.price_per_seat > 0 ? `$${trip.price_per_seat}` : "Pending Bid"}
                                    />
                                ))
                            ) : (
                                <div className="w-full py-10 text-center border-2 border-dashed border-card-border rounded-2xl bg-muted/20">
                                    <p className="text-muted-foreground font-medium">No active trips found.</p>
                                    <Link href="/passenger/create" className="text-indigo-500 hover:underline text-sm font-bold mt-2 inline-block">
                                        Request your first ride →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Map Section */}
                    <section className="h-[400px] rounded-2xl overflow-hidden border border-card-border shadow-sm relative z-0">
                        <MapWidget />
                    </section>

                </div>

                {/* Right Column: Recent Activity / Quick Book */}
                <div className="space-y-6">

                    {/* Quick Book Widget */}
                    <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
                        <h3 className="text-lg font-bold text-foreground mb-4">Quick Book</h3>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                Ready to head out? Set your route and find the best nearby drivers in seconds.
                            </p>

                            <Link href="/passenger/create" className="block">
                                <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/30 cursor-pointer">
                                    Start New Request
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Locations */}
                    <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
                        <h3 className="text-lg font-bold text-foreground mb-4">Recent Places</h3>
                        <ul className="space-y-3">
                            {trips.length > 0 ? (
                                trips.slice(0, 3).map((trip) => (
                                    <li key={trip.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                            🕒
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{trip.dest_address.split(',')[0]}</p>
                                            <p className="text-xs text-muted-foreground truncate">{trip.dest_address}</p>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground py-4 text-center italic">Your recent destinations will appear here</p>
                            )}
                        </ul>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
