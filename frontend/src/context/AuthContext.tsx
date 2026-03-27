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
    register: (data: RegisterRequest) => Promise<User | null>;
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

    // Load user from token on mount
    useEffect(() => {
        const loadUser = async () => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('auth_token');
                const savedRole = getPersistedRole();

                if (savedRole) setRoleState(savedRole);

                if (token) {
                    try {
                        const userData = await authAPI.getCurrentUser();
                        const frontendUser = transformBackendUser(userData);
                        setUser(frontendUser);
                        const effectiveRole = savedRole ?? (userData.role as UserRole);
                        setRoleState(effectiveRole);
                        if (effectiveRole) {
                            localStorage.setItem('commuto_role', effectiveRole);
                        }
                    } catch (error: any) {
                        // Only log real errors, not expected 401s (expired session)
                        if (error.response?.status !== 401) {
                            console.error('Failed to load user:', error);
                        }
                        localStorage.removeItem('auth_token');
                    }
                }
                setIsLoading(false);
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
    const register = useCallback(async (data: RegisterRequest): Promise<User | null> => {
        setIsLoading(true);
        try {
            const userData = await authAPI.register(data);
            const frontendUser = transformBackendUser(userData);

            // Auto-login after registration
            const loggedInUser = await login(data.email, data.password);

            setIsLoading(false);
            return loggedInUser;
        } catch (error) {
            console.error('Registration failed:', error);
            setIsLoading(false);
            return null;
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
            setRole(savedRole ?? (userData.role as UserRole));
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
