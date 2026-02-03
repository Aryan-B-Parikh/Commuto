'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AvatarBadge } from '@/components/ui/AvatarBadge';
import { DriverBottomNav } from '@/components/layout/DriverBottomNav';
import { useToast } from '@/hooks/useToast';
import { mockUsers } from '@/data/users';

interface PassengerRequest {
    id: string;
    passenger: typeof mockUsers[0];
    trip: { from: string; to: string; date: string };
    seats: number;
    status: 'pending' | 'approved' | 'rejected';
}

const mockRequests: PassengerRequest[] = [
    { id: '1', passenger: mockUsers[1], trip: { from: 'Downtown', to: 'Airport', date: 'Today, 2:00 PM' }, seats: 1, status: 'pending' },
    { id: '2', passenger: mockUsers[2], trip: { from: 'Downtown', to: 'Airport', date: 'Today, 2:00 PM' }, seats: 2, status: 'pending' },
    { id: '3', passenger: mockUsers[3], trip: { from: 'Office Park', to: 'Central Station', date: 'Tomorrow, 8:00 AM' }, seats: 1, status: 'pending' },
];

export default function DriverRequestsPage() {
    const { showToast } = useToast();
    const [requests, setRequests] = useState(mockRequests);

    const handleAction = (id: string, action: 'approve' | 'reject') => {
        setRequests(prev => prev.map(r =>
            r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
        ));
        showToast(action === 'approve' ? 'success' : 'info',
            action === 'approve' ? 'Passenger approved!' : 'Request declined');
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b px-4 py-4">
                <div className="flex items-center gap-4">
                    <Link href="/driver/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Passenger Requests</h1>
                        <p className="text-sm text-gray-500">{pendingRequests.length} pending approval</p>
                    </div>
                </div>
            </div>

            <div className="px-4 py-6">
                <AnimatePresence>
                    {pendingRequests.length > 0 ? (
                        <div className="space-y-4">
                            {pendingRequests.map((request, index) => (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card>
                                        <div className="flex items-start gap-4 mb-4">
                                            <AvatarBadge src={request.passenger.avatar} alt={request.passenger.name} size="lg" badge="passenger" rating={request.passenger.rating} />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{request.passenger.name}</h3>
                                                <p className="text-sm text-gray-500">{request.passenger.totalTrips} trips completed</p>
                                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    </svg>
                                                    <span>{request.trip.from} → {request.trip.to}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">{request.trip.date} • {request.seats} seat(s)</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="outline" fullWidth onClick={() => handleAction(request.id, 'reject')}>Decline</Button>
                                            <Button variant="primary" fullWidth onClick={() => handleAction(request.id, 'approve')}>Approve</Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">All caught up!</h3>
                            <p className="text-gray-500">No pending requests</p>
                        </Card>
                    )}
                </AnimatePresence>
            </div>

            <DriverBottomNav />
        </div>
    );
}
