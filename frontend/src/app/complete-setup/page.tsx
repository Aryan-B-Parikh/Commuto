'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { authAPI } from '@/services/api';
import { isValidPhone } from '@/utils/validators';
import { Phone, User2, Calendar } from 'lucide-react';

export default function CompleteSetupPage() {
    const router = useRouter();
    const { user, refreshUser, isLoading: authLoading } = useAuth();
    const { showToast } = useToast();

    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState('');
    const [errors, setErrors] = useState<{ phone?: string; gender?: string; dob?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        // If they already have all required info, send them to dashboard
        if (user.phone_number && user.gender && user.date_of_birth) {
            const dest = user.role === 'driver' ? '/driver/dashboard' : '/passenger/dashboard';
            router.push(dest);
        }
    }, [user, authLoading, router]);

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!phone) {
            newErrors.phone = 'Phone number is required';
        } else if (!isValidPhone(phone)) {
            newErrors.phone = 'Invalid Indian mobile number';
        }
        if (!gender) newErrors.gender = 'Gender is required';
        if (!dob) newErrors.dob = 'Date of birth is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await authAPI.updateProfile({
                phone_number: phone,
                gender,
                date_of_birth: dob
            });

            if (refreshUser) await refreshUser();
            showToast('success', 'Setup complete! Welcome to Commuto.');
            
            const dest = user?.role === 'driver' ? '/driver/dashboard' : '/passenger/dashboard';
            router.push(dest);
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'Failed to complete setup');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = (hasError?: string) =>
        `min-h-[54px] w-full rounded-2xl border bg-background/70 px-4 text-foreground outline-none transition-all placeholder:text-muted-foreground ${hasError ? 'border-danger focus:ring-4 focus:ring-danger/10' : 'border-card-border focus:border-primary focus:ring-4 focus:ring-[var(--ring)]'}`;

    if (authLoading || !user) return <div className="min-h-screen bg-background" />;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="rounded-[32px] border border-card-border bg-card p-8 shadow-[var(--shadow-card)]">
                    <div className="mb-8">
                        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            Final Step
                        </span>
                        <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Complete your setup</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Please provide these essential details to start using Commuto.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80">Phone Number</label>
                            <div className="relative">
                                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input 
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)} 
                                    className={`${inputClass(errors.phone)} pl-11`} 
                                    placeholder="9876543210" 
                                />
                            </div>
                            {errors.phone && <p className="text-xs text-danger">{errors.phone}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80">Gender</label>
                            <div className="relative">
                                <User2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <select 
                                    value={gender} 
                                    onChange={(e) => setGender(e.target.value)} 
                                    className={`${inputClass(errors.gender)} pl-11`}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                    <option value="prefer-not-to-say">Prefer not to say</option>
                                </select>
                            </div>
                            {errors.gender && <p className="text-xs text-danger">{errors.gender}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80">Date of Birth</label>
                            <div className="relative">
                                <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input 
                                    type="date" 
                                    value={dob} 
                                    onChange={(e) => setDob(e.target.value)} 
                                    className={`${inputClass(errors.dob)} pl-11`} 
                                />
                            </div>
                            {errors.dob && <p className="text-xs text-danger">{errors.dob}</p>}
                        </div>

                        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
                            Go to Dashboard
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
