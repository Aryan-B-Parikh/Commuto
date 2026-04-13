"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, Bell, Car, Clock3, Leaf, MapPin, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PassengerBottomNav } from '@/components/layout/PassengerBottomNav';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { tripsAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { useToast } from '@/hooks/useToast';
import { calculateDistance, estimateCO2Saved } from '@/utils/geoUtils';
import { useAuth } from '@/hooks/useAuth';
import { useSocketEvent } from '@/hooks/useWebSocket';
import { formatCurrency } from '@/utils/formatters';
import { useTheme } from '@/context/ThemeContext';

export default function PassengerDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [trips, setTrips] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const tripsData = await tripsAPI.getMyTrips();
                setTrips(tripsData);
                const activeTrip = tripsData.find((t) => ['active', 'driver_assigned', 'bid_accepted'].includes(t.status));
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
    }, [router, showToast]);

    useSocketEvent('new_bid', (data: unknown) => {
        const amount = typeof data === 'object' && data !== null && 'bid_amount' in data ? Number((data as { bid_amount?: number }).bid_amount ?? 0) : 0;
        showToast('info', `A driver placed a bid of ${formatCurrency(amount)} on your trip.`);
        tripsAPI.getMyTrips().then(setTrips).catch(console.error);
    });

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }, []);

    const stats = useMemo(() => {
        const completedTrips = trips.filter((t) => t.status === 'completed');
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
            { label: 'Completed rides', value: completedTrips.length.toString(), note: 'Trips finished', icon: <Car className="h-5 w-5" />, tone: 'bg-sky-500/10 text-sky-400' },
            { label: 'Wallet spend', value: formatCurrency(totalSpent), note: 'Secure payments', icon: <Wallet className="h-5 w-5" />, tone: 'bg-primary/10 text-primary' },
            { label: 'CO2 saved', value: `${co2.toFixed(1)} kg`, note: 'Shared commute impact', icon: <Leaf className="h-5 w-5" />, tone: 'bg-emerald-500/10 text-emerald-400' },
        ];
    }, [trips]);

    const upcomingCount = trips.filter((t) => ['pending', 'upcoming', 'bid_accepted'].includes(t.status)).length;
    const recentTrips = trips.slice(0, 4);

    const mobileStats = stats.map((stat) => ({ ...stat, value: stat.value.length > 9 ? stat.value.replace('.00', '') : stat.value }));
    const isLightTheme = theme === 'light';
    const heroCardClass = isLightTheme
        ? 'bg-[linear-gradient(135deg,#eef5ff,#dbeafe_55%,#e0f2fe)] text-slate-900'
        : 'bg-[linear-gradient(135deg,var(--primary),#59b0ff)] text-white';
    const heroEyebrowClass = isLightTheme ? 'text-slate-600' : 'text-white/80';
    const heroOutlineButtonClass = isLightTheme
        ? 'border-slate-300/80 text-slate-700 hover:bg-white/70'
        : 'border-white/25 text-white hover:bg-white/10';
    const heroPillClass = isLightTheme
        ? 'border-slate-300/80 bg-white/75 text-slate-600'
        : 'border-white/16 bg-white/10 text-white/80';
    const heroPanelClass = isLightTheme
        ? 'border-slate-200/90 bg-white/72 text-slate-900'
        : 'border-white/12 bg-white/10 text-white';
    const heroPanelMutedClass = isLightTheme ? 'text-slate-600' : 'text-white/80';
    const heroPanelLabelClass = isLightTheme ? 'text-slate-500' : 'text-white/70';
    const heroPanelRowClass = isLightTheme ? 'bg-slate-100/80' : 'bg-white/10';
    const heroIconWrapClass = isLightTheme ? 'bg-white/80 text-primary' : 'bg-white/15 text-white';

    return (
        <RoleGuard allowedRoles={['passenger']}>
            <div className="lg:hidden min-h-screen bg-background pb-24">
                <div className="sticky top-0 z-30 border-b border-card-border bg-background/80 px-4 py-4 backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground">{greeting}</p>
                            <h1 className="mt-1 font-display text-2xl font-bold text-foreground">{user?.name?.split(' ')[0] || 'Passenger'}</h1>
                            <p className="mt-1 text-xs text-muted-foreground">Plan, book, and pay in one smoother flow.</p>
                        </div>
                        <button className="relative rounded-2xl border border-card-border bg-card p-3 text-muted-foreground shadow-sm">
                            <Bell className="h-5 w-5" />
                            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger" />
                        </button>
                    </div>
                </div>

                <div className="space-y-5 px-4 pt-5">
                    <Card className={`overflow-hidden ${heroCardClass}`} padding="lg">
                        <div className="space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className={`text-sm ${heroEyebrowClass}`}>Ready for your next trip?</p>
                                    <h2 className="mt-2 font-display text-2xl font-bold">Book a shared ride in under a minute.</h2>
                                </div>
                                <div className={`rounded-2xl p-3 ${heroIconWrapClass}`}>
                                    <Sparkles className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/passenger/ride-sharing">
                                    <Button variant="secondary" fullWidth className="bg-white text-primary hover:bg-white/90">
                                        Book ride
                                    </Button>
                                </Link>
                                <Link href="/passenger/live">
                                    <Button variant="outline" fullWidth className={heroOutlineButtonClass}>
                                        Live trip
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-3 gap-3">
                        {mobileStats.map((stat) => (
                            <Card key={stat.label} className="rounded-[24px]" padding="sm">
                                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${stat.tone}`}>
                                    {stat.icon}
                                </div>
                                <p className="text-sm font-bold text-foreground">{stat.value}</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">{stat.label}</p>
                            </Card>
                        ))}
                    </div>

                    <Card padding="lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Upcoming rides</p>
                                <p className="mt-2 text-2xl font-bold text-foreground">{upcomingCount}</p>
                            </div>
                            <Link href="/passenger/history" className="text-sm font-semibold text-primary">View all</Link>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Keep an eye on accepted bids and active journeys without bouncing between screens.
                        </p>
                    </Card>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recent activity</h3>
                            <Link href="/passenger/history" className="text-sm font-semibold text-primary">See history</Link>
                        </div>
                        {isLoading ? (
                            [1, 2, 3].map((item) => <div key={item} className="h-24 rounded-[24px] bg-card animate-pulse" />)
                        ) : recentTrips.length > 0 ? (
                            recentTrips.map((trip) => (
                                <Link key={trip.id} href={`/passenger/trip/${trip.id}`}>
                                    <Card className="rounded-[24px]" padding="sm">
                                        <div className="flex items-start gap-3">
                                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${trip.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                                                {trip.status === 'completed' ? <ShieldCheck className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-foreground">{trip.origin_address}</p>
                                                        <p className="truncate text-sm text-muted-foreground">to {trip.dest_address}</p>
                                                    </div>
                                                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold capitalize text-foreground">{trip.status.replace('_', ' ')}</span>
                                                </div>
                                                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>{trip.start_time ? new Date(trip.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Today'}</span>
                                                    <span className="font-semibold text-foreground">{formatCurrency(trip.price_per_seat || 0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))
                        ) : (
                            <Card className="rounded-[24px] border-dashed" padding="lg">
                                <p className="text-sm text-muted-foreground">No recent rides yet. Start with a quick search and book your first shared trip.</p>
                            </Card>
                        )}
                    </div>
                </div>
                <PassengerBottomNav />
            </div>

            <div className="hidden lg:block">
                <DashboardLayout userType="passenger" title="Passenger Overview">
                    <div className="mx-auto max-w-7xl space-y-8">
                        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                            <Card className={`overflow-hidden ${heroCardClass}`} padding="lg">
                                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                                    <div>
                                        <span className={`inline-flex rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] ${heroPillClass}`}>
                                            Rider dashboard
                                        </span>
                                        <h1 className="mt-5 font-display text-4xl font-bold leading-tight">
                                            {greeting}, {user?.name?.split(' ')[0] || 'there'}.
                                        </h1>
                                        <p className={`mt-4 max-w-2xl text-base leading-7 ${heroEyebrowClass}`}>
                                            Search faster, book with clearer pricing, and keep wallet, trip progress, and recent activity in one calmer dashboard.
                                        </p>
                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <Link href="/passenger/ride-sharing">
                                                <Button variant="secondary" className="bg-white text-primary hover:bg-white/92">
                                                    Book a ride
                                                </Button>
                                            </Link>
                                            <Link href="/passenger/search">
                                                <Button variant="outline" className={heroOutlineButtonClass}>
                                                    Search open rides
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    <div className={`rounded-[28px] border p-6 backdrop-blur-md ${heroPanelClass}`}>
                                        <p className={`text-xs uppercase tracking-[0.2em] ${heroPanelLabelClass}`}>Status snapshot</p>
                                        <div className="mt-5 space-y-4">
                                            <div className={`flex items-center justify-between rounded-2xl px-4 py-3 ${heroPanelRowClass}`}>
                                                <span className={`text-sm ${heroPanelMutedClass}`}>Upcoming rides</span>
                                                <span className="text-lg font-semibold">{upcomingCount}</span>
                                            </div>
                                            <div className={`flex items-center justify-between rounded-2xl px-4 py-3 ${heroPanelRowClass}`}>
                                                <span className={`text-sm ${heroPanelMutedClass}`}>Live support status</span>
                                                <span className="text-sm font-semibold">Protected</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card padding="lg">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Quick actions</p>
                                <div className="mt-5 space-y-3">
                                    {[
                                        { href: '/passenger/ride-sharing', title: 'Book a ride', description: 'Pickup, drop, seats, and price in one simple flow', icon: <MapPin className="h-5 w-5" /> },
                                        { href: '/passenger/live', title: 'Track active trip', description: 'See real-time updates and status changes', icon: <Activity className="h-5 w-5" /> },
                                        { href: '/passenger/wallet', title: 'Manage wallet', description: 'Payments, cards, and balance in one place', icon: <Wallet className="h-5 w-5" /> },
                                    ].map((item) => (
                                        <Link key={item.href} href={item.href}>
                                            <div className="flex items-center gap-4 rounded-[24px] border border-card-border bg-background/50 px-4 py-4 transition-all hover:border-primary/20 hover:bg-muted/50">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">{item.icon}</div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">
                            {stats.map((stat) => (
                                <Card key={stat.label} padding="lg">
                                    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
                                        {stat.icon}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">{stat.note}</p>
                                </Card>
                            ))}
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                            <Card padding="lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recent activity</p>
                                        <h3 className="mt-2 font-display text-2xl font-bold text-foreground">Trips and ride requests</h3>
                                    </div>
                                    <Link href="/passenger/history" className="text-sm font-semibold text-primary">Open history</Link>
                                </div>

                                <div className="mt-6 space-y-3">
                                    {isLoading ? (
                                        [1, 2, 3].map((item) => <div key={item} className="h-24 rounded-[24px] bg-muted animate-pulse" />)
                                    ) : recentTrips.length > 0 ? (
                                        recentTrips.map((trip) => (
                                            <Link key={trip.id} href={`/passenger/trip/${trip.id}`}>
                                                <motion.div whileHover={{ y: -2 }} className="rounded-[24px] border border-card-border bg-background/55 p-5 transition-all hover:border-primary/20 hover:bg-muted/45">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${trip.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                                                                    {trip.status === 'completed' ? <ShieldCheck className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-foreground">{trip.origin_address}</p>
                                                                    <p className="text-sm text-muted-foreground">to {trip.dest_address}</p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                                <span>{trip.start_time ? new Date(trip.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Today'}</span>
                                                                <span className="rounded-full bg-muted px-2.5 py-1 capitalize text-foreground">{trip.status.replace('_', ' ')}</span>
                                                                {trip.bid_count && trip.bid_count > 0 && trip.status === 'pending' && (
                                                                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-400">{trip.bid_count} bids</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-semibold text-foreground">{formatCurrency(trip.price_per_seat || 0)}</p>
                                                            <p className="text-xs text-muted-foreground">Per seat</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="rounded-[24px] border border-dashed border-card-border p-8 text-sm text-muted-foreground">
                                            No recent activity yet. Search for a route or create a ride request to get moving.
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <div className="space-y-6">
                                <Card padding="lg">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                                            <Leaf className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Sustainability impact</p>
                                            <p className="text-sm text-muted-foreground">Every shared trip cuts cost and emissions.</p>
                                        </div>
                                    </div>
                                    <div className="mt-5 rounded-[24px] bg-background/55 p-5">
                                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Personal impact</p>
                                        <p className="mt-2 text-3xl font-bold text-foreground">{stats[2].value}</p>
                                        <p className="mt-2 text-sm text-muted-foreground">Estimated carbon savings from completed shared rides.</p>
                                    </div>
                                </Card>

                                <Card padding="lg">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Safety tools</p>
                                            <p className="text-sm text-muted-foreground">Live tracking and verified trips stay close at hand.</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" fullWidth className="mt-5">
                                        Open safety center
                                    </Button>
                                </Card>
                            </div>
                        </div>
                    </div>
                </DashboardLayout>
            </div>
        </RoleGuard>
    );
}
