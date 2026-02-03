'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapContainer } from '@/components/trip/MapContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatters';

export default function DriverCreatePage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        date: '',
        time: '',
        seats: 3,
        pricePerSeat: 12,
        vehicleType: 'sedan',
        vehicleNumber: '',
        notes: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        showToast('success', 'Trip published successfully!');
        router.push('/driver/dashboard');
    };

    const estimatedEarnings = formData.pricePerSeat * formData.seats;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/driver/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Create Trip</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                <MapContainer className="h-40 rounded-2xl overflow-hidden mb-6" showRoute={!!(formData.from && formData.to)} />

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Route */}
                    <Card>
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center pt-3">
                                <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100" />
                                <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                                <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup</label>
                                    <input type="text" name="from" value={formData.from} onChange={handleChange} placeholder="Enter pickup location" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Drop-off</label>
                                    <input type="text" name="to" value={formData.to} onChange={handleChange} placeholder="Enter destination" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white" required />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* DateTime */}
                    <Card>
                        <h3 className="font-semibold text-gray-900 mb-4">Schedule</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" name="date" value={formData.date} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50" required />
                            </div>
                        </div>
                    </Card>

                    {/* Seats & Price */}
                    <Card>
                        <h3 className="font-semibold text-gray-900 mb-4">Seats & Pricing</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-700">Available Seats</span>
                                <div className="flex items-center gap-4">
                                    <button type="button" onClick={() => setFormData(p => ({ ...p, seats: Math.max(1, p.seats - 1) }))} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                    </button>
                                    <span className="text-2xl font-bold w-8 text-center">{formData.seats}</span>
                                    <button type="button" onClick={() => setFormData(p => ({ ...p, seats: Math.min(4, p.seats + 1) }))} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Seat ($)</label>
                                <input type="number" name="pricePerSeat" value={formData.pricePerSeat} onChange={handleChange} min="1" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50" required />
                            </div>
                        </div>
                    </Card>

                    {/* Vehicle */}
                    <Card>
                        <h3 className="font-semibold text-gray-900 mb-4">Vehicle</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                                    <option value="sedan">Sedan</option>
                                    <option value="suv">SUV</option>
                                    <option value="hatchback">Hatchback</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plate #</label>
                                <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} placeholder="ABC 1234" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 uppercase" required />
                            </div>
                        </div>
                    </Card>

                    {/* Earnings Preview */}
                    {formData.from && formData.to && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="bg-green-50 border-green-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-700">Potential Earnings</p>
                                        <p className="text-xs text-green-600">{formData.seats} seats × {formatCurrency(formData.pricePerSeat)}</p>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(estimatedEarnings)}</p>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    <Button type="submit" fullWidth size="lg" isLoading={isLoading}>Publish Trip</Button>
                </form>
            </div>
        </div>
    );
}
