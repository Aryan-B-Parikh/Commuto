"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
    error?: string;
    helperText?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    icon,
    error,
    helperText,
    className = '',
    ...props
}) => {
    return (
        <div className={`flex w-full flex-col gap-2 ${className}`}>
            <label className="ml-1 text-sm font-semibold text-foreground/78">
                {label}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                        {icon}
                    </div>
                )}
                <input
                    className={`
                        min-h-[52px] w-full rounded-2xl border bg-card px-4 py-3.5 text-foreground outline-none transition-all duration-200
                        ${icon ? 'pl-12' : 'pl-4'}
                        ${error
                            ? 'border-danger/50 bg-danger/5 focus:border-danger focus:ring-4 focus:ring-danger/10'
                            : 'border-card-border hover:border-primary/20 focus:border-primary focus:ring-4 focus:ring-[var(--ring)]'}
                        placeholder:text-muted-foreground/80
                    `}
                    {...props}
                />
            </div>
            {(error || helperText) && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`ml-1 text-xs ${error ? 'text-danger' : 'text-muted-foreground'}`}
                >
                    {error || helperText}
                </motion.p>
            )}
        </div>
    );
};
