'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RatingStars } from '@/components/ui/RatingStars';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { tripsAPI } from '@/services/api';
import { transformTripResponses } from '@/utils/tripTransformers';
import { formatCurrency } from '@/utils/formatters';
import type { Trip } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function ProfilePage() {
    const { user, logout, role, isLoading: authLoading } = useAuth();
    const { showToast } = useToast() as any;
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoadingTrips, setIsLoadingTrips] = useState(true);

    useEffect(() => {
        if (user) {
            loadTrips();
        }
    }, [user]);

    const loadTrips = async () => {
        try {
            const data = await tripsAPI.getMyTrips();
            setTrips(transformTripResponses(data));
        } catch (error) {
            console.error('Failed to load trips:', error);
        } finally {
            setIsLoadingTrips(false);
        }
    };

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
    }

    const completedTrips = trips.filter(t => t.status === 'completed');
    const tripHistory = completedTrips.slice(0, 5);
    const totalSpent = completedTrips.reduce((acc, t) => acc + (t.pricePerSeat || 0), 0);
    const co2Reduced = (completedTrips.length * 2.5).toFixed(1) + 'kg';
    const userRating = typeof user.rating === 'number' ? user.rating : 0;
    const hasUserRating = userRating > 0;

    const handleLogout = () => {
        logout();
        showToast('success', 'Logged out successfully');
        window.location.href = '/';
    };

    const menuItems = [
        { icon: '👤', label: 'Edit Profile', href: '/profile/edit' },
        { icon: '🔔', label: 'Notifications', href: '#' },
        { icon: '🔒', label: 'Privacy & Security', href: '#' },
        {
            icon: '💳',
            label: 'Payment Methods',
            href: role === 'passenger' ? '/passenger/wallet' : '#'
        },
        { icon: '🎫', label: 'My Vouchers', href: '#' },
        { icon: '📄', label: 'Terms of Service', href: '#' },
    ];

    return (
        <DashboardLayout userType={role as any} title="Personal Profile">
            {/* Wrap everything in a container with padding and max-width */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 lg:pb-12 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Profile Identity Card */}
                    <div className="space-y-6">
                        <Card className="relative overflow-hidden text-center border-none shadow-sm pb-8 px-4 lg:px-6">
                            {/* Role-based Banner */}
                            <div className={`absolute top-0 left-0 w-full h-24 ${role === 'driver' ? 'bg-gradient-to-r from-indigo-500 to-blue-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                }`} />

                            <div className="relative pt-12 mb-4">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-24 h-24 rounded-3xl mx-auto border-4 border-card-border shadow-xl object-cover relative z-10"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-3xl mx-auto border-4 border-card-border shadow-xl bg-muted flex items-center justify-center text-muted-foreground text-3xl font-bold relative z-10">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                            </div>

                            <div className="px-6 relative z-10 mt-4 flex flex-col items-center">
                                <h2 className="text-2xl font-black text-foreground leading-none mb-1 text-center">{user.name}</h2>
                                <p className="text-sm font-bold text-muted-foreground mb-4 text-center">{user.email}</p>

                                <div className="flex flex-wrap items-center justify-center gap-2 py-2 px-4 bg-muted rounded-full w-fit mx-auto border border-card-border">
                                    <span className="text-sm font-black text-orange-500">{hasUserRating ? userRating.toFixed(1) : '—'}</span>
                                    {hasUserRating ? (
                                        <RatingStars rating={userRating} size="sm" />
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No ratings yet</span>
                                    )}
                                    <span className="text-xs text-muted-foreground font-bold ml-1">• {user.totalTrips || 0} rides</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8 px-6">
                                <Button
                                    variant="outline"
                                    className="h-12 border-card-border font-bold text-xs uppercase tracking-widest"
                                    onClick={() => setShowLogoutModal(true)}
                                >
                                    Sign Out
                                </Button>
                                <Link href="/profile/edit" className="block">
                                    <Button variant="primary" className="h-12 w-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                                        Settings
                                    </Button>
                                </Link>
                            </div>
                        </Card>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4 text-center border-none shadow-sm">
                                <p className="text-2xl font-black text-blue-600">{completedTrips.length}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rides</p>
                            </Card>
                            <Card className="p-4 text-center border-none shadow-sm">
                                <p className="text-2xl font-black text-indigo-600">{formatCurrency(totalSpent)}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Saved</p>
                            </Card>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Settings Menu */}
                        <Card className="border-none shadow-sm">
                            <h3 className="text-lg font-bold text-foreground mb-6">Account Settings</h3>

                            <div className="mb-6">
                                <ThemeToggle />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-foreground text-sm">{item.label}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium">Manage your {item.label.toLowerCase()}</p>
                                        </div>
                                        <svg className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                ))}
                            </div>
                        </Card>

                        {/* Security Tip Card */}
                        <div className="bg-indigo-950 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform">🛡️</div>
                                <div>
                                    <h4 className="font-black text-xl mb-1 italic tracking-tighter">SECURE YOUR ACCOUNT</h4>
                                    <p className="text-sm text-gray-400 leading-snug">Enable two-factor authentication to add an extra layer of security to your profile and earnings.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Logout Modal */}
            <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Log Out">
                <div className="flex flex-col items-center py-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-3xl mb-6">👋</div>
                    <p className="text-muted-foreground mb-8 text-center font-medium">Are you sure you want to end your session?</p>
                    <div className="flex gap-4 w-full">
                        <Button variant="outline" fullWidth onClick={() => setShowLogoutModal(false)} className="h-12 font-bold uppercase tracking-widest">Stay Here</Button>
                        <Button variant="danger" fullWidth onClick={handleLogout} className="h-12 font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 text-white bg-red-600 border-none">Log Out</Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
