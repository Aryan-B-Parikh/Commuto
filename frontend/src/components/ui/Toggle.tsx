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
                <label className="text-sm font-medium text-foreground">{label}</label>
                {description && (
                    <span className="text-xs text-muted-foreground leading-relaxed">{description}</span>
                )}
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`
                    relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-2 focus:ring-offset-background
                    ${checked ? 'bg-indigo-500' : 'bg-muted'}
                `}
            >
                <motion.span
                    animate={{ x: checked ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0"
                />
            </button>
        </div>
    );
};
