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
        <nav className="fixed bottom-0 left-0 right-0 bg-[#111827]/95 backdrop-blur-xl border-t border-[#1E293B] z-50 safe-bottom">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center flex-1 h-full relative py-1"
                        >
                            <motion.div
                                whileTap={{ scale: 0.85 }}
                                className={`flex flex-col items-center gap-0.5 transition-colors ${isActive ? 'text-indigo-400' : 'text-[#6B7280]'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="passenger-nav-indicator"
                                        className="absolute -top-0.5 w-8 h-1 bg-indigo-500 rounded-full"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-indigo-500/10' : ''}`}>
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
