"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ChevronsLeftRight, LogOut, Search, Sidebar as SidebarIcon, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function TopBar({
    title,
    onToggleSidebar,
    isSidebarMini,
    onToggleMini
}: {
    title: string;
    onToggleSidebar: () => void;
    isSidebarMini?: boolean;
    onToggleMini?: () => void;
}) {
    const { user, role, logout } = useAuth();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const query = searchQuery.trim();

        if (role === 'passenger') {
            const target = query ? `/passenger/search?q=${encodeURIComponent(query)}` : '/passenger/search';
            router.push(target);
            return;
        }

        if (role === 'driver') {
            router.push('/driver/requests');
        }
    };

    return (
        <header className="sticky top-0 z-40 h-20 px-6">
            <div className="absolute inset-x-4 top-3 bottom-3 rounded-[28px] border border-card-border bg-card/85 shadow-[var(--shadow-card)] backdrop-blur-xl" />

            <div className="relative z-10 flex w-full items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-2xl border border-card-border bg-muted/60 p-1">
                        <button
                            onClick={onToggleSidebar}
                            className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-card hover:text-primary"
                        >
                            <SidebarIcon className="h-5 w-5" />
                        </button>
                        {onToggleMini && (
                            <button
                                onClick={onToggleMini}
                                className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-card hover:text-primary"
                            >
                                <ChevronsLeftRight className={`h-5 w-5 transition-transform duration-500 ${isSidebarMini ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <h1 className="font-display text-lg font-bold leading-none tracking-tight text-foreground">{title}</h1>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{role} workspace active</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <form className="relative hidden lg:block" onSubmit={handleSearch}>
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-80 rounded-2xl border border-card-border bg-muted/55 py-3 pl-11 pr-12 text-sm font-medium leading-5 text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-[var(--ring)]"
                            placeholder={role === 'passenger' ? 'Search locations...' : 'Search route requests...'}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <kbd className="hidden items-center rounded-lg border border-card-border bg-card px-2 py-0.5 text-[10px] font-bold text-muted-foreground sm:inline-flex">
                                Enter
                            </kbd>
                        </div>
                    </form>

                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`relative rounded-2xl border p-2.5 transition-all ${showNotifications
                                ? 'border-primary bg-primary text-white shadow-[0_14px_30px_rgba(47,128,255,0.2)]'
                                : 'border-card-border text-muted-foreground hover:bg-muted hover:text-primary'
                                }`}
                        >
                            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger ring-2 ring-card"></span>
                            <Bell className="h-5 w-5" />
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 10, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-80 overflow-hidden rounded-[24px] border border-card-border bg-card p-4 shadow-[var(--shadow-soft)]"
                                >
                                    <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Activity Log</h4>
                                    <div className="space-y-3">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="group flex cursor-pointer gap-3 rounded-2xl p-3 transition-colors hover:bg-muted">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                                    R
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold leading-tight text-foreground">New route available from Delhi Central</p>
                                                    <p className="mt-1 text-[10px] text-muted-foreground">2 minutes ago</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-4 w-full rounded-xl p-2 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/10">
                                        Clear All History
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`flex items-center gap-2 rounded-2xl border p-1 transition-all ${isDropdownOpen
                                ? 'border-card-border bg-muted shadow-md'
                                : 'border-transparent active:scale-95'
                                }`}
                        >
                            <div className="relative">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/20"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--primary),#59b0ff)] text-sm font-bold text-white shadow-inner">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
                            </div>
                            <div className="hidden pr-3 xl:flex flex-col items-start">
                                <span className="line-clamp-1 text-xs font-bold tracking-tight text-foreground">{user?.name}</span>
                                <span className="text-[10px] font-semibold leading-none uppercase tracking-widest text-muted-foreground">Settings</span>
                            </div>
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 10, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                    className="absolute right-0 z-[100] mt-2 w-64 overflow-hidden rounded-[24px] border border-card-border bg-card p-2 shadow-[var(--shadow-soft)]"
                                >
                                    <div className="mb-2 border-b border-card-border px-4 py-3">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Verified Account</p>
                                        <p className="mt-1 truncate text-sm font-bold text-foreground">{user?.email}</p>
                                    </div>

                                    <Link
                                        href="/profile"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-foreground transition-all hover:bg-primary/10 hover:text-primary"
                                    >
                                        <UserCircle2 className="h-[18px] w-[18px] transition-transform group-hover:rotate-6" />
                                        <span className="font-semibold tracking-tight">Personal Profile</span>
                                    </Link>

                                    <div className="mt-2 border-t border-card-border pt-2">
                                        <button
                                            onClick={handleLogout}
                                            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 transition-all hover:bg-red-500/10"
                                        >
                                            <LogOut className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                            <span className="text-[11px] font-bold uppercase tracking-widest">Terminate Session</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}
