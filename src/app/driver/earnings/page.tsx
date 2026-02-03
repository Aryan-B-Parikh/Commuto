'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { DriverBottomNav } from '@/components/layout/DriverBottomNav';
import { formatCurrency } from '@/utils/formatters';

export default function DriverEarningsPage() {
    const stats = {
        today: 45.50,
        thisWeek: 312.80,
        thisMonth: 1248.00,
        totalTrips: 24,
        avgPerTrip: 13.50,
    };

    const recentEarnings = [
        { id: '1', route: 'Downtown → Airport', date: 'Today, 2:30 PM', passengers: 2, amount: 24.00 },
        { id: '2', route: 'Office Park → Central', date: 'Today, 9:00 AM', passengers: 3, amount: 21.50 },
        { id: '3', route: 'Mall → University', date: 'Yesterday', passengers: 1, amount: 12.00 },
        { id: '4', route: 'Beach → Downtown', date: 'Yesterday', passengers: 2, amount: 18.00 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white px-4 pt-6 pb-12">
                <h1 className="text-xl font-semibold mb-1">Earnings</h1>
                <p className="text-green-100 text-sm">Your driver earnings overview</p>
            </div>

            <div className="px-4 -mt-6">
                {/* Main Stat */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card variant="elevated" className="text-center mb-6">
                        <p className="text-sm text-gray-500 mb-1">This Month</p>
                        <p className="text-4xl font-bold text-green-600">{formatCurrency(stats.thisMonth)}</p>
                        <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
                            <div>
                                <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.today)}</p>
                                <p className="text-xs text-gray-500">Today</p>
                            </div>
                            <div className="w-px bg-gray-200" />
                            <div>
                                <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.thisWeek)}</p>
                                <p className="text-xs text-gray-500">This Week</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900">{stats.totalTrips}</p>
                                <p className="text-xs text-gray-500">Total Trips</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.avgPerTrip)}</p>
                                <p className="text-xs text-gray-500">Avg/Trip</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recent Earnings */}
                <div>
                    <h2 className="font-semibold text-gray-900 mb-4">Recent Earnings</h2>
                    <div className="space-y-3">
                        {recentEarnings.map((earning, index) => (
                            <motion.div
                                key={earning.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{earning.route}</p>
                                            <p className="text-sm text-gray-500">{earning.date} • {earning.passengers} passenger(s)</p>
                                        </div>
                                        <span className="text-lg font-bold text-green-600">+{formatCurrency(earning.amount)}</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <DriverBottomNav />
        </div>
    );
}
