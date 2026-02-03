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
import { useToast } from '@/hooks/useToast';
import { mockTrips } from '@/data/trips';

export default function DriverLivePage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [progress, setProgress] = useState(0);
    const [showEndModal, setShowEndModal] = useState(false);

    const trip = mockTrips[0];

    if (!trip) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="text-center py-12">
                    <h3 className="font-semibold text-gray-900 mb-2">No Active Trip</h3>
                    <p className="text-gray-500 mb-6">You don't have an active trip.</p>
                    <Button onClick={() => router.push('/driver/dashboard')}>Go to Dashboard</Button>
                </Card>
            </div>
        );
    }

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => prev >= 100 ? 100 : prev + 2);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (progress >= 100) {
            showToast('success', 'Trip completed! Earnings added.');
            setTimeout(() => router.push('/driver/earnings'), 2000);
        }
    }, [progress, router, showToast]);

    const handleEndTrip = () => {
        showToast('success', 'Trip ended. Earnings calculated.');
        router.push('/driver/earnings');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="relative h-[55vh]">
                <MapContainer className="h-full" showRoute />

                <div className="absolute top-4 left-4 right-4">
                    <Card variant="glass" padding="sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Driving to</p>
                                <p className="font-semibold text-gray-900 truncate">{trip.to.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">ETA</p>
                                <p className="font-semibold text-green-600">{trip.duration}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="-mt-8 relative z-10 bg-white rounded-t-3xl shadow-xl px-4 py-6 min-h-[45vh]">
                <div className="mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Trip Progress</span>
                        <span className="text-sm font-semibold text-green-600">{progress}%</span>
                    </div>
                    <ProgressBar progress={progress} variant={progress === 100 ? 'success' : 'default'} size="lg" />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card padding="sm" className="text-center">
                        <p className="text-lg font-bold text-gray-900">{trip.distance}</p>
                        <p className="text-xs text-gray-500">Distance</p>
                    </Card>
                    <Card padding="sm" className="text-center">
                        <p className="text-lg font-bold text-gray-900">{trip.passengers.length}</p>
                        <p className="text-xs text-gray-500">Passengers</p>
                    </Card>
                    <Card padding="sm" className="text-center">
                        <p className="text-lg font-bold text-green-600">${trip.pricePerSeat * trip.passengers.length}</p>
                        <p className="text-xs text-gray-500">Earnings</p>
                    </Card>
                </div>

                <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Passengers</h3>
                    <PassengerList driver={trip.driver} passengers={trip.passengers} />
                </div>

                <Button variant="danger" fullWidth onClick={() => setShowEndModal(true)}>End Trip</Button>
            </div>

            <Modal isOpen={showEndModal} onClose={() => setShowEndModal(false)} title="End Trip">
                <p className="text-gray-600 mb-6 text-center">End this trip and calculate earnings?</p>
                <div className="flex gap-3">
                    <Button variant="outline" fullWidth onClick={() => setShowEndModal(false)}>Continue</Button>
                    <Button variant="primary" fullWidth onClick={handleEndTrip}>End Trip</Button>
                </div>
            </Modal>
        </div>
    );
}
