/**
 * Utility functions to transform between frontend and backend data formats
 */

import type { BackendUser, UserResponse } from '@/types/api';
import type { User } from '@/types';

/**
 * Transform backend user data to frontend User type
 */
export function transformBackendUser(backendUser: BackendUser | UserResponse): User {
    return {
        id: backendUser.id,
        name: backendUser.full_name,
        email: backendUser.email,
        phone: backendUser.phone_number || '',
        avatar: backendUser.avatar_url,
        role: 'role' in backendUser ? backendUser.role as 'passenger' | 'driver' : undefined,
        rating: 0, // Default, should come from driver/passenger profile
        totalTrips: 0, // Default, should come from driver/passenger profile
        verified: backendUser.is_verified,
        joinedDate: backendUser.created_at,
    };
}

/**
 * Transform frontend user data to backend format (for updates)
 */
export function transformFrontendUser(user: Partial<User>): Partial<BackendUser> {
    return {
        full_name: user.name,
        email: user.email,
        phone_number: user.phone,
        avatar_url: user.avatar,
    };
}
