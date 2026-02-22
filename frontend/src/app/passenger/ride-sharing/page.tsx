'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import CreateRideForm from '@/components/ride-sharing/CreateRideForm';
import AvailableRidesList from '@/components/ride-sharing/AvailableRidesList';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function RideSharingPage() {
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

    return (
        <RoleGuard allowedRoles={['passenger']}>
            <DashboardLayout userType="passenger" title="Shared Commute Dashboard">
                <div className="max-w-5xl mx-auto px-4">

                    {/* Marketplace Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-extrabold text-foreground mb-4">
                            Collaborative Travel Marketplace
                        </h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Join existing rides to save costs or create your own shared commute
                            and find fellow travelers going your way.
                        </p>
                    </div>

                    {/* Modern SaaS Tabs */}
                    <div className="flex justify-center mb-10">
                        <div className="bg-muted/50 p-1.5 rounded-2xl flex gap-2 backdrop-blur-sm border border-card-border shadow-sm">
                            <button
                                onClick={() => setActiveTab('create')}
                                className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'create'
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                        : 'text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                <span className="text-xl">✍️</span>
                                Create Ride
                            </button>
                            <button
                                onClick={() => setActiveTab('join')}
                                className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'join'
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                        : 'text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                <span className="text-xl">🤝</span>
                                Join Ride
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'create' ? <CreateRideForm /> : <AvailableRidesList />}
                        </motion.div>
                    </AnimatePresence>

                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
