'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { DriverBottomNav } from '@/components/layout/DriverBottomNav';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/formatters';
import { tripsAPI } from '@/services/api';

export default function DriverDashboardPage() {
    const { user, isLoading } = useAuth();
    const [isOnline, setIsOnline] = useState(false);
    const [activeTrips, setActiveTrips] = useState([]);
    const [todayEarnings, setTodayEarnings] = useState(0);
    const [weeklyEarnings, setWeeklyEarnings] = useState(0);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDriverData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch driver's active trips
                const tripsResponse = await tripsAPI.getDriverTrips();
                const activeTripsData = tripsResponse.filter(trip => trip.status === 'upcoming' || trip.status === 'active');
                setActiveTrips(activeTripsData.slice(0, 2));
                
                // Fetch earnings data (this would come from a driver stats endpoint)
                // For now, using placeholder values that would be replaced with real API calls
                setTodayEarnings(45.50); // Would be: earningsResponse.today
                setWeeklyEarnings(312.80); // Would be: earningsResponse.weekly
                
                // Fetch pending requests (would come from bids/requests endpoint)
                setPendingRequests(3); // Would be: requestsResponse.pending_count
                
            } catch (err) {
                console.error('Failed to fetch driver data:', err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        if (user) {
            fetchDriverData();
        }
    }, [user]);

    if (isLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading dashboard data...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="text-center py-6 max-w-md">
                    <p className="text-red-500 mb-3">⚠️ {error}</p>
                    <Button size="sm" variant="primary" onClick={() => window.location.reload()}>Retry</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Map Section */}
            <div className="relative h-[45vh]">
                <MapContainer className="h-full" showRoute={false} />

                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-white/90 to-transparent">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Welcome back 🚗</p>
                            <h1 className="text-xl font-bold text-gray-900">{user.name.split(' ')[0]}</h1>
                        </div>
                        <Link href="/profile">
                            <div className="relative">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full border-2 border-white shadow-md" />
                                ) : (
                                    <div className="w-11 h-11 rounded-full border-2 border-white shadow-md bg-green-500 flex items-center justify-center text-white font-semibold">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">{pendingRequests}</span>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* System Routes CTA */}
                <div className="absolute bottom-6 left-4 right-4">
                    <Card variant="glass" padding="md" className="shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Today&apos;s Opportunities</h2>
                        <Link href="/driver/routes">
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">System Routes</p>
                                    <p className="text-sm text-gray-500">Accept optimized passenger groups</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </motion.div>
                        </Link>
                    </Card>
                </div>
            </div>

            <div className="px-4 py-6">
                {/* Earnings Overview */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                            <p className="text-sm text-green-100">Today&apos;s Earnings</p>
                            <p className="text-2xl font-bold">{formatCurrency(todayEarnings)}</p>
                        </Card>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card>
                            <p className="text-sm text-gray-500">This Week</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(weeklyEarnings)}</p>
                        </Card>
                    </motion.div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { value: '24', label: 'Trips', color: 'blue' },
                        { value: '4.9', label: 'Rating', color: 'yellow' },
                        { value: '98%', label: 'Accept', color: 'green' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className="bg-white rounded-2xl p-3 text-center shadow-sm"
                        >
                            <p className={`text-lg font-bold text-${stat.color}-600`}>{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Pending Requests */}
                {pendingRequests > 0 && (
                    <Link href="/driver/requests">
                        <Card hoverable className="bg-orange-50 border-orange-100 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-orange-900">{pendingRequests} Pending Requests</p>
                                    <p className="text-sm text-orange-700">Passengers waiting for approval</p>
                                </div>
                                <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Card>
                    </Link>
                )}

                {/* Active Trips */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Your Trips</h2>
                        <Link href="/driver/history" className="text-sm text-green-600 font-medium">View all</Link>
                    </div>
                    {activeTrips.length > 0 ? (
                        <div className="space-y-3">
                            {activeTrips.map(trip => (
                                <Card key={trip.id} hoverable>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{trip.from.name} → {trip.to.name}</p>
                                            <p className="text-sm text-gray-500">{trip.date} • {trip.seatsAvailable} seats left</p>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center py-6">
                            <p className="text-gray-500 mb-3">No active trips</p>
                            <Link href="/driver/routes"><Button size="sm" variant="primary">View Available Routes</Button></Link>
                        </Card>
                    )}
                </div>
            </div>

            <DriverBottomNav />
        </div>
    );
}
