'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { isValidEmail, isValidName, getPasswordStrength } from '@/utils/validators';
import { authAPI } from '@/services/api';
import { useGoogleLogin } from '@react-oauth/google';

export default function SignupPage() {
    const router = useRouter();
    const { register, googleLogin, isLoading, role } = useAuth() as any;
    const { showToast } = useToast() as any;

    // Redirect if no role selected
    useEffect(() => {
        if (!role && !isLoading) {
            showToast('info', 'Please select a role first');
            router.push('/select-role');
        }
    }, [role, isLoading, router, showToast]);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; phone?: string; terms?: string }>({});

    const passwordStrength = getPasswordStrength(password);
    const strengthColors = {
        weak: 'bg-red-500',
        medium: 'bg-amber-500',
        strong: 'bg-emerald-500',
    };

    const validate = () => {
        const newErrors: typeof errors = {};

        if (!name) {
            newErrors.name = 'Name is required';
        } else if (!isValidName(name)) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!phone) {
            newErrors.phone = 'Phone number is required';
        } else if (phone.length < 10) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!agreeTerms) {
            newErrors.terms = 'You must agree to the terms';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        if (!role) {
            showToast('error', 'Please select a role first (from /select-role)');
            router.push('/select-role');
            return;
        }

        const loggedInUser = await register({
            email,
            password,
            full_name: name,
            phone,
            role: role as 'passenger' | 'driver',
        });

        if (loggedInUser) {
            showToast('success', 'Account created! Please verify your email.');
            // Trigger verification email (non-blocking)
            try {
                await authAPI.sendVerification();
            } catch (_) {
                // best-effort; user can resend on the verify page
            }
            router.push('/verify-email');
        } else {
            showToast('error', 'Registration failed. Please try again.');
        }
    };

    const googleLoginAction = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const user = await googleLogin(tokenResponse.access_token, role || undefined);
            if (user) {
                showToast('success', 'Signup successful with Google!');
                const finalRole = user.role || role;
                if (finalRole) {
                    router.push(`/${finalRole}/dashboard`);
                } else {
                    router.push('/select-role');
                }
            } else {
                showToast('error', 'Google signup failed. Please try again.');
            }
        },
        onError: () => showToast('error', 'Google Signup Failed'),
        prompt: 'select_account'
    });

    const inputClass = (hasError?: string) =>
        `w-full px-4 py-3 min-h-[48px] rounded-xl border bg-card text-foreground placeholder:text-muted-foreground/60 transition-all outline-none ${hasError ? 'border-red-500/50 ring-2 ring-red-500/10' : 'border-card-border hover:border-card-border/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`;

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

            {/* Left Panel - Premium Interactive Layout (Desktop only) */}
            <div className="hidden lg:block lg:w-1/2 relative bg-[#0F172A] overflow-hidden">
                {/* Dynamic Background Pattern */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4F46E5_0%,transparent_50%)]" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.8))]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center p-20">
                    <div className="relative w-full max-w-lg">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="relative z-10"
                        >
                            <h2 className="text-5xl font-extrabold text-white leading-tight tracking-tight mb-8">
                                Start your journey with{' '}
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400">
                                    Commuto
                                </span>
                            </h2>
                            <p className="text-xl text-slate-400 leading-relaxed max-w-md mb-12">
                                Join thousands of verified commuters. Fast, safe, and environmentally friendly.
                            </p>

                            <div className="space-y-6">
                                {[
                                    'Save up to 60% on commute costs',
                                    'Verified users for safe travels',
                                    'Reduce your carbon footprint',
                                    'Make new connections',
                                ].map((feature, index) => (
                                    <motion.div
                                        key={feature}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + (index * 0.1) }}
                                        className="flex items-center gap-4 group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all duration-300 backdrop-blur-md">
                                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-slate-300 font-medium">{feature}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Background Shapes */}
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, 0],
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px]"
                        />
                    </div>
                </div>

                {/* Subtle Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            {/* Right Panel - Form Card with Glassmorphism */}
            <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-[480px] my-auto"
                >
                    <div className="bg-card/40 dark:bg-card/20 backdrop-blur-xl border border-card-border/50 rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/5 dark:shadow-black/20">
                        {/* Logo */}
                        <div className="flex flex-col items-center mb-8">
                            <Link href="/" className="group">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <svg className="w-6 h-6 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </motion.div>
                            </Link>

                            {role && (
                                <div className={`mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 ${role === 'driver' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    Signing up as <span className="capitalize">{role}</span>
                                </div>
                            )}

                            <h1 className="mt-4 text-2xl font-bold text-foreground tracking-tight">Create your account</h1>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="name" className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">Full Name</label>
                                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass(errors.name)} placeholder="John Doe" />
                                    {errors.name && <p className="text-[10px] font-bold text-red-500 pl-1">{errors.name}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="phone" className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">Phone</label>
                                    <input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass(errors.phone)} placeholder="+1 234..." />
                                    {errors.phone && <p className="text-[10px] font-bold text-red-500 pl-1">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">Email Address</label>
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass(errors.email)} placeholder="you@example.com" />
                                {errors.email && <p className="text-[10px] font-bold text-red-500 pl-1">{errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="password" className="text-xs font-bold text-foreground/60 uppercase tracking-widest pl-1">Password</label>
                                <div className="relative group">
                                    <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass(errors.password)} pr-12`} placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide" : "Show"} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted transition-all">
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                                {password && (
                                    <div className="mt-2.5 px-1">
                                        <div className="flex gap-1.5 mb-2">
                                            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${password.length > 0 ? strengthColors[passwordStrength] : 'bg-card-border/40'}`} />
                                            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${password.length >= 6 ? strengthColors[passwordStrength] : 'bg-card-border/40'}`} />
                                            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${passwordStrength === 'strong' ? strengthColors[passwordStrength] : 'bg-card-border/40'}`} />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                            Strength: <span className={`${strengthColors[passwordStrength].replace('bg-', 'text-')} transition-colors`}>{passwordStrength}</span>
                                        </p>
                                    </div>
                                )}
                                {errors.password && <p className="text-[10px] font-bold text-red-500 pl-1">{errors.password}</p>}
                            </div>

                            <div className="pt-2">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center h-5">
                                        <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="w-4 h-4 rounded border-card-border/60 bg-background/50 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-background transition-all" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium leading-tight group-hover:text-foreground/80 transition-colors">
                                        I agree to the{' '}
                                        <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-1 underline-offset-2">Terms</Link>
                                        {' '}and{' '}
                                        <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-1 underline-offset-2">Privacy Policy</Link>
                                    </span>
                                </label>
                                {errors.terms && <p className="mt-1 text-[10px] font-bold text-red-500 pl-1">{errors.terms}</p>}
                            </div>

                            <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="h-12 rounded-2xl shadow-xl shadow-indigo-500/20 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all">
                                Create My Account
                            </Button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-card-border/60" /></div>
                            <div className="relative flex justify-center text-[10px] font-bold tracking-[0.2em] uppercase">
                                <span className="px-5 bg-card/10 backdrop-blur-md text-muted-foreground/50">Or register with</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    onClick={() => googleLoginAction()}
                                    fullWidth
                                    variant="outline"
                                    className="h-12 rounded-2xl shadow-sm hover:bg-muted/50 transition-all font-semibold gap-3 border-card-border"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Continue with Google
                                </Button>
                            </div>
                        </div>

                        <p className="mt-8 text-center text-sm text-muted-foreground font-medium">
                            Already share rides?{' '}
                            <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-2 underline-offset-4 decoration-indigo-500/30 transition-all">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
