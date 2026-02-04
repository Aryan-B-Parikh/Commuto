'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AvatarBadge } from '@/components/ui/AvatarBadge';
import { PassengerBottomNav } from '@/components/layout/PassengerBottomNav';
import { useToast } from '@/hooks/useToast';
import { tripsAPI, bidsAPI } from '@/services/api';
import { transformTripResponse } from '@/utils/tripTransformers';
import type { TripResponse, BidResponse } from '@/types/api';
import type { Trip } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { useSocketEvent } from '@/hooks/useWebSocket';

export default function PassengerTripDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast() as any;
    const [isLoading, setIsLoading] = useState(true);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [bids, setBids] = useState<BidResponse[]>([]);
    const [isAccepting, setIsAccepting] = useState<string | null>(null);

    const tripId = params.id as string;

    useEffect(() => {
        if (tripId) {
            fetchData();
        }
    }, [tripId]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            // In a real app, we'd have getTripById, for now we filter from myTrips
            // Optimization: Add getTripById endpoint later
            const allTrips = await tripsAPI.getMyTrips();
            const foundTrip = allTrips.find(t => t.id === tripId);

            if (foundTrip) {
                setTrip(transformTripResponse(foundTrip));

                // Fetch bids if trip is pending
                if (foundTrip.status === 'pending') {
                    try {
                        const bidsData = await bidsAPI.getRideBids(tripId);
                        setBids(bidsData);
                    } catch (err) {
                        console.error('Failed to fetch bids:', err);
                    }
                }
            } else {
                showToast('error', 'Trip not found');
                router.push('/passenger/dashboard');
            }
        } catch (error) {
            console.error('Failed to load trip details:', error);
            showToast('error', 'Failed to load trip details');
        } finally {
            setIsLoading(false);
        }
    };

    // Real-time bid updates
    useSocketEvent('new_bid', (data: any) => {
        // Backend sends personal message with bid data
        // Check if bid is for this trip (if payload has trip_id)
        // Or if we trust the backend sends only relevant bids to this user
        console.log('New bid received:', data);

        // Add new bid to state if it's not already there
        setBids(prev => {
            if (prev.find(b => b.id === data.id)) return prev;
            showToast('info', `New bid of ${formatCurrency(data.bid_amount)} received!`);
            return [data, ...prev];
        });
    });

    const handleAcceptBid = async (bidId: string) => {
        try {
            setIsAccepting(bidId);
            const response = await bidsAPI.acceptBid(bidId);

            showToast('success', 'Driver accepted! Your ride is confirmed.');
            router.push('/passenger/live'); // Or some confirmation page with OTP
        } catch (error) {
            console.error('Failed to accept bid:', error);
            showToast('error', 'Failed to accept bid. Please try again.');
        } finally {
            setIsAccepting(null);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading trip details...</div>;
    }

    if (!trip) {
        return null; // Redirect handled in useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Map Header */}
            <div className="relative h-[40vh]">
                <MapContainer className="h-full" showRoute />

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${trip.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        trip.status === 'active' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </span>
                </div>
            </div>

            {/* Content info */}
            <div className="-mt-8 relative z-10 px-4">
                <Card className="mb-6 shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">{trip.to.name}</h2>
                            <p className="text-sm text-gray-500">From {trip.from.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-900">{trip.date}</p>
                            <p className="text-sm text-gray-500">{trip.time}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">{trip.totalSeats} passengers</span>
                        </div>
                    </div>
                </Card>

                {/* Bids Section */}
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Driver Bids {bids.length > 0 && `(${bids.length})`}
                </h3>

                <div className="space-y-4">
                    <AnimatePresence>
                        {bids.length > 0 ? (
                            bids.map((bid, index) => (
                                <motion.div
                                    key={bid.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="border border-gray-100">
                                        <div className="flex items-center gap-4 mb-4">
                                            {/* Driver Avatar Placeholder */}
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                D
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900">Driver</h4>
                                                <p className="text-xs text-gray-500">4.8 ★ • 120 trips</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-green-600">{formatCurrency(bid.bid_amount)}</p>
                                                <p className="text-xs text-gray-500">Fixed Price</p>
                                            </div>
                                        </div>

                                        <Button
                                            fullWidth
                                            variant="primary"
                                            isLoading={isAccepting === bid.id}
                                            onClick={() => handleAcceptBid(bid.id)}
                                        >
                                            Accept Offer
                                        </Button>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <Card className="text-center py-8 bg-gray-50 border-dashed border-2 border-gray-200">
                                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h4 className="font-medium text-gray-900">Waiting for bids...</h4>
                                <p className="text-sm text-gray-500 mt-1">Drivers will see your request shortly.</p>
                            </Card>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <PassengerBottomNav />
        </div>
    );
}
