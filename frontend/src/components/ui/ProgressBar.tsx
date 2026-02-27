'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number; // 0-100
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'danger';
    showLabel?: boolean;
    animated?: boolean;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    size = 'md',
    variant = 'default',
    showLabel = false,
    animated = true,
    className = '',
}) => {
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    const sizeStyles = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
    };

    const variantStyles = {
        default: 'bg-gradient-to-r from-indigo-500 to-indigo-400',
        success: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
        warning: 'bg-gradient-to-r from-amber-500 to-amber-400',
        danger: 'bg-gradient-to-r from-red-500 to-red-400',
    };

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[#9CA3AF]">Progress</span>
                    <span className="text-sm font-semibold text-[#F9FAFB]">{clampedProgress}%</span>
                </div>
            )}
            <div className={`w-full bg-[#1E293B] rounded-full overflow-hidden ${sizeStyles[size]}`}>
                <motion.div
                    className={`h-full rounded-full ${variantStyles[variant]}`}
                    initial={animated ? { width: 0 } : { width: `${clampedProgress}%` }}
                    animate={{ width: `${clampedProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
};
