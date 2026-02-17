"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsibleSectionProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon,
    children,
    defaultExpanded = true,
}) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    return (
        <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden mb-4">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-5 hover:bg-muted transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    {icon && <div className="text-emerald-600">{icon}</div>}
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                </div>
                <svg
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="p-5 pt-0 border-t border-card-border">
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
