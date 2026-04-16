// Location type
export interface Location {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
}

// User type
export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    full_name?: string;     // Explicit matching for profile form
    phone_number?: string;
    avatar?: string;
    role?: 'passenger' | 'driver';
    rating: number;
    todayEarnings?: number;
    onlineHours?: number;
    totalTrips?: number;
    verified: boolean;
    isPhoneVerified?: boolean;
    profileCompleted: boolean;
    joinedDate: string;
    licensePhotoUrl?: string;
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

// Trip type
export type RideStatus = 'requested' | 'accepted' | 'started' | 'completed' | 'cancelled';
export type LegacyRideStatus = 'pending' | 'upcoming' | 'active' | 'bid_accepted' | 'driver_assigned';

export interface Trip {
    id: string;
    from: Location;
    to: Location;
    date: string;
    time: string;
    totalSeats: number;
    seatsAvailable: number;
    pricePerSeat: number;
    driver: User;
    passengers: User[];
    status: RideStatus | LegacyRideStatus;
    distance: string;
    duration: string;
    vehicleType: string;
    vehicleNumber: string;
    bidCount?: number;
}

// Testimonial type
export interface Testimonial {
    id: string;
    name: string;
    role: string;
    avatar: string;
    content: string;
    rating: number;
}

// Notification type
export interface Notification {
    id: string;
    type: 'trip' | 'payment' | 'system';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

// Billing type
export interface Billing {
    id: string;
    tripId: string;
    baseFare: number;
    distanceCharge: number;
    platformFee: number;
    taxes: number;
    total: number;
    splitAmount: number;
    passengers: number;
    paymentStatus: 'pending' | 'completed' | 'failed';
    paymentMethod: string;
}

// Toast type
export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}
