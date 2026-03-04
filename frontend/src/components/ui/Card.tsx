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
        default: 'bg-card border border-card-border shadow-sm shadow-black/20',
        glass: 'bg-card/70 backdrop-blur-xl border border-card-border/50 shadow-lg shadow-black/20',
        elevated: 'bg-card shadow-xl shadow-black/30 border border-card-border/50',
        outline: 'bg-transparent border border-card-border',
    };

    const paddingStyles = {
        none: '',
        sm: 'p-3',
        md: 'p-4 lg:p-5',
        lg: 'p-5 lg:p-7',
    };

    const hoverStyles = hoverable ? 'hover:shadow-lg hover:shadow-black/30 hover:border-card-border/80 cursor-pointer' : '';

    const Component = onClick ? motion.button : motion.div;

    return (
        <Component
            whileHover={hoverable ? { y: -2 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
            onClick={onClick}
        >
            {children}
        </Component>
    );
};
