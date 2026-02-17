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
    Wallet,
    Settings,
    Mail,
    Map,
    CircleDollarSign,
    User,
    LogOut,
    ChevronLeft,
    ChevronRight
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer mb-1 mx-2 relative group
          ${isActive
                        ? 'bg-emerald-500/10 text-emerald-500 font-bold active-glow shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]'
                        : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover-glow'
                    } ${isMini ? 'justify-center px-2 mx-auto w-12' : ''}`}
            >
                <div className={`transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${isActive ? 'scale-110 text-emerald-500' : 'text-muted-foreground'}`}>
                    {icon}
                </div>
                {!isMini && <span className="text-sm font-medium tracking-tight">{label}</span>}

                {isActive && (
                    <motion.div
                        layoutId="active-pill"
                        className={`absolute left-0 w-1 bg-emerald-500 rounded-r-md ${isMini ? 'h-6 top-3' : 'h-8 top-2.5'}`}
                    />
                )}

                {isMini && (
                    <div className="absolute left-14 px-2 py-1 bg-foreground text-background text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
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
        { label: 'Overview', href: '/passenger/dashboard', icon: <LayoutDashboard size={22} strokeWidth={2.5} /> },
        { label: 'Book a Ride', href: '/passenger/create', icon: <Car size={22} strokeWidth={2.5} /> },
        { label: 'Active Trips', href: '/passenger/live', icon: <MapPin size={22} strokeWidth={2.5} /> },
        { label: 'Wallet', href: '/passenger/wallet', icon: <Wallet size={22} strokeWidth={2.5} /> },
        { label: 'Settings', href: '/profile', icon: <Settings size={22} strokeWidth={2.5} /> },
    ];

    const driverLinks = [
        { label: 'Overview', href: '/driver/dashboard', icon: <LayoutDashboard size={22} strokeWidth={2.5} /> },
        { label: 'Route Requests', href: '/driver/requests', icon: <Mail size={22} strokeWidth={2.5} /> },
        { label: 'My Routes', href: '/driver/routes', icon: <Map size={22} strokeWidth={2.5} /> },
        { label: 'Earnings', href: '/driver/earnings', icon: <CircleDollarSign size={22} strokeWidth={2.5} /> },
        { label: 'Settings', href: '/profile', icon: <Settings size={22} strokeWidth={2.5} /> },
    ];

    const links = userType === 'driver' ? driverLinks : passengerLinks;

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-card border-r border-card-border flex flex-col z-50 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'
                } ${isMini ? 'w-[88px]' : 'w-[260px]'}`}
        >
            {/* Logo Area */}
            <div className={`p-6 flex items-center gap-3 transition-all duration-500 ${isMini ? 'justify-center px-2' : ''}`}>
                <div
                    onClick={onToggleMini}
                    className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-[0_8px_30px_rgb(16,185,129,0.3)] transform hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group/logo"
                >
                    <Car size={28} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                </div>
                {!isMini && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col"
                    >
                        <span className="text-xl font-black tracking-tighter text-foreground leading-none">COMMUTO</span>
                        <span className="text-[10px] font-bold text-emerald-500 tracking-[0.2em] mt-0.5">PLATFORM</span>
                    </motion.div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 overflow-y-auto scrollbar-hide">
                {!isMini && (
                    <div className="px-6 mb-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">
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
            <div className={`p-4 border-t border-card-border/50 bg-muted/20 backdrop-blur-md transition-all duration-300 ${isMini ? 'items-center' : ''}`}>
                <div className={`flex items-center gap-3 p-2 rounded-2xl hover:bg-card hover:shadow-lg border border-transparent hover:border-card-border/50 transition-all group cursor-pointer ${isMini ? 'justify-center p-1' : ''}`}>
                    {user?.avatar ? (
                        <div className="relative">
                            <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/20" alt="Avatar" />
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                            {user?.name?.charAt(0).toUpperCase() || <User size={18} />}
                        </div>
                    )}
                    {!isMini && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate leading-tight">
                                {user?.name || 'User Name'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-bold truncate uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                                {userType}
                            </p>
                        </div>
                    )}
                    {!isMini && (
                        <button
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            onClick={() => {/* logout logic will be handled by parent/useAuth */ }}
                        >
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
