// Backend API Types (matching NeonDB schema exactly)

export interface BackendUser {
    id: string;
    email: string;
    phone_number: string;  // Database column name
    full_name: string;
    avatar_url?: string;   // Database column name
    role: 'passenger' | 'driver';
    is_verified: boolean;
    is_phone_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
    phone: string;  // Frontend sends as 'phone', we'll map to phone_number
    role: 'passenger' | 'driver';
    // Driver-specific fields
    license_number?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_plate?: string;
    vehicle_capacity?: number;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface UserResponse {
    id: string;
    email: string;
    full_name: string;
    phone_number: string;
    avatar_url?: string;
    role: string;
    is_verified: boolean;
    created_at: string;
}

// Trip Types matching backend
export interface TripRequest {
    from_location: {
        address: string;
        lat: number;
        lng: number;
    };
    to_location: {
        address: string;
        lat: number;
        lng: number;
    };
    date: string;  // YYYY-MM-DD
    time: string;  // HH:MM
    seats_requested: number;
}

export interface TripResponse {
    id: string;
    driver_id?: string;
    from_address: string;
    to_address: string;
    start_time: string;
    seats_requested?: number;
    total_seats: number;
    available_seats: number;
    price_per_seat?: number;
    status: string;
    created_at: string;
    driver_name?: string;
    driver_rating?: number;
    driver_avatar?: string;
}

export interface BidRequest {
    amount: number;
    message?: string;
}

export interface BidResponse {
    id: string;
    trip_id: string;
    driver_id: string;
    bid_amount: number;
    status: string;
    created_at: string;
}
