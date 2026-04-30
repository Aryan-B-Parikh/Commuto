'use client';

import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authAPI } from '@/services/api';
import { transformBackendUser } from '@/utils/transformers';
import { authStorage } from '@/utils/authStorage';
import type { RegisterRequest } from '@/types/api';

export type UserRole = 'driver' | 'passenger' | null;

interface AuthContextType {
    user: User | null;
    role: UserRole;
    isAuthenticated: boolean;
    isLoading: boolean;
    pendingEmail: string | null;
    login: (email: string, password: string) => Promise<User | null>;
    register: (data: RegisterRequest) => Promise<User>;
    googleLogin: (credential: string, role?: string) => Promise<User | null>;
    verifyOTP: (otp: string) => Promise<boolean>;
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
    const [pendingEmail, setPendingEmail] = useState<string | null>(null);

    const getPersistedRole = (): UserRole => {
        return authStorage.getRole();
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
                const token = authStorage.getToken();
                const savedRole = getPersistedRole();
                const routeRole = getRoleFromPathname();

                if (!token) {
                    if (routeRole || savedRole) setRoleState(routeRole ?? savedRole);
                    setIsLoading(false);
                    return;
                }

                try {
                    const userData = await authAPI.getCurrentUser();
                    const frontendUser = transformBackendUser(userData);
                    setUser(frontendUser);
                    // Backend role is authoritative after authentication.
                    const backendRole = userData.role as UserRole;
                    const effectiveRole = backendRole ?? routeRole ?? savedRole;
                    setRoleState(effectiveRole);
                    if (effectiveRole) {
                        authStorage.setRole(effectiveRole);
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
                        authStorage.clearSession();
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
            '/complete-setup',
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

        if (isAllowed) return;

        // Force complete setup if core data is missing
        const isCoreDataMissing = !user.phone_number || !user.gender || !user.date_of_birth;
        if (isCoreDataMissing) {
            window.location.href = '/complete-setup';
            return;
        }

        // Force complete profile if required fields are missing
        if (!user.profileCompleted) {
            window.location.href = '/complete-profile';
        }
    }, [user, isLoading]);

    // Set role and persist to localStorage
    const setRole = useCallback((newRole: UserRole) => {
        setRoleState(newRole);
        if (newRole) {
            authStorage.setRole(newRole);
        } else {
            authStorage.clearRole();
        }
    }, []);

    // Real login with backend API
    const login = useCallback(async (email: string, password: string): Promise<User | null> => {
        setIsLoading(true);
        try {
            const authResponse = await authAPI.login({ email, password });
            authStorage.setToken(authResponse.access_token);
            setPendingEmail(email);

            // Fetch user data
            const userData = await authAPI.getCurrentUser();
            const frontendUser = transformBackendUser(userData);

            setUser(frontendUser);
            setPendingEmail(frontendUser.email);
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
            setPendingEmail(data.email);
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
            const requestedRole = role === 'driver' || role === 'passenger' ? role : 'passenger';
            const authResponse = await authAPI.googleLogin(credential, requestedRole);
            authStorage.setToken(authResponse.access_token);

            // Fetch user data
            const userData = await authAPI.getCurrentUser();
            const frontendUser = transformBackendUser(userData);

            setUser(frontendUser);
            setPendingEmail(frontendUser.email);
            setRole(userData.role as UserRole);
            setIsLoading(false);
            return frontendUser;
        } catch (error) {
            console.error('Google login failed:', error);
            setIsLoading(false);
            return null;
        }
    }, [setRole]);

    // Legacy OTP page support. Use the real backend email verification endpoint.
    const verifyOTP = useCallback(async (otp: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            await authAPI.verifyEmail(otp.trim());
            setPendingEmail(null);
            return true;
        } catch (error) {
            console.error('OTP verification failed:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        try {
            const userData = await authAPI.getCurrentUser();
            const frontendUser = transformBackendUser(userData);
            setUser(frontendUser);
            const savedRole = getPersistedRole();
            const routeRole = getRoleFromPathname();
            const backendRole = userData.role as UserRole;
            setRole(backendRole ?? routeRole ?? savedRole);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    }, [setRole]);

    // Logout
    const logout = useCallback(() => {
        setUser(null);
        authStorage.clearSession();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                isAuthenticated: !!user,
                isLoading,
                pendingEmail,
                login,
                register,
                googleLogin,
                verifyOTP,
                logout,
                setRole,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
