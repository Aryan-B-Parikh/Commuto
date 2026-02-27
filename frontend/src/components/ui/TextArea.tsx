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
            <label className="text-sm font-medium text-[#9CA3AF] ml-1">
                {label}
            </label>
            <div className="relative group">
                <textarea
                    className={`
                        w-full bg-[#111827] border rounded-xl py-3 px-4 transition-all duration-200 outline-none min-h-[120px] resize-none
                        ${error
                            ? 'border-red-500/50 ring-2 ring-red-500/10 focus:border-red-500'
                            : 'border-[#1E293B] hover:border-[#374151] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}
                        text-[#F9FAFB] placeholder:text-[#6B7280]
                    `}
                    {...props}
                />
            </div>
            {(error || helperText) && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs ml-1 ${error ? 'text-red-400' : 'text-[#6B7280]'}`}
                >
                    {error || helperText}
                </motion.p>
            )}
        </div>
    );
};
