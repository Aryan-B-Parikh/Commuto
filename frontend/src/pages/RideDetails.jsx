import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { ridesAPI } from '../services/api'
import MapView from '../components/MapView'

const RideDetails = () => {
    const { id } = useParams()
    const { user, isDriver } = useAuth()
    const {
        joinRideRoom,
        leaveRideRoom,
        sendLocationUpdate,
        onLocationUpdate,
        onRideStarted,
        onRideCompleted
    } = useSocket()
    const navigate = useNavigate()

    const [ride, setRide] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [otp, setOtp] = useState('')
    const [driverLocation, setDriverLocation] = useState(null)

    useEffect(() => {
        loadRide()
        joinRideRoom(id)

        return () => leaveRideRoom(id)
    }, [id])

    // Subscribe to location updates
    useEffect(() => {
        const unsubLocation = onLocationUpdate(({ lat, lng }) => {
            setDriverLocation({ lat, lng })
        })

        const unsubStarted = onRideStarted(() => {
            loadRide()
            setSuccess('Ride has started!')
        })

        const unsubCompleted = onRideCompleted(({ bill }) => {
            loadRide()
            setSuccess('Ride completed!')
        })

        return () => {
            unsubLocation()
            unsubStarted()
            unsubCompleted()
        }
    }, [onLocationUpdate, onRideStarted, onRideCompleted])

    // Driver location tracking
    useEffect(() => {
        if (isDriver && ride?.status === 'ONGOING') {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    sendLocationUpdate(id, latitude, longitude)
                    setDriverLocation({ lat: latitude, lng: longitude })
                },
                (error) => console.error('Geolocation error:', error),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            )

            return () => navigator.geolocation.clearWatch(watchId)
        }
    }, [isDriver, ride?.status, id, sendLocationUpdate])

    const loadRide = async () => {
        try {
            const response = await ridesAPI.getRide(id)
            setRide(response.data.data)
            if (response.data.data.vehicleLat && response.data.data.vehicleLng) {
                setDriverLocation({
                    lat: response.data.data.vehicleLat,
                    lng: response.data.data.vehicleLng
                })
            }
        } catch (err) {
            setError('Failed to load ride details')
        } finally {
            setLoading(false)
        }
    }

    const handleStartRide = async () => {
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP')
            return
        }

        try {
            await ridesAPI.startRide(id, otp)
            setSuccess('Ride started!')
            loadRide()
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP')
        }
    }

    const handleCompleteRide = async () => {
        try {
            // Calculate distance (simplified - in production use actual GPS data)
            const distance = 5.5 // Mock distance
            await ridesAPI.completeRide(id, distance)
            setSuccess('Ride completed!')
            loadRide()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete ride')
        }
    }

    const handleCancelRide = async () => {
        try {
            await ridesAPI.cancelRide(id)
            setSuccess('Ride cancelled')
            navigate(isDriver ? '/driver/dashboard' : '/rider/dashboard')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel ride')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    if (!ride) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-400">Ride not found</p>
            </div>
        )
    }

    const isRider = ride.riderId === user?.id
    const isAssignedDriver = ride.assignedDriverId === user?.id
    const acceptedBid = ride.bids?.find(b => b.status === 'ACCEPTED')

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="glass-card p-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-white">Ride Details</h1>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${ride.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                                ride.status === 'ONGOING' ? 'bg-purple-500/20 text-purple-400' :
                                    ride.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-gray-500/20 text-gray-400'
                            }`}>
                            {ride.status}
                        </span>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
                        {success}
                    </div>
                )}

                {/* Route Info */}
                <div className="glass-card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                            <p className="text-sm text-gray-400 mb-1">📍 Pickup</p>
                            <p className="text-white font-medium">{ride.originAddress}</p>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                            <p className="text-sm text-gray-400 mb-1">🎯 Drop</p>
                            <p className="text-white font-medium">{ride.destAddress}</p>
                        </div>
                    </div>
                </div>

                {/* Fare & Driver/Rider Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Fare</h3>
                        <p className="text-3xl font-bold text-emerald-400">
                            ₹{ride.finalFare || acceptedBid?.offeredFare || 'Pending'}
                        </p>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            {isRider ? 'Driver' : 'Rider'}
                        </h3>
                        {isRider && acceptedBid ? (
                            <div>
                                <p className="text-white font-medium">{acceptedBid.driver.name}</p>
                                <p className="text-gray-400 text-sm">
                                    {acceptedBid.driver.vehicleModel} • {acceptedBid.driver.vehicleColor}
                                </p>
                                <p className="text-blue-400 text-sm font-mono mt-1">
                                    {acceptedBid.driver.vehiclePlateNumber}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-white font-medium">{ride.rider?.name}</p>
                                <p className="text-gray-400 text-sm">{ride.rider?.contactNumber}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* OTP Section - For Rider (show OTP) */}
                {isRider && ride.status === 'CONFIRMED' && (
                    <div className="glass-card p-6 text-center border-2 border-yellow-500/30">
                        <h3 className="text-lg font-semibold text-white mb-2">🔐 Your OTP</h3>
                        <p className="text-gray-400 text-sm mb-4">Share this with your driver to start the ride</p>
                        <p className="text-4xl font-bold tracking-widest text-yellow-400">
                            {ride.otp || '------'}
                        </p>
                    </div>
                )}

                {/* OTP Section - For Driver (enter OTP) */}
                {isAssignedDriver && ride.status === 'CONFIRMED' && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">🔐 Enter OTP to Start</h3>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Enter 6-digit OTP"
                                className="input-field flex-1 text-center text-2xl tracking-widest"
                                maxLength={6}
                            />
                            <button
                                onClick={handleStartRide}
                                className="btn-primary px-8"
                            >
                                Start Ride
                            </button>
                        </div>
                    </div>
                )}

                {/* Live Map */}
                {ride.status === 'ONGOING' && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">📍 Live Tracking</h3>
                        <div className="h-80 rounded-xl overflow-hidden">
                            <MapView
                                origin={{ lat: ride.originLat, lng: ride.originLng }}
                                destination={{ lat: ride.destLat, lng: ride.destLng }}
                                driverLocation={driverLocation}
                            />
                        </div>
                    </div>
                )}

                {/* Complete Ride Button - For Driver */}
                {isAssignedDriver && ride.status === 'ONGOING' && (
                    <button
                        onClick={handleCompleteRide}
                        className="w-full btn-primary py-4 text-lg"
                    >
                        ✓ Complete Ride
                    </button>
                )}

                {/* View Bill - After Completion */}
                {ride.status === 'COMPLETED' && ride.bill && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">🧾 Bill Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Fare</span>
                                <span className="text-white">₹{ride.bill.fare}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Distance</span>
                                <span className="text-white">{ride.bill.distance} km</span>
                            </div>
                            {ride.bill.duration && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Duration</span>
                                    <span className="text-white">{ride.bill.duration} mins</span>
                                </div>
                            )}
                            <hr className="border-gray-700" />
                            <div className="flex justify-between text-lg font-bold">
                                <span className="text-white">Total</span>
                                <span className="text-emerald-400">₹{ride.bill.fare}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancel Button */}
                {!['COMPLETED', 'CANCELLED'].includes(ride.status) && (
                    <button
                        onClick={handleCancelRide}
                        className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
                    >
                        Cancel Ride
                    </button>
                )}

                {/* Back Button */}
                <button
                    onClick={() => navigate(isDriver ? '/driver/dashboard' : '/rider/dashboard')}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
                >
                    ← Back to Dashboard
                </button>
            </div>
        </div>
    )
}

export default RideDetails
