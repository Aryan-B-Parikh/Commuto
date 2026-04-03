/**
 * Utility functions to transform between frontend and backend data formats
 */

import type { BackendUser, UserResponse } from '@/types/api';
import type { User } from '@/types';

/**
 * Transform backend user data to frontend User type
 */
export function transformBackendUser(backendUser: BackendUser | UserResponse): User {
    const userResp = backendUser as UserResponse;
    return {
        id: backendUser.id,
        name: backendUser.full_name,
        full_name: backendUser.full_name,
        email: backendUser.email,
        phone: backendUser.phone_number || '',
        phone_number: backendUser.phone_number || '',
        avatar: backendUser.avatar_url,
        role: 'role' in backendUser ? backendUser.role as 'passenger' | 'driver' : undefined,
        rating: userResp.rating || 0,
        totalTrips: userResp.total_trips || 0,
        verified: backendUser.is_verified,
        profileCompleted: (backendUser as any).profileCompleted ?? false,
        joinedDate: backendUser.created_at,
        todayEarnings: userResp.today_earnings || 0,
        onlineHours: userResp.online_hours || 0,
        licensePhotoUrl: userResp.license_photo_url,
        gender: userResp.gender,
        date_of_birth: userResp.date_of_birth ? String(userResp.date_of_birth) : undefined,
        bio: userResp.bio,
        address: userResp.address,
        emergency_contact: userResp.emergency_contact ? {
            name: userResp.emergency_contact.name || '',
            relationship: userResp.emergency_contact.relationship || '',
            phone: userResp.emergency_contact.phone || '',
        } : undefined,
        travel_preferences: userResp.travel_preferences,
        accessibility_needs: userResp.accessibility_needs,
        license_number: userResp.license_number,
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
