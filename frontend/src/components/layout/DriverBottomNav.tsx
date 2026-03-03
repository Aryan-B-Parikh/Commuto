'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Map,
    Mail,
    CircleDollarSign,
    User
} from 'lucide-react';

const navItems = [
    {
        label: 'Home',
        href: '/driver/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'Requests',
        href: '/driver/requests',
        icon: Mail,
    },
    {
        label: 'My Trips',
        href: '/driver/routes',
        icon: Map,
    },
    {
        label: 'Earnings',
        href: '/driver/earnings',
        icon: CircleDollarSign,
    },
    {
        label: 'Profile',
        href: '/profile',
        icon: User,
    },
];

export function DriverBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#0F172A]/90 backdrop-blur-md border-t border-[#1E293B] z-50 px-2 pb-safe pt-1 lg:hidden">
            <div className="flex justify-around items-center h-full max-w-lg mx-auto">
                {navItems.map((item, index) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    const isCenter = index === Math.floor(navItems.length / 2);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center min-w-[60px] h-full"
                        >
                            <motion.div
                                whileTap={{ scale: 0.95 }}
                                className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-colors duration-200 ${isActive
                                        ? isCenter
                                            ? 'bg-indigo-600 shadow-md shadow-indigo-500/20'
                                            : 'bg-indigo-500/20'
                                        : 'hover:bg-[#1E293B]/50'
                                    }`}
                            >
                                <Icon
                                    size={isCenter ? 24 : 22}
                                    strokeWidth={1.8}
                                    className={`${isActive
                                            ? isCenter
                                                ? 'text-white'
                                                : 'text-[#6366F1]'
                                            : 'text-[#6B7280] opacity-80'
                                        }`}
                                />
                                <span className={`text-[10px] font-medium tracking-tight ${isActive
                                        ? isCenter
                                            ? 'text-white'
                                            : 'text-[#6366F1]'
                                        : 'text-[#6B7280] opacity-80'
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
