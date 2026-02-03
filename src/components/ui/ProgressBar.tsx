'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number; // 0-100
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'danger';
    showLabel?: boolean;
    animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    size = 'md',
    variant = 'default',
    showLabel = false,
    animated = true,
}) => {
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    const sizeStyles = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
    };

    const variantStyles = {
        default: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
    };

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-semibold text-gray-900">{clampedProgress}%</span>
                </div>
            )}
            <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeStyles[size]}`}>
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
