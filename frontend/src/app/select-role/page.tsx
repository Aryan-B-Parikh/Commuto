'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';

export default function SelectRolePage() {
    const router = useRouter();
    const { setRole } = useAuth();

    const handleSelectRole = (role: 'driver' | 'passenger') => {
        setRole(role);
        router.push('/signup');
    };

    const roles = [
        {
            id: 'passenger' as const,
            title: 'Passenger',
            subtitle: 'Find rides & save money',
            description: 'Search for trips going your way, share costs with fellow commuters, and enjoy safe rides.',
            icon: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            color: 'blue',
            features: ['Find affordable rides', 'Split travel costs', 'Rate your experience'],
        },
        {
            id: 'driver' as const,
            title: 'Driver',
            subtitle: 'Offer rides & earn money',
            description: 'Share your daily commute, pick up passengers along the way, and offset your travel costs.',
            icon: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
            color: 'green',
            features: ['Earn from your trips', 'Choose your passengers', 'Flexible schedule'],
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
            {/* Header */}
            <div className="p-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-gray-900">Commuto</span>
                </Link>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                            How will you use Commuto?
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Choose your role to get started. You can always switch later.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {roles.map((role, index) => (
                            <motion.div
                                key={role.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.1 }}
                            >
                                <Card
                                    hoverable
                                    className={`border-2 border-transparent hover:border-${role.color}-500 transition-all duration-300`}
                                >
                                    <div className="text-center p-4">
                                        {/* Icon */}
                                        <div className={`w-20 h-20 rounded-2xl bg-${role.color}-100 flex items-center justify-center mx-auto mb-4 text-${role.color}-600`}>
                                            {role.icon}
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{role.title}</h2>
                                        <p className={`text-${role.color}-600 font-medium mb-3`}>{role.subtitle}</p>
                                        <p className="text-gray-500 text-sm mb-6">{role.description}</p>

                                        {/* Features */}
                                        <ul className="space-y-2 text-left">
                                            {role.features.map((feature) => (
                                                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                                                    <svg className={`w-5 h-5 text-${role.color}-500 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSelectRole(role.id)}
                                            className={`mt-6 w-full py-3 rounded-xl font-semibold transition-all ${role.id === 'passenger'
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                                }`}
                                        >
                                            Continue as {role.title}
                                        </motion.button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Login link */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-center mt-8 text-gray-600"
                    >
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 font-medium hover:underline">
                            Sign in
                        </Link>
                    </motion.p>
                </div>
            </div>
        </div>
    );
}
