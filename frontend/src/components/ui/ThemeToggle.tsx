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
            className={`relative flex items-center justify-between gap-4 p-4 rounded-2xl hover:bg-muted transition-all group w-full ${className}`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                {theme === 'light' ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                    <Moon className="w-5 h-5 text-indigo-400" />
                )}
            </div>
            <div className="flex-1 text-left">
                <p className="font-bold text-foreground text-sm">Theme Mode</p>
                <p className="text-[10px] text-muted-foreground font-medium capitalize">Switch to {theme === 'light' ? 'dark' : 'light'} mode</p>
            </div>
            <div className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none
                ${theme === 'light' ? 'bg-amber-500/20' : 'bg-indigo-500/20'}
            `}>
                <motion.span
                    animate={{ x: theme === 'light' ? 0 : 20 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0"
                />
            </div>
        </button>
    );
}
