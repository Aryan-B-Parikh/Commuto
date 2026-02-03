'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { mockGroupedRoutes } from '@/data/groupedRoutes';
import { formatCurrency } from '@/utils/formatters';
import { DriverBottomNav } from '@/components/layout/DriverBottomNav';
import { useToast } from '@/hooks/useToast';

export default function GroupedRoutesDashboard() {
    const { showToast } = useToast() as any;

    const handleDecline = (id: string) => {
        showToast('info', 'Route declined successfully');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Map Header Section */}
            <div className="relative h-[40vh] w-full">
                <MapContainer className="h-full" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />

                {/* Floating Stats */}
                <div className="absolute top-4 left-4 right-4 z-10 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <Card variant="glass" padding="sm" className="whitespace-nowrap flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <p className="text-xs font-semibold text-gray-700">{mockGroupedRoutes.length} New Routes Found</p>
                        </div>
                    </Card>
                    <Card variant="glass" padding="sm" className="whitespace-nowrap flex-shrink-0">
                        <p className="text-xs font-semibold text-blue-600">Avg. Earnings: $35.00</p>
                    </Card>
                </div>
            </div>

            {/* Routes List Section */}
            <div className="flex-1 px-4 py-6 -mt-10 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Available Routes</h1>
                    <button className="text-sm text-blue-600 font-medium hover:underline">Refresh</button>
                </div>

                <div className="space-y-6">
                    {mockGroupedRoutes.map((route, index) => (
                        <motion.div
                            key={route.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card hoverable className="overflow-hidden border-0 shadow-lg shadow-blue-500/5">
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Route Map Preview Placeholder */}
                                    <div className="h-32 md:w-48 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl relative overflow-hidden flex-shrink-0">
                                        <div className="absolute inset-0 opacity-20" style={{
                                            backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
                                            backgroundSize: '15px 15px',
                                        }} />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                            <svg className="w-12 h-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Route Info */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    System Recommended
                                                </div>
                                                <p className="text-lg font-bold text-green-600">{formatCurrency(route.estimatedEarnings)}</p>
                                            </div>

                                            <h3 className="font-bold text-gray-900 mb-1">{route.to}</h3>
                                            <div className="space-y-1">
                                                {route.stops.filter(s => s.type === 'pickup').map((stop, i) => (
                                                    <div key={stop.id} className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                        <p className="text-xs text-gray-500 truncate">{stop.address}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                                <span className="text-xs font-semibold text-gray-600">{route.passengerCount} Passengers</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                                <span className="text-xs font-semibold text-gray-600">{route.totalDistance}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <Button
                                        variant="outline"
                                        fullWidth
                                        className="border-gray-200 text-gray-600"
                                        onClick={() => handleDecline(route.id)}
                                    >
                                        Decline
                                    </Button>
                                    <Link href={`/driver/routes/${route.id}`} className="flex-1">
                                        <Button variant="primary" fullWidth className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20">
                                            Accept & View
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* App Padding for Bottom Nav */}
            <DriverBottomNav />
        </div>
    );
}
