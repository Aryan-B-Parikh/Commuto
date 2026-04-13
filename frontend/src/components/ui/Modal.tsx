'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
}) => {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (typeof document === 'undefined') return null;

    const sizeStyles = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        full: 'max-w-full mx-4',
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end lg:items-center justify-center lg:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
                    />

                    {/* Modal Content — bottom sheet on mobile, centered on desktop */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className={`relative w-full ${sizeStyles[size]} bg-card rounded-t-[28px] lg:rounded-[32px] shadow-[var(--shadow-soft)] overflow-hidden border border-card-border max-h-[90vh] overflow-y-auto`}
                    >
                        {/* Drag handle (mobile) */}
                        <div className="flex justify-center pt-3 pb-1 lg:hidden">
                            <div className="w-10 h-1 bg-muted rounded-full" />
                        </div>

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-5 py-4 lg:px-8 lg:py-6 border-b border-card-border">
                                <h2 className="text-lg lg:text-xl font-bold text-foreground">{title}</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Body */}
                        <div className="p-5 lg:p-8">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
