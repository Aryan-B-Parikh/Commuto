'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { OTPInput } from '@/components/ui/OTPInput';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useCountdown } from '@/hooks/useCountdown';

export default function VerifyOTPPage() {
    const router = useRouter();
    const { verifyOTP, isLoading, pendingEmail, role } = useAuth() as any;
    const { showToast } = useToast() as any;
    const { seconds, isActive, start, formattedTime } = useCountdown();

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        // Start countdown on mount
        start(300); // 5 minutes
    }, [start]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        const success = await verifyOTP(otp);

        if (success) {
            setIsVerified(true);
            showToast('success', 'Verification successful!');
            setTimeout(() => {
                const targetDashboard = role === 'driver' ? '/driver/dashboard' : '/passenger/dashboard';
                router.push(targetDashboard);
            }, 2000);
        } else {
            setError('Invalid OTP. Please try again.');
            showToast('error', 'Invalid OTP code');
        }
    };

    const handleResend = () => {
        if (!isActive || seconds === 0) {
            // Simulate resending OTP
            start(300);
            setOtp('');
            setError('');
            showToast('info', 'New OTP sent to your email');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-white to-green-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                    {/* Logo */}
                    <Link href="/" className="inline-flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-900">Commuto</span>
                    </Link>

                    <AnimatePresence mode="wait">
                        {!isVerified ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>

                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h1>
                                <p className="text-gray-600 mb-2">
                                    We sent a verification code to
                                </p>
                                <p className="text-blue-600 font-medium mb-8">
                                    {pendingEmail || 'your email address'}
                                </p>

                                {/* OTP Input */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <OTPInput
                                        value={otp}
                                        onChange={setOtp}
                                        error={!!error}
                                        disabled={isLoading}
                                    />

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-500 text-sm"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    {/* Countdown */}
                                    <div className="text-sm text-gray-500">
                                        {seconds > 0 ? (
                                            <p>
                                                Code expires in <span className="font-medium text-gray-900">{formattedTime}</span>
                                            </p>
                                        ) : (
                                            <p className="text-red-500">Code expired</p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        fullWidth
                                        size="lg"
                                        isLoading={isLoading}
                                        disabled={otp.length !== 6}
                                    >
                                        Verify Email
                                    </Button>
                                </form>

                                {/* Resend */}
                                <div className="mt-6">
                                    <p className="text-sm text-gray-500">
                                        Didn&apos;t receive the code?{' '}
                                        <button
                                            onClick={handleResend}
                                            disabled={isActive && seconds > 0}
                                            className={`font-medium ${isActive && seconds > 0
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-blue-600 hover:text-blue-700'
                                                }`}
                                        >
                                            Resend
                                        </button>
                                    </p>
                                </div>

                                {/* Demo hint */}
                                <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-500">
                                        <span className="font-medium">Demo:</span> Use code <span className="font-mono font-bold text-blue-600">123456</span> to verify
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-8"
                            >
                                {/* Success Animation */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                    className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
                                >
                                    <motion.svg
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ delay: 0.2, duration: 0.5 }}
                                        className="w-10 h-10 text-green-600"
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

                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verified!</h2>
                                <p className="text-gray-600">
                                    Redirecting you to the dashboard...
                                </p>

                                {/* Loading dots */}
                                <div className="flex justify-center gap-1 mt-6">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ y: [0, -8, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                            className="w-2 h-2 bg-blue-500 rounded-full"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Back link */}
                <div className="text-center mt-6">
                    <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                        ← Back to login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
