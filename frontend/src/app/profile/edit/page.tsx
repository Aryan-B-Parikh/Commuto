"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditProfileForm } from '../../../components/profile/EditProfileForm';
import { UserProfile, Gender } from '../../../types/profile';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
    const { user, role, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [currentData, setCurrentData] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user || !role) {
            router.push('/login');
            return;
        }

        // Map User to UserProfile
        const profileData: UserProfile = {
            id: user.id,
            fullName: user.name,
            email: user.email,
            phone: user.phone || '',
            avatar: user.avatar || '',
            role: role as 'passenger' | 'driver',
            gender: 'prefer-not-to-say' as Gender, // Default
            dateOfBirth: '',
            bio: '',
            address: '',
            emergencyContact: {
                name: '',
                relationship: '',
                phone: ''
            },
            // Initialize empty preference/driver fields
            preferences: {
                smoking: false,
                pets: false,
                music: false,
                chat: false
            },
            driverDetails: role === 'driver' ? {
                licenseNumber: '',
                vehicle: {
                    make: '',
                    model: '',
                    plateNumber: '',
                    color: '',
                    year: 2020
                },
                experience: 0,
                documents: {
                    license: true,
                    insurance: true,
                    registration: true
                }
            } : undefined
        };

        setCurrentData(profileData);
        setLoading(false);

    }, [user, role, authLoading, router]);

    const handleSave = async (newData: UserProfile) => {
        console.log('Saving profile data:', newData);
        // TODO: Call API to update profile
        // await authAPI.updateProfile(newData);
        setCurrentData(newData);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 px-4 pt-4 pb-20">
            <div className="max-w-2xl mx-auto mb-8">
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => window.history.back()}
                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:text-blue-600 shadow-sm transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                <section className="mb-8">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Profile</h2>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${role === 'driver' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                            {role}
                        </span>
                    </div>
                    <p className="text-slate-500 mt-2">Manage your {role} account details and preferences.</p>
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
                                <div className="w-32 h-32 rounded-full bg-slate-200 animate-pulse" />
                                <div className="h-6 w-40 bg-slate-200 rounded-lg mt-4 animate-pulse mx-auto" />
                                <div className="h-4 w-24 bg-slate-100 rounded-lg mt-2 animate-pulse mx-auto" />
                            </div>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                                    <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                                        <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
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
                            <EditProfileForm initialData={currentData} onSave={handleSave} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
