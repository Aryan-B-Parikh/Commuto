'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface MobileHeaderProps {
    title: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
    className?: string;
}

export function MobileHeader({ title, showBack = true, rightAction, className = '' }: MobileHeaderProps) {
    const router = useRouter();

    return (
        <header className={`sticky top-0 z-40 bg-[#0B1020]/90 backdrop-blur-xl border-b border-[#1E293B]/50 ${className}`}>
            <div className="flex items-center justify-between h-14 px-4">
                <div className="flex items-center gap-3 min-w-0">
                    {showBack && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => router.back()}
                            className="p-2 -ml-2 text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1E293B] rounded-xl transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </motion.button>
                    )}
                    <h1 className="text-lg font-bold text-[#F9FAFB] truncate">{title}</h1>
                </div>
                {rightAction && (
                    <div className="flex items-center">
                        {rightAction}
                    </div>
                )}
            </div>
        </header>
    );
}
