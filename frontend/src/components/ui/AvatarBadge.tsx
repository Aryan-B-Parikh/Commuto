'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AvatarBadgeProps {
    src: string;
    alt: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    badge?: 'driver' | 'passenger' | 'verified' | 'online' | 'none';
    rating?: number;
    className?: string;
}

export function AvatarBadge({
    src,
    alt,
    size = 'md',
    badge = 'none',
    rating,
    className = '',
}: AvatarBadgeProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24',
    };

    const badgePosition = {
        sm: '-bottom-0.5 -right-0.5',
        md: '-bottom-1 -right-1',
        lg: '-bottom-1 -right-1',
        xl: '-bottom-1 -right-1',
    };

    const badgeSize = {
        sm: 'w-4 h-4 text-[8px]',
        md: 'w-5 h-5 text-[10px]',
        lg: 'w-6 h-6 text-xs',
        xl: 'w-8 h-8 text-sm',
    };

    const getBadgeContent = () => {
        switch (badge) {
            case 'driver':
                return (
                    <div className={`absolute ${badgePosition[size]} ${badgeSize[size]} rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white shadow-sm`}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4" />
                        </svg>
                    </div>
                );
            case 'passenger':
                return (
                    <div className={`absolute ${badgePosition[size]} ${badgeSize[size]} rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white shadow-sm`}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                );
            case 'verified':
                return (
                    <div className={`absolute ${badgePosition[size]} ${badgeSize[size]} rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white shadow-sm`}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'online':
                return (
                    <div className={`absolute ${badgePosition[size]} w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm`} />
                );
            default:
                return null;
        }
    };

    return (
        <div className={`relative inline-block ${className}`}>
            <motion.img
                whileHover={{ scale: 1.05 }}
                src={src}
                alt={alt}
                className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-md`}
            />
            {getBadgeContent()}
            {rating !== undefined && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-yellow-400 rounded-full text-[10px] font-bold text-yellow-900 shadow-sm flex items-center gap-0.5">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {rating.toFixed(1)}
                </div>
            )}
        </div>
    );
}
