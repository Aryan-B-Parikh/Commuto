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
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me')
}

// Rides API
export const ridesAPI = {
    getAll: (params) => api.get('/rides', { params }),
    getOne: (id) => api.get(`/rides/${id}`),
    create: (data) => api.post('/rides', data),
    join: (id) => api.post(`/rides/${id}/join`),
    leave: (id) => api.post(`/rides/${id}/leave`),
    verifyOTP: (id, otp) => api.post(`/rides/${id}/verify-otp`, { otp }),
    updateLocation: (id, lat, lng) => api.patch(`/rides/${id}/location`, { lat, lng }),
    complete: (id, distance) => api.patch(`/rides/${id}/complete`, { distance }),
    cancel: (id) => api.patch(`/rides/${id}/cancel`),
    getMyRides: () => api.get('/rides/my-rides')
}

// Bills API
export const billsAPI = {
    getAll: () => api.get('/bills'),
    getOne: (rideId) => api.get(`/bills/${rideId}`)
}

export default api
