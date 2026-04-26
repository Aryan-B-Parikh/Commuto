'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { authAPI } from '@/services/api';
import { isValidPhone } from '@/utils/validators';

type Step = 'personal' | 'safety' | 'vehicle';

interface FormData {
    full_name: string;
    phone_number: string;
    gender: string;
    date_of_birth: string;
    bio: string;
    address: string;
    emergency_name: string;
    emergency_relationship: string;
    emergency_phone: string;
    // Driver-only
    license_number: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_plate: string;
    vehicle_capacity: number;
    vehicle_color: string;
}

const INITIAL_FORM: FormData = {
    full_name: '',
    phone_number: '',
    gender: '',
    date_of_birth: '',
    bio: '',
    address: '',
    emergency_name: '',
    emergency_relationship: '',
    emergency_phone: '',
    license_number: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_plate: '',
    vehicle_capacity: 4,
    vehicle_color: '',
};

export default function CompleteProfilePage() {
    const router = useRouter();
    const { user, role, refreshUser, isLoading: authLoading } = useAuth();
    const { showToast } = useToast() as any;

    const [currentStep, setCurrentStep] = useState<Step>('personal');
    const [form, setForm] = useState<FormData>(INITIAL_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [submitting, setSubmitting] = useState(false);

    const effectiveRole = user?.role || role;
    const isDriver = effectiveRole === 'driver';
    const steps: Step[] = isDriver ? ['personal', 'safety', 'vehicle'] : ['personal', 'safety'];
    const stepIndex = steps.indexOf(currentStep);
    const isLast = stepIndex === steps.length - 1;

    // Redirect or pre-fill if already complete or not logged in
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        if (effectiveRole === 'passenger') {
            router.push('/passenger/dashboard');
            return;
        }
        
        // Pre-fill fields from user object
        setForm(prev => ({
            ...prev,
            full_name: user.full_name || '',
            phone_number: user.phone_number || '',
            gender: user.gender || '',
            date_of_birth: user.date_of_birth || '',
            bio: user.bio || '',
            address: user.address || '',
            emergency_name: user.emergency_contact?.name || '',
            emergency_relationship: user.emergency_contact?.relationship || '',
            emergency_phone: user.emergency_contact?.phone || '',
            license_number: user.license_number || '',
            // ... vehicles are separate models, usually empty start
        }));

        if (user.profileCompleted) {
            const dest = effectiveRole === 'driver' ? '/driver/dashboard' : '/passenger/dashboard';
            router.push(dest);
        }
    }, [user, effectiveRole, authLoading, router]);

    const update = (key: keyof FormData, value: string | number) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const validateStep = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        if (currentStep === 'personal') {
            if (!form.full_name.trim()) newErrors.full_name = 'Full name is required';
            if (!form.phone_number.trim()) {
                newErrors.phone_number = 'Phone number is required';
            } else if (!isValidPhone(form.phone_number)) {
                newErrors.phone_number = 'Enter a valid Indian mobile number';
            }
            if (!form.gender) newErrors.gender = 'Please select your gender';
            if (!form.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
        }

        if (currentStep === 'safety') {
            if (!form.emergency_name.trim()) newErrors.emergency_name = 'Contact name is required';
            if (!form.emergency_phone.trim()) {
                newErrors.emergency_phone = 'Contact phone is required';
            } else if (!isValidPhone(form.emergency_phone)) {
                newErrors.emergency_phone = 'Enter a valid Indian mobile number';
            }
            if (!form.emergency_relationship.trim()) newErrors.emergency_relationship = 'Relationship is required';
        }

        if (currentStep === 'vehicle') {
            if (!form.license_number.trim()) newErrors.license_number = 'License number is required';
            if (!form.vehicle_make.trim()) newErrors.vehicle_make = 'Vehicle make is required';
            if (!form.vehicle_model.trim()) newErrors.vehicle_model = 'Vehicle model is required';
            if (!form.vehicle_plate.trim()) newErrors.vehicle_plate = 'Plate number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        const idx = steps.indexOf(currentStep);
        if (idx < steps.length - 1) setCurrentStep(steps[idx + 1]);
    };

    const handleBack = () => {
        const idx = steps.indexOf(currentStep);
        if (idx > 0) setCurrentStep(steps[idx - 1]);
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;
        setSubmitting(true);
        try {
            const payload: Record<string, any> = {
                full_name: form.full_name,
                phone_number: form.phone_number,
                gender: form.gender,
                date_of_birth: form.date_of_birth,
                emergency_contact: {
                    name: form.emergency_name,
                    relationship: form.emergency_relationship,
                    phone: form.emergency_phone,
                },
            };

            if (form.bio.trim()) payload.bio = form.bio;
            if (form.address.trim()) payload.address = form.address;

            if (isDriver) {
                payload.license_number = form.license_number;
                payload.vehicle_type = form.vehicle_make;
                payload.vehicle_model = form.vehicle_model;
                payload.vehicle_plate = form.vehicle_plate;
                payload.vehicle_capacity = form.vehicle_capacity;
                payload.vehicle_color = form.vehicle_color;
            }

            await authAPI.updateProfile(payload);
            if (refreshUser) await refreshUser();

            showToast('success', 'Profile completed! Welcome to Commuto.');
            const dest = effectiveRole === 'driver' ? '/driver/dashboard' : '/passenger/dashboard';
            router.push(dest);
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            showToast('error', typeof detail === 'string' ? detail : 'Failed to save profile. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = (hasError?: string) =>
        `w-full px-4 py-3 min-h-[48px] rounded-xl border bg-[#0B1020] text-[#F9FAFB] placeholder:text-[#6B7280] transition-all outline-none ${hasError ? 'border-red-500/50 ring-2 ring-red-500/10' : 'border-[#1E293B] hover:border-[#334155] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`;

    const labelClass = 'block text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-1.5';

    if (authLoading || !user) {
        return <div className="min-h-screen bg-[#0B1020]" />;
    }

    const stepTitles: Record<Step, { title: string; desc: string }> = {
        personal: {
            title: 'Personal Information',
            desc: 'Tell us a bit about yourself so other commuters can trust you.',
        },
        safety: {
            title: 'Emergency Contact',
            desc: 'Add a safety contact in case of emergencies during trips.',
        },
        vehicle: {
            title: 'Auto-Rickshaw & License',
            desc: 'Add your auto-rickshaw details so passengers know what to expect.',
        },
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1020] px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-8">
                    {/* Progress */}
                    <div className="flex items-center gap-2 mb-8">
                        {steps.map((s, i) => (
                            <React.Fragment key={s}>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                        i <= stepIndex
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-[#1E293B] text-[#6B7280]'
                                    }`}
                                >
                                    {i < stepIndex ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        i + 1
                                    )}
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 rounded-full transition-all ${i < stepIndex ? 'bg-indigo-500' : 'bg-[#1E293B]'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-[#F9FAFB] mb-1">
                            {stepTitles[currentStep].title}
                        </h1>
                        <p className="text-[#9CA3AF] text-sm">
                            {stepTitles[currentStep].desc}
                        </p>
                    </div>

                    {/* Steps */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-5"
                        >
                            {currentStep === 'personal' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Full Name *</label>
                                            <input
                                                type="text"
                                                value={form.full_name}
                                                onChange={(e) => update('full_name', e.target.value)}
                                                placeholder="John Doe"
                                                className={inputClass(errors.full_name)}
                                            />
                                            {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name}</p>}
                                        </div>
                                        <div>
                                            <label className={labelClass}>Phone Number *</label>
                                            <input
                                                type="tel"
                                                value={form.phone_number}
                                                onChange={(e) => update('phone_number', e.target.value)}
                                                placeholder="+91 9876543210"
                                                className={inputClass(errors.phone_number)}
                                            />
                                            {errors.phone_number && <p className="mt-1 text-xs text-red-400">{errors.phone_number}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Gender *</label>
                                            <select
                                                value={form.gender}
                                                onChange={(e) => update('gender', e.target.value)}
                                                className={inputClass(errors.gender)}
                                            >
                                                <option value="">Select gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                                <option value="prefer-not-to-say">Prefer not to say</option>
                                            </select>
                                            {errors.gender && <p className="mt-1 text-xs text-red-400">{errors.gender}</p>}
                                        </div>
                                        <div>
                                            <label className={labelClass}>Date of Birth *</label>
                                            <input
                                                type="date"
                                                value={form.date_of_birth}
                                                onChange={(e) => update('date_of_birth', e.target.value)}
                                                className={inputClass(errors.date_of_birth)}
                                            />
                                            {errors.date_of_birth && <p className="mt-1 text-xs text-red-400">{errors.date_of_birth}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Address <span className="text-[#6B7280] normal-case">(optional)</span></label>
                                        <input
                                            type="text"
                                            value={form.address}
                                            onChange={(e) => update('address', e.target.value)}
                                            placeholder="Your home address"
                                            className={inputClass()}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Bio <span className="text-[#6B7280] normal-case">(optional)</span></label>
                                        <textarea
                                            value={form.bio}
                                            onChange={(e) => update('bio', e.target.value)}
                                            placeholder="Tell commuters about yourself..."
                                            rows={3}
                                            className={`${inputClass()} resize-none`}
                                        />
                                    </div>
                                </>
                            )}

                            {currentStep === 'safety' && (
                                <>
                                    <div>
                                        <label className={labelClass}>Contact Name *</label>
                                        <input
                                            type="text"
                                            value={form.emergency_name}
                                            onChange={(e) => update('emergency_name', e.target.value)}
                                            placeholder="e.g. Mom, Dad, Partner"
                                            className={inputClass(errors.emergency_name)}
                                        />
                                        {errors.emergency_name && <p className="mt-1 text-xs text-red-400">{errors.emergency_name}</p>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Relationship *</label>
                                        <input
                                            type="text"
                                            value={form.emergency_relationship}
                                            onChange={(e) => update('emergency_relationship', e.target.value)}
                                            placeholder="e.g. Parent, Spouse, Friend"
                                            className={inputClass(errors.emergency_relationship)}
                                        />
                                        {errors.emergency_relationship && <p className="mt-1 text-xs text-red-400">{errors.emergency_relationship}</p>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone Number *</label>
                                        <input
                                            type="tel"
                                            inputMode="tel"
                                            value={form.emergency_phone}
                                            onChange={(e) => update('emergency_phone', e.target.value)}
                                            placeholder="+91 9876543210"
                                            className={inputClass(errors.emergency_phone)}
                                        />
                                        {errors.emergency_phone && <p className="mt-1 text-xs text-red-400">{errors.emergency_phone}</p>}
                                    </div>
                                </>
                            )}

                            {currentStep === 'vehicle' && (
                                <>
                                    <div>
                                        <label className={labelClass}>License Number *</label>
                                        <input
                                            type="text"
                                            value={form.license_number}
                                            onChange={(e) => update('license_number', e.target.value)}
                                            placeholder="DL-1234567890"
                                            className={inputClass(errors.license_number)}
                                        />
                                        {errors.license_number && <p className="mt-1 text-xs text-red-400">{errors.license_number}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Rickshaw Make *</label>
                                            <input
                                                type="text"
                                                value={form.vehicle_make}
                                                onChange={(e) => update('vehicle_make', e.target.value)}
                                                placeholder="e.g. Bajaj, TVS, Piaggio"
                                                className={inputClass(errors.vehicle_make)}
                                            />
                                            {errors.vehicle_make && <p className="mt-1 text-xs text-red-400">{errors.vehicle_make}</p>}
                                        </div>
                                        <div>
                                            <label className={labelClass}>Model *</label>
                                            <input
                                                type="text"
                                                value={form.vehicle_model}
                                                onChange={(e) => update('vehicle_model', e.target.value)}
                                                placeholder="e.g. Swift, City"
                                                className={inputClass(errors.vehicle_model)}
                                            />
                                            {errors.vehicle_model && <p className="mt-1 text-xs text-red-400">{errors.vehicle_model}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Plate Number *</label>
                                            <input
                                                type="text"
                                                value={form.vehicle_plate}
                                                onChange={(e) => update('vehicle_plate', e.target.value)}
                                                placeholder="GJ-01-XX-1234"
                                                className={inputClass(errors.vehicle_plate)}
                                            />
                                            {errors.vehicle_plate && <p className="mt-1 text-xs text-red-400">{errors.vehicle_plate}</p>}
                                        </div>
                                        <div>
                                            <label className={labelClass}>Color <span className="text-[#6B7280] normal-case">(optional)</span></label>
                                            <input
                                                type="text"
                                                value={form.vehicle_color}
                                                onChange={(e) => update('vehicle_color', e.target.value)}
                                                placeholder="e.g. White, Silver"
                                                className={inputClass()}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Rikshaw Capacity</label>
                                        <select
                                            value={form.vehicle_capacity}
                                            onChange={(e) => update('vehicle_capacity', parseInt(e.target.value))}
                                            className={inputClass()}
                                        >
                                            {[1, 2, 3, 4].map((n) => (
                                                <option key={n} value={n}>{n} seats</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 mt-8">
                        {stepIndex > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                className="h-12 flex-1 rounded-xl border-[#1E293B] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#334155]"
                            >
                                Back
                            </Button>
                        )}

                        {!isLast ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                className="h-12 flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                            >
                                Continue
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                isLoading={submitting}
                                className="h-12 flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-500/20"
                            >
                                Complete Profile
                            </Button>
                        )}
                    </div>

                    {/* Step label */}
                    <p className="text-center text-xs text-[#6B7280] mt-6 font-medium">
                        Step {stepIndex + 1} of {steps.length}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
