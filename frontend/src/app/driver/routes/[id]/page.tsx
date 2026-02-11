'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { tripsAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function RouteDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRouteDetails = async () => {
            try {
                if (!user || !id) return;
                
                // Fetch the specific route details from API
                const routeDetails = await tripsAPI.getRouteDetails(id);
                setRoute(routeDetails);
            } catch (err) {
                console.error('Failed to fetch route details:', err);
                setError('Failed to load route information.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchRouteDetails();
    }, [user, id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Loading route details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-500 mb-4">⚠️ {error}</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    if (!route) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Route not found</p>
                    <Link href="/driver/routes">
                        <Button variant="outline">Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Visual Header */}
            <div className="h-[35vh] relative w-full">
                <MapContainer className="h-full" showRoute />
                <Link href="/driver/routes" className="absolute top-4 left-4 z-10">
                    <button className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </Link>
            </div>

            {/* Content */}
            <div className="relative z-10 -mt-8 bg-white rounded-t-[32px] px-6 pt-8 pb-24 shadow-[0_-12px_24px_-10px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                            Optimized Sequence
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{route.to}</h1>
                        <p className="text-gray-500 text-sm">Target destination for all passengers</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(route.estimatedEarnings)}</p>
                        <p className="text-xs text-gray-400">Total Route Est.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <Card variant="outline" padding="sm" className="bg-blue-50/30 border-blue-50">
                        <p className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-tight">Distance</p>
                        <p className="text-lg font-bold text-gray-900">{route.totalDistance}</p>
                    </Card>
                    <Card variant="outline" padding="sm" className="bg-blue-50/30 border-blue-50">
                        <p className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-tight">Passengers</p>
                        <p className="text-lg font-bold text-gray-900">{route.passengerCount}</p>
                    </Card>
                </div>

                {/* Pickup Sequence */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Route Sequence</h2>
                    <div className="space-y-6 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-blue-100" />

                        {route.stops.map((stop, index) => (
                            <motion.div
                                key={stop.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex gap-4 relative"
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${stop.type === 'pickup'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
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
                                        <h3 className="font-bold text-gray-900 leading-tight">{stop.passengerName}</h3>
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{stop.estimatedTime}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-1">{stop.address}</p>
                                    <p className="text-xs font-medium text-blue-400">{stop.type === 'pickup' ? 'Pickup' : 'Final Dropoff'}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Start Button */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
                    <div className="max-w-xl mx-auto">
                        <Button
                            variant="primary"
                            fullWidth
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/30"
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
