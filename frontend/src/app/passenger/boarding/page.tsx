'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { OTPInput } from '@/components/ui/OTPInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCountdown } from '@/hooks/useCountdown';
import { useToast } from '@/hooks/useToast';
import { tripsAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function BoardingPage() {
    const router = useRouter();
    const { showToast } = useToast() as any;
    const { seconds, start, formattedTime } = useCountdown();
    const { user } = useAuth();

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActiveTrip = async () => {
            try {
                if (!user) return;
                
                // Fetch the user's active trip that needs boarding
                const trips = await tripsAPI.getMyTrips();
                const activeTrip = trips.find(trip => 
                    trip.status === 'accepted' && 
                    trip.driver && 
                    trip.otp && 
                    !trip.hasStarted
                );
                
                setTrip(activeTrip);
                if (activeTrip) {
                    start(300); // 5 minute countdown
                }
            } catch (err) {
                console.error('Failed to fetch active trip:', err);
                setError('Failed to load trip information.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchActiveTrip();
    }, [user, start]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
                <Card className="text-center py-12">
                    <h3 className="font-semibold text-gray-900 mb-2">Loading Trip Information</h3>
                    <p className="text-gray-500 mb-6">Please wait while we fetch your trip details...</p>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
                <Card className="text-center py-12">
                    <h3 className="font-semibold text-red-500 mb-2">⚠️ Error</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <Button size="sm" variant="primary" onClick={() => window.location.reload()}>Retry</Button>
                </Card>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
                <Card className="text-center py-12">
                    <h3 className="font-semibold text-gray-900 mb-2">No Active Trip</h3>
                    <p className="text-gray-500 mb-6">You don't have an active trip to board.</p>
                    <Link href="/passenger/dashboard" className="text-blue-600 hover:underline">Go to Dashboard</Link>
                </Card>
            </div>
        );
    }

    useEffect(() => {
        start(300); // 5 minute countdown
    }, [start]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError('Please enter the complete OTP');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            // Call the real API to verify OTP
            const response = await tripsAPI.verifyTripOTP(trip.id, otp);
            
            if (response.success) {
                setIsVerified(true);
                showToast('success', 'Boarding verified! Have a safe trip.');
                setTimeout(() => {
                    router.push('/passenger/live');
                }, 2500);
            } else {
                setError(response.message || 'Invalid OTP. Please try again.');
                setIsVerifying(false);
            }
        } catch (err) {
            console.error('OTP verification failed:', err);
            setError('Failed to verify OTP. Please check your connection and try again.');
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col">
            {/* Header */}
            <div className="p-4">
                <Link
                    href="/passenger/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    {!isVerified ? (
                        <motion.div
                            key="otp-form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-md"
                        >
                            <Card variant="elevated" className="text-center">
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>

                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Boarding Verification</h1>
                                <p className="text-gray-600 mb-6">
                                    Ask the driver for the 6-digit OTP to verify your boarding
                                </p>

                                {/* Trip Info */}
                                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                                    <div className="flex items-center gap-3 mb-3">
                                        <img
                                            src={trip.driver.avatar}
                                            alt={trip.driver.name}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{trip.driver.name}</p>
                                            <p className="text-sm text-gray-500">{trip.vehicleType} • {trip.vehicleNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        <span>{trip.from.name} → {trip.to.name}</span>
                                    </div>
                                </div>

                                {/* OTP Input */}
                                <div className="mb-6">
                                    <OTPInput
                                        value={otp}
                                        onChange={setOtp}
                                        error={!!error}
                                        disabled={isVerifying}
                                    />
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-2 text-sm text-red-500"
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Countdown */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-gray-500">
                                            Time remaining: <span className="font-semibold text-gray-900">{formattedTime}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Verify Button */}
                                <Button
                                    onClick={handleVerify}
                                    fullWidth
                                    size="lg"
                                    isLoading={isVerifying}
                                    disabled={otp.length !== 6}
                                >
                                    Verify & Start Trip
                                </Button>

                                {/* Security Note */}
                                <div className="mt-6 flex items-start gap-3 p-4 bg-yellow-50 rounded-xl text-left">
                                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">Safety First</p>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            Verify the vehicle details and driver before boarding. Only share the OTP when you&apos;re safely in the vehicle.
                                        </p>
                                    </div>
                                </div>

                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md"
                        >
                            <Card variant="elevated" className="text-center py-12">
                                {/* Success Animation */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                    className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
                                >
                                    <motion.svg
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ delay: 0.2, duration: 0.5 }}
                                        className="w-12 h-12 text-green-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <motion.path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </motion.svg>
                                </motion.div>

                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Boarding Verified!</h2>
                                <p className="text-gray-600 mb-6">
                                    Have a safe and enjoyable trip
                                </p>

                                {/* Loading dots */}
                                <div className="flex justify-center gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ y: [0, -8, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                            className="w-2 h-2 bg-blue-500 rounded-full"
                                        />
                                    ))}
                                </div>
                                <p className="mt-4 text-sm text-gray-500">Starting live trip tracking...</p>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
