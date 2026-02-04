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
    avatar?: string;  // Make optional to handle empty values
    role?: 'passenger' | 'driver';  // Add role field
    rating: number;
    totalTrips: number;
    verified: boolean;
    joinedDate: string;
}

// Trip type
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
    status: 'pending' | 'upcoming' | 'active' | 'completed' | 'cancelled';
    distance: string;
    duration: string;
    vehicleType: string;
    vehicleNumber: string;
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
