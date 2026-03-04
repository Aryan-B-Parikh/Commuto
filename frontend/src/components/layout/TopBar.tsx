"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

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
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
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

    return (
        <header className="h-20 px-6 flex items-center justify-between sticky top-0 z-40">
            {/* Floating Glass Container */}
            <div className="absolute inset-x-4 top-3 bottom-3 bg-card/80 backdrop-blur-xl rounded-2xl border border-card-border shadow-lg shadow-black/20" />

            <div className="relative flex items-center gap-6 z-10 w-full justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-card-border/30">
                        <button
                            onClick={onToggleSidebar}
                            className="p-2 text-muted-foreground hover:text-indigo-400 hover:bg-muted rounded-lg transition-all"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        {onToggleMini && (
                            <button
                                onClick={onToggleMini}
                                className="p-2 text-[#6B7280] hover:text-indigo-400 hover:bg-[#1E293B] rounded-lg transition-all"
                            >
                                <svg className={`h-5 w-5 transition-transform duration-500 ${isSidebarMini ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-foreground tracking-tight leading-none">{title}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{role} Session Active</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative group hidden xl:block">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-72 pl-11 pr-12 py-2.5 border border-card-border rounded-xl leading-5 bg-muted/50 focus:bg-muted focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all duration-200 text-sm text-foreground placeholder:text-muted-foreground font-medium"
                            placeholder="Search routes or drivers..."
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 border border-card-border/50 rounded-lg text-[10px] font-bold text-muted-foreground bg-muted">
                                ⌘K
                            </kbd>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2.5 rounded-xl transition-all relative border ${showNotifications
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border-indigo-500'
                                : 'text-muted-foreground hover:bg-muted hover:text-indigo-400 border-transparent'
                                }`}
                        >
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card-bg ring-2 ring-red-500/20"></span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 10, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-80 bg-card border border-card-border rounded-2xl shadow-2xl shadow-black/40 p-4 overflow-hidden"
                                >
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">Activity Log</h4>
                                    <div className="space-y-3">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="flex gap-3 p-2 rounded-xl hover:bg-[#1E293B] transition-colors cursor-pointer group">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs group-hover:bg-indigo-500 group-hover:text-white transition-colors">🚀</div>
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground leading-tight">New route available from Delhi Central</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1">2 minutes ago</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full mt-4 p-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/5 rounded-lg transition-colors">Clear All History</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`flex items-center gap-2 p-1 rounded-2xl transition-all border ${isDropdownOpen
                                ? 'bg-muted border-card-border shadow-md'
                                : 'border-transparent active:scale-95'
                                }`}
                        >
                            <div className="relative">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-card-bg rounded-full" />
                            </div>
                            <div className="hidden xl:flex flex-col items-start pr-3">
                                <span className="text-xs font-bold text-foreground tracking-tight line-clamp-1">{user?.name}</span>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">Settings</span>
                            </div>
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 10, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-64 bg-card border border-card-border rounded-2xl shadow-2xl shadow-black/40 p-2 overflow-hidden z-[100]"
                                >
                                    <div className="px-4 py-3 border-b border-card-border mb-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Verified Account</p>
                                        <p className="text-sm font-bold text-foreground mt-1 truncate">{user?.email}</p>
                                    </div>

                                    <Link
                                        href="/profile"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-indigo-500/10 hover:text-indigo-400 rounded-xl transition-all group"
                                    >
                                        <span className="text-lg group-hover:rotate-12 transition-transform">💎</span>
                                        <span className="font-semibold tracking-tight">Personal Profile</span>
                                    </Link>

                                    <div className="mt-2 pt-2 border-t border-card-border">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
                                        >
                                            <span className="text-lg group-hover:scale-110 transition-transform">⚡</span>
                                            <span className="font-bold uppercase tracking-widest text-[11px]">Terminate Session</span>
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
