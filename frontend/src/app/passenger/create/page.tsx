'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RideForm } from '@/components/ride/RideForm';
import { useToast } from '@/hooks/useToast';
import { tripsAPI } from '@/services/api';
import { geocodeAddress } from '@/utils/geocoding';
import { prepareTripForBackend } from '@/utils/tripTransformers';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card } from '@/components/ui/Card';

export default function PassengerCreatePage() {
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
                showToast('error', `Location Error: ${errorMsg}`);
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
            if (error.response?.data) {
                console.error('API Error Response:', JSON.stringify(error.response.data, null, 2));
            }
            const errorDetail = error.response?.data?.detail || error.message || 'Unknown error';
            showToast('error', `Failed to create ride request: ${errorDetail}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <RoleGuard allowedRoles={['passenger']}>
            <DashboardLayout userType="passenger" title="Plan Your Commute">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Hero Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 italic tracking-tighter uppercase">Find Your Ride</h2>
                            <p className="text-gray-500 mt-1 font-medium">Enter your trip details to see available drivers.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">Live Network Active</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        {/* Form Column */}
                        <div className="space-y-6">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <Card className="border-none shadow-xl overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full" />
                                    <RideForm
                                        formData={formData}
                                        setFormData={setFormData}
                                        onSubmit={handleSubmit}
                                        isLoading={isLoading}
                                    />
                                </Card>
                            </motion.div>

                            <Card className="bg-indigo-50 border-indigo-100 py-4 px-6 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
                                    💡
                                </div>
                                <p className="text-sm text-indigo-700 font-medium leading-snug">
                                    <span className="font-bold block uppercase text-[10px] tracking-widest mb-0.5">Pro Tip</span>
                                    Booking 24 hours in advance increases your chances of finding a driver by 80%.
                                </p>
                            </Card>
                        </div>

                        {/* Visual Column */}
                        <div className="space-y-8 hidden lg:block">
                            <div className="relative h-[300px] rounded-3xl overflow-hidden shadow-2xl group border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500">
                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent z-10" />
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80')] bg-cover bg-center group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
                                    <p className="text-xs font-black uppercase tracking-widest mb-2 text-indigo-300">Sustainable Travel</p>
                                    <h4 className="text-2xl font-black italic tracking-tighter leading-tight">SHARE THE RIDE,<br />SAVE THE PLANET.</h4>
                                </div>
                            </div>

                            <Card className="">
                                <h4 className="font-bold text-foreground mb-4">Why Commuto?</h4>
                                <div className="space-y-3">
                                    {['Verified Drivers Only', 'Real-time GPS Tracking', 'Cashless Payments', 'Carbon Footprint Tracking'].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[10px] font-bold">✓</div>
                                            <span className="text-sm font-medium text-muted-foreground">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </RoleGuard>
    );
}
