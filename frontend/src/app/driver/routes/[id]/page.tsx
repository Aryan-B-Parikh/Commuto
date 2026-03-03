'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { mockGroupedRoutes } from '@/data/groupedRoutes';
import { formatCurrency } from '@/utils/formatters';

export default function RouteDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const route = mockGroupedRoutes.find(r => r.id === id);

    if (!route) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B1020]">
                <div className="text-center">
                    <p className="text-[#9CA3AF] mb-4">Route not found</p>
                    <Link href="/driver/routes">
                        <Button variant="outline">Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B1020]">
            {/* Visual Header */}
            <div className="h-[35vh] relative w-full">
                <MapContainer className="h-full" showRoute />
                <Link href="/driver/routes" className="absolute top-4 left-4 z-10">
                    <button className="w-10 h-10 rounded-full bg-[#111827] shadow-lg flex items-center justify-center text-[#9CA3AF] hover:text-indigo-400 transition-colors border border-[#1E293B]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </Link>
            </div>

            {/* Content */}
            <div className="relative z-10 -mt-8 bg-[#111827] rounded-t-[32px] px-6 pt-8 pb-24 shadow-[0_-12px_24px_-10px_rgba(0,0,0,0.3)]">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                            Optimized Sequence
                        </div>
                        <h1 className="text-2xl font-bold text-[#F9FAFB]">{route.to}</h1>
                        <p className="text-[#9CA3AF] text-sm">Target destination for all passengers</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">{formatCurrency(route.estimatedEarnings)}</p>
                        <p className="text-xs text-[#6B7280]">Total Route Est.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <Card variant="outline" padding="sm" className="bg-indigo-500/5 border-indigo-500/20">
                        <p className="text-xs text-indigo-400 font-semibold mb-1 uppercase tracking-tight">Distance</p>
                        <p className="text-lg font-bold text-[#F9FAFB]">{route.totalDistance}</p>
                    </Card>
                    <Card variant="outline" padding="sm" className="bg-indigo-500/5 border-indigo-500/20">
                        <p className="text-xs text-indigo-400 font-semibold mb-1 uppercase tracking-tight">Passengers</p>
                        <p className="text-lg font-bold text-[#F9FAFB]">{route.passengerCount}</p>
                    </Card>
                </div>

                {/* Pickup Sequence */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-[#6B7280] uppercase tracking-widest mb-4">Route Sequence</h2>
                    <div className="space-y-6 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-indigo-500/20" />

                        {route.stops.map((stop, index) => (
                            <motion.div
                                key={stop.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex gap-4 relative"
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${stop.type === 'pickup'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                    }`}>
                                    {stop.type === 'pickup' ? (
                                        <span className="text-xs font-bold">{index + 1}</span>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-[#F9FAFB] leading-tight">{stop.passengerName}</h3>
                                        <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg">{stop.estimatedTime}</span>
                                    </div>
                                    <p className="text-sm text-[#9CA3AF] mb-1">{stop.address}</p>
                                    <p className="text-xs font-medium text-indigo-400/70">{stop.type === 'pickup' ? 'Pickup' : 'Final Dropoff'}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Start Button */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#111827] via-[#111827] to-transparent">
                    <div className="max-w-xl mx-auto">
                        <Button
                            variant="primary"
                            fullWidth
                            size="lg"
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/30"
                            onClick={() => router.push(`/driver/routes/${route.id}/live`)}
                        >
                            Confirm & Start Route
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
