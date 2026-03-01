"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Car,
    Wallet,
    Leaf,
    TrendingUp,
    ChevronRight,
    ShieldCheck,
    Clock,
    MapPin,
    ArrowRight,
    PlusCircle,
    Activity,
    Bell,
    ChevronUp,
    Navigation,
    UserCircle,
    Map as MapIcon,
    Search
} from 'lucide-react';
import { PassengerBottomNav } from '@/components/layout/PassengerBottomNav';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { tripsAPI, walletAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { useToast } from '@/hooks/useToast';
import { calculateDistance, estimateCO2Saved } from '@/utils/geoUtils';
import { useAuth } from '@/hooks/useAuth';
import { useSocketEvent } from '@/hooks/useWebSocket';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function PassengerDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [trips, setTrips] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast() as any;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const tripsData = await tripsAPI.getMyTrips();
                setTrips(tripsData);

                // Auto-navigation logic: check for active/assigned trips
                const activeTrip = tripsData.find(t => ['active', 'driver_assigned', 'bid_accepted'].includes(t.status));
                if (activeTrip) {
                    router.push('/passenger/live');
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                showToast('error', 'Failed to load dashboard data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [showToast, router]);

    // Listen for new bids in real-time
    useSocketEvent('new_bid', (data: any) => {
        showToast('info', `A driver has placed a bid of ₹${data.bid_amount} on your trip!`);
        // Refresh trips to show updated bid count
        tripsAPI.getMyTrips().then(setTrips).catch(console.error);
    });

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    }, []);

    const computedStats = useMemo(() => {
        const completedTrips = trips.filter(t => t.status === 'completed');
        const co2 = completedTrips.reduce((acc, trip) => {
            const dist = calculateDistance(
                { lat: trip.origin_lat, lng: trip.origin_lng },
                { lat: trip.dest_lat, lng: trip.dest_lng }
            );
            return acc + estimateCO2Saved(dist);
        }, 0);

        const totalSpent = completedTrips.reduce((acc, trip) => {
            if (trip.booking_payment_status === 'completed') {
                return acc + (trip.booking_total_price || 0);
            }
            return acc;
        }, 0);

        return [
            { label: 'Total Trips', value: trips.length.toString(), icon: <Car size={20} />, color: 'bg-blue-500/10 text-blue-400', trend: 'Lifetime' },
            { label: 'Carbon Saved', value: `${co2.toFixed(1)}kg`, icon: <Leaf size={20} />, color: 'bg-emerald-500/10 text-emerald-400', trend: 'Shared' },
            { label: 'Total Spent', value: `₹${totalSpent.toFixed(2)}`, icon: <Wallet size={20} />, color: 'bg-indigo-500/10 text-indigo-400', trend: 'Safe' },
        ];
    }, [trips]);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const [sheetExpanded, setSheetExpanded] = useState(false);

    return (
        <RoleGuard allowedRoles={['passenger']}>
            {/* ====================== MOBILE LAYOUT ====================== */}
            <div className="lg:hidden min-h-screen bg-background flex flex-col relative overflow-hidden">

                {/* 1️⃣ Mobile Header */}
                <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-card-border px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <UserCircle size={22} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground leading-tight">
                                {user?.name ? `${greeting}, ${user.name.split(' ')[0]}` : 'Passenger'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                Ahmedabad, Gujarat
                            </p>
                        </div>
                    </div>
                    <button className="relative p-2 hover:bg-muted rounded-xl transition-colors">
                        <Bell size={20} className="text-muted-foreground" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
                    </button>
                </div>

                {/* 2️⃣ MAP — Main Focus */}
                <div className="flex-1 relative min-h-[60vh]">
                    <div className="absolute inset-0 z-0">
                        {/* Map placeholder/widget */}
                        <div className="w-full h-full bg-muted/20 animate-pulse flex items-center justify-center">
                            <MapIcon size={48} className="text-muted/30" />
                        </div>
                    </div>

                    {/* Floating Quick Action */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-32px)]">
                        <Link href="/passenger/ride-sharing">
                            <div className="bg-card/90 backdrop-blur-xl p-4 rounded-2xl border border-card-border shadow-lg flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                                    <Search size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-foreground">Where to?</p>
                                    <p className="text-[10px] text-muted-foreground">Find a shared ride nearby</p>
                                </div>
                                <ChevronRight size={18} className="text-muted-foreground" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* 3️⃣ Mobile Bottom Sheet */}
                <motion.div
                    className="fixed bottom-0 left-0 right-0 z-40 bg-card rounded-t-[32px] shadow-[0_-8px_32px_rgba(0,0,0,0.5)] border-t border-card-border"
                    animate={{
                        height: sheetExpanded ? '75vh' : '260px',
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Handle */}
                    <button
                        onClick={() => setSheetExpanded(!sheetExpanded)}
                        className="w-full flex flex-col items-center pt-3 pb-2"
                    >
                        <div className="w-10 h-1 rounded-full bg-muted mb-1" />
                        <ChevronUp
                            size={16}
                            className={`text-muted-foreground/60 transition-transform duration-200 ${sheetExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>

                    <div className="px-5 pb-24 overflow-y-auto max-h-[calc(75vh-48px)] scrollbar-hide">
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {computedStats.map((stat, i) => (
                                <div key={i} className="bg-muted/50 rounded-2xl p-3 border border-card-border text-center">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
                                        {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 16 })}
                                    </div>
                                    <p className="text-sm font-black text-foreground">{stat.value}</p>
                                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Recent Trips Section */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
                                <Link href="/passenger/history" className="text-xs font-bold text-indigo-400">View All</Link>
                            </div>

                            <div className="space-y-3">
                                {isLoading ? (
                                    [1, 2].map(i => <div key={i} className="h-20 bg-muted/30 rounded-2xl animate-pulse" />)
                                ) : trips.length > 0 ? (
                                    trips.slice(0, 3).map((trip, i) => (
                                        <div key={i} className="bg-background/50 p-4 rounded-2xl border border-card-border flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${trip.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                                {trip.status === 'completed' ? <ShieldCheck size={18} /> : <Activity size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">{trip.dest_address}</p>
                                                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">{trip.status} • {new Date(trip.start_time).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-foreground">₹{trip.price_per_seat}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-xs text-muted-foreground py-4">No recent trips</p>
                                )}
                            </div>
                        </div>

                        {/* Safety Card */}
                        <div className="bg-indigo-600 rounded-2xl p-4 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                            <div className="relative z-10 flex items-center gap-3">
                                <ShieldCheck size={24} />
                                <div>
                                    <p className="text-sm font-bold">Safe & Secure</p>
                                    <p className="text-[10px] text-indigo-100">Every ride is tracked and verified</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 4️⃣ Bottom Navigation */}
                <PassengerBottomNav />
            </div>

            {/* ====================== DESKTOP LAYOUT (UNCHANGED) ====================== */}
            <div className="hidden lg:block">
                <DashboardLayout userType="passenger" title="Overview">
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={containerVariants}
                        className="max-w-7xl mx-auto space-y-6 lg:space-y-10 pb-12"
                    >
                        {/* Welcome Section */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <motion.div variants={itemVariants}>
                                <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                                    {greeting}, {user?.name?.split(' ')[0] || 'there'} 👋
                                </h2>
                                <p className="text-muted-foreground font-medium mt-1">
                                    {trips.length > 0
                                        ? `You have ${trips.filter(t => t.status === 'upcoming').length} upcoming rides scheduled.`
                                        : "Ready to start your journey? Find a ride today."}
                                </p>
                            </motion.div>
                            <motion.div variants={itemVariants} className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-card flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                            UA
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    42 Drivers active nearby
                                </p>
                            </motion.div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                            {computedStats.map((stat, i) => (
                                <motion.div key={i} variants={itemVariants}>
                                    <Card className="p-5 lg:p-6 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative text-left">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                            {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 80 })}
                                        </div>
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="space-y-4">
                                                <div className={`p-3 rounded-xl w-fit ${stat.color}`}>
                                                    {stat.icon}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-muted-foreground tracking-tight">{stat.label}</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-2xl lg:text-3xl font-bold text-foreground tabular-nums tracking-tight">{stat.value}</p>
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center gap-0.5">
                                                            <TrendingUp size={10} /> {stat.trend}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                            {/* Quick Actions - Primary Focus */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-2">
                                        <Activity size={14} className="text-indigo-400" />
                                        Main Actions
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Link href="/passenger/ride-sharing" className="group h-full">
                                        <Card className="bg-indigo-600 border-none p-6 lg:p-8 h-full flex flex-col justify-between relative overflow-hidden group-hover:shadow-2xl group-hover:shadow-indigo-500/30 transition-all cursor-pointer">
                                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />

                                            <div className="relative z-10">
                                                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl w-fit mb-6 text-white border border-white/20 group-hover:rotate-6 transition-transform">
                                                    <PlusCircle size={32} />
                                                </div>
                                                <h4 className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-none">Find a Ride</h4>
                                                <p className="text-indigo-100/70 text-sm mt-3 font-medium max-w-[200px]">
                                                    Browse thousands of available routes and book your seat instantly.
                                                </p>
                                            </div>

                                            <div className="mt-6 lg:mt-8 flex items-center gap-2 text-white font-bold text-sm tracking-tight group-hover:gap-4 transition-all relative z-10">
                                                Get Started <ArrowRight size={18} />
                                            </div>
                                        </Card>
                                    </Link>

                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { label: 'Active Trips', desc: 'Real-time GPS tracking', href: '/passenger/live', icon: <MapPin size={24} />, color: 'indigo' },
                                        ].map((action, i) => (
                                            <Link key={i} href={action.href}>
                                                <Card className="p-5 lg:p-6 border-none shadow-sm hover:shadow-md hover:border-indigo-500/20 border border-[#1E293B] transition-all cursor-pointer flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-muted rounded-xl text-indigo-400 font-bold group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                            {action.icon}
                                                        </div>
                                                        <div>
                                                            <h5 className="font-bold text-foreground leading-none">{action.label}</h5>
                                                            <p className="text-xs text-muted-foreground mt-1 font-medium">{action.desc}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={18} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Activity Feed / Recent Trips */}
                                <div className="space-y-6 pt-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-2">
                                            <Clock size={14} className="text-indigo-400" />
                                            Activity Feed
                                        </h3>
                                        <Link href="/passenger/history" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 tracking-tight flex items-center gap-1 group">
                                            Review full history <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>

                                    <div className="space-y-3">
                                        {isLoading ? (
                                            [1, 2, 3].map(i => (
                                                <div key={i} className="h-20 w-full bg-muted animate-pulse rounded-2xl" />
                                            ))
                                        ) : trips.length === 0 ? (
                                            <div className="py-12 text-center bg-muted/30 rounded-3xl border-2 border-dashed border-card-border">
                                                <p className="text-sm font-medium text-muted-foreground">No recent activity detected.</p>
                                            </div>
                                        ) : (
                                            trips.slice(0, 3).map((trip, i) => (
                                                <motion.div key={i} variants={itemVariants}>
                                                    <Link href={`/passenger/trip/${trip.id}`}>
                                                        <Card className="px-4 lg:px-6 py-4 border-none shadow-sm flex items-center justify-between hover:shadow-md transition-all cursor-pointer group">
                                                            <div className="flex items-center gap-3 lg:gap-5 flex-1 min-w-0">
                                                                <div className={`p-3 lg:p-4 rounded-2xl flex items-center justify-center flex-shrink-0 ${trip.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                                    {trip.status === 'completed' ? <ShieldCheck size={20} /> : <Activity size={20} />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                                                                        <p className="font-bold text-foreground text-sm tracking-tight truncate">
                                                                            {trip.origin_address || 'Home'}
                                                                            <span className="mx-2 text-muted-foreground/40 opacity-50 font-normal">→</span>
                                                                            {trip.dest_address || 'Airport'}
                                                                        </p>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0 ${trip.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                                                                            }`}>
                                                                            {trip.status}
                                                                        </span>
                                                                        {trip.bid_count && trip.bid_count > 0 && trip.status === 'pending' && (
                                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 uppercase animate-pulse flex-shrink-0">
                                                                                {trip.bid_count} {trip.bid_count === 1 ? 'Bid' : 'Bids'} Received
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-1">
                                                                        {trip.start_time ? new Date(trip.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Today'} • {trip.start_time ? new Date(trip.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                                                                <div className="text-right hidden sm:block">
                                                                    <p className="font-bold text-foreground text-sm">${trip.price_per_seat || '24'}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Fixed Price</p>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center border border-card-border text-muted-foreground group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                                    <ChevronRight size={14} />
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    </Link>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Column - Safety & Community */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Safety Section */}
                                <motion.div variants={itemVariants}>
                                    <Card className="p-5 lg:p-6 border-none shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full" />
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <h4 className="font-bold text-foreground tracking-tight">Safety Center</h4>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6">
                                                Your security is our top priority. Every journey is protected with verified drivers and live monitoring.
                                            </p>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Verified Drivers Only
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    24/7 Live GPS Tracking
                                                </div>
                                            </div>
                                            <Button variant="outline" fullWidth className="mt-6 lg:mt-8 h-11 text-xs font-bold uppercase tracking-widest border-card-border hover:bg-muted shadow-sm">
                                                Access SOS Tools
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>

                                {/* Community Card */}
                                <motion.div variants={itemVariants}>
                                    <div className="bg-card rounded-3xl p-5 lg:p-6 text-foreground shadow-2xl relative overflow-hidden group border border-card-border">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                            <TrendingUp size={120} />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">Sustainable Future</p>
                                            <h4 className="text-xl lg:text-2xl font-bold tracking-tight leading-none mb-3 italic transition-all group-hover:scale-105 text-foreground">Reducing Carbon, <br />One Trip at a Time.</h4>
                                            <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6">
                                                Join 5,000+ commuters who reduced over 12 tons of CO2 this month alone.
                                            </p>
                                            <div className="flex items-center gap-3 py-3 px-4 bg-white/5 rounded-2xl border border-white/10 w-fit transition-all group-hover:bg-white/10">
                                                <div className="p-2 bg-emerald-500 rounded-lg text-white">
                                                    <Leaf size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Personal Impact</p>
                                                    <p className="text-sm font-bold text-foreground">{computedStats[1].value} Reduced</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </DashboardLayout>
            </div>
        </RoleGuard>
    );
}
