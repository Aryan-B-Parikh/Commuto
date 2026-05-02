// Backend API types matching the PostgreSQL schema

export interface BackendUser {
    id: string;
    email: string;
    phone_number: string;  // Database column name
    full_name: string;
    avatar_url?: string;   // Database column name
    role: 'passenger' | 'driver';
    is_verified: boolean;
    is_phone_verified: boolean;
    profile_completed: boolean;
    rating?: number;
    total_trips?: number;
    created_at: string;
    updated_at: string;
    license_photo_url?: string;
    // Profile fields
    gender?: string;
    date_of_birth?: string;
    bio?: string;
    address?: string;
    emergency_contact?: {
        name: string;
        relationship: string;
        phone: string;
    };
    travel_preferences?: string[];
    accessibility_needs?: boolean;
    license_number?: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
    phone: string;  // Frontend sends as 'phone', we'll map to phone_number
    role: 'passenger' | 'driver';
    gender?: string;
    date_of_birth?: string;
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
    is_phone_verified: boolean;
    profile_completed: boolean;
    rating?: number;
    total_trips?: number;
    today_earnings?: number;
    online_hours?: number;
    created_at: string;
    license_photo_url?: string;
    // Profile fields
    gender?: string;
    date_of_birth?: string;
    bio?: string;
    address?: string;
    emergency_contact?: {
        name: string;
        relationship: string;
        phone: string;
    };
    travel_preferences?: string[];
    accessibility_needs?: boolean;
    license_number?: string;
}

// Trip Types matching backend
export interface TripResponse {
    id: string;
    driver_id?: string;
    origin_address: string;
    dest_address: string;
    from_address?: string; // for backward compatibility
    to_address?: string;   // for backward compatibility
    start_time: string;
    seats_requested?: number;
    total_seats: number;
    available_seats: number;
    creator_passenger_id?: string;
    shared_ride?: boolean;
    total_price: number;
    price_per_seat?: number;
    status: string;
    created_at: string;
    driver_name?: string;
    driver_rating?: number;
    driver_avatar?: string;
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
    vehicle_details?: string;
    bid_count?: number;
    booking_id?: string;
    booking_total_price?: number;
    booking_payment_status?: string;
    payment_method?: 'online' | 'cash';
    notes?: string;
    start_otp?: string;
    completion_otp?: string;
    otp_verified?: boolean;
    passenger_notes?: { passenger_name: string; notes: string }[];
}

export interface CreateSharedRideRequest {
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
    date: string;
    time: string;
    total_seats: number;
    total_price: number;
    payment_method: 'online' | 'cash';
    notes?: string;
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

export interface DriverBidWithTrip {
    id: string;
    trip_id: string;
    driver_id: string;
    bid_amount: number;
    status: string;
    created_at: string;
    is_counter_bid?: boolean;
    parent_bid_id?: string;
    origin_address: string;
    dest_address: string;
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
    trip_status: string;
    start_time: string;
    total_seats: number;
    total_price: number;
    price_per_seat?: number;
    notes?: string;
    passenger_notes?: { passenger_name: string; notes: string }[];
}

export interface ActionResponse {
    message: string;
    success?: boolean;
}

export interface TripPaymentOrderResponse {
    order_id: string;
    amount: number;
    currency: string;
    key: string;
    trip_id: string;
    booking_id: string;
}

export interface TripPaymentVerifyRequest {
    trip_id: string;
    booking_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}
