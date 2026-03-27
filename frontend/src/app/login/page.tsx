'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { isValidEmail } from '@/utils/validators';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const router = useRouter();
    const { login, googleLogin, isLoading, role } = useAuth() as any;
    const { showToast } = useToast() as any;

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
            // Always redirect to role selection as requested by user
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
        <div className="min-h-screen flex relative bg-background overflow-hidden selection:bg-indigo-500/30">
            {/* Sophisticated Background Treatment */}
            <div className="absolute inset-0 z-0">
                {/* Animated Grid */}
                <div className="absolute inset-x-0 -top-[10%] h-[1000px] w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" />

                {/* Radial Glows */}
                <div className="absolute top-0 -left-[10%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 -right-[10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
            </div>

            {/* Main Panel - Form Card with Glassmorphism */}
            <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10 lg:w-1/2">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-[440px]"
                >
                    <div className="bg-card/40 dark:bg-card/20 backdrop-blur-xl border border-card-border/50 rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/5 dark:shadow-black/20">
                        {/* Logo */}
                        <div className="flex flex-col items-center mb-10">
                            <Link href="/" className="group relative">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <svg className="w-8 h-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </motion.div>
                            </Link>
                            <h1 className="mt-6 text-2xl font-bold text-foreground tracking-tight">Welcome back</h1>
                            <p className="text-muted-foreground mt-2 text-center text-sm">
                                Enter your credentials to access your dashboard
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-semibold text-foreground/80 flex justify-between">
                                    Email Address
                                </label>
                                <div className="group relative">
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`w-full px-4 py-3.5 rounded-2xl border bg-background/50 text-foreground placeholder:text-muted-foreground/40 transition-all outline-none ring-offset-background group-hover:bg-background/80 focus:bg-background ${errors.email ? 'border-red-500/50 focus:ring-4 focus:ring-red-500/10' : 'border-card-border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                                        placeholder="name@company.com"
                                    />
                                    {errors.email && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-2 text-xs font-medium text-red-500"
                                        >
                                            {errors.email}
                                        </motion.p>
                                    )}
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <label htmlFor="password" className="font-semibold text-foreground/80">
                                        Password
                                    </label>
                                    <Link href="/forgot-password" title="Recover your password" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline decoration-2 underline-offset-4 decoration-indigo-500/30 transition-all">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="group relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`w-full px-4 py-3.5 pr-14 rounded-2xl border bg-background/50 text-foreground placeholder:text-muted-foreground/40 transition-all outline-none ring-offset-background group-hover:bg-background/80 focus:bg-background ${errors.password ? 'border-red-500/50 focus:ring-4 focus:ring-red-500/10' : 'border-card-border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-all"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                    {errors.password && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-2 text-xs font-medium text-red-500"
                                        >
                                            {errors.password}
                                        </motion.p>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                isLoading={isLoading}
                                className="h-[54px] rounded-2xl shadow-xl shadow-indigo-500/20 text-base font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all"
                            >
                                Continue to Dashboard
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-10">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-card-border/60" />
                            </div>
                            <div className="relative flex justify-center text-xs font-semibold tracking-widest uppercase">
                                <span className="px-5 bg-card/10 dark:bg-card/5 backdrop-blur-md text-muted-foreground/60">Social Login</span>
                            </div>
                        </div>

                        {/* Social Login - Refined with Glass effect */}
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    onClick={() => googleLoginAction()}
                                    fullWidth
                                    variant="outline"
                                    className="h-[54px] rounded-2xl shadow-sm hover:bg-muted/50 transition-all text-base font-semibold gap-3 border-card-border"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Continue with Google
                                </Button>
                            </div>
                        </div>

                        {/* Footer Link */}
                        <p className="mt-10 text-center text-sm text-muted-foreground font-medium">
                            First time here?{' '}
                            <Link href="/select-role" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-2 underline-offset-4 decoration-indigo-500/30 transition-all">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right Panel - Premium Interactive Layout */}
            <div className="hidden lg:block lg:w-1/2 relative bg-[#0F172A] overflow-hidden">
                {/* Dynamic Background Pattern */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4F46E5_0%,transparent_50%)]" />
                    <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.8))]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                </div>

                {/* Floating Elements / UI Preview */}
                <div className="absolute inset-0 flex items-center justify-center p-20">
                    <div className="relative w-full max-w-lg">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="relative z-10"
                        >
                            <h2 className="text-5xl font-extrabold text-white leading-tight tracking-tight mb-8">
                                The smartest way to{' '}
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400">
                                    Commute
                                </span>
                            </h2>
                            <p className="text-xl text-slate-400 leading-relaxed max-w-md mb-12">
                                Join our community of verified riders and drivers. Save money, reduce emissions, and enjoy a better journey.
                            </p>

                            {/* Decorative Stats or Tags */}
                            <div className="flex flex-wrap gap-4">
                                {['Verified Users', 'Real-time Tracking', 'Safe Payments'].map((tag, i) => (
                                    <motion.span
                                        key={tag}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.6 + (i * 0.1) }}
                                        className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold backdrop-blur-md"
                                    >
                                        {tag}
                                    </motion.span>
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
                            className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px]"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, -5, 0],
                            }}
                            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-40 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"
                        />
                    </div>
                </div>

                {/* Subtle Grid in right panel */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>
        </div>
    );
}
