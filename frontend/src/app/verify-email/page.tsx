'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { authAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast() as any;

    const [token, setToken] = useState('');
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [resending, setResending] = useState(false);
    const [devToken, setDevToken] = useState<string | null>(null);
    const [devUrl, setDevUrl] = useState<string | null>(null);

    // If token is in the URL query param, auto-fill and verify
    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
            handleVerify(urlToken);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleVerify = async (t?: string) => {
        const tokenToUse = t ?? token;
        if (!tokenToUse.trim()) return;
        setStatus('verifying');
        setErrorMsg('');
        try {
            await authAPI.verifyEmail(tokenToUse.trim());
            setStatus('success');
            showToast('success', 'Email verified! Now verify your phone number…');
            setTimeout(() => router.push('/verify-phone'), 2000);
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err?.response?.data?.detail ?? 'Verification failed. The token may have expired.');
        }
    };

    const handleResend = async () => {
        setResending(true);
        setDevToken(null);
        setDevUrl(null);
        try {
            const res = await authAPI.sendVerification();
            if (res.dev_token) {
                setDevToken(res.dev_token);
                setDevUrl(res.dev_verify_url ?? null);
                showToast('info', 'Dev mode: token shown below (no SMTP configured)');
            } else {
                showToast('success', 'Verification email resent — check your inbox!');
            }
        } catch (err: any) {
            showToast('error', err?.response?.data?.detail ?? 'Could not resend. Are you logged in?');
        } finally {
            setResending(false);
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    )}
                </div>

                {status === 'success' ? (
                    <>
                        <h1 className="text-2xl font-bold text-[#F9FAFB] text-center mb-2">Email Verified!</h1>
                        <p className="text-[#9CA3AF] text-center mb-6">Your email is confirmed. Next, verify your phone number.</p>
                        <Button fullWidth size="lg" onClick={() => router.push('/verify-phone')}>
                            Verify Phone Number →
                        </Button>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-[#F9FAFB] text-center mb-2">Verify your email</h2>
                        <p className="text-[#9CA3AF] text-center mb-6">
                            We sent a verification link to your email. Click it or paste the token below.
                        </p>

                        {/* Dev mode: show token + link */}
                        {devToken && (
                            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
                                <p className="text-amber-400 font-semibold mb-1">Dev mode — no SMTP configured</p>
                                <p className="text-[#9CA3AF] mb-1 break-all">Token: <span className="text-[#F9FAFB] font-mono">{devToken}</span></p>
                                {devUrl && (
                                    <a href={devUrl} className="text-indigo-400 underline text-xs break-all">{devUrl}</a>
                                )}
                            </div>
                        )}

                        {/* Token input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5">Verification token</label>
                            <input
                                type="text"
                                value={token}
                                onChange={(e) => { setToken(e.target.value); setErrorMsg(''); setStatus('idle'); }}
                                placeholder="Paste your verification token here"
                                className="w-full px-4 py-3 rounded-xl border border-[#1E293B] bg-[#0B1020] text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-sm"
                            />
                            {errorMsg && (
                                <p className="mt-1.5 text-sm text-red-400">{errorMsg}</p>
                            )}
                        </div>

                        <Button
                            fullWidth
                            size="lg"
                            isLoading={status === 'verifying'}
                            onClick={() => handleVerify()}
                            disabled={!token.trim() || status === 'verifying'}
                        >
                            Verify Email
                        </Button>

                        <div className="mt-4 text-center">
                            <p className="text-[#6B7280] text-sm">
                                Didn&apos;t receive anything?{' '}
                                <button
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50"
                                >
                                    {resending ? 'Sending…' : 'Resend verification'}
                                </button>
                            </p>
                        </div>
                    </>
                )}

                <div className="mt-6 text-center">
                    <Link href="/passenger/dashboard" className="text-sm text-[#6B7280] hover:text-[#9CA3AF]">
                        Skip for now →
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0B1020]" />}>
            <VerifyEmailContent />
        </Suspense>
    );
}
