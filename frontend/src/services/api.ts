import axios from 'axios';
import axiosRetry from 'axios-retry';
import { authStorage } from '@/utils/authStorage';
import type {
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
    TripResponse,
    CreateSharedRideRequest,
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
        const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');

        if (isNetworkError) {
            console.error('API Network Error detected!', {
                config: error.config,
                code: error.code,
                message: error.message,
                baseURL: error.config?.baseURL,
                url: error.config?.url,
                method: error.config?.method
            });
            // Check if CORS is likely the issue (host mismatch or blocked)
            return Promise.reject(new Error(`Network Error: Ensure backend is running at ${error.config?.baseURL || 'localhost:8000'} and CORS covers ${window.location.origin}`));
        }

        if (error.response?.status === 401) {
            const isAuthReq = error.config?.url?.includes('/auth/');
            if (!isAuthReq) {
                console.warn('Session expired or unauthorized request to:', error.config?.url);
                // Clear state and redirect only if necessary, or let the hook handle it
                authStorage.clearSession();
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login?expired=true';
                }
            }
        }

        // Detailed logging for non-401 errors
        if (error.response?.status !== 401) {
            console.warn('API Warning/Bad Request:', {
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
    const token = authStorage.getToken();
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

    sendVerification: async (): Promise<{ message: string; dev_token?: string; dev_verify_url?: string }> => {
        const response = await api.post('/auth/send-verification');
        return response.data;
    },

    verifyEmail: async (token: string): Promise<{ message: string; is_verified: boolean }> => {
        const response = await api.post('/auth/verify-email', { token });
        return response.data;
    },

    sendPhoneVerification: async (): Promise<{ message: string; dev_otp?: string }> => {
        const response = await api.post('/auth/send-phone-verification');
        return response.data;
    },

    verifyPhone: async (otp: string): Promise<{ message: string; is_phone_verified: boolean }> => {
        const response = await api.post('/auth/verify-phone', { otp });
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

    createSharedRide: async (data: CreateSharedRideRequest): Promise<TripResponse> => {
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

    joinRide: async (tripId: string, notes?: string): Promise<any> => {
        const response = await api.post(`/rides/${tripId}/join`, notes ? { notes } : {});
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

    getReceipt: async (tripId: string): Promise<any> => {
        const response = await api.get(`/rides/${tripId}/receipt`);
        return response.data;
    },

    rateDriver: async (tripId: string, rating: number, comment?: string): Promise<any> => {
        const response = await api.post(`/rides/${tripId}/rate-driver`, { rating, comment });
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
    verifyOTP: async (tripId: string, otp: string): Promise<{ message: string; completion_otp: string }> => {
        const response = await api.post(`/rides/${tripId}/verify-otp`, { otp });
        return response.data;
    },

    completeRide: async (tripId: string, otp: string): Promise<{ message: string }> => {
        const response = await api.post(`/rides/${tripId}/complete`, { otp });
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

// Notifications APIs
export const notificationsAPI = {
    getNotifications: async (): Promise<any[]> => {
        const response = await api.get('/notifications/');
        return response.data;
    },

    markAsRead: async (id: string): Promise<void> => {
        await api.post(`/notifications/${id}/read`);
    },

    markAllAsRead: async (): Promise<void> => {
        await api.post('/notifications/read-all');
    },

    clearAll: async (): Promise<void> => {
        await api.delete('/notifications/');
    }
};

export default api;

