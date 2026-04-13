'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface NavbarProps {
    variant?: 'default' | 'transparent';
}

export const Navbar: React.FC<NavbarProps> = ({ variant = 'default' }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { label: 'How It Works', href: '/#how-it-works' },
        { label: 'Safety', href: '/#safety' },
        { label: 'Features', href: '/#features' },
    ];

    const navWrapperClass = variant === 'transparent'
        ? 'bg-transparent'
        : 'bg-background/70 backdrop-blur-xl border-b border-card-border';

    return (
        <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${navWrapperClass}`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-18 items-center justify-between md:h-20">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),#59b0ff)] text-white shadow-[0_14px_30px_rgba(47,128,255,0.24)]">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-display text-lg font-bold tracking-tight text-foreground">Commuto</p>
                            <p className="text-[11px] text-muted-foreground">Smart ride sharing for everyday travel</p>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-7 md:flex">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden items-center gap-3 md:flex">
                        <ThemeToggle />
                        <Link href="/login">
                            <Button variant="ghost">Log in</Button>
                        </Link>
                        <Link href="/select-role">
                            <Button>Get Started</Button>
                        </Link>
                    </div>

                    <button
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        className="rounded-2xl border border-card-border bg-card p-2.5 text-foreground shadow-sm transition-all hover:bg-muted md:hidden"
                        aria-label="Toggle navigation menu"
                    >
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-card-border bg-background/95 backdrop-blur-xl md:hidden"
                    >
                        <div className="space-y-3 px-4 py-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="space-y-3 border-t border-card-border pt-3">
                                <ThemeToggle className="w-full justify-between" />
                                <Link href="/login" className="block" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="outline" fullWidth>Log in</Button>
                                </Link>
                                <Link href="/select-role" className="block" onClick={() => setIsMenuOpen(false)}>
                                    <Button fullWidth>Get Started</Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
