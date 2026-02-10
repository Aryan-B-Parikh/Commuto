'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    children?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'elevated' | 'outline';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
    hoverable = false,
    onClick,
}) => {
    const baseStyles = 'rounded-2xl transition-all duration-200';

    const variantStyles = {
        default: 'bg-white border border-gray-100 shadow-sm',
        glass: 'bg-white/80 backdrop-blur-lg border border-white/20 shadow-lg',
        elevated: 'bg-white shadow-xl shadow-gray-200/50',
        outline: 'bg-white border border-gray-200',
    };

    const paddingStyles = {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-7',
    };

    const hoverStyles = hoverable ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : '';

    const Component = onClick ? motion.button : motion.div;

    return (
        <Component
            whileHover={hoverable ? { y: -4 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
            onClick={onClick}
        >
            {children}
        </Component>
    );
};
