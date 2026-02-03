'use client';

import React from 'react';

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
}) => {
    const baseStyles = 'animate-pulse bg-gray-200';

    const variantStyles = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-xl',
    };

    const style: React.CSSProperties = {
        width: width || (variant === 'circular' ? '40px' : '100%'),
        height: height || (variant === 'circular' ? '40px' : variant === 'text' ? '16px' : '100px'),
    };

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            style={style}
        />
    );
};

// Pre-built skeleton components
export const SkeletonCard: React.FC = () => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1">
                <Skeleton variant="text" className="mb-2" width="60%" />
                <Skeleton variant="text" width="40%" height={12} />
            </div>
        </div>
        <Skeleton variant="rounded" height={80} className="mb-4" />
        <div className="flex gap-3">
            <Skeleton variant="rounded" height={40} className="flex-1" />
            <Skeleton variant="rounded" height={40} width={100} />
        </div>
    </div>
);

export const SkeletonTripCard: React.FC = () => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start gap-4 mb-4">
            <div className="flex flex-col items-center gap-1">
                <Skeleton variant="circular" width={12} height={12} />
                <div className="w-0.5 h-8 bg-gray-200" />
                <Skeleton variant="circular" width={12} height={12} />
            </div>
            <div className="flex-1">
                <Skeleton variant="text" className="mb-3" width="80%" />
                <Skeleton variant="text" width="70%" />
            </div>
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="text" width={100} />
            </div>
            <Skeleton variant="rounded" width={80} height={36} />
        </div>
    </div>
);
