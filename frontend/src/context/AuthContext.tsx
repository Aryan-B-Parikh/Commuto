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
    login: (email: string, password: string) => Promise<User | null>;
    register: (data: RegisterRequest) => Promise<User>;
    googleLogin: (credential: string, role?: string) => Promise<User | null>;
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
    const [isLoading, setIsLoading] = useState(true);

    const getPersistedRole = (): UserRole => {
        if (typeof window === 'undefined') {
            return null;
        }

        const savedRole = localStorage.getItem('commuto_role');
        if (savedRole === 'driver' || savedRole === 'passenger') {
            return savedRole;
        }

        return null;
    };

    const getRoleFromPathname = (): UserRole => {
        if (typeof window === 'undefined') {
            return null;
        }

        const path = window.location.pathname;
        if (path.startsWith('/driver')) {
            return 'driver';
        }
        if (path.startsWith('/passenger')) {
            return 'passenger';
        }
        return null;
    };

    // Load user from token on mount
    useEffect(() => {
        const loadUser = async () => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('auth_token');
                const savedRole = getPersistedRole();
                const routeRole = getRoleFromPathname();

                if (routeRole || savedRole) setRoleState(routeRole ?? savedRole);

                if (token) {
                    try {
                        const userData = await authAPI.getCurrentUser();
                        const frontendUser = transformBackendUser(userData);
                        setUser(frontendUser);
                        // Use backend role as source of truth; saved role is only a fallback.
                        const backendRole = userData.role as UserRole;
                        const effectiveRole = routeRole ?? backendRole ?? savedRole;
                        setRoleState(effectiveRole);
                        if (effectiveRole) {
                            localStorage.setItem('commuto_role', effectiveRole);
                        }
                    } catch (error: any) {
                        const status = error?.response?.status;
                        const isNetworkError = !error?.response && (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error');

                        if (isNetworkError) {
                            console.warn('Auth check skipped: backend unreachable.');
                            setUser(null);
                        } else if (status !== 401) {
                            console.error('Failed to load user:', error);
                        }

                        // Clear persisted auth only on actual unauthorized response.
                        if (status === 401) {
                            localStorage.removeItem('auth_token');
                            localStorage.removeItem('commuto_role');
                        }
                    }
                }
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    // Route guard: redirect users with incomplete profiles to /complete-profile
    useEffect(() => {
        if (typeof window === 'undefined' || isLoading || !user) return;
        const path = window.location.pathname;

        // Pages that should NOT trigger the redirect (auth/onboarding pages)
        const allowedPaths = [
            '/complete-profile',
            '/login',
            '/signup',
            '/select-role',
            '/verify-email',
            '/verify-phone',
            '/verify-otp',
            '/',
        ];

        const isAllowed = allowedPaths.some(
            (p) => path === p || path.startsWith(p + '/')
        );

        if (!user.profileCompleted && !isAllowed) {
            window.location.href = '/complete-profile';
        }
    }, [user, isLoading]);

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
    const login = useCallback(async (email: string, password: string): Promise<User | null> => {
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
            return frontendUser;
        } catch (error) {
            console.error('Login failed:', error);
            setIsLoading(false);
            return null;
        }
    }, [setRole]);

    // Real registration with backend API
    const register = useCallback(async (data: RegisterRequest): Promise<User> => {
        setIsLoading(true);
        try {
            await authAPI.register(data);

            // Auto-login after registration
            const loggedInUser = await login(data.email, data.password);
            if (!loggedInUser) {
                throw new Error('Registration succeeded but auto-login failed');
            }

            setIsLoading(false);
            return loggedInUser;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    }, [login]);

    // Google Login
    const googleLogin = useCallback(async (credential: string, role?: string): Promise<User | null> => {
        setIsLoading(true);
        try {
            const authResponse = await authAPI.googleLogin(credential, role);
            localStorage.setItem('auth_token', authResponse.access_token);

            // Fetch user data
            const userData = await authAPI.getCurrentUser();
            const frontendUser = transformBackendUser(userData);

            setUser(frontendUser);
            setRole(userData.role as UserRole);
            setIsLoading(false);
            return frontendUser;
        } catch (error) {
            console.error('Google login failed:', error);
            setIsLoading(false);
            return null;
        }
    }, [setRole]);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        try {
            const userData = await authAPI.getCurrentUser();
            const frontendUser = transformBackendUser(userData);
            setUser(frontendUser);
            const savedRole = getPersistedRole();
            const routeRole = getRoleFromPathname();
            const backendRole = userData.role as UserRole;
            setRole(routeRole ?? backendRole ?? savedRole);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    }, [setRole]);

    // Logout
    const logout = useCallback(() => {
        setUser(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('commuto_role');
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                googleLogin,
                logout,
                setRole,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
