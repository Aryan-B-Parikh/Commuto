'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Search,
    Car,
    Clock,
    User
} from 'lucide-react';

const navItems = [
    {
        label: 'Home',
        href: '/passenger/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'Search',
        href: '/passenger/search',
        icon: Search,
    },
    {
        label: 'Book',
        href: '/passenger/ride-sharing',
        icon: Car,
    },
    {
        label: 'Trips',
        href: '/passenger/history',
        icon: Clock,
    },
    {
        label: 'Profile',
        href: '/profile',
        icon: User,
    },
];

export function PassengerBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
            {/* Gradient blur backdrop */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1020] via-[#111827]/98 to-[#111827]/90 backdrop-blur-xl border-t border-[#1E293B]/60" />

            <div className="relative flex justify-around items-center h-16 max-w-lg mx-auto px-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center flex-1 h-full relative"
                        >
                            <motion.div
                                whileTap={{ scale: 0.8 }}
                                className="flex flex-col items-center gap-0.5"
                            >
                                {/* Active glow indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="passenger-nav-glow"
                                        className="absolute -top-0.5 w-10 h-1 rounded-full"
                                        style={{ background: 'linear-gradient(90deg, transparent, #6366F1, transparent)' }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}

                                {/* Icon with background glow on active */}
                                <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-indigo-500/15' : ''}`}>
                                    <Icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                        className={`transition-colors duration-200 ${isActive ? 'text-indigo-400' : 'text-[#4B5563]'}`}
                                    />
                                    {/* Subtle glow behind active icon */}
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-xl bg-indigo-500/10 blur-md -z-10" />
                                    )}
                                </div>

                                <span className={`text-[10px] transition-colors duration-200 ${isActive
                                    ? 'font-bold text-indigo-400'
                                    : 'font-medium text-[#4B5563]'
                                    }`}>
                                    {item.label}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
