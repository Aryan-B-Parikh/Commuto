'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { tripsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import {
    TrendingUp,
    Calendar,
    Car,
    Loader2,
    Inbox,
    RefreshCw
} from 'lucide-react';

interface EarningsTrip {
    id: string;
    origin_address: string;
    dest_address: string;
    start_time: string;
    total_seats: number;
    earning: number;
    status: string;
}

interface EarningsData {
    today: number;
    this_week: number;
    this_month: number;
    total: number;
    total_trips: number;
    avg_per_trip: number;
    recent_trips: EarningsTrip[];
}

export default function DriverEarningsPage() {
    const { showToast } = useToast() as any;
    const [data, setData] = useState<EarningsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEarnings = async () => {
        try {
            setIsLoading(true);
            const earnings = await tripsAPI.getDriverEarnings();
            setData(earnings);
        } catch (error: any) {
            if (error?.response?.status !== 401) {
                console.error('Failed to fetch earnings:', error);
                showToast('error', 'Failed to load earnings.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEarnings();
    }, []);

    if (isLoading) {
        return (
            <RoleGuard allowedRoles={['driver']}>
                <DashboardLayout userType="driver" title="Earnings History">
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading earnings...</p>
                    </div>
                </DashboardLayout>
            </RoleGuard>
        );
    }

    const stats = data || { today: 0, this_week: 0, this_month: 0, total: 0, total_trips: 0, avg_per_trip: 0, recent_trips: [] };

    return (
        <RoleGuard allowedRoles={['driver']}>
            <DashboardLayout userType="driver" title="Earnings History">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-5xl mx-auto"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Stats Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Monthly Overview Card */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <Card className="relative overflow-hidden border-none shadow-sm">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

                                    <div className="flex flex-col items-center py-8">
                                        <p className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-widest">Revenue This Month</p>
                                        <p className="text-5xl font-black text-indigo-600">{formatCurrency(stats.this_month)}</p>
                                    </div>

                                    <div className="grid grid-cols-3 border-t border-card-border">
                                        <div className="p-6 text-center border-r border-card-border">
                                            <p className="text-2xl font-black text-foreground">{formatCurrency(stats.today)}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Today</p>
                                        </div>
                                        <div className="p-6 text-center border-r border-card-border">
                                            <p className="text-2xl font-black text-foreground">{formatCurrency(stats.this_week)}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">This Week</p>
                                        </div>
                                        <div className="p-6 text-center">
                                            <p className="text-2xl font-black text-foreground">{formatCurrency(stats.total)}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">All Time</p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Recent Transactions */}
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
                                    <button
                                        onClick={fetchEarnings}
                                        className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1.5"
                                    >
                                        <RefreshCw size={14} />
                                        Refresh
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {stats.recent_trips.length > 0 ? (
                                        stats.recent_trips.map((trip, index) => (
                                            <motion.div
                                                key={trip.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.08 }}
                                            >
                                                <Card hoverable className="border-none shadow-sm px-6 py-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                                <Car size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground leading-tight text-sm">
                                                                    {trip.origin_address} → {trip.dest_address}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                                                    {new Date(trip.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {new Date(trip.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • {trip.total_seats} pax
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xl font-black text-emerald-600">
                                                            +{formatCurrency(trip.earning)}
                                                        </span>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <Card className="text-center py-16 border-none shadow-sm">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                                                <Inbox size={28} className="text-indigo-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-foreground mb-1">No trips yet</h3>
                                            <p className="text-sm text-muted-foreground">Complete trips to start earning.</p>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Column */}
                        <div className="space-y-6">
                            {/* Performance Metrics */}
                            <Card className="border-none shadow-sm">
                                <h3 className="text-lg font-bold text-foreground mb-6">Performance</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Calendar size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Trips</p>
                                                <p className="text-lg font-black text-foreground">{stats.total_trips}</p>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(stats.total_trips * 2, 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <TrendingUp size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg / Trip</p>
                                                <p className="text-lg font-black text-foreground">{formatCurrency(stats.avg_per_trip)}</p>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min((stats.avg_per_trip / 50) * 100, 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Withdrawal Card */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative group">
                                <div className="relative z-10">
                                    <h4 className="font-black text-lg mb-3 tracking-tight uppercase">Ready to Cash Out?</h4>
                                    <p className="text-sm text-slate-300 leading-snug mb-5">
                                        {stats.total > 0
                                            ? `You have ${formatCurrency(stats.total)} in total earnings. Weekly settlements are processed every Monday.`
                                            : 'Complete trips to start earning. Weekly settlements are processed every Monday.'
                                        }
                                    </p>
                                    <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest h-12">
                                        Withdraw Now
                                    </Button>
                                </div>
                                <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform">💸</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </DashboardLayout>
        </RoleGuard>
    );
}
