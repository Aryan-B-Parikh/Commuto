"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
    LayoutDashboard,
    Car,
    MapPin,
    Settings,
    Mail,
    Map,
    CircleDollarSign,
    User,
    LogOut,
    Clock,
    Navigation
} from 'lucide-react';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    isActive?: boolean;
    isMini?: boolean;
}

const SidebarItem = ({ icon, label, href, isActive, isMini }: SidebarItemProps) => {
    return (
        <Link href={href} className="w-full">
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer mb-1 mx-3 relative group
                    ${isActive
                        ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    } ${isMini ? 'justify-center px-0 mx-auto w-10' : ''}`}
            >
                <div className={`transition-all duration-200 ${isActive ? 'text-indigo-400' : 'text-muted-foreground/60 group-hover:text-muted-foreground'}`}>
                    {icon}
                </div>
                {!isMini && <span className="text-sm font-medium tracking-tight">{label}</span>}

                {isActive && (
                    <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 w-1 bg-indigo-500 rounded-r-full h-5 top-1/2 -translate-y-1/2"
                    />
                )}

                {isMini && (
                    <div className="absolute left-14 px-2 py-1 bg-muted text-foreground text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-card-border">
                        {label}
                    </div>
                )}
            </motion.div>
        </Link>
    );
};

export function Sidebar({
    userType = 'passenger',
    isOpen = true,
    isMini = false,
    onToggleMini
}: {
    userType?: 'passenger' | 'driver';
    isOpen?: boolean;
    isMini?: boolean;
    onToggleMini?: () => void;
}) {
    const pathname = usePathname();
    const { user } = useAuth();

    const passengerLinks = [
        { label: 'Overview', href: '/passenger/dashboard', icon: <LayoutDashboard size={18} strokeWidth={2} /> },
        { label: 'Book a Ride', href: '/passenger/ride-sharing', icon: <Car size={18} strokeWidth={2} /> },
        { label: 'My Trips', href: '/passenger/history', icon: <Clock size={18} strokeWidth={2} /> },
        { label: 'Active Trips', href: '/passenger/live', icon: <MapPin size={18} strokeWidth={2} /> },
        { label: 'Settings', href: '/profile', icon: <Settings size={18} strokeWidth={2} /> },
    ];

    const driverLinks = [
        { label: 'Overview', href: '/driver/dashboard', icon: <LayoutDashboard size={18} strokeWidth={2} /> },
        { label: 'Route Requests', href: '/driver/requests', icon: <Mail size={18} strokeWidth={2} /> },
        { label: 'My Routes', href: '/driver/routes', icon: <Map size={18} strokeWidth={2} /> },
        { label: 'Live Trip', href: '/driver/live', icon: <Navigation size={18} strokeWidth={2} /> },
        { label: 'Earnings', href: '/driver/earnings', icon: <CircleDollarSign size={18} strokeWidth={2} /> },
        { label: 'Settings', href: '/profile', icon: <Settings size={18} strokeWidth={2} /> },
    ];

    const links = userType === 'driver' ? driverLinks : passengerLinks;

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar flex flex-col z-50 transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'
                } ${isMini ? 'w-[88px]' : 'w-[260px]'}`}
        >
            {/* Logo Area */}
            <div className={`p-6 flex items-center gap-3 transition-all duration-500 ${isMini ? 'justify-center px-2' : ''}`}>
                <div
                    onClick={onToggleMini}
                    className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 transform hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                    <Car size={20} strokeWidth={2} />
                </div>
                {!isMini && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col"
                    >
                        <span className="text-xl font-black tracking-tighter text-foreground leading-none">COMMUTO</span>
                        <span className="text-[10px] font-bold text-indigo-400 tracking-[0.2em] mt-0.5">PLATFORM</span>
                    </motion.div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 overflow-y-auto scrollbar-hide">
                {!isMini && (
                    <div className="px-6 mb-4 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] opacity-50">
                        Main Menu
                    </div>
                )}
                <div className="space-y-1">
                    {links.map((link) => (
                        <SidebarItem
                            key={link.href}
                            {...link}
                            isActive={pathname === link.href}
                            isMini={isMini}
                        />
                    ))}
                </div>
            </nav>

            {/* User Mini Profile */}
            <div className={`p-4 border-t border-sidebar bg-background/50 transition-all duration-300 ${isMini ? 'items-center' : ''}`}>
                <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-muted border border-transparent hover:border-card-border transition-all group cursor-pointer ${isMini ? 'justify-center p-1' : ''}`}>
                    {user?.avatar ? (
                        <div className="relative">
                            <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20" alt="Avatar" />
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#111827] rounded-full" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-sm group-hover:bg-indigo-500 group-hover:text-white transition-all">
                            {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
                        </div>
                    )}
                    {!isMini && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate leading-tight">
                                {user?.name || 'User Name'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-bold truncate uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                <span className="w-1 h-1 bg-indigo-500 rounded-full" />
                                {userType}
                            </p>
                        </div>
                    )}
                    {!isMini && (
                        <button
                            className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            onClick={() => {/* logout logic will be handled by parent/useAuth */ }}
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
