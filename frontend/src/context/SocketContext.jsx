import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isDriverOnline, setIsDriverOnline] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        if (user) {
            const token = localStorage.getItem('commuto_token')

            // Connect with authentication
            const newSocket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                auth: { token }
            })

            newSocket.on('connect', () => {
                console.log('🔌 Socket connected:', newSocket.id)
                setIsConnected(true)
            })

            newSocket.on('disconnect', () => {
                console.log('🔌 Socket disconnected')
                setIsConnected(false)
            })

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error.message)
                setIsConnected(false)
            })

            // Driver status updates
            newSocket.on('status-update', ({ isOnline, message }) => {
                setIsDriverOnline(isOnline)
                console.log('📍 Status:', message)
            })

            setSocket(newSocket)

            return () => {
                newSocket.close()
            }
        } else {
            if (socket) {
                socket.close()
                setSocket(null)
                setIsConnected(false)
                setIsDriverOnline(false)
            }
        }
    }, [user])

    // === DRIVER ACTIONS ===
    const goOnline = useCallback(() => {
        if (socket) {
            socket.emit('driver-online')
        }
    }, [socket])

    const goOffline = useCallback(() => {
        if (socket) {
            socket.emit('driver-offline')
        }
    }, [socket])

    const submitBid = useCallback((rideId, offeredFare) => {
        if (socket) {
            socket.emit('submit-bid', { rideId, offeredFare })
        }
    }, [socket])

    // === RIDE ROOM ACTIONS ===
    const joinRideRoom = useCallback((rideId) => {
        if (socket) {
            socket.emit('join-ride-room', rideId)
        }
    }, [socket])

    const leaveRideRoom = useCallback((rideId) => {
        if (socket) {
            socket.emit('leave-ride-room', rideId)
        }
    }, [socket])

    const sendLocationUpdate = useCallback((rideId, lat, lng) => {
        if (socket) {
            socket.emit('location-update', { rideId, lat, lng })
        }
    }, [socket])

    // === EVENT SUBSCRIPTIONS ===

    // New ride requests (for drivers)
    const onNewRideRequest = useCallback((callback) => {
        if (socket) {
            socket.on('new-ride-request', callback)
            return () => socket.off('new-ride-request', callback)
        }
        return () => { }
    }, [socket])

    // Direct ride requests (for specific driver)
    const onDirectRideRequest = useCallback((callback) => {
        if (socket) {
            socket.on('direct-ride-request', callback)
            return () => socket.off('direct-ride-request', callback)
        }
        return () => { }
    }, [socket])

    // Bid received (for riders)
    const onReceiveBid = useCallback((callback) => {
        if (socket) {
            socket.on('receive-bid', callback)
            return () => socket.off('receive-bid', callback)
        }
        return () => { }
    }, [socket])

    // Counter offer (for drivers)
    const onCounterOffer = useCallback((callback) => {
        if (socket) {
            socket.on('counter-offer', callback)
            return () => socket.off('counter-offer', callback)
        }
        return () => { }
    }, [socket])

    // Bid accepted (for drivers)
    const onBidAccepted = useCallback((callback) => {
        if (socket) {
            socket.on('bid-accepted', callback)
            return () => socket.off('bid-accepted', callback)
        }
        return () => { }
    }, [socket])

    // Bid rejected (for drivers)
    const onBidRejected = useCallback((callback) => {
        if (socket) {
            socket.on('bid-rejected', callback)
            return () => socket.off('bid-rejected', callback)
        }
        return () => { }
    }, [socket])

    // Ride started
    const onRideStarted = useCallback((callback) => {
        if (socket) {
            socket.on('ride-started', callback)
            return () => socket.off('ride-started', callback)
        }
        return () => { }
    }, [socket])

    // Location updates
    const onLocationUpdate = useCallback((callback) => {
        if (socket) {
            socket.on('location-broadcast', callback)
            return () => socket.off('location-broadcast', callback)
        }
        return () => { }
    }, [socket])

    // Ride completed
    const onRideCompleted = useCallback((callback) => {
        if (socket) {
            socket.on('ride-completed', callback)
            return () => socket.off('ride-completed', callback)
        }
        return () => { }
    }, [socket])

    // Ride cancelled
    const onRideCancelled = useCallback((callback) => {
        if (socket) {
            socket.on('ride-cancelled', callback)
            return () => socket.off('ride-cancelled', callback)
        }
        return () => { }
    }, [socket])

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            isDriverOnline,
            // Driver actions
            goOnline,
            goOffline,
            submitBid,
            // Ride room
            joinRideRoom,
            leaveRideRoom,
            sendLocationUpdate,
            // Event subscriptions
            onNewRideRequest,
            onDirectRideRequest,
            onReceiveBid,
            onCounterOffer,
            onBidAccepted,
            onBidRejected,
            onRideStarted,
            onLocationUpdate,
            onRideCompleted,
            onRideCancelled
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
