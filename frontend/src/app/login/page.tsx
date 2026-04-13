'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { ArrowRight, Eye, EyeOff, Mail, LockKeyhole, ShieldCheck, Route, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { isValidEmail } from '@/utils/validators';

const featureHighlights = [
    { icon: <Route className="h-4 w-4" />, label: 'Faster booking with fewer steps' },
    { icon: <ShieldCheck className="h-4 w-4" />, label: 'Verified riders and trusted trips' },
    { icon: <Wallet className="h-4 w-4" />, label: 'Secure wallet and ride payments' },
];

export default function LoginPage() {
    const router = useRouter();
    const { login, googleLogin, isLoading, role } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: typeof errors = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const loggedInUser = await login(email, password);

        if (loggedInUser) {
            showToast('success', 'Login successful!');
            router.push('/select-role');
        } else {
            showToast('error', 'Invalid email or password. Please try again.');
        }
    };

    const googleLoginAction = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const user = await googleLogin(tokenResponse.access_token, role || undefined);
            if (user) {
                showToast('success', 'Login successful with Google!');
                if (user.role) {
                    router.push(`/${user.role}/dashboard`);
                } else {
                    router.push('/select-role');
                }
            } else {
                showToast('error', 'Google login failed. Please try again.');
            }
        },
        onError: () => showToast('error', 'Google Login Failed'),
        prompt: 'select_account'
    });

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:flex-row lg:items-stretch lg:px-6">
                <div className="mb-6 flex items-center justify-between lg:hidden">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),#59b0ff)] text-white shadow-[0_14px_30px_rgba(47,128,255,0.24)]">
                            <ArrowRight className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-display text-lg font-bold text-foreground">Commuto</p>
                            <p className="text-xs text-muted-foreground">Smart ride sharing</p>
                        </div>
                    </Link>
                    <ThemeToggle />
                </div>

                <div className="relative hidden overflow-hidden rounded-[36px] border border-card-border bg-[linear-gradient(160deg,#0f1f38,#08111f)] p-10 text-white shadow-[var(--shadow-soft)] lg:flex lg:w-[52%] lg:flex-col lg:justify-between">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(89,176,255,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_26%)]" />
                    <div className="relative z-10 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-white backdrop-blur-sm">
                                <ArrowRight className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-display text-xl font-bold">Commuto</p>
                                <p className="text-sm text-slate-300">Designed for confident daily travel</p>
                            </div>
                        </Link>
                        <ThemeToggle />
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div className="space-y-5">
                            <span className="inline-flex rounded-full border border-white/12 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200">
                                Passenger-first experience
                            </span>
                            <h1 className="max-w-xl font-display text-5xl font-bold leading-tight">
                                Sign in and get from pickup to payment with less friction.
                            </h1>
                            <p className="max-w-lg text-lg leading-8 text-slate-300">
                                Your trips, wallet, live ride status, and booking history now sit inside one cleaner flow built for mobile and desktop.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {featureHighlights.map((item) => (
                                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-sky-200">
                                        {item.icon}
                                    </div>
                                    <p className="text-sm font-medium text-slate-100">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-300">Today at a glance</p>
                                <p className="mt-1 text-2xl font-semibold">18 active rides nearby</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Average pickup</p>
                                <p className="mt-1 text-lg font-semibold">4 min</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="w-full max-w-xl"
                    >
                        <div className="rounded-[32px] border border-card-border bg-card p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8 lg:p-10">
                            <div className="mb-8 space-y-3">
                                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                    Welcome back
                                </span>
                                <h2 className="font-display text-3xl font-bold text-foreground">Sign in to continue</h2>
                                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                                    Resume your booking flow, manage saved payment methods, and track live trips from one place.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-semibold text-foreground/80">Email</label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={`min-h-[54px] w-full rounded-2xl border bg-background/70 pl-11 pr-4 text-foreground outline-none transition-all placeholder:text-muted-foreground ${errors.email ? 'border-danger focus:ring-4 focus:ring-danger/10' : 'border-card-border focus:border-primary focus:ring-4 focus:ring-[var(--ring)]'}`}
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                    {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="password" className="text-sm font-semibold text-foreground/80">Password</label>
                                        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`min-h-[54px] w-full rounded-2xl border bg-background/70 pl-11 pr-12 text-foreground outline-none transition-all placeholder:text-muted-foreground ${errors.password ? 'border-danger focus:ring-4 focus:ring-danger/10' : 'border-card-border focus:border-primary focus:ring-4 focus:ring-[var(--ring)]'}`}
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
                                </div>

                                <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="mt-2">
                                    Continue to dashboard
                                </Button>
                            </form>

                            <div className="my-6 flex items-center gap-3">
                                <div className="h-px flex-1 bg-card-border" />
                                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">or</span>
                                <div className="h-px flex-1 bg-card-border" />
                            </div>

                            <Button
                                type="button"
                                onClick={() => googleLoginAction()}
                                fullWidth
                                variant="outline"
                                className="gap-3"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Continue with Google
                            </Button>

                            <p className="mt-6 text-center text-sm text-muted-foreground">
                                New to Commuto?{' '}
                                <Link href="/select-role" className="font-semibold text-primary hover:underline">
                                    Create your account
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
