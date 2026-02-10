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
            <label className="text-sm font-medium text-slate-700 ml-1">
                {label}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={`
            w-full bg-white border rounded-xl py-3 px-4 transition-all duration-200 outline-none
            ${icon ? 'pl-11' : 'pl-4'}
            ${error
                            ? 'border-red-300 ring-2 ring-red-50/50 focus:border-red-500'
                            : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50'}
            text-slate-900 placeholder:text-slate-400
          `}
                    {...props}
                />
            </div>
            {(error || helperText) && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs ml-1 ${error ? 'text-red-500' : 'text-slate-500'}`}
                >
                    {error || helperText}
                </motion.p>
            )}
        </div>
    );
};
