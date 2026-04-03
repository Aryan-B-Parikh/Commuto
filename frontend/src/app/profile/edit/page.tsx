"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditProfileForm } from '../../../components/profile/EditProfileForm';
import { UserProfile, Gender } from '../../../types/profile';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { authAPI, paymentMethodsAPI } from '@/services/api';
import { PaymentMethod } from '../../../types/profile';


export default function EditProfilePage() {
    const { user, role, refreshUser, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [currentData, setCurrentData] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user || !role) {
            router.push('/login');
            return;
        }

        const loadData = async () => {
            try {
                // Fetch fresh user data from backend
                const userData = await authAPI.getCurrentUser();
                const methods = await paymentMethodsAPI.getMethods();

                // Map backend user data to UserProfile
                const profileData = {
                    id: userData.id || '',
                    fullName: userData.full_name || '',
                    email: userData.email || '',
                    phone: userData.phone_number || '',
                    avatar: userData.avatar_url || '',
                    role: role as 'passenger' | 'driver',
                    gender: userData.gender as Gender || 'prefer-not-to-say' as Gender,
                    dateOfBirth: userData.date_of_birth || '',
                    bio: userData.bio || '',
                    address: userData.address || '',
                    emergencyContact: userData.emergency_contact ? {
                        name: userData.emergency_contact.name || '',
                        relationship: userData.emergency_contact.relationship || '',
                        phone: userData.emergency_contact.phone || ''
                    } : { name: '', relationship: '', phone: '' },
                    preferences: {
                        maxPassengers: userData.max_passengers || 3,
                        routeRadius: userData.route_radius || 10,
                        isAvailable: userData.is_online || false
                    },
                    vehicle: role === 'driver' ? {
                        type: userData.vehicle_type || 'Auto-Rickshaw',
                        model: userData.vehicle_model || '',
                        plateNumber: userData.vehicle_plate || '',
                        color: userData.vehicle_color || '',
                        seatCapacity: userData.vehicle_capacity || 3
                    } : undefined,
                    documents: role === 'driver' ? {
                        licenseNumber: userData.license_number || '',
                        insuranceStatus: userData.insurance_status || 'active',
                        registrationUrl: '',
                        licensePhotoUrl: userData.license_photo_url || ''
                    } : undefined,
                    // Passenger specific fields
                    savedPlaces: [],
                    paymentMethods: methods.map((m: any) => ({
                        id: m.id,
                        type: m.type as 'card' | 'wallet' | 'upi',
                        provider: m.provider,
                        last4: m.last4,
                        isDefault: m.is_default
                    })),
                    travelPreferences: userData.travel_preferences || [],
                    preferredPickupLocations: [],
                    accessibilityNeeds: userData.accessibility_needs || false
                };

                setCurrentData(profileData as any);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load payment methods:', err);
                setLoading(false);
            }
        };

        loadData();
    }, [user, role, authLoading, router]);

    const handleSave = async (newData: UserProfile) => {
        try {
            const payload: Record<string, any> = {
                full_name: newData.fullName,
                phone_number: newData.phone,
                avatar_url: newData.avatar,
                gender: newData.gender,
                date_of_birth: newData.dateOfBirth,
                bio: newData.bio,
                address: newData.address,
                emergency_contact: {
                    name: newData.emergencyContact.name,
                    relationship: newData.emergencyContact.relationship,
                    phone: newData.emergencyContact.phone,
                },
            };

            if (newData.role === 'driver' && newData.vehicle) {
                payload.vehicle_type = newData.vehicle.type;
                payload.vehicle_model = newData.vehicle.model;
                payload.vehicle_plate = newData.vehicle.plateNumber;
                payload.vehicle_color = newData.vehicle.color;
                payload.vehicle_capacity = newData.vehicle.seatCapacity;
                payload.license_number = (newData as any).documents?.licenseNumber;
                payload.license_photo_url = (newData as any).documents?.licensePhotoUrl;
                payload.max_passengers = newData.preferences?.maxPassengers;
                payload.route_radius = newData.preferences?.routeRadius;
                payload.is_available = newData.preferences?.isAvailable;
            }

            await authAPI.updateProfile(payload);
            if (refreshUser) await refreshUser();
            setCurrentData(newData);
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        }
    };



    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background px-4 pt-4 pb-20">
            <div className="max-w-2xl mx-auto mb-8">
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => window.history.back()}
                        className="p-3 bg-card border border-card-border rounded-2xl text-muted-foreground hover:text-indigo-600 shadow-sm transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                <section className="mb-8">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Edit Profile</h2>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${role === 'driver' ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                            {role}
                        </span>
                    </div>
                    <p className="text-muted-foreground mt-2">Manage your {role} account details and preferences.</p>
                </section>

                <AnimatePresence mode="wait">
                    {loading || !currentData ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-32 h-32 rounded-full bg-muted animate-pulse" />
                                <div className="h-6 w-40 bg-muted rounded-lg mt-4 animate-pulse mx-auto" />
                                <div className="h-4 w-24 bg-muted rounded-lg mt-2 animate-pulse mx-auto" />
                            </div>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-card rounded-2xl border border-card-border p-6 space-y-4">
                                    <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-12 bg-muted rounded-xl animate-pulse" />
                                        <div className="h-12 bg-muted rounded-xl animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={role}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        >
                            <EditProfileForm initialData={currentData!} onSave={handleSave} />
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
