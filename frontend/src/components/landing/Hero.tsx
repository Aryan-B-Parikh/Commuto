'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export const Hero: React.FC = () => {
    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-background transition-colors duration-500" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/5 opacity-50 dark:opacity-100" />

            {/* Decorative elements */}
            <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-green-400/20 rounded-full blur-3xl" />

            {/* Floating shapes */}
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 right-1/4 w-16 h-16 bg-blue-500/10 rounded-2xl rotate-12"
            />
            <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-green-500/10 rounded-full"
            />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full mb-6 border border-blue-500/20"
                        >
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">10,000+ daily rides shared</span>
                        </motion.div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                            Share Your Ride,
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                                Share The Journey
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-lg">
                            Connect with fellow commuters, split costs, reduce emissions, and make your daily commute more enjoyable with Commuto.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/select-role">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Get Started Free
                                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Button>
                            </Link>
                            <Link href="/#how-it-works">
                                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                    See How It Works
                                </Button>
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 mt-12">
                            <div>
                                <p className="text-3xl font-bold text-foreground">50K+</p>
                                <p className="text-sm text-muted-foreground">Active Users</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-foreground">1M+</p>
                                <p className="text-sm text-muted-foreground">Rides Shared</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-foreground">4.9</p>
                                <p className="text-sm text-muted-foreground">App Rating</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Hero Image / App Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="relative hidden lg:block"
                    >
                        {/* Phone Mockup */}
                        <div className="relative mx-auto w-[300px]">
                            <div className="relative bg-foreground rounded-[40px] p-3 shadow-2xl transition-colors">
                                <div className="bg-background rounded-[32px] overflow-hidden transition-colors">
                                    {/* Status Bar */}
                                    <div className="bg-muted px-6 py-3 flex justify-between items-center transition-colors">
                                        <span className="text-xs font-medium text-foreground">9:41</span>
                                        <div className="flex items-center gap-1">
                                            <div className="w-4 h-2 bg-muted-foreground/30 rounded-sm" />
                                            <div className="w-4 h-2 bg-muted-foreground/30 rounded-sm" />
                                            <div className="w-6 h-3 bg-muted-foreground/30 rounded-sm" />
                                        </div>
                                    </div>

                                    {/* App Content */}
                                    <div className="p-4 h-[500px] bg-background transition-colors leading-relaxed">
                                        {/* Map Area */}
                                        <div className="h-48 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-2xl mb-4 relative overflow-hidden">
                                            <div className="absolute inset-0 opacity-20" style={{
                                                backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
                                                backgroundSize: '20px 20px',
                                            }} />
                                            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-green-500 rounded-full shadow-lg" />
                                            <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-red-500 rounded-full shadow-lg" />
                                        </div>

                                        {/* Cards */}
                                        <div className="space-y-3">
                                            <div className="bg-card p-4 rounded-xl shadow-sm border border-card-border transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-500/10 rounded-full" />
                                                    <div className="flex-1">
                                                        <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                                                        <div className="h-2 bg-muted/50 rounded w-1/2" />
                                                    </div>
                                                    <div className="text-blue-600 font-bold">$12</div>
                                                </div>
                                            </div>
                                            <div className="bg-card p-4 rounded-xl shadow-sm border border-card-border transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-500/10 rounded-full" />
                                                    <div className="flex-1">
                                                        <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                                                        <div className="h-2 bg-muted/50 rounded w-2/5" />
                                                    </div>
                                                    <div className="text-blue-500 font-bold">$8</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Nav Preview */}
                                        <div className="absolute bottom-4 left-4 right-4 bg-card rounded-2xl p-3 shadow-lg flex justify-around border border-card-border transition-colors">
                                            <div className="w-8 h-8 bg-blue-500 rounded-lg" />
                                            <div className="w-8 h-8 bg-muted rounded-lg" />
                                            <div className="w-8 h-8 bg-muted rounded-lg" />
                                            <div className="w-8 h-8 bg-muted rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating notification */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute -right-16 top-20 bg-card p-3 rounded-xl shadow-lg border border-card-border flex items-center gap-2 max-w-[180px] transition-colors"
                            >
                                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="leading-tight">
                                    <p className="text-xs font-semibold text-foreground">Trip Matched!</p>
                                    <p className="text-[10px] text-muted-foreground">Saved $15 today</p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
