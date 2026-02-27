'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
            {icon ? (
                <div className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center mb-4 text-[#6B7280]">
                    {icon}
                </div>
            ) : (
                <div className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
            )}
            <h3 className="text-lg font-semibold text-[#F9FAFB] mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-[#9CA3AF] max-w-sm mb-4">{description}</p>
            )}
            {action && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.onClick}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-[14px] font-semibold hover:from-indigo-400 hover:to-indigo-500 transition-all min-h-[48px] shadow-lg shadow-indigo-500/25"
                >
                    {action.label}
                </motion.button>
            )}
        </motion.div>
    );
};
