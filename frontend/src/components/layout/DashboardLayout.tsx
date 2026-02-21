import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
    children: React.ReactNode;
    userType: 'passenger' | 'driver';
    title?: string;
}

export function DashboardLayout({ children, userType, title = 'Dashboard' }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const [isSidebarMini, setIsSidebarMini] = React.useState(false);
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

            <Sidebar
                userType={role || userType}
                isOpen={isSidebarOpen}
                isMini={isSidebarMini}
                onToggleMini={() => setIsSidebarMini(!isSidebarMini)}
            />

            <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen
                ? isSidebarMini ? 'ml-[88px]' : 'ml-[240px]'
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
