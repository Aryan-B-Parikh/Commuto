import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PassengerBottomNav } from './PassengerBottomNav';
import { DriverBottomNav } from './DriverBottomNav';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
    children: React.ReactNode;
    userType: 'passenger' | 'driver';
    title?: string;
    immersive?: boolean;
}

export function DashboardLayout({ children, userType, title = 'Dashboard', immersive = false }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSidebarMini, setIsSidebarMini] = useState(false);
    const { role, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated && role && role !== userType) {
            console.log(`Role mismatch: user is ${role} but accessing ${userType} module. Redirecting...`);
            router.push(`/${role}/dashboard`);
        }
    }, [role, userType, isAuthenticated, isLoading, router]);

    if (isLoading || (isAuthenticated && role && role !== userType)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar — desktop only */}
            {!immersive && (
                <div className="hidden lg:block">
                    <Sidebar
                        userType={role || userType}
                        isOpen={isSidebarOpen}
                        isMini={isSidebarMini}
                        onToggleMini={() => setIsSidebarMini(!isSidebarMini)}
                    />
                </div>
            )}

            {/* Main content */}
            <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!immersive && isSidebarOpen
                ? isSidebarMini ? 'lg:ml-[88px]' : 'lg:ml-[260px]'
                : 'lg:ml-0'
                }`}>

                {/* TopBar — desktop only */}
                {!immersive && (
                    <div className="hidden lg:block">
                        <TopBar
                            title={title}
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                            isSidebarMini={isSidebarMini}
                            onToggleMini={() => setIsSidebarMini(!isSidebarMini)}
                        />
                    </div>
                )}

                {/* Content area — extra bottom padding on mobile for bottom nav */}
                <div className="flex-1 animate-fadeIn">
                    {children}
                </div>
            </main>

            {/* Bottom Navigation — mobile only */}
            {!immersive && (
                <div className="lg:hidden">
                    {userType === 'passenger' ? <PassengerBottomNav /> : <DriverBottomNav />}
                </div>
            )}
        </div>
    );
}
