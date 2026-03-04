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
        <div className={`flex flex-col gap-1.5 w-full ${className}`}>
            <label className="text-sm font-medium text-muted-foreground ml-1">
                {label}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-indigo-400 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={`
                        w-full bg-card border rounded-xl py-3 px-4 min-h-[48px] transition-all duration-200 outline-none
                        ${icon ? 'pl-11' : 'pl-4'}
                        ${error
                            ? 'border-red-500/50 ring-2 ring-red-500/10 focus:border-red-500'
                            : 'border-card-border hover:border-card-border/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}
                        text-foreground placeholder:text-muted-foreground/60
                    `}
                    {...props}
                />
            </div>
            {(error || helperText) && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs ml-1 ${error ? 'text-red-400' : 'text-muted-foreground/60'}`}
                >
                    {error || helperText}
                </motion.p>
            )}
        </div>
    );
};
