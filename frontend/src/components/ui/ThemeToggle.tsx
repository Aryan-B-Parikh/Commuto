"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`inline-flex items-center gap-3 rounded-full border border-card-border bg-card px-3 py-2.5 shadow-sm transition-all hover:border-primary/20 hover:bg-muted/70 ${className}`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {theme === 'light' ? (
                        <Sun className="h-[18px] w-[18px] text-amber-500" />
                    ) : (
                        <Moon className="h-[18px] w-[18px] text-primary" />
                    )}
                </div>
                <div className="hidden text-left sm:block">
                    <p className="text-xs font-semibold text-foreground">Theme</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{theme} mode</p>
                </div>
            </div>
            <div className={`
                relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200
                ${theme === 'light' ? 'bg-amber-500/20' : 'bg-primary/20'}
            `}>
                <motion.span
                    animate={{ x: theme === 'light' ? 2 : 24 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="pointer-events-none absolute top-1 inline-block h-5 w-5 rounded-full bg-white shadow-sm"
                />
            </div>
        </button>
    );
}
