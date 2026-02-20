"use client";

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { MapWidget } from '@/components/map/MapWidget';
import { tripsAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function DriverDashboard() {
    const [requests, setRequests] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { showToast } = useToast() as any;

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const data = await tripsAPI.getOpenRides();
                setRequests(data);
            } catch (error) {
                console.error('Failed to fetch requests:', error);
                showToast('error', 'Failed to load requests.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, []);

    return (
        <DashboardLayout userType="driver" title="Driver Command Center">

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    label="Today's Earnings"
                    value={`$${user?.todayEarnings?.toFixed(2) || '0.00'}`}
                    trend={user?.todayEarnings && user.todayEarnings > 0 ? "Active today" : "No earnings yet"}
                    trendUp={user?.todayEarnings && user.todayEarnings > 0}
                    icon={<span className="text-2xl">💰</span>}
                    color="indigo"
                />
                <StatCard
                    label="Rides Completed"
                    value={user?.totalTrips?.toString() || '0'}
                    trend="Lifetime trips"
                    trendUp={true}
                    icon={<span className="text-2xl">🚗</span>}
                    color="blue"
                />
                <StatCard
                    label="Online Hours"
                    value={`${user?.onlineHours || 0}h`}
                    icon={<span className="text-2xl">⏱️</span>}
                    color="purple"
                />
                <StatCard
                    label="Rating"
                    value={user?.rating?.toFixed(1) || '5.0'}
                    trend={user?.rating && user.rating >= 4.5 ? "Top rated" : "Maintain your rating"}
                    trendUp={user?.rating && user.rating >= 4.5}
                    icon={<span className="text-2xl">⭐</span>}
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Map Area */}
                <div className="lg:col-span-2 h-[500px] rounded-2xl overflow-hidden glass border border-card-border shadow-sm relative z-0">
                    <div className="absolute top-4 left-4 z-[10] bg-card/90 dark:bg-black/90 backdrop-blur-md px-4 py-2 rounded-xl border border-card-border shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                            </span>
                            <span className="text-sm font-semibold text-foreground">You are Online</span>
                        </div>
                    </div>

                    <MapWidget />

                    {/* "Scan for Riders" Overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
                        <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-500/40 transition-all flex items-center gap-2">
                            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Scanning Area...
                        </button>
                    </div>
                </div>

                {/* Requests Side Panel */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-foreground">Incoming Requests</h2>
                        {requests.length > 0 && (
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                                {requests.length} New
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            [1, 2].map(i => (
                                <div key={i} className="h-[200px] w-full bg-card/50 animate-pulse rounded-2xl border border-card-border" />
                            ))
                        ) : requests.length > 0 ? (
                            requests.slice(0, 3).map((request) => (
                                <div key={request.id} className="bg-card p-5 rounded-2xl border border-card-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>

                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-xs">
                                                {request.seats_requested}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">Passenger ID: {request.id.substring(0, 5)}</p>
                                                <p className="text-xs text-muted-foreground">Pending Approval</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground">
                                            {new Date(request.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                            <p className="text-sm text-muted-foreground truncate">{request.origin_address}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                            <p className="text-sm text-muted-foreground truncate">{request.dest_address}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link href="/driver/requests" className="flex-1">
                                            <button className="w-full bg-indigo-500 text-white font-bold py-2 rounded-xl hover:bg-indigo-600 transition-colors shadow-sm text-sm">
                                                Review Details
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-muted/10 rounded-2xl border-2 border-dashed border-card-border">
                                <p className="text-muted-foreground text-sm">No incoming requests</p>
                            </div>
                        )}

                        {requests.length > 3 && (
                            <Link href="/driver/requests" className="block text-center text-sm font-bold text-indigo-500 hover:underline pt-2">
                                View all {requests.length} requests
                            </Link>
                        )}
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
