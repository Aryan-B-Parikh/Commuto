'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { PassengerList } from '@/components/trip/PassengerList';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PassengerBottomNav } from '@/components/layout/PassengerBottomNav';
import { useToast } from '@/hooks/useToast';
import { mockTrips } from '@/data/trips';

export default function PassengerLivePage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [progress, setProgress] = useState(0);
    const [showEmergency, setShowEmergency] = useState(false);

    const trip = mockTrips[0];

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => prev >= 100 ? 100 : prev + 2);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (progress >= 100) {
            showToast('success', 'You have arrived!');
            setTimeout(() => router.push('/billing'), 2000);
        }
    }, [progress, router, showToast]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="relative h-[55vh]">
                <MapContainer className="h-full" showRoute />

                <div className="absolute top-4 left-4 right-4">
                    <Card variant="glass" padding="sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Heading to</p>
                                <p className="font-semibold text-gray-900 truncate">{trip.to.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">ETA</p>
                                <p className="font-semibold text-blue-600">{trip.duration}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <button
                    onClick={() => setShowEmergency(true)}
                    className="absolute top-4 right-4 w-12 h-12 bg-red-500 rounded-full shadow-lg flex items-center justify-center text-white"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </button>
            </div>

            <div className="-mt-8 relative z-10 bg-white rounded-t-3xl shadow-xl px-4 py-6 min-h-[45vh]">
                <div className="mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Trip Progress</span>
                        <span className="text-sm font-semibold text-blue-600">{progress}%</span>
                    </div>
                    <ProgressBar progress={progress} variant={progress === 100 ? 'success' : 'default'} size="lg" />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card padding="sm" className="text-center">
                        <p className="text-lg font-bold text-gray-900">{trip.distance}</p>
                        <p className="text-xs text-gray-500">Distance</p>
                    </Card>
                    <Card padding="sm" className="text-center">
                        <p className="text-lg font-bold text-gray-900">{trip.duration}</p>
                        <p className="text-xs text-gray-500">Duration</p>
                    </Card>
                    <Card padding="sm" className="text-center">
                        <p className="text-lg font-bold text-blue-600">${trip.pricePerSeat}</p>
                        <p className="text-xs text-gray-500">Your Fare</p>
                    </Card>
                </div>

                <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Your Driver</h3>
                    <PassengerList driver={trip.driver} passengers={[]} />
                </div>

                <Button variant="outline" fullWidth onClick={() => setShowEmergency(true)}>Contact Driver</Button>
            </div>

            <Modal isOpen={showEmergency} onClose={() => setShowEmergency(false)} title="Emergency">
                <p className="text-gray-600 mb-6 text-center">This will alert emergency services with your location.</p>
                <div className="flex gap-3">
                    <Button variant="outline" fullWidth onClick={() => setShowEmergency(false)}>Cancel</Button>
                    <Button variant="danger" fullWidth onClick={() => { showToast('warning', 'Alert sent'); setShowEmergency(false); }}>Send Alert</Button>
                </div>
            </Modal>

            <PassengerBottomNav />
        </div>
    );
}
