"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, PassengerProfile, DriverProfile, Gender } from '../../types/profile';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { Select } from '../ui/Select';
import { ProfileImageUpload } from '../ui/ProfileImageUpload';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { PassengerProfileFields } from './PassengerProfileFields';
import { DriverProfileFields } from './DriverProfileFields';

interface EditProfileFormProps {
    initialData: UserProfile;
    onSave: (data: UserProfile) => Promise<void>;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({
    initialData,
    onSave,
}) => {
    const [formData, setFormData] = useState<UserProfile>(initialData);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) newErrors.email = "Invalid email format";
        if (formData.phone.length < 10) newErrors.phone = "Phone number is too short";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSharedChange = (updates: Partial<UserProfile>) => {
        setFormData((prev) => ({ ...prev, ...updates } as UserProfile));
        setIsDirty(true);
        // Clear error when user types
        const key = Object.keys(updates)[0];
        if (errors[key]) {
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs[key];
                return newErrs;
            });
        }
    };

    const handlePassengerChange = (updates: Partial<PassengerProfile>) => {
        if (formData.role === 'passenger') {
            setFormData({ ...formData, ...updates });
            setIsDirty(true);
        }
    };

    const handleDriverChange = (updates: Partial<DriverProfile>) => {
        if (formData.role === 'driver') {
            setFormData({ ...formData, ...updates });
            setIsDirty(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSaving(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        await onSave(formData);

        setIsSaving(false);
        setShowSuccess(true);
        setIsDirty(false);

        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto pb-32">
            {/* Header & Avatar */}
            <div className="mb-8 text-center bg-gradient-to-b from-blue-50/50 to-transparent pt-8 pb-4 rounded-3xl">
                <ProfileImageUpload
                    currentImageUrl={formData.avatar}
                    onImageChange={(url) => handleSharedChange({ avatar: url })}
                />
                <div className="mt-4 flex flex-col items-center">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-900">{formData.fullName}</h1>
                        <AnimatePresence>
                            {isDirty && !isSaving && !showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-full border border-amber-100"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Unsaved Changes</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">{formData.role === 'driver' ? 'Verified Driver' : 'Passenger'}</p>
                </div>
            </div>

            {/* Shared Section: Basic Info */}
            <CollapsibleSection
                title="Personal Information"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                }
            >
                <Input
                    label="Full Name"
                    value={formData.fullName}
                    onChange={(e) => handleSharedChange({ fullName: e.target.value })}
                    placeholder="e.g. John Doe"
                    error={errors.fullName}
                />
                <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleSharedChange({ email: e.target.value })}
                    placeholder="e.g. john@example.com"
                    error={errors.email}
                />
                <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleSharedChange({ phone: e.target.value })}
                    placeholder="e.g. +1 (555) 000-0000"
                    error={errors.phone}
                />
                <Select
                    label="Gender"
                    value={formData.gender}
                    options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                        { value: 'prefer-not-to-say', label: 'Prefer not to say' },
                    ]}
                    onChange={(val) => handleSharedChange({ gender: val as Gender })}
                />
                <Input
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleSharedChange({ dateOfBirth: e.target.value })}
                />
                <div className="md:col-span-2">
                    <TextArea
                        label="Short Bio"
                        value={formData.bio}
                        onChange={(e) => handleSharedChange({ bio: e.target.value })}
                        placeholder="Tell us a bit about yourself..."
                    />
                </div>
            </CollapsibleSection>

            {/* Shared Section: Address & Emergency */}
            <CollapsibleSection
                title="Contact & Safety"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                }
            >
                <div className="md:col-span-2">
                    <Input
                        label="Home Address"
                        value={formData.address}
                        onChange={(e) => handleSharedChange({ address: e.target.value })}
                        placeholder="Enter your full address"
                    />
                </div>
                <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-50">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Contact Name"
                            value={formData.emergencyContact.name}
                            onChange={(e) => handleSharedChange({ emergencyContact: { ...formData.emergencyContact, name: e.target.value } })}
                        />
                        <Input
                            label="Relationship"
                            value={formData.emergencyContact.relationship}
                            onChange={(e) => handleSharedChange({ emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })}
                        />
                        <Input
                            label="Phone Number"
                            value={formData.emergencyContact.phone}
                            onChange={(e) => handleSharedChange({ emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })}
                        />
                    </div>
                </div>
            </CollapsibleSection>

            {/* Role-Specific Sections */}
            {formData.role === 'passenger' && (
                <PassengerProfileFields data={formData} onChange={handlePassengerChange} />
            )}

            {formData.role === 'driver' && (
                <DriverProfileFields data={formData} onChange={handleDriverChange} />
            )}

            {/* Floating Save Button */}
            <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center pointer-events-none">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isSaving}
                    className={`
            pointer-events-auto h-16 px-10 rounded-full shadow-2xl flex items-center gap-3 font-bold text-lg transition-all
            ${showSuccess
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200/50'}
            disabled:opacity-70 disabled:cursor-not-allowed
          `}
                >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Saving Changes...</span>
                        </>
                    ) : showSuccess ? (
                        <>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Saved Successfully</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Save Profile</span>
                        </>
                    )}
                </motion.button>
            </div>

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-28 left-0 right-0 flex justify-center pointer-events-none"
                    >
                        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            Your profile has been updated successfully!
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
};
