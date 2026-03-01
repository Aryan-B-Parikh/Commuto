import axios from 'axios';
import axiosRetry from 'axios-retry';
import type {
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
    TripResponse,
    BidRequest,
    BidResponse,
    TripPaymentOrderResponse,
    TripPaymentVerifyRequest
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosRetry(api, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

api.interceptors.response.use(
    response => response,
    error => {
        // Don't log 401 errors to console as they involve expected auth flows
        if (error.response?.status !== 401) {
            console.error('API Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                url: error.config?.url
            });
        }
        return Promise.reject(error);
    }
);

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

    googleLogin: async (token: string, role?: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/google', { token, role });
        return response.data;
    },

    getCurrentUser: async (): Promise<UserResponse> => {
        const response = await api.get<UserResponse>('/auth/me');
        return response.data;
    },

    updateProfile: async (data: any): Promise<UserResponse> => {
        const response = await api.patch<UserResponse>('/auth/me', data);
        return response.data;
    },
};


// Trips APIs
export const tripsAPI = {
    getOpenRides: async (): Promise<TripResponse[]> => {
        const response = await api.get<TripResponse[]>('/rides/open');
        return response.data;
    },

    getMyTrips: async (): Promise<TripResponse[]> => {
        const response = await api.get<TripResponse[]>('/rides/my-trips');
        return response.data;
    },

    getDriverTrips: async (): Promise<TripResponse[]> => {
        const response = await api.get<TripResponse[]>('/rides/driver-trips');
        return response.data;
    },

    cancelTrip: async (tripId: string): Promise<{ message: string }> => {
        const response = await api.post(`/rides/${tripId}/cancel`);
        return response.data;
    },

    getDriverEarnings: async (): Promise<any> => {
        const response = await api.get('/rides/driver-earnings');
        return response.data;
    },

    createSharedRide: async (data: any): Promise<TripResponse> => {
        const response = await api.post<TripResponse>('/rides/create-shared', data);
        return response.data;
    },

    getAvailableRides: async (): Promise<TripResponse[]> => {
        const response = await api.get<TripResponse[]>('/rides/available');
        return response.data;
    },

    getTripDetails: async (tripId: string): Promise<any> => {
        const response = await api.get(`/rides/${tripId}/details`);
        return response.data;
    },

    joinRide: async (tripId: string): Promise<any> => {
        const response = await api.post(`/rides/${tripId}/join`);
        return response.data;
    },

    leaveRide: async (tripId: string): Promise<any> => {
        const response = await api.post(`/rides/${tripId}/leave`);
        return response.data;
    },

    createTripPaymentOrder: async (tripId: string, bookingId: string): Promise<TripPaymentOrderResponse> => {
        const response = await api.post<TripPaymentOrderResponse>(`/rides/${tripId}/pay-order`, null, {
            params: { booking_id: bookingId }
        });
        return response.data;
    },

    verifyTripPayment: async (data: TripPaymentVerifyRequest): Promise<any> => {
        const response = await api.post('/rides/verify-trip-payment', data);
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

    getMyBids: async (): Promise<import('@/types/api').DriverBidWithTrip[]> => {
        const response = await api.get<import('@/types/api').DriverBidWithTrip[]>('/bids/my-bids');
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

// Wallet APIs
export const walletAPI = {
    getWallet: async (): Promise<{ balance: number; currency: string }> => {
        const response = await api.get('/wallet');
        return response.data;
    },

    getTransactions: async (): Promise<any[]> => {
        const response = await api.get('/wallet/transactions');
        return response.data;
    },

    addMoney: async (amount: number): Promise<{
        order_id: string;
        amount: number;
        currency: string;
        key: string;
    }> => {
        const response = await api.post('/wallet/add-money', { amount });
        return response.data;
    },

    verifyPayment: async (paymentData: any): Promise<{ status: string; new_balance: number }> => {
        const response = await api.post('/wallet/verify-payment', paymentData);
        return response.data;
    },

    transfer: async (data: { recipient_email: string; amount: number; note?: string }): Promise<any> => {
        const response = await api.post('/wallet/transfer', data);
        return response.data;
    }
};

// Payment Methods APIs
export const paymentMethodsAPI = {
    getMethods: async (): Promise<any[]> => {
        const response = await api.get('/auth/payment-methods');
        return response.data;
    },

    addMethod: async (data: { type: string; provider: string; last4: string; is_default?: boolean }): Promise<any> => {
        const response = await api.post('/auth/payment-methods', data);
        return response.data;
    },

    deleteMethod: async (id: string): Promise<void> => {
        await api.delete(`/auth/payment-methods/${id}`);
    },

    setDefault: async (id: string): Promise<any> => {
        const response = await api.patch(`/auth/payment-methods/${id}/default`);
        return response.data;
    }
};

export default api;
