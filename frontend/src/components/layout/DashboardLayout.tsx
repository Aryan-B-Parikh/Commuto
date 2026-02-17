"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
    children: React.ReactNode;
    userType: 'passenger' | 'driver';
    title?: string;
}

export function DashboardLayout({ children, userType, title = 'Dashboard' }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const [isSidebarMini, setIsSidebarMini] = React.useState(false);

    return (
        <div className="flex min-h-screen bg-background">

            <Sidebar
                userType={userType}
                isOpen={isSidebarOpen}
                isMini={isSidebarMini}
                onToggleMini={() => setIsSidebarMini(!isSidebarMini)}
            />

            <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen
                    ? isSidebarMini ? 'ml-[88px]' : 'ml-[260px]'
                    : 'ml-0'
                }`}>
                <TopBar
                    title={title}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarMini={isSidebarMini}
                    onToggleMini={() => setIsSidebarMini(!isSidebarMini)}
                />
                <div className="p-8 animate-fadeIn">
                    {children}
                </div>
            </main>
        </div>
    );
}
