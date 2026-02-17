"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardFallback() {
    const router = useRouter();
    const { user, role, isLoading } = useAuth() as any;

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (role === 'driver') {
                router.push('/driver/dashboard');
            } else if (role === 'passenger') {
                router.push('/passenger/dashboard');
            } else {
                router.push('/select-role');
            }
        }
    }, [user, role, isLoading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
}
