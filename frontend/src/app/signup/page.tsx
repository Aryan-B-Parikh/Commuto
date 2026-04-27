'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, Phone, User2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { authStorage } from '@/utils/authStorage';
import { isValidEmail, isValidName, getPasswordStrength, isValidPhone } from '@/utils/validators';

const trustPoints = [
    'Cleaner onboarding with clear validation',
    'Role-aware setup for rider and driver journeys',
    'Safer payments and verified identity flows',
];

export default function SignupPage() {
    const router = useRouter();
    const { register, googleLogin, isLoading, role } = useAuth();
    const { showToast } = useToast();

    const getSelectedRole = (): 'driver' | 'passenger' | null => {
        if (role === 'driver' || role === 'passenger') {
            return role;
        }
        const persistedRole = authStorage.getRole();
        if (persistedRole) {
            return persistedRole;
        }
        return null;
    };

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
    const [gender, setGender] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; phone?: string; gender?: string; dob?: string; terms?: string }>({});

    const resolvePostAuthRoute = (signedInUser: any) => {
        const normalizedRole = signedInUser?.role === 'driver' ? 'driver' : 'passenger';
        if (signedInUser?.phone_number && signedInUser?.isPhoneVerified === false) {
            return '/verify-phone';
        }
        if (normalizedRole === 'driver' && !signedInUser?.profileCompleted) {
            return '/complete-profile';
        }
        return `/${normalizedRole}/dashboard`;
    };

    const passwordStrength = getPasswordStrength(password);
    const strengthStyles = {
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
        } else if (!isValidPhone(phone)) {
            newErrors.phone = 'Please enter a valid Indian mobile number';
        }

        if (!gender) {
            newErrors.gender = 'Gender is required';
        }

        if (!dateOfBirth) {
            newErrors.dob = 'Date of birth is required';
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

    const getApiErrorMessage = (error: unknown): string => {
        const apiError = error as { response?: { status?: number; data?: { detail?: unknown } }; message?: string };
        const status = apiError?.response?.status;
        const detail = apiError?.response?.data?.detail;
        if (status === 409) {
            return 'This email is already registered. Please log in or use a different email.';
        }
        if (Array.isArray(detail)) {
            return detail.map((d) => (typeof d === 'object' && d !== null && 'msg' in d ? String((d as { msg?: unknown }).msg) : String(d))).join(', ');
        }
        if (typeof detail === 'string' && detail.trim()) {
            return detail;
        }
        if (typeof apiError?.message === 'string' && apiError.message.trim()) {
            return apiError.message;
        }
        return 'Registration failed. Please try again.';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        if (!role) {
            showToast('error', 'Please select a role first');
            router.push('/select-role');
            return;
        }

        try {
            await register({
                email,
                password,
                full_name: name,
                phone: phone.replace(/\s+/g, ''),
                role: role as 'passenger' | 'driver',
                gender,
                date_of_birth: dateOfBirth,
            });

            showToast('success', 'Account created! Please verify your email.');
            router.push('/verify-email');
        } catch (error: unknown) {
            showToast('error', getApiErrorMessage(error));
        }
    };

    const googleLoginAction = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const selectedRole = getSelectedRole();
            if (!selectedRole) {
                showToast('error', 'Please select a role first');
                router.push('/select-role');
                return;
            }

            const user = await googleLogin(tokenResponse.access_token, selectedRole);
            if (user) {
                showToast('success', 'Signup successful with Google!');
                router.push('/verify-email');
            } else {
                showToast('error', 'Google signup failed. Please try again.');
            }
        },
        onError: () => showToast('error', 'Google Signup Failed'),
        prompt: 'select_account'
    });

    const inputClass = (hasError?: string) =>
        `min-h-[54px] w-full rounded-2xl border bg-background/70 px-4 text-foreground outline-none transition-all placeholder:text-muted-foreground ${hasError ? 'border-danger focus:ring-4 focus:ring-danger/10' : 'border-card-border focus:border-primary focus:ring-4 focus:ring-[var(--ring)]'}`;

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:flex-row lg:px-6">
                <div className="mb-6 flex items-center justify-between lg:hidden">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),#59b0ff)] text-white shadow-[0_14px_30px_rgba(47,128,255,0.24)]">
                            <ArrowRight className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-display text-lg font-bold text-foreground">Commuto</p>
                            <p className="text-xs text-muted-foreground">Set up your account</p>
                        </div>
                    </Link>
                    <ThemeToggle />
                </div>

                <div className="relative hidden overflow-hidden rounded-[36px] border border-card-border bg-[linear-gradient(160deg,#0f1f38,#08111f)] p-10 text-white shadow-[var(--shadow-soft)] lg:flex lg:w-[48%] lg:flex-col lg:justify-between">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(89,176,255,0.26),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_26%)]" />
                    <div className="relative z-10 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-white backdrop-blur-sm">
                                <ArrowRight className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-display text-xl font-bold">Commuto</p>
                                <p className="text-sm text-slate-300">Original UI, production-minded UX</p>
                            </div>
                        </Link>
                        <ThemeToggle />
                    </div>

                    <div className="relative z-10 space-y-7">
                        <div>
                            <span className="inline-flex rounded-full border border-white/12 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200">
                                Sign up as {role || 'commuter'}
                            </span>
                            <h1 className="mt-5 font-display text-5xl font-bold leading-tight">
                                Build your account once, then move through booking and payments faster.
                            </h1>
                            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
                                A better first-run experience means fewer drop-offs and a clearer path into ride search, live status, and wallet setup.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {trustPoints.map((point) => (
                                <div key={point} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/12 text-emerald-300">
                                        <Check className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-100">{point}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Why role-aware onboarding helps</p>
                        <p className="mt-3 text-sm leading-7 text-slate-100">
                            Riders can start searching sooner, and drivers can land directly inside route and earnings workflows without confusing cross-role detours.
                        </p>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="w-full max-w-2xl"
                    >
                        <div className="rounded-[32px] border border-card-border bg-card p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8 lg:p-10">
                            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                        Create account
                                    </span>
                                    <h2 className="font-display text-3xl font-bold text-foreground">Let&apos;s get you started</h2>
                                    <p className="max-w-md text-sm leading-6 text-muted-foreground">
                                        Fill in the essentials now. We&apos;ll keep the rest of the flow lightweight so you can move into the app quickly.
                                    </p>
                                </div>
                                {role && (
                                    <div className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${role === 'driver' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' : 'border-primary/25 bg-primary/10 text-primary'}`}>
                                        {role} journey
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground/80">Full name</label>
                                        <div className="relative">
                                            <User2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass(errors.name)} pl-11`} placeholder="Your full name" />
                                        </div>
                                        {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground/80">Phone</label>
                                        <div className="relative">
                                            <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass(errors.phone)} pl-11`} placeholder="9876543210" />
                                        </div>
                                        {errors.phone && <p className="text-xs text-danger">{errors.phone}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground/80">Gender</label>
                                        <select 
                                            value={gender} 
                                            onChange={(e) => setGender(e.target.value)} 
                                            className={inputClass(errors.gender)}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                            <option value="prefer-not-to-say">Prefer not to say</option>
                                        </select>
                                        {errors.gender && <p className="text-xs text-danger">{errors.gender}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground/80">Date of Birth</label>
                                        <input 
                                            type="date" 
                                            value={dateOfBirth} 
                                            onChange={(e) => setDateOfBirth(e.target.value)} 
                                            className={inputClass(errors.dob)} 
                                        />
                                        {errors.dob && <p className="text-xs text-danger">{errors.dob}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80">Email</label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <input value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass(errors.email)} pl-11`} placeholder="you@example.com" />
                                    </div>
                                    {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80">Password</label>
                                    <div className="relative">
                                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`${inputClass(errors.password)} pl-11 pr-12`}
                                            placeholder="At least 8 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {password && (
                                        <div className="rounded-2xl border border-card-border bg-background/55 p-3">
                                            <div className="mb-2 flex gap-2">
                                                <div className={`h-1.5 flex-1 rounded-full ${password.length > 0 ? strengthStyles[passwordStrength] : 'bg-card-border'}`} />
                                                <div className={`h-1.5 flex-1 rounded-full ${password.length >= 6 ? strengthStyles[passwordStrength] : 'bg-card-border'}`} />
                                                <div className={`h-1.5 flex-1 rounded-full ${passwordStrength === 'strong' ? strengthStyles[passwordStrength] : 'bg-card-border'}`} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Password strength: <span className="font-semibold capitalize text-foreground">{passwordStrength}</span>
                                            </p>
                                        </div>
                                    )}
                                    {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
                                </div>

                                <div className="space-y-2 rounded-2xl border border-card-border bg-background/55 p-4">
                                    <label className="flex items-start gap-3 text-sm text-muted-foreground">
                                        <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-card-border bg-card text-primary focus:ring-primary" />
                                        <span>
                                            I agree to the{' '}
                                            <Link href="/terms" className="font-semibold text-primary hover:underline">Terms</Link>
                                            {' '}and{' '}
                                            <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
                                        </span>
                                    </label>
                                    {errors.terms && <p className="text-xs text-danger">{errors.terms}</p>}
                                </div>

                                <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                                    Create account
                                </Button>
                            </form>

                            <div className="my-6 flex items-center gap-3">
                                <div className="h-px flex-1 bg-card-border" />
                                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">or</span>
                                <div className="h-px flex-1 bg-card-border" />
                            </div>

                            <Button type="button" onClick={() => googleLoginAction()} fullWidth variant="outline" className="gap-3">
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Continue with Google
                            </Button>

                            <p className="mt-6 text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
