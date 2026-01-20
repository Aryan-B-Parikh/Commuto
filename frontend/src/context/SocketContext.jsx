import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        if (user) {
            // Connect to socket server
            const newSocket = io(SOCKET_URL, {
                transports: ['websocket', 'polling']
            })

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id)
                setIsConnected(true)
            })

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected')
                setIsConnected(false)
            })

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error)
                setIsConnected(false)
            })

            setSocket(newSocket)

            return () => {
                newSocket.close()
            }
        } else {
            // Disconnect when user logs out
            if (socket) {
                socket.close()
                setSocket(null)
                setIsConnected(false)
            }
        }
    }, [user])

    // Join a ride room
    const joinRideRoom = (rideId) => {
        if (socket) {
            socket.emit('join-ride-room', rideId)
        }
    }

    // Leave a ride room
    const leaveRideRoom = (rideId) => {
        if (socket) {
            socket.emit('leave-ride-room', rideId)
        }
    }

    // Send location update
    const sendLocationUpdate = (rideId, lat, lng) => {
        if (socket) {
            socket.emit('location-update', { rideId, lat, lng })
        }
    }

    // Trigger ride update broadcast
    const triggerRideUpdate = (rideId) => {
        if (socket) {
            socket.emit('ride-update', rideId)
        }
    }

    // Subscribe to ride updates
    const onRideUpdate = (callback) => {
        if (socket) {
            socket.on('ride-updated', callback)
            return () => socket.off('ride-updated', callback)
        }
        return () => { }
    }

    // Subscribe to location updates
    const onLocationUpdate = (callback) => {
        if (socket) {
            socket.on('location-broadcast', callback)
            return () => socket.off('location-broadcast', callback)
        }
        return () => { }
    }

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            joinRideRoom,
            leaveRideRoom,
            sendLocationUpdate,
            triggerRideUpdate,
            onRideUpdate,
            onLocationUpdate
        }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => {
    const context = useContext(SocketContext)
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider')
    }
    return context
}
