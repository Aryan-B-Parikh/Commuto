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
import { tripsAPI, otpAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { Loader2 } from 'lucide-react';
import { normalizeRideStatus } from '@/utils/rideState';

export default function BoardingPage() {
    const router = useRouter();
    const { showToast } = useToast() as any;
    const { seconds, start, formattedTime } = useCountdown();

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [trip, setTrip] = useState<TripResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchActiveTrip = async () => {
            try {
                const myTrips = await tripsAPI.getMyTrips();
                const startedTrip = myTrips.find((t: TripResponse) => normalizeRideStatus(t.status) === 'started');
                if (startedTrip) {
                    router.replace('/passenger/live');
                    return;
                }

                const acceptedTrip = myTrips.find((t: TripResponse) => normalizeRideStatus(t.status) === 'accepted');
                if (acceptedTrip) {
                    setTrip(acceptedTrip);
                }
            } catch (error) {
                console.error('Failed to fetch active trip:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveTrip();
    }, []);

    useEffect(() => {
        if (trip) {
            start(300);
        }
    }, [trip, start]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError('Please enter the complete OTP');
            return;
        }

        if (!trip) return;

        setIsVerifying(true);
        setError('');

        try {
            await otpAPI.verifyOTP(trip.id, otp);
            setIsVerified(true);
            showToast('success', 'Boarding verified! Your ride is starting.');
            setTimeout(() => {
                router.push('/passenger/live');
            }, 2500);
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Invalid OTP. Please try again.';
            setError(msg);
            setIsVerifying(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0B1020] flex items-center justify-center p-4">
                <Loader2 size={32} className="animate-spin text-indigo-400" />
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="min-h-screen bg-[#0B1020] flex items-center justify-center p-4">
                <Card className="text-center py-12">
                    <h3 className="font-semibold text-[#F9FAFB] mb-2">No Active Trip</h3>
                    <p className="text-[#6B7280] mb-6">You don&apos;t have an active trip to board.</p>
                    <Link href="/passenger/dashboard" className="text-indigo-400 hover:underline">Go to Dashboard</Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B1020] flex flex-col">
            {/* Header */}
            <div className="p-4">
                <Link
                    href="/passenger/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E293B]/50 backdrop-blur-sm rounded-full text-[#F9FAFB] hover:bg-[#1E293B] transition-colors"
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
                                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>

                                <h1 className="text-2xl font-bold text-[#F9FAFB] mb-2">Boarding Verification</h1>
                                <p className="text-[#9CA3AF] mb-6">
                                    Ask the driver for the 6-digit OTP to verify your boarding
                                </p>

                                {/* Trip Info */}
                                <div className="bg-[#1E293B]/50 rounded-xl p-4 mb-6 text-left border border-[#1E293B]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-sm">
                                            {trip.driver_name ? trip.driver_name.charAt(0).toUpperCase() : 'D'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-[#F9FAFB]">{trip.driver_name || 'Driver'}</p>
                                            <p className="text-sm text-[#6B7280]">{trip.vehicle_details || 'Vehicle assigned'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        <span>{trip.origin_address} → {trip.dest_address}</span>
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
                                            className="mt-2 text-sm text-red-400"
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Countdown */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-[#6B7280]">
                                            Time remaining: <span className="font-semibold text-[#F9FAFB]">{formattedTime}</span>
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
                                <div className="mt-6 flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl text-left border border-amber-500/20">
                                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-amber-400">Safety First</p>
                                        <p className="text-xs text-amber-400/80 mt-1">
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
                                    className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6"
                                >
                                    <motion.svg
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ delay: 0.2, duration: 0.5 }}
                                        className="w-12 h-12 text-emerald-400"
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

                                <h2 className="text-2xl font-bold text-[#F9FAFB] mb-2">Boarding Verified!</h2>
                                <p className="text-[#9CA3AF] mb-6">
                                    Have a safe and enjoyable trip
                                </p>

                                {/* Loading dots */}
                                <div className="flex justify-center gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ y: [0, -8, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                            className="w-2 h-2 bg-indigo-500 rounded-full"
                                        />
                                    ))}
                                </div>
                                <p className="mt-4 text-sm text-[#6B7280]">Starting live trip tracking...</p>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
