'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MapContainer } from '@/components/trip/MapContainer';
import { PassengerList } from '@/components/trip/PassengerList';
import { useToast } from '@/hooks/useToast';
import { mockTrips } from '@/data/trips';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

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

    if (!trip) {
        return (
            <DashboardLayout userType="passenger" title="Active Trip">
                <div className="flex items-center justify-center p-4">
                    <Card className="text-center py-12 max-w-md w-full dark:glass">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-xl">No Active Trip</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">You don't have an active trip at the moment.</p>
                        <Button variant="primary" onClick={() => router.push('/passenger/dashboard')}>Go to Dashboard</Button>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout userType="passenger" title="Live Trip">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    <div className="relative h-[400px] rounded-2xl overflow-hidden dark:glass border border-gray-100 dark:border-gray-800 shadow-sm relative z-0">
                        <MapContainer className="h-full" showRoute />

                        <div className="absolute top-4 left-4 right-4">
                            <Card variant="glass" padding="sm" className="bg-white/80 dark:bg-black/80 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Heading to</p>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{trip.to.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">ETA</p>
                                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">{trip.duration}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <button
                            onClick={() => setShowEmergency(true)}
                            className="absolute bottom-4 right-4 w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full shadow-lg flex items-center justify-center text-white transition-colors z-10"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </button>
                    </div>

                    <Card padding="md" className="dark:glass">
                        <div className="mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trip Progress</span>
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{progress}%</span>
                            </div>
                            <ProgressBar progress={progress} variant={progress === 100 ? 'success' : 'default'} size="lg" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{trip.distance}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Distance</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{trip.duration}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">${trip.pricePerSeat}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Fare</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card padding="md" className="dark:glass">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">👤</span>
                            Your Driver
                        </h3>
                        <PassengerList driver={trip.driver} passengers={[]} />
                        <div className="mt-6 flex gap-3">
                            <Button variant="outline" fullWidth onClick={() => showToast('info', 'Calling driver...')}>Call Driver</Button>
                            <Button variant="primary" fullWidth className="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" onClick={() => showToast('info', 'Starting chat...')}>Message</Button>
                        </div>
                    </Card>

                    <Card padding="md" className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
                        <h3 className="text-red-600 dark:text-red-400 font-bold mb-2">Safety Tools</h3>
                        <p className="text-xs text-red-500 dark:text-red-500/70 mb-4">Quick access to safety features during your ride.</p>
                        <Button variant="danger" fullWidth onClick={() => setShowEmergency(true)} className="bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-500/30">
                            Emergency SOS
                        </Button>
                    </Card>
                </div>
            </div>

            <Modal isOpen={showEmergency} onClose={() => setShowEmergency(false)} title="Emergency SOS">
                <div className="p-4 text-center">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Emergency Services</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">This will instantly alert emergency services and our safety team with your live location.</p>
                    <div className="flex flex-col gap-3">
                        <Button variant="danger" fullWidth size="lg" className="bg-red-600 hover:bg-red-700 py-4 shadow-xl shadow-red-600/30" onClick={() => { showToast('warning', 'Emergency alert sent'); setShowEmergency(false); }}>
                            CONSENT & SEND ALERT
                        </Button>
                        <Button variant="outline" fullWidth onClick={() => setShowEmergency(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
