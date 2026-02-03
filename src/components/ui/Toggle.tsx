"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface ToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
    label,
    description,
    checked,
    onChange,
    className = '',
}) => {
    return (
        <div className={`flex items-center justify-between gap-4 py-2 ${className}`}>
            <div className="flex flex-col gap-0.5">
                <label className="text-sm font-medium text-slate-900">{label}</label>
                {description && (
                    <span className="text-xs text-slate-500 leading-relaxed">{description}</span>
                )}
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-4 focus:ring-blue-100
          ${checked ? 'bg-blue-600' : 'bg-slate-200'}
        `}
            >
                <motion.span
                    animate={{ x: checked ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0
          `}
                />
            </button>
        </div>
    );
};
