'use client';

import React from 'react';
import { motion } from 'framer-motion';

const safetyFeatures = [
    {
        title: 'Verified Users',
        description: 'All users undergo ID verification and phone verification before joining.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
        ),
    },
    {
        title: 'OTP Verification',
        description: 'Share a unique code with your driver to confirm you\'re in the right vehicle.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
    },
    {
        title: 'Live Tracking',
        description: 'Share your live location with trusted contacts throughout your journey.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
        ),
    },
    {
        title: 'Emergency Button',
        description: 'One-tap emergency alert that notifies your contacts and local authorities.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    },
];

const trustBadges = [
    { label: 'SOC 2 Certified', icon: '🔐' },
    { label: '256-bit Encryption', icon: '🛡️' },
    { label: 'GDPR Compliant', icon: '✓' },
    { label: '24/7 Support', icon: '📞' },
];

export const Safety: React.FC = () => {
    return (
        <section id="safety" className="py-20 lg:py-32 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Safety First</span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">
                            Your Safety is Our Top Priority
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            We&apos;ve built multiple layers of security and verification to ensure every ride is safe and trustworthy.
                        </p>

                        {/* Safety Features */}
                        <div className="grid sm:grid-cols-2 gap-6">
                            {safetyFeatures.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex gap-4"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                                        <p className="text-sm text-gray-600">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-3 mt-8">
                            {trustBadges.map((badge) => (
                                <div
                                    key={badge.label}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700"
                                >
                                    <span>{badge.icon}</span>
                                    <span>{badge.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Visual */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="relative">
                            {/* Shield Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-3xl transform rotate-3" />

                            <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                                {/* Security Animation */}
                                <div className="flex justify-center mb-8">
                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
                                    >
                                        <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </motion.div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">100%</p>
                                        <p className="text-sm text-gray-500">Users Verified</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">99.9%</p>
                                        <p className="text-sm text-gray-500">Safe Rides</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">24/7</p>
                                        <p className="text-sm text-gray-500">Support</p>
                                    </div>
                                </div>

                                {/* Recent Verification */}
                                <div className="mt-8 p-4 bg-green-50 rounded-xl flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">All safety checks passed</p>
                                        <p className="text-xs text-gray-500">Identity • Phone • Background verified</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
