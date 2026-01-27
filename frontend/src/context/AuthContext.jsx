import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('commuto_token')
        const storedUser = localStorage.getItem('commuto_user')

        if (token && storedUser) {
            try {
                const response = await authAPI.getMe()
                setUser(response.data.data)
            } catch (error) {
                // Token invalid, clear storage
                localStorage.removeItem('commuto_token')
                localStorage.removeItem('commuto_user')
                setUser(null)
            }
        }
        setLoading(false)
    }

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password })
        const { token, user: userData } = response.data.data

        localStorage.setItem('commuto_token', token)
        localStorage.setItem('commuto_user', JSON.stringify(userData))
        setUser(userData)

        return response.data
    }

    const registerRider = async (data) => {
        const response = await authAPI.registerRider(data)
        const { token, user: userData } = response.data.data

        localStorage.setItem('commuto_token', token)
        localStorage.setItem('commuto_user', JSON.stringify(userData))
        setUser(userData)

        return response.data
    }

    const registerDriver = async (data) => {
        const response = await authAPI.registerDriver(data)
        const { token, user: userData } = response.data.data

        localStorage.setItem('commuto_token', token)
        localStorage.setItem('commuto_user', JSON.stringify(userData))
        setUser(userData)

        return response.data
    }

    const logout = () => {
        localStorage.removeItem('commuto_token')
        localStorage.removeItem('commuto_user')
        setUser(null)
    }

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData }
        localStorage.setItem('commuto_user', JSON.stringify(newUser))
        setUser(newUser)
    }

    const isRider = user?.role === 'RIDER'
    const isDriver = user?.role === 'DRIVER'

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isRider,
            isDriver,
            login,
            registerRider,
            registerDriver,
            logout,
            updateUser,
            checkAuth
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
