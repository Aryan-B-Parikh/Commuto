import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { ridesAPI, authAPI } from '../services/api'

const DriverDashboard = () => {
    const { user } = useAuth()
    const {
        isConnected,
        isDriverOnline,
        goOnline,
        goOffline,
        onNewRideRequest,
        onDirectRideRequest,
        onBidAccepted,
        onBidRejected
    } = useSocket()
    const navigate = useNavigate()

    const [rideRequests, setRideRequests] = useState([])
    const [activeRide, setActiveRide] = useState(null)
    const [bidAmounts, setBidAmounts] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Load available rides on mount
    useEffect(() => {
        if (isDriverOnline) {
            loadAvailableRides()
        }
    }, [isDriverOnline])

    // Load active ride (if any)
    useEffect(() => {
        loadActiveRide()
    }, [])

    // Subscribe to new ride requests
    useEffect(() => {
        if (isDriverOnline) {
            const unsubNew = onNewRideRequest((ride) => {
                setRideRequests(prev => {
                    if (prev.find(r => r.id === ride.id)) return prev
                    return [ride, ...prev]
                })
            })

            const unsubDirect = onDirectRideRequest((ride) => {
                setRideRequests(prev => {
                    if (prev.find(r => r.id === ride.id)) return prev
                    return [{ ...ride, isDirect: true }, ...prev]
                })
                setSuccess('New direct ride request received!')
            })

            const unsubAccepted = onBidAccepted(({ rideId, ride }) => {
                setActiveRide(ride)
                setRideRequests(prev => prev.filter(r => r.id !== rideId))
                setSuccess('Your bid was accepted! Check active ride.')
            })

            const unsubRejected = onBidRejected(({ rideId }) => {
                setRideRequests(prev => prev.map(r =>
                    r.id === rideId ? { ...r, myBidRejected: true } : r
                ))
            })

            return () => {
                unsubNew()
                unsubDirect()
                unsubAccepted()
                unsubRejected()
            }
        }
    }, [isDriverOnline, onNewRideRequest, onDirectRideRequest, onBidAccepted, onBidRejected])

    const loadAvailableRides = async () => {
        try {
            const response = await ridesAPI.getAvailable()
            setRideRequests(response.data.data)
        } catch (err) {
            console.error('Error loading rides:', err)
        }
    }

    const loadActiveRide = async () => {
        try {
            const response = await ridesAPI.getMyRides()
            const rides = response.data.data
            const active = rides.find(r =>
                ['CONFIRMED', 'ONGOING'].includes(r.status)
            )
            if (active) {
                setActiveRide(active)
            }
        } catch (err) {
            console.error('Error loading active ride:', err)
        }
    }

    const handleToggleOnline = async () => {
        try {
            if (isDriverOnline) {
                goOffline()
                await authAPI.updateDriverStatus(false)
            } else {
                goOnline()
                await authAPI.updateDriverStatus(true)
            }
        } catch (err) {
            setError('Failed to update status')
        }
    }

    const handleBidChange = (rideId, value) => {
        setBidAmounts(prev => ({
            ...prev,
            [rideId]: value
        }))
    }

    const handleSubmitBid = async (rideId) => {
        const amount = bidAmounts[rideId]
        if (!amount || amount <= 0) {
            setError('Please enter a valid bid amount')
            return
        }

        setLoading(true)
        try {
            await ridesAPI.submitBid(rideId, parseFloat(amount))
            setSuccess('Bid submitted successfully!')
            setBidAmounts(prev => ({ ...prev, [rideId]: '' }))

            // Mark as bid submitted
            setRideRequests(prev => prev.map(r =>
                r.id === rideId ? { ...r, hasBid: true } : r
            ))
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit bid')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header with Online Toggle */}
                <div className="glass-card p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                🚗 Driver Dashboard
                            </h1>
                            <p className="text-gray-400 mt-1">Hello, {user?.name}</p>
                        </div>
                        <button
                            onClick={handleToggleOnline}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${isDriverOnline
                                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                    : 'bg-gray-700 text-gray-300'
                                }`}
                        >
                            {isDriverOnline ? '🟢 Online' : '🔴 Offline'}
                        </button>
                    </div>

                    {!isConnected && (
                        <p className="text-yellow-400 text-sm mt-2">
                            ⚠️ Connecting to server...
                        </p>
                    )}
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                        {error}
                        <button onClick={() => setError('')} className="float-right">×</button>
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
                        {success}
                        <button onClick={() => setSuccess('')} className="float-right">×</button>
                    </div>
                )}

                {/* Active Ride Card */}
                {activeRide && (
                    <div className="glass-card p-6 border-2 border-green-500/30">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">🎯 Active Ride</h2>
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                                {activeRide.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-gray-800/50 rounded-lg">
                                <p className="text-xs text-gray-400">Pickup</p>
                                <p className="text-white">{activeRide.originAddress}</p>
                            </div>
                            <div className="p-3 bg-gray-800/50 rounded-lg">
                                <p className="text-xs text-gray-400">Drop</p>
                                <p className="text-white">{activeRide.destAddress}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-emerald-400">
                                ₹{activeRide.finalFare}
                            </p>
                            <button
                                onClick={() => navigate(`/ride/${activeRide.id}`)}
                                className="btn-primary px-6 py-2"
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                )}

                {/* Ride Requests */}
                {isDriverOnline && !activeRide && (
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            📍 Available Ride Requests
                        </h2>

                        {rideRequests.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-4xl mb-2">🔍</p>
                                <p>No ride requests available</p>
                                <p className="text-sm">Stay online to receive requests</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {rideRequests.map(ride => (
                                    <div
                                        key={ride.id}
                                        className={`p-4 bg-gray-800/50 rounded-xl ${ride.isDirect ? 'border-2 border-blue-500/30' : ''
                                            }`}
                                    >
                                        {ride.isDirect && (
                                            <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded mb-2">
                                                Direct Request
                                            </span>
                                        )}

                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-white font-medium">{ride.rider?.name}</p>
                                                <p className="text-sm text-gray-400">{ride.rider?.contactNumber}</p>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {new Date(ride.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-400">📍</span>
                                                <span className="text-gray-300 text-sm">{ride.originAddress}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-400">🎯</span>
                                                <span className="text-gray-300 text-sm">{ride.destAddress}</span>
                                            </div>
                                        </div>

                                        {ride.hasBid ? (
                                            <p className="text-center text-blue-400 py-2">
                                                ✓ Bid Submitted - Waiting for response
                                            </p>
                                        ) : ride.myBidRejected ? (
                                            <p className="text-center text-red-400 py-2">
                                                ✗ Your bid was rejected
                                            </p>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Enter fare ₹"
                                                    value={bidAmounts[ride.id] || ''}
                                                    onChange={(e) => handleBidChange(ride.id, e.target.value)}
                                                    className="flex-1 input-field"
                                                />
                                                <button
                                                    onClick={() => handleSubmitBid(ride.id)}
                                                    disabled={loading}
                                                    className="px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                                                >
                                                    Bid
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Offline Message */}
                {!isDriverOnline && !activeRide && (
                    <div className="glass-card p-8 text-center">
                        <p className="text-4xl mb-4">🔴</p>
                        <h3 className="text-xl font-semibold text-white mb-2">You're Offline</h3>
                        <p className="text-gray-400 mb-6">Go online to start receiving ride requests</p>
                        <button
                            onClick={handleToggleOnline}
                            className="btn-primary px-8 py-3"
                        >
                            Go Online
                        </button>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/rides/history')}
                        className="glass-card p-4 text-center hover:bg-gray-800/30 transition-colors"
                    >
                        <span className="text-2xl">📋</span>
                        <p className="text-gray-300 mt-2">Ride History</p>
                    </button>
                    <button
                        onClick={() => navigate('/earnings')}
                        className="glass-card p-4 text-center hover:bg-gray-800/30 transition-colors"
                    >
                        <span className="text-2xl">💰</span>
                        <p className="text-gray-300 mt-2">Earnings</p>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DriverDashboard
