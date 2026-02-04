'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { tripsAPI } from '@/services/api';
import { prepareTripForBackend } from '@/utils/tripTransformers';
import { geocodeAddress } from '@/utils/geocoding';

export default function PassengerCreateTripPage() {
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
            // Geocode addresses to get coordinates
            const fromCoords = await geocodeAddress(formData.pickup);
            const toCoords = await geocodeAddress(formData.destination);

            // Create trip with backend API using transformer and real coordinates
            const tripData = prepareTripForBackend(formData, fromCoords, toCoords);
            await tripsAPI.createTrip(tripData);

            showToast('success', 'Trip request posted successfully!');
            router.push('/passenger/dashboard');
        } catch (error) {
            console.error('Failed to create trip:', error);
            showToast('error', 'Failed to post trip request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="bg-white px-4 py-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10">
                <Link href="/passenger/dashboard">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Request a Trip</h1>
            </div>

            <div className="p-4 max-w-lg mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Card padding="md" className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup Location</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter pickup address"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                        value={formData.pickup}
                                        onChange={e => setFormData({ ...formData, pickup: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Destination</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Where to?"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                        value={formData.destination}
                                        onChange={e => setFormData({ ...formData, destination: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition-all outline-none"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition-all outline-none"
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card padding="md" className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Passengers</label>
                                <div className="flex gap-2">
                                    {['1', '2', '3', '4'].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, passengers: num })}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.passengers === num
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500 ring-offset-2'
                                                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Notes (Optional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Any specific requests?"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition-all outline-none"
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
                                className="bg-blue-600 hover:bg-blue-700 h-14 shadow-xl shadow-blue-600/30"
                            >
                                Post Trip Request
                            </Button>
                            <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                                By posting, you agree to Commuto&apos;s Terms of Service. <br />
                                The system will automatically group you with nearby riders.
                            </p>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
