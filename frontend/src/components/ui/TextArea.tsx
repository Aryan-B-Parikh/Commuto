"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
    helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
    label,
    error,
    helperText,
    className = '',
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-1.5 w-full ${className}`}>
            <label className="text-sm font-medium text-foreground ml-1">
                {label}
            </label>
            <div className="relative group">
                <textarea
                    className={`
            w-full bg-card border rounded-xl py-3 px-4 transition-all duration-200 outline-none min-h-[120px] resize-none
            ${error
                            ? 'border-red-300 ring-2 ring-red-50/50 focus:border-red-500'
                            : 'border-card-border hover:border-muted-foreground/30 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50'}
            text-foreground placeholder:text-muted-foreground
          `}
                    {...props}
                />
            </div>
            {(error || helperText) && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs ml-1 ${error ? 'text-red-500' : 'text-muted-foreground'}`}
                >
                    {error || helperText}
                </motion.p>
            )}
        </div>
    );
};
