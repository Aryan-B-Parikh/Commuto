'use client';

import React from 'react';

interface RatingStarsProps {
    rating: number; // 0-5
    size?: 'sm' | 'md' | 'lg';
    showValue?: boolean;
    interactive?: boolean;
    onChange?: (rating: number) => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
    rating,
    size = 'md',
    showValue = true,
    interactive = false,
    onChange,
}) => {
    const sizeStyles = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const textSizeStyles = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    const handleClick = (value: number) => {
        if (interactive && onChange) {
            onChange(value);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= Math.floor(rating);
                const partial = star === Math.ceil(rating) && rating % 1 !== 0;

                return (
                    <button
                        key={star}
                        onClick={() => handleClick(star)}
                        disabled={!interactive}
                        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                    >
                        <svg
                            className={`${sizeStyles[size]} ${filled || partial ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill={filled ? 'currentColor' : partial ? 'url(#partial)' : 'none'}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={filled || partial ? 0 : 1.5}
                        >
                            {partial && (
                                <defs>
                                    <linearGradient id="partial">
                                        <stop offset={`${(rating % 1) * 100}%`} stopColor="currentColor" />
                                        <stop offset={`${(rating % 1) * 100}%`} stopColor="transparent" />
                                    </linearGradient>
                                </defs>
                            )}
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />
                        </svg>
                    </button>
                );
            })}
            {showValue && (
                <span className={`ml-1 font-semibold text-gray-700 ${textSizeStyles[size]}`}>
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
};
