'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { TripCard } from '@/components/trip/TripCard';
import { PassengerBottomNav } from '@/components/layout/PassengerBottomNav';
import { SkeletonTripCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { mockTrips } from '@/data/trips';

export default function PassengerSearchPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    const filteredTrips = mockTrips.filter(trip => {
        const matchesSearch = !searchQuery ||
            trip.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.to.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDate = !filterDate || trip.date === filterDate;
        return matchesSearch && matchesDate && trip.seatsAvailable > 0;
    });

    const handleJoinTrip = (tripId: string) => {
        showToast('success', 'Join request sent!');
        router.push('/passenger/live');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Map */}
            <div className="relative h-[30vh]">
                <MapContainer className="h-full" showRoute />
                <Link href="/passenger/dashboard" className="absolute top-4 left-4 p-3 bg-white rounded-full shadow-md hover:bg-gray-50">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
            </div>

            {/* Search */}
            <div className="sticky top-0 z-10 bg-white border-b px-4 py-4 -mt-6 rounded-t-3xl shadow-lg">
                <div className="relative mb-3">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by location..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white"
                    />
                </div>
                <div className="flex gap-3">
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                    />
                    <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">Filter</button>
                </div>
            </div>

            {/* Results */}
            <div className="px-4 py-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Available Trips {!isLoading && `(${filteredTrips.length})`}
                </h2>

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div key="loading" className="space-y-4">
                            {[1, 2, 3].map((i) => <SkeletonTripCard key={i} />)}
                        </motion.div>
                    ) : filteredTrips.length > 0 ? (
                        <motion.div key="trips" className="space-y-4">
                            {filteredTrips.map((trip, index) => (
                                <motion.div
                                    key={trip.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <TripCard trip={trip} onJoin={handleJoinTrip} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <EmptyState
                            title="No trips found"
                            description="Try adjusting your search criteria"
                            action={{ label: 'Clear Filters', onClick: () => { setSearchQuery(''); setFilterDate(''); } }}
                        />
                    )}
                </AnimatePresence>
            </div>

            <PassengerBottomNav />
        </div>
    );
}
