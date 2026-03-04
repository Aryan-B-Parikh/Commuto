'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';

export default function SelectRolePage() {
    const router = useRouter();
    const { setRole, isAuthenticated } = useAuth() as any;

    const handleSelectRole = (role: 'driver' | 'passenger') => {
        setRole(role);
        if (isAuthenticated) {
            router.push(`/${role}/dashboard`);
        } else {
            router.push('/signup');
        }
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
            gradient: 'from-indigo-500 to-blue-600',
            glowColor: 'shadow-indigo-500/20',
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
            gradient: 'from-emerald-500 to-green-600',
            glowColor: 'shadow-emerald-500/20',
            features: ['Earn from your trips', 'Choose your passengers', 'Flexible schedule'],
        },
    ];

    return (
        <div className="min-h-screen flex relative bg-background overflow-hidden selection:bg-indigo-500/30">
            {/* Sophisticated Background Treatment */}
            <div className="absolute inset-0 z-0">
                {/* Animated Grid */}
                <div className="absolute inset-x-0 -top-[10%] h-[1000px] w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" />

                {/* Radial Glows */}
                <div className="absolute top-0 -left-[10%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 -right-[10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
            </div>

            <div className="flex-1 flex flex-col relative z-10 overflow-y-auto">
                {/* Header */}
                <div className="p-4">
                    <Link href="/" className="group inline-flex items-center gap-2">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <svg className="w-6 h-6 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </motion.div>
                        <span className="text-xl font-bold text-foreground tracking-tight">Commuto</span>
                    </Link>
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center p-4 pb-10">
                    <div className="w-full max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-8"
                        >
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
                                How will you use <span className="text-indigo-600 dark:text-indigo-400">Commuto?</span>
                            </h1>
                            <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto font-medium">
                                Choose your role to get started. You can always switch later from your profile.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                            {roles.map((role, index) => (
                                <motion.div
                                    key={role.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + (index * 0.1), duration: 0.5 }}
                                    whileHover={{ y: -8 }}
                                    className="relative group"
                                >
                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[32px] blur opacity-0 group-hover:opacity-20 transition duration-500" />

                                    <div className="relative h-full bg-card/40 dark:bg-card/20 backdrop-blur-xl border border-card-border/50 rounded-[28px] p-6 lg:p-8 shadow-2xl shadow-black/5 flex flex-col items-center text-center transition-all duration-300 group-hover:border-indigo-500/30">
                                        {/* Icon */}
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-4 text-white shadow-2xl ${role.glowColor} group-hover:scale-110 transition-transform duration-500`}>
                                            {role.icon}
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-1 tracking-tight">{role.title}</h2>
                                        <p className="text-indigo-500 dark:text-indigo-400 font-bold mb-2 text-sm tracking-wide uppercase">{role.subtitle}</p>
                                        <p className="text-muted-foreground font-medium mb-4 text-sm leading-relaxed">{role.description}</p>

                                        {/* Features */}
                                        <ul className="space-y-2 text-left w-full mb-6 flex-1">
                                            {role.features.map((feature) => (
                                                <li key={feature} className="flex items-center gap-3 text-foreground/70 font-medium text-sm">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSelectRole(role.id)}
                                            className={`w-full py-4 rounded-2xl font-bold text-base transition-all bg-gradient-to-r ${role.gradient} text-white shadow-xl ${role.glowColor} hover:shadow-2xl hover:brightness-110 active:scale-[0.98]`}
                                        >
                                            Continue as {role.title}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Login link */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-center mt-8 text-muted-foreground font-medium"
                        >
                            Already have an account?{' '}
                            <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-2 underline-offset-4 decoration-indigo-500/30 transition-all">
                                Sign in
                            </Link>
                        </motion.p>
                    </div>
                </div>
            </div>
        </div>
    );
}
