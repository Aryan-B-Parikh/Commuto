'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { PassengerList } from '@/components/trip/PassengerList';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { tripsAPI } from '@/services/api';
import { geocodeAddress } from '@/utils/geocoding';
import { prepareTripForBackend } from '@/utils/tripTransformers';
import { mockTrips } from '@/data/trips';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function PassengerLivePage() {
    const router = useRouter();
    const { showToast } = useToast() as any;
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        pickup: '',
        destination: '',
        date: '',
        time: '',
        passengers: '1',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Geocode addresses
            const fromResult = await geocodeAddress(formData.pickup);
            const toResult = await geocodeAddress(formData.destination);

            if (fromResult.status !== 'OK' || toResult.status !== 'OK') {
                const errorMsg = fromResult.error_message || toResult.error_message || 'Geocoding failed';
                const status = fromResult.status !== 'OK' ? fromResult.status : toResult.status;

                if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT') {
                    showToast('error', `Google Maps Error: ${errorMsg}. Please ensure the Geocoding API is enabled and billing is active.`);
                } else {
                    showToast('error', `Location Error: ${errorMsg}`);
                }
                setIsLoading(false);
                return;
            }

            const tripRequest = prepareTripForBackend(
                formData,
                fromResult.coordinates,
                toResult.coordinates
            );

            await tripsAPI.createTrip(tripRequest);
            showToast('success', 'Ride request created successfully!');
            router.push('/passenger/dashboard');
        } catch (error: any) {
            console.error('Failed to create trip:', error);
            const errorDetail = error.response?.data?.detail || error.message || 'Unknown error';
            showToast('error', `Failed to create ride request: ${errorDetail}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout userType="passenger" title="Request a Trip">
            <div className="max-w-2xl mx-auto space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Card padding="md" className="space-y-5 dark:glass">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pickup Location</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter pickup address"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-foreground"
                                        value={formData.pickup}
                                        onChange={e => setFormData({ ...formData, pickup: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Destination</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-500" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Where to?"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-foreground"
                                        value={formData.destination}
                                        onChange={e => setFormData({ ...formData, destination: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-black transition-all outline-none text-foreground"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-black transition-all outline-none text-foreground"
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card padding="md" className="space-y-4 dark:glass">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Number of Passengers</label>
                                <div className="flex gap-2">
                                    {['1', '2', '3', '4'].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, passengers: num })}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.passengers === num
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                : 'bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Additional Notes (Optional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Any specific requests?"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-black transition-all outline-none text-foreground"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </Card>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                size="lg"
                                isLoading={isLoading}
                                className="bg-emerald-500 hover:bg-emerald-600 h-14 shadow-lg shadow-emerald-500/30 text-lg font-bold"
                            >
                                Post Trip Request
                            </Button>
                            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
                                By posting, you agree to Commuto&apos;s Terms of Service. <br />
                                The system will automatically group you with nearby riders.
                            </p>
                        </div>
                    </form>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
