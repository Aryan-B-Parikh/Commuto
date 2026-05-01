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
    Search,
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
                className={`relative mx-3 mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 group ${isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    } ${isMini ? 'mx-auto w-10 justify-center px-0' : ''}`}
            >
                <div className={`transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-muted-foreground'}`}>
                    {icon}
                </div>
                {!isMini && <span className="text-sm font-medium tracking-tight">{label}</span>}

                {isActive && (
                    <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                    />
                )}

                {isMini && (
                    <div className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded border border-card-border bg-muted px-2 py-1 text-[10px] font-bold text-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
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
        { label: 'Search Rides', href: '/passenger/search', icon: <Search size={18} strokeWidth={2} /> },
        { label: 'Book a Ride', href: '/passenger/ride-sharing', icon: <Car size={18} strokeWidth={2} /> },
        { label: 'My Trips', href: '/passenger/history', icon: <Clock size={18} strokeWidth={2} /> },
        { label: 'Active Trips', href: '/passenger/live', icon: <MapPin size={18} strokeWidth={2} /> },
        { label: 'Wallet', href: '/passenger/wallet', icon: <CircleDollarSign size={18} strokeWidth={2} /> },
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
            className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isMini ? 'w-[88px]' : 'w-[260px]'}`}
        >
            <div className={`px-5 pb-4 pt-6 ${isMini ? 'flex justify-center px-0' : ''}`}>
                <Link href="/" className={`flex items-center gap-3 ${isMini ? 'justify-center' : ''}`}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),#59b0ff)] text-white shadow-[0_14px_30px_rgba(47,128,255,0.24)]">
                        <Navigation size={20} />
                    </div>
                    {!isMini && (
                        <div>
                            <p className="font-display text-base font-bold text-foreground">Commuto</p>
                            <p className="text-[11px] text-muted-foreground">Control center</p>
                        </div>
                    )}
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto scrollbar-hide pt-6 pb-6">
                {!isMini && (
                    <div className="mb-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                        Main Menu
                    </div>
                )}
                <div className="space-y-1">
                    {links.map((link) => (
                        <SidebarItem
                            key={link.href}
                            {...link}
                            isActive={pathname === link.href || pathname.startsWith(link.href + '/')}
                            isMini={isMini}
                        />
                    ))}
                </div>
            </nav>

            <div className={`border-t border-sidebar-border bg-background/30 p-4 transition-all duration-300 ${isMini ? 'items-center' : ''}`}>
                <div className={`group flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent p-2 transition-all hover:border-card-border hover:bg-muted ${isMini ? 'justify-center p-1' : ''}`}>
                    {user?.avatar ? (
                        <div className="relative">
                            <img src={user.avatar} className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/20" alt="Avatar" />
                            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
                        </div>
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary transition-all group-hover:bg-primary group-hover:text-white">
                            {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
                        </div>
                    )}
                    {!isMini && (
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold leading-tight text-foreground">
                                {user?.name || 'User Name'}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <span className="h-1 w-1 rounded-full bg-primary" />
                                {userType}
                            </p>
                        </div>
                    )}
                    {!isMini && (
                        <button
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => { }}
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
