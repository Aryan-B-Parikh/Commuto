'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { PassengerBottomNav } from '@/components/layout/PassengerBottomNav';
import { DriverBottomNav } from '@/components/layout/DriverBottomNav';
import { BottomNav } from '@/components/layout/BottomNav';
import { currentUser } from '@/data/users';
import { mockTrips } from '@/data/trips';
import { formatDate } from '@/utils/formatters';

export default function ProfilePage() {
    const { logout, role } = useAuth();
    const { showToast } = useToast() as any; // Cast as any to bypass IDE lint issues temporarily if path aliasing is failing
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const tripHistory = mockTrips.filter(t => t.status === 'completed').slice(0, 5);

    const handleLogout = () => {
        logout();
        showToast('success', 'Logged out successfully');
        window.location.href = '/';
    };

    const menuItems = [
        { icon: '👤', label: 'Edit Profile', href: '/profile/edit' },
        { icon: '🔔', label: 'Notifications', href: '#' },
        { icon: '🔒', label: 'Privacy & Security', href: '#' },
        { icon: '💳', label: 'Payment Methods', href: '#' },
        { icon: '🎫', label: 'My Vouchers', href: '#' },
        { icon: '❓', label: 'Help Center', href: '#' },
        { icon: '📄', label: 'Terms of Service', href: '#' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className={`text-white px-4 pt-6 pb-16 bg-gradient-to-br ${role === 'driver' ? 'from-green-500 to-green-600' : 'from-blue-500 to-blue-600'
                }`}>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-semibold">Profile</h1>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="px-4 -mt-12 max-w-xl mx-auto">
                {/* Profile Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card variant="elevated" className="mb-6 text-center">
                        <div className="relative -mt-12 mb-4">
                            <img
                                src={currentUser.avatar}
                                alt={currentUser.name}
                                className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg"
                            />
                            <span className="absolute bottom-0 right-1/2 translate-x-8 w-6 h-6 bg-green-500 border-2 border-white rounded-full" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
                        <p className="text-gray-500 text-sm mb-3">{currentUser.email}</p>
                        <div className="flex items-center justify-center gap-1 mb-4">
                            <RatingStars rating={currentUser.rating} size="sm" />
                            <span className="text-sm text-gray-600 ml-1">{currentUser.rating.toFixed(1)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-2xl font-bold text-blue-600">{currentUser.totalTrips}</p>
                                <p className="text-xs text-gray-500">Trips</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">$320</p>
                                <p className="text-xs text-gray-500">Saved</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-600">185kg</p>
                                <p className="text-xs text-gray-500">CO₂</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Trip History */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Recent Trips</h3>
                            <Link href="/find-trip" className="text-sm text-blue-600 font-medium">View all</Link>
                        </div>
                        <div className="space-y-3">
                            {tripHistory.map((trip) => (
                                <div key={trip.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{trip.to.name}</p>
                                        <p className="text-xs text-gray-500">{formatDate(trip.date)}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900">${trip.pricePerSeat}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>

                {/* Settings Menu */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <h3 className="font-semibold text-gray-900 mb-4">Settings</h3>
                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="text-gray-700">{item.label}</span>
                                    <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </Card>
                </motion.div>

                {/* App Version */}
                <p className="text-center text-xs text-gray-400 mt-6">Commuto v1.0.0</p>
            </div>

            {/* Logout Modal */}
            <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Log Out">
                <p className="text-gray-600 mb-6 text-center">Are you sure you want to log out?</p>
                <div className="flex gap-3">
                    <Button variant="outline" fullWidth onClick={() => setShowLogoutModal(false)}>Cancel</Button>
                    <Button variant="danger" fullWidth onClick={handleLogout}>Log Out</Button>
                </div>
            </Modal>

            {role === 'driver' ? <DriverBottomNav /> : <PassengerBottomNav />}
        </div>
    );
}
