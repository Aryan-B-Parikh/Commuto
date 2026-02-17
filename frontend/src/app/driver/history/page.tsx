'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { mockTrips } from '@/data/trips';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function DriverHistoryPage() {
    const completedTrips = mockTrips.filter(t => t.status === 'completed');

    return (
        <DashboardLayout userType="driver" title="Ride History">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: History Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-foreground">Past Missions</h2>
                        <div className="flex gap-2">
                            <span className="text-sm font-bold text-blue-600 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">{completedTrips.length} Rides Ended</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {completedTrips.map((trip, index) => (
                            <motion.div
                                key={trip.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card hoverable className="border-none shadow-sm dark:glass px-6 py-5">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <span className="text-xs font-black leading-none">{formatDate(trip.date).split(' ')[0]}</span>
                                            <span className="text-xl font-black">{formatDate(trip.date).split(' ')[1]}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                                    {trip.from.name} <span className="text-gray-400 font-medium mx-1">→</span> {trip.to.name}
                                                </h3>
                                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                                    +{formatCurrency(trip.pricePerSeat * trip.passengers.length)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-2">
                                                        {trip.passengers.slice(0, 3).map((p) => (
                                                            <img key={p.id} src={p.avatar} alt={p.name} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 object-cover" />
                                                        ))}
                                                        {trip.passengers.length > 3 && (
                                                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                                +{trip.passengers.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-bold">{trip.passengers.length} Passengers Joined</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <RatingStars rating={4.8} size="sm" />
                                                    <span className="text-xs font-bold text-gray-400">4.8</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Lifetime Stats */}
                <div className="space-y-6">
                    <Card className="dark:glass overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
                        <h3 className="text-lg font-bold text-foreground mb-6">Driver Overview</h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">💰</div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Total Earned</p>
                                </div>
                                <p className="text-xl font-black text-foreground">{formatCurrency(4862)}</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">🚗</div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Total Distance</p>
                                </div>
                                <p className="text-xl font-black text-foreground">1,240 km</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">⭐</div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Avg. Rating</p>
                                </div>
                                <p className="text-xl font-black text-foreground">4.95</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-2">Top Performance</p>
                            <p className="text-xs text-gray-500 leading-relaxed px-4">You are in the top 5% of drivers in your region this month. Keep it up!</p>
                        </div>
                    </Card>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative group">
                        <div className="relative z-10">
                            <h4 className="font-black text-xl mb-1 italic tracking-tighter uppercase underline decoration-emerald-300">New Achievement</h4>
                            <p className="text-sm text-emerald-50 leading-snug">Elite Navigator: You've completed 50 rides without a single cancellation!</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform">🏆</div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
