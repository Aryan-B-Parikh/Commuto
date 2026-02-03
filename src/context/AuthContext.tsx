'use client';

import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { currentUser } from '@/data/users';

export type UserRole = 'driver' | 'passenger' | null;

interface AuthContextType {
    user: User | null;
    role: UserRole;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    signup: (name: string, email: string, password: string) => Promise<boolean>;
    verifyOTP: (otp: string) => Promise<boolean>;
    logout: () => void;
    setRole: (role: UserRole) => void;
    pendingEmail: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRoleState] = useState<UserRole>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingEmail, setPendingEmail] = useState<string | null>(null);

    // Load role from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedRole = localStorage.getItem('commuto_role') as UserRole;
            if (savedRole) setRoleState(savedRole);
        }
    }, []);

    // Set role and persist to localStorage
    const setRole = useCallback((newRole: UserRole) => {
        setRoleState(newRole);
        if (typeof window !== 'undefined') {
            if (newRole) {
                localStorage.setItem('commuto_role', newRole);
            } else {
                localStorage.removeItem('commuto_role');
            }
        }
    }, []);

    // Simulated login
    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (email && password) {
            setPendingEmail(email);
            setIsLoading(false);
            return true;
        }

        setIsLoading(false);
        return false;
    }, []);

    // Simulated signup
    const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (name && email && password) {
            setPendingEmail(email);
            setIsLoading(false);
            return true;
        }

        setIsLoading(false);
        return false;
    }, []);

    // Simulated OTP verification
    const verifyOTP = useCallback(async (otp: string): Promise<boolean> => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (otp === '123456') {
            setUser({
                ...currentUser,
                email: pendingEmail || currentUser.email,
            });
            setPendingEmail(null);
            setIsLoading(false);
            return true;
        }

        setIsLoading(false);
        return false;
    }, [pendingEmail]);

    // Logout
    const logout = useCallback(() => {
        setUser(null);
        setPendingEmail(null);
        // Keep role for convenience
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                isAuthenticated: !!user,
                isLoading,
                login,
                signup,
                verifyOTP,
                logout,
                setRole,
                pendingEmail,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
