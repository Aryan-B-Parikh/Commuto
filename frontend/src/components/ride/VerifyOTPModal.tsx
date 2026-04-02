"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VerifyOTPModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (otp: string) => Promise<void>;
    isVerifying: boolean;
}

export function VerifyOTPModal({ isOpen, onClose, onVerify, isVerifying }: VerifyOTPModalProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    useEffect(() => {
        if (isOpen) {
            setOtp(['', '', '', '', '', '']);
            setTimeout(() => inputRefs[0].current?.focus(), 100);
        }
    }, [isOpen]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullOtp = otp.join('');
        if (fullOtp.length === 6) {
            try {
                await onVerify(fullOtp);
            } catch (err: any) {
                // Error handling is actually done in DriverLivePage, 
                // but we can add UI local states here if needed.
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="relative w-full max-w-md bg-[#111827] rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#1E293B] shadow-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#F9FAFB]">Verify Start OTP</h3>
                                        <p className="text-sm text-[#9CA3AF]">Ask passenger for the 6-digit code</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-[#1E293B] rounded-full text-[#6B7280] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8 text-center">
                                <div className="flex justify-center gap-2 sm:gap-4">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={inputRefs[index]}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className="w-10 sm:w-14 h-14 sm:h-16 bg-[#1E293B] border border-[#374151] rounded-xl sm:rounded-2xl text-xl sm:text-2xl font-black text-white text-center focus:border-indigo-500 focus:outline-none transition-all shadow-lg focus:ring-4 focus:ring-indigo-500/20"
                                            disabled={isVerifying}
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={otp.join('').length !== 6 || isVerifying}
                                        className="h-14 bg-indigo-500 hover:bg-indigo-600 font-bold text-lg rounded-2xl w-full flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader2 size={24} className="animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                Verify & Start Trip
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="h-12 text-[#9CA3AF] font-bold text-sm hover:text-[#F9FAFB] transition-colors"
                                    >
                                        Later
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
