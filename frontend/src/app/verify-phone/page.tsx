'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { authAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyPhonePage() {
    const router = useRouter();
    const { showToast } = useToast() as any;
    const { user } = useAuth() as any;

    const [otp, setOtp] = useState('');
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [devOtp, setDevOtp] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    const resolvePostVerifyRoute = async () => {
        const currentUser = await authAPI.getCurrentUser();
        const normalizedRole = currentUser?.role === 'driver' ? 'driver' : 'passenger';

        if (normalizedRole === 'driver' && !currentUser?.profile_completed) {
            return '/complete-profile';
        }

        return `/${normalizedRole}/dashboard`;
    };

    // Countdown for resend cooldown
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    // Auto-send OTP on mount
    useEffect(() => {
        handleSendOtp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSendOtp = async () => {
        setSending(true);
        setDevOtp(null);
        try {
            const res = await authAPI.sendPhoneVerification();
            if (res.dev_otp) {
                setDevOtp(res.dev_otp);
                showToast('info', 'Dev mode: OTP shown below (Twilio not configured)');
            } else {
                showToast('success', 'OTP sent to your phone!');
            }
            setCooldown(60); // 60s cooldown before resend
        } catch (err: any) {
            showToast('error', err?.response?.data?.detail ?? 'Could not send OTP. Are you logged in?');
        } finally {
            setSending(false);
        }
    };

    const handleVerify = async () => {
        if (otp.trim().length !== 6) {
            setErrorMsg('Please enter the 6-digit OTP.');
            return;
        }
        setStatus('verifying');
        setErrorMsg('');
        try {
            await authAPI.verifyPhone(otp.trim());
            setStatus('success');
            const nextRoute = await resolvePostVerifyRoute();
            showToast('success', 'Phone verified successfully.');
            setTimeout(() => {
                router.push(nextRoute);
            }, 2000);
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err?.response?.data?.detail ?? 'Incorrect OTP. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1020] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-2xl p-8"
            >
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    {status === 'success' ? (
                        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    )}
                </div>

                {status === 'success' ? (
                    <>
                        <h1 className="text-2xl font-bold text-[#F9FAFB] text-center mb-2">Phone Verified!</h1>
                        <p className="text-[#9CA3AF] text-center">Your phone is verified. Now complete your profile…</p>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-[#F9FAFB] text-center mb-2">Verify your phone</h2>
                        <p className="text-[#9CA3AF] text-center mb-6">
                            We sent a 6-digit OTP to{' '}
                            <span className="text-[#F9FAFB] font-semibold">
                                {user?.phone_number ?? 'your phone number'}
                            </span>.
                            Enter it below.
                        </p>

                        {/* Dev mode: show OTP */}
                        {devOtp && (
                            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
                                <p className="text-amber-400 font-semibold mb-1">Dev mode — Twilio not configured</p>
                                <p className="text-[#9CA3AF]">
                                    OTP:{' '}
                                    <span
                                        className="text-[#F9FAFB] font-mono text-lg tracking-widest cursor-pointer select-all"
                                        onClick={() => { setOtp(devOtp); setErrorMsg(''); }}
                                        title="Click to auto-fill"
                                    >
                                        {devOtp}
                                    </span>
                                    <span className="text-xs text-indigo-400 ml-2">(click to fill)</span>
                                </p>
                            </div>
                        )}

                        {/* OTP input — single large field for the 6-digit code */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5">
                                6-digit OTP
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(val);
                                    setErrorMsg('');
                                    setStatus('idle');
                                }}
                                placeholder="000000"
                                className="w-full px-4 py-3 rounded-xl border border-[#1E293B] bg-[#0B1020] text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-center text-2xl tracking-[0.4em]"
                            />
                            {errorMsg && (
                                <p className="mt-1.5 text-sm text-red-400">{errorMsg}</p>
                            )}
                        </div>

                        <Button
                            fullWidth
                            size="lg"
                            isLoading={status === 'verifying'}
                            onClick={handleVerify}
                            disabled={otp.trim().length !== 6 || status === 'verifying'}
                        >
                            Verify Phone
                        </Button>

                        <div className="mt-4 text-center">
                            <p className="text-[#6B7280] text-sm">
                                Didn&apos;t receive the SMS?{' '}
                                {cooldown > 0 ? (
                                    <span className="text-[#6B7280]">Resend in {cooldown}s</span>
                                ) : (
                                    <button
                                        onClick={handleSendOtp}
                                        disabled={sending}
                                        className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50"
                                    >
                                        {sending ? 'Sending…' : 'Resend OTP'}
                                    </button>
                                )}
                            </p>
                        </div>
                    </>
                )}

                <div className="mt-6 text-center">
                    <Link
                        href="/dashboard"
                        className="text-sm text-[#6B7280] hover:text-[#9CA3AF]"
                    >
                        Skip for now →
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
