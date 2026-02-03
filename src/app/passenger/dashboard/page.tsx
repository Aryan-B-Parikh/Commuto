'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { TripCard } from '@/components/trip/TripCard';
import { PassengerBottomNav } from '@/components/layout/PassengerBottomNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { mockTrips } from '@/data/trips';
import { currentUser } from '@/data/users';

export default function PassengerDashboardPage() {
    const upcomingTrips = mockTrips.filter(t => t.status === 'upcoming').slice(0, 2);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Map Section */}
            <div className="relative h-[45vh]">
                <MapContainer className="h-full" showRoute={false} />

                {/* Header Overlay */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-white/90 to-transparent">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Good morning 👋</p>
                            <h1 className="text-xl font-bold text-gray-900">{currentUser.name.split(' ')[0]}</h1>
                        </div>
                        <Link href="/profile">
                            <img src={currentUser.avatar} alt={currentUser.name} className="w-11 h-11 rounded-full border-2 border-white shadow-md" />
                        </Link>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="absolute bottom-6 left-4 right-4 flex flex-col gap-3">
                    <Card variant="glass" padding="md" className="shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Where are you going?</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/passenger/search" className="flex-1">
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    className="h-full flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer text-center"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mb-2 shadow-lg shadow-blue-500/20">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 leading-tight">Find Rides</p>
                                </motion.div>
                            </Link>

                            <Link href="/passenger/create" className="flex-1">
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    className="h-full flex flex-col items-center justify-center p-4 bg-green-50 rounded-2xl border border-green-100 hover:bg-green-100 transition-colors cursor-pointer text-center"
                                >
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mb-2 shadow-lg shadow-green-500/20">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 leading-tight">Post Request</p>
                                </motion.div>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Stats */}
            <div className="px-4 py-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { value: currentUser.totalTrips, label: 'Trips Taken', color: 'blue' },
                        { value: '$180', label: 'Total Saved', color: 'green' },
                        { value: '95kg', label: 'CO₂ Reduced', color: 'purple' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-2xl p-4 text-center shadow-sm"
                        >
                            <p className={`text-xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Upcoming Trips */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
                        <Link href="/passenger/history" className="text-sm text-blue-600 font-medium">View all</Link>
                    </div>
                    {upcomingTrips.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingTrips.map((trip) => (
                                <TripCard key={trip.id} trip={trip} variant="compact" />
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center py-8">
                            <p className="text-gray-500 mb-3">No upcoming trips</p>
                            <Link href="/passenger/search"><Button size="sm">Find a Trip</Button></Link>
                        </Card>
                    )}
                </div>

                {/* Safety Banner */}
                <Card className="bg-blue-50 border-blue-100">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900">Your safety matters</h3>
                            <p className="text-sm text-blue-700">All drivers are verified. Share your trip with loved ones.</p>
                        </div>
                    </div>
                </Card>
            </div>

            <PassengerBottomNav />
        </div>
    );
}
