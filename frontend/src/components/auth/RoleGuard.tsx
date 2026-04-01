'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: ('passenger' | 'driver')[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
    const { role, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (role && !allowedRoles.includes(role)) {
                router.push(`/${role}/dashboard`);
            } else if (!role) {
                router.push('/select-role');
            }
        }
    }, [isLoading, isAuthenticated, role, allowedRoles, router]);

    if (isLoading || !isAuthenticated || !role || !allowedRoles.includes(role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                        Verifying Access...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
