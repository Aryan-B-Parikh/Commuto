"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface SelectProps {
    label: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    error?: string;
    className?: string;
    placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    value,
    options,
    onChange,
    error,
    className = '',
    placeholder = 'Select an option',
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`flex flex-col gap-1.5 w-full ${className}`} ref={containerRef}>
            <label className="text-sm font-medium text-muted-foreground ml-1">
                {label}
            </label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        w-full bg-card border rounded-xl py-3 px-4 min-h-[48px] flex items-center justify-between transition-all duration-200 outline-none
                        ${error
                            ? 'border-red-500/50 ring-2 ring-red-500/10'
                            : 'border-card-border hover:border-card-border/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}
                        ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''}
                    `}
                >
                    <span className={`text-sm ${selectedOption ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <svg
                        className={`w-5 h-5 text-muted-foreground/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="19 9l-7 7-7-7" />
                    </svg>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 5, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute z-50 w-full bg-card border border-card-border rounded-xl shadow-xl shadow-black/30 overflow-hidden mt-1"
                        >
                            <div className="max-h-60 overflow-y-auto py-1">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 min-h-[48px] text-sm text-left transition-colors
                                            ${value === option.value ? 'bg-indigo-500/15 text-indigo-400 font-medium' : 'text-foreground hover:bg-muted'}
                                        `}
                                    >
                                        {option.icon}
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 ml-1"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
};
