'use client';

import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authAPI } from '@/services/api';
import { transformBackendUser } from '@/utils/transformers';
import type { RegisterRequest } from '@/types/api';

export type UserRole = 'driver' | 'passenger' | null;

interface AuthContextType {
    user: User | null;
    role: UserRole;
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (data: RegisterRequest) => Promise<boolean>;
    logout: () => void;
    setRole: (role: UserRole) => void;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRoleState] = useState<UserRole>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load user from token on mount
    useEffect(() => {
        const loadUser = async () => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('auth_token');
                const savedRole = localStorage.getItem('commuto_role') as UserRole;

                if (savedRole) setRoleState(savedRole);

                if (token) {
                    try {
                        setIsLoading(true);
                        const userData = await authAPI.getCurrentUser();
                        const frontendUser = transformBackendUser(userData);
                        setUser(frontendUser);
                        setRoleState(userData.role as UserRole);
                    } catch (error) {
                        console.error('Failed to load user:', error);
                        localStorage.removeItem('auth_token');
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        };
        loadUser();
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

    // Real login with backend API
    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const authResponse = await authAPI.login({ email, password });
            localStorage.setItem('auth_token', authResponse.access_token);

            // Fetch user data
            const userData = await authAPI.getCurrentUser();
            const frontendUser = transformBackendUser(userData);

            setUser(frontendUser);
            setRole(userData.role as UserRole);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            setIsLoading(false);
            return false;
        }
    }, [setRole]);

    // Real registration with backend API
    const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
        setIsLoading(true);
        try {
            const userData = await authAPI.register(data);
            const frontendUser = transformBackendUser(userData);

            // Auto-login after registration
            const loginSuccess = await login(data.email, data.password);

            setIsLoading(false);
            return loginSuccess;
        } catch (error) {
            console.error('Registration failed:', error);
            setIsLoading(false);
            return false;
        }
    }, [login]);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        try {
            const userData = await authAPI.getCurrentUser();
            const frontendUser = transformBackendUser(userData);
            setUser(frontendUser);
            setRole(userData.role as UserRole);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    }, [setRole]);

    // Logout
    const logout = useCallback(() => {
        setUser(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                isAuthenticated: !!user,
                isLoading,
                token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
                login,
                register,
                logout,
                setRole,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
