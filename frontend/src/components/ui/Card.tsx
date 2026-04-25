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
    const baseStyles = 'rounded-[28px] transition-all duration-200 text-left';

    const variantStyles = {
        default: 'surface-gradient border border-card-border shadow-[var(--shadow-card)]',
        glass: 'bg-card/90 backdrop-blur-xl border border-card-border shadow-[var(--shadow-soft)]',
        elevated: 'bg-card-strong border border-card-border shadow-[var(--shadow-soft)]',
        outline: 'bg-transparent border border-card-border',
    };

    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-5 lg:p-6',
        lg: 'p-6 lg:p-8',
    };

    const hoverStyles = hoverable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(2,8,23,0.28)] hover:border-primary/20' : '';

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
