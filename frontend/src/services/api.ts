import axios from 'axios';
import type {
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
    TripRequest,
    TripResponse,
    BidRequest,
    BidResponse
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth APIs
export const authAPI = {
    register: async (data: RegisterRequest): Promise<UserResponse> => {
        const response = await api.post<UserResponse>('/auth/register', data);
        return response.data;
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    getCurrentUser: async (): Promise<UserResponse> => {
        const response = await api.get<UserResponse>('/auth/me');
        return response.data;
    },
};

// Trips APIs
export const tripsAPI = {
    createTrip: async (data: TripRequest): Promise<TripResponse> => {
        const response = await api.post<TripResponse>('/rides/request', data);
        return response.data;
    },

    getOpenRides: async (): Promise<TripResponse[]> => {
        const response = await api.get<TripResponse[]>('/rides/open');
        return response.data;
    },

    getMyTrips: async (): Promise<TripResponse[]> => {
        const response = await api.get<TripResponse[]>('/rides/my-trips');
        return response.data;
    },

    cancelTrip: async (tripId: string): Promise<{ message: string }> => {
        const response = await api.post(`/rides/${tripId}/cancel`);
        return response.data;
    },
};

// Bids APIs
export const bidsAPI = {
    placeBid: async (rideId: string, data: BidRequest): Promise<BidResponse> => {
        const response = await api.post<BidResponse>(`/bids/${rideId}`, data);
        return response.data;
    },

    getRideBids: async (rideId: string): Promise<BidResponse[]> => {
        const response = await api.get<BidResponse[]>(`/bids/${rideId}/all`);
        return response.data;
    },

    acceptBid: async (bidId: string): Promise<{ message: string; trip_id: string; otp: string }> => {
        const response = await api.post(`/bids/${bidId}/accept`);
        return response.data;
    },

    counterBid: async (bidId: string, data: BidRequest): Promise<BidResponse> => {
        const response = await api.post<BidResponse>(`/bids/${bidId}/counter`, data);
        return response.data;
    },
};

// OTP APIs
export const otpAPI = {
    verifyOTP: async (tripId: string, otp: string): Promise<{ message: string }> => {
        const response = await api.post(`/rides/${tripId}/verify-otp`, { otp });
        return response.data;
    },

    completeRide: async (tripId: string): Promise<{ message: string }> => {
        const response = await api.post(`/rides/${tripId}/complete`);
        return response.data;
    },
};

export default api;
