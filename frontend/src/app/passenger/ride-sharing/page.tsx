'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Search, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CreateRideForm from '@/components/ride-sharing/CreateRideForm';
import AvailableRidesList from '@/components/ride-sharing/AvailableRidesList';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function RideSharingPage() {
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

    const tabClass = (isActive: boolean) =>
        `flex-1 rounded-full px-4 py-3 text-sm font-semibold transition-all ${isActive
            ? 'bg-[linear-gradient(135deg,var(--primary),#59b0ff)] text-white shadow-[0_16px_30px_rgba(47,128,255,0.22)]'
            : 'text-muted-foreground hover:text-foreground'
        }`;

    return (
        <RoleGuard allowedRoles={['passenger']}>
            <div className="lg:hidden min-h-screen bg-background pb-24">
                <div className="sticky top-0 z-40 border-b border-card-border bg-background/85 px-4 py-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <button onClick={() => window.history.back()} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-card-border bg-card text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="text-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Ride booking</p>
                            <h1 className="font-display text-xl font-bold text-foreground">Plan your next trip</h1>
                        </div>
                        <div className="w-11" />
                    </div>
                </div>

                <div className="space-y-5 px-4 pt-5">
                    <div className="rounded-[28px] border border-card-border bg-card p-2 shadow-[var(--shadow-card)]">
                        <div className="flex rounded-full bg-muted/60 p-1">
                            <button onClick={() => setActiveTab('create')} className={tabClass(activeTab === 'create')}>Create ride</button>
                            <button onClick={() => setActiveTab('join')} className={tabClass(activeTab === 'join')}>Join ride</button>
                        </div>
                    </div>

                    <CardHero activeTab={activeTab} />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'create' ? <CreateRideForm isMobile /> : <AvailableRidesList isMobile />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="hidden lg:block">
                <DashboardLayout userType="passenger" title="Ride Booking">
                    <div className="mx-auto max-w-6xl space-y-8">
                        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-[32px] border border-card-border bg-[linear-gradient(135deg,var(--primary),#59b0ff)] p-8 text-white shadow-[var(--shadow-soft)]">
                                <span className="inline-flex rounded-full border border-white/16 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                                    Booking flow refresh
                                </span>
                                <h1 className="mt-5 font-display text-4xl font-bold leading-tight">
                                    Book or join a ride with cleaner steps and clearer decisions.
                                </h1>
                                <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
                                    Pickup, destination, seats, pricing, and available rides now sit inside a simpler split view that works across mobile and desktop.
                                </p>
                            </div>

                            <div className="rounded-[32px] border border-card-border bg-card p-6 shadow-[var(--shadow-card)]">
                                <div className="flex rounded-full bg-muted/60 p-1">
                                    <button onClick={() => setActiveTab('create')} className={tabClass(activeTab === 'create')}>Create ride</button>
                                    <button onClick={() => setActiveTab('join')} className={tabClass(activeTab === 'join')}>Join ride</button>
                                </div>
                                <div className="mt-5 grid gap-3">
                                    <div className="rounded-[24px] border border-card-border bg-background/55 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                <Sparkles className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Fewer booking steps</p>
                                                <p className="mt-1 text-sm text-muted-foreground">Key decisions are grouped together to reduce back-and-forth.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-[24px] border border-card-border bg-background/55 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                                                <Search className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Clear availability</p>
                                                <p className="mt-1 text-sm text-muted-foreground">Browse open rides with seats, timing, and pricing upfront.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`desktop-${activeTab}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.25 }}
                            >
                                {activeTab === 'create' ? <CreateRideForm /> : <AvailableRidesList />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </DashboardLayout>
            </div>
        </RoleGuard>
    );
}

function CardHero({ activeTab }: { activeTab: 'create' | 'join' }) {
    return (
        <div className="rounded-[28px] border border-card-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {activeTab === 'create' ? <Sparkles className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">{activeTab === 'create' ? 'Create a ride request' : 'Browse open rides'}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {activeTab === 'create'
                            ? 'Set pickup, drop, seats, timing, and total budget in one compact booking flow.'
                            : 'Compare available rides with timing, seats, and price before you commit.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
