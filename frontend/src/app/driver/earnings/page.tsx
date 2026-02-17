'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

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
        <DashboardLayout userType="driver" title="Earnings History">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Stats Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Monthly Overview Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="relative overflow-hidden border-none shadow-sm dark:glass">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

                            <div className="flex flex-col items-center py-8">
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Revenue This Month</p>
                                <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.thisMonth)}</p>
                            </div>

                            <div className="grid grid-cols-2 border-t border-gray-100 dark:border-gray-800">
                                <div className="p-6 text-center border-r border-gray-100 dark:border-gray-800">
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(stats.today)}</p>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Today</p>
                                </div>
                                <div className="p-6 text-center">
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(stats.thisWeek)}</p>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">This Week</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Recent Transactions */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
                            <button className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline">View All</button>
                        </div>
                        <div className="space-y-4">
                            {recentEarnings.map((earning, index) => (
                                <motion.div
                                    key={earning.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card hoverable className="border-none shadow-sm dark:glass px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-xl">
                                                    🚗
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white leading-tight">{earning.route}</p>
                                                    <p className="text-sm text-gray-500 font-medium">{earning.date} • {earning.passengers} pax</p>
                                                </div>
                                            </div>
                                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                                +{formatCurrency(earning.amount)}
                                            </span>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Performance Metrics */}
                    <Card className="dark:glass">
                        <h3 className="text-lg font-bold text-foreground mb-6">Performance</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                    #
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-end mb-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Total Trips</p>
                                        <p className="text-lg font-black text-foreground">{stats.totalTrips}</p>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 rounded-full" style={{ width: '75%' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                    $
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-end mb-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Avg / Trip</p>
                                        <p className="text-lg font-black text-foreground">{formatCurrency(stats.avgPerTrip)}</p>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: '60%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Withdrawal Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative group">
                        <div className="relative z-10">
                            <h4 className="font-black text-xl mb-4 italic tracking-tighter uppercase underline decoration-indigo-300">Ready to Cash Out?</h4>
                            <p className="text-sm text-indigo-100 leading-snug mb-6">Your balance is ready for transfer. Weekly settlements are processed every Monday.</p>
                            <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white font-black text-sm uppercase tracking-widest h-12">
                                Withdraw Now
                            </Button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform">💸</div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
