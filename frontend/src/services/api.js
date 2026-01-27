import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Create axios instance
const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('commuto_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('commuto_token')
            localStorage.removeItem('commuto_user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Auth API
export const authAPI = {
    registerRider: (data) => api.post('/auth/register-rider', data),
    registerDriver: (data) => api.post('/auth/register-driver', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateDriverStatus: (isOnline) => api.patch('/auth/driver-status', { isOnline }),
    getOnlineDrivers: () => api.get('/auth/drivers/online')
}

// Rides API
export const ridesAPI = {
    // Rider actions
    createRequest: (data) => api.post('/rides/request', data),
    getMyRides: () => api.get('/rides/my-rides'),
    getRide: (id) => api.get(`/rides/${id}`),
    counterBid: (rideId, bidId, counterFare) => api.post(`/rides/${rideId}/counter`, { bidId, counterFare }),
    acceptBid: (rideId, bidId) => api.post(`/rides/${rideId}/accept-bid`, { bidId }),
    rejectBid: (rideId, bidId) => api.post(`/rides/${rideId}/reject-bid`, { bidId }),

    // Driver actions
    getAvailable: () => api.get('/rides/available'),
    submitBid: (rideId, offeredFare) => api.post(`/rides/${rideId}/bid`, { offeredFare }),
    startRide: (rideId, otp) => api.post(`/rides/${rideId}/start`, { otp }),
    updateLocation: (rideId, lat, lng) => api.patch(`/rides/${rideId}/location`, { lat, lng }),
    completeRide: (rideId, distance) => api.post(`/rides/${rideId}/complete`, { distance }),

    // Shared
    cancelRide: (rideId) => api.post(`/rides/${rideId}/cancel`)
}

// Bills API
export const billsAPI = {
    getHistory: () => api.get('/bills/history'),
    getBill: (rideId) => api.get(`/bills/${rideId}`)
}

export default api
