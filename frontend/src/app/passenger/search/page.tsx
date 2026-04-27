'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapContainer } from '@/components/trip/MapContainer';
import { TripCard } from '@/components/trip/TripCard';
import { PassengerBottomNav } from '@/components/layout/PassengerBottomNav';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonTripCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { tripsAPI } from '@/services/api';
import type { TripResponse } from '@/types/api';
import { transformTripResponses } from '@/utils/tripTransformers';

function PassengerSearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [trips, setTrips] = useState<TripResponse[]>([]);

    useEffect(() => {
        const initialQuery = searchParams.get('q');
        if (initialQuery) setSearchQuery(initialQuery);
    }, [searchParams]);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                setIsLoading(true);
                const data = await tripsAPI.getAvailableRides();
                setTrips(data);
            } catch (error) {
                console.error('Failed to fetch trips:', error);
                showToast('error', 'Failed to load trips');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrips();
    }, [showToast]);

    const filteredTrips = trips.filter((trip) => {
        const matchesSearch = !searchQuery ||
            trip.from_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.to_address?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && trip.available_seats > 0;
    });

    const transformedTrips = transformTripResponses(filteredTrips);

    return (
        <>
            <div className="lg:hidden min-h-screen bg-background pb-24">
                <div className="relative h-[32vh] overflow-hidden border-b border-card-border">
                    <MapContainer className="h-full w-full" showRoute />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,31,0.1),rgba(8,17,31,0.72))]" />
                    <button onClick={() => router.push('/passenger/dashboard')} className="absolute left-4 top-4 rounded-2xl border border-white/20 bg-black/25 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md">
                        Back to dashboard
                    </button>
                    <div className="absolute bottom-5 left-4 right-4">
                        <div className="max-w-3xl rounded-[28px] border border-white/12 bg-black/28 p-5 text-white backdrop-blur-md">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Search rides</p>
                            <h1 className="mt-2 font-display text-2xl font-bold">Find an available shared trip</h1>
                            <p className="mt-2 text-sm text-white/75">Search by pickup or destination, then compare routes without leaving the page.</p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-6xl px-4 py-5">
                    <div className="sticky top-4 z-20 rounded-[28px] border border-card-border bg-card p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
                        <div className="grid gap-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by location"
                                    className="min-h-[52px] w-full rounded-2xl border border-card-border bg-background/55 pl-11 pr-4 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-[var(--ring)]"
                                />
                            </div>
                            <div className="relative">
                                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="min-h-[52px] w-full rounded-2xl border border-card-border bg-background/55 pl-11 pr-4 text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-[var(--ring)]"
                                />
                            </div>
                            <button className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-card-border bg-background/55 text-sm font-semibold text-foreground transition-all hover:border-primary/20 hover:bg-muted/50">
                                <SlidersHorizontal className="h-4 w-4 text-primary" />
                                Filter
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Results</p>
                            <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                                Available rides {!isLoading && `(${transformedTrips.length})`}
                            </h2>
                        </div>
                        <Link href="/passenger/ride-sharing" className="text-sm font-semibold text-primary">Create a ride instead</Link>
                    </div>

                    <div className="mt-5">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div key="loading" className="space-y-4">
                                    {[1, 2, 3].map((i) => <SkeletonTripCard key={i} />)}
                                </motion.div>
                            ) : transformedTrips.length > 0 ? (
                                <motion.div key="trips" className="space-y-4">
                                    {transformedTrips.map((trip, index) => (
                                        <motion.div key={trip.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                            <TripCard trip={trip} onJoin={() => router.push('/passenger/live')} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <EmptyState
                                    title="No trips found"
                                    description="Try adjusting your location or clearing filters."
                                    action={{ label: 'Clear Filters', onClick: () => { setSearchQuery(''); setFilterDate(''); } }}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <PassengerBottomNav />
            </div>

            <div className="hidden lg:block">
                <DashboardLayout userType="passenger" title="Search Rides">
                    <div className="mx-auto max-w-6xl space-y-8">
                        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                            <div className="relative overflow-hidden rounded-[32px] border border-card-border shadow-[var(--shadow-soft)] min-h-[400px] h-full w-full">
                                <MapContainer className="absolute inset-0 w-full h-full" showRoute />
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,31,0.1),rgba(8,17,31,0.72))] pointer-events-none" />
                                <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Interactive Map</p>
                                    <h1 className="mt-2 font-display text-4xl font-bold text-white">Find an available shared trip</h1>
                                    <p className="mt-3 max-w-lg text-base leading-7 text-white/80">Search by pickup or destination, then compare routes and pricing.</p>
                                </div>
                            </div>

                            <div className="rounded-[32px] border border-card-border bg-card p-6 shadow-[var(--shadow-card)] flex flex-col justify-center">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">Search & Filter</p>
                                <div className="grid gap-4">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by location"
                                            className="min-h-[56px] w-full rounded-2xl border border-card-border bg-background/55 pl-12 pr-4 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-[var(--ring)]"
                                        />
                                    </div>
                                    <div className="relative">
                                        <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={filterDate}
                                            onChange={(e) => setFilterDate(e.target.value)}
                                            className="min-h-[56px] w-full rounded-2xl border border-card-border bg-background/55 pl-12 pr-4 text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-[var(--ring)]"
                                        />
                                    </div>
                                    <button className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-card-border bg-background/55 text-sm font-semibold text-foreground transition-all hover:border-primary/20 hover:bg-muted/50 mt-2">
                                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                                        Advanced Filters
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Results</p>
                                    <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                                        Available rides {!isLoading && `(${transformedTrips.length})`}
                                    </h2>
                                </div>
                                <Link href="/passenger/ride-sharing" className="text-sm font-semibold text-primary hover:underline">Create a ride instead</Link>
                            </div>

                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div key="loading" className="grid gap-6 md:grid-cols-2">
                                        {[1, 2, 3, 4].map((i) => <SkeletonTripCard key={i} />)}
                                    </motion.div>
                                ) : transformedTrips.length > 0 ? (
                                    <motion.div key="trips" className="grid gap-6 md:grid-cols-2">
                                        {transformedTrips.map((trip, index) => (
                                            <motion.div key={trip.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                                <TripCard trip={trip} onJoin={() => router.push('/passenger/live')} />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <EmptyState
                                        title="No trips found"
                                        description="Try adjusting your location or clearing filters."
                                        action={{ label: 'Clear Filters', onClick: () => { setSearchQuery(''); setFilterDate(''); } }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </DashboardLayout>
            </div>
        </>
    );
}

export default function PassengerSearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <PassengerSearchContent />
        </Suspense>
    );
}
