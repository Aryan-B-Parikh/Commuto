'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AvatarBadge } from '@/components/ui/AvatarBadge';
import { useToast } from '@/hooks/useToast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { tripsAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { BidModal } from '@/components/ride/BidModal';

export default function DriverRequestsPage() {
    const router = useRouter();
    const { showToast } = useToast() as any;
    const [requests, setRequests] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTrip, setSelectedTrip] = useState<TripResponse | null>(null);
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);

    const getIgnoredIds = (): string[] => {
        try {
            return JSON.parse(localStorage.getItem('ignored_requests') || '[]');
        } catch {
            return [];
        }
    };

    const addIgnoredId = (id: string) => {
        const ignored = getIgnoredIds();
        if (!ignored.includes(id)) {
            ignored.push(id);
            localStorage.setItem('ignored_requests', JSON.stringify(ignored));
        }
    };

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const data = await tripsAPI.getOpenRides();
                const ignored = getIgnoredIds();
                setRequests(data.filter(r => !ignored.includes(r.id)));
            } catch (error) {
                console.error('Failed to fetch requests:', error);
                showToast('error', 'Failed to load requests.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, []);

    const handleAction = (id: string, action: 'approve' | 'reject') => {
        const trip = requests.find(r => r.id === id);

        if (action === 'approve' && trip) {
            setSelectedTrip(trip);
            setIsBidModalOpen(true);
        } else {
            addIgnoredId(id);
            showToast('info', 'Request ignored');
            setRequests(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleBidPlaced = () => {
        if (selectedTrip) {
            setRequests(prev => prev.filter(r => r.id !== selectedTrip.id));
        }
    };

    return (
        <RoleGuard allowedRoles={['driver']}>
            <DashboardLayout userType="driver" title="Passenger Requests">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-muted-foreground">
                            {requests.length} pending approval
                        </h2>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-[250px] bg-card/50 animate-pulse rounded-2xl border border-card-border" />
                                ))}
                            </div>
                        ) : requests.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {requests.map((request, index) => (
                                    <motion.div
                                        key={request.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, x: -20 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                    >
                                        <Card className="">
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner">
                                                    {request.seats_requested}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-foreground text-lg line-clamp-1">Request {request.id.substring(0, 8).toUpperCase()}</h3>
                                                    <p className="text-sm text-indigo-600 font-medium">Seats Requested: {request.seats_requested}</p>

                                                    <div className="mt-4 space-y-2">
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                                                            <span className="truncate">{request.origin_address}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                                                            <span className="truncate">{request.dest_address}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-3 font-medium">
                                                        📅 {new Date(request.start_time).toLocaleDateString()} • ⏱️ {new Date(request.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button variant="outline" fullWidth onClick={() => handleAction(request.id, 'reject')} className="font-bold uppercase tracking-widest text-xs">Ignore</Button>
                                                <Button variant="primary" fullWidth className="bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 font-bold uppercase tracking-widest text-xs border-none" onClick={() => handleAction(request.id, 'approve')}>Accept Request</Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <Card className="text-center py-20">
                                    <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">All caught up!</h3>
                                    <p className="text-muted-foreground">No pending passenger requests at the moment.</p>
                                    <Button
                                        variant="outline"
                                        className="mt-8 font-bold uppercase tracking-widest text-xs"
                                        onClick={() => router.push('/driver/dashboard')}
                                    >
                                        Back to Dashboard
                                    </Button>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <BidModal
                        isOpen={isBidModalOpen}
                        onClose={() => setIsBidModalOpen(false)}
                        trip={selectedTrip}
                        onBidPlaced={handleBidPlaced}
                    />
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
