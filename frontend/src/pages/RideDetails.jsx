import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ridesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import MapView from '../components/MapView'
import OTPInput from '../components/OTPInput'
import Loading from '../components/Loading'
import {
    MapPin,
    Clock,
    Users,
    IndianRupee,
    ArrowLeft,
    Navigation,
    Phone,
    Mail,
    Lock,
    Play,
    CheckCircle,
    XCircle,
    LogOut,
    User,
    AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const RideDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { joinRideRoom, leaveRideRoom, onRideUpdate, onLocationUpdate, sendLocationUpdate, triggerRideUpdate } = useSocket()

    const [ride, setRide] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [vehicleLocation, setVehicleLocation] = useState(null)
    const [showOTPInput, setShowOTPInput] = useState(false)
    const [watchId, setWatchId] = useState(null)

    const isCreator = ride?.creator?._id === user?._id
    const isPassenger = ride?.passengers?.some(p => p._id === user?._id)
    const isInRide = isCreator || isPassenger

    const fetchRide = useCallback(async () => {
        try {
            const response = await ridesAPI.getOne(id)
            setRide(response.data.data)

            if (response.data.data.vehicleLocation?.lat) {
                setVehicleLocation(response.data.data.vehicleLocation)
            }
        } catch (error) {
            toast.error('Failed to load ride details')
            navigate('/')
        } finally {
            setLoading(false)
        }
    }, [id, navigate])

    useEffect(() => {
        fetchRide()
        joinRideRoom(id)

        return () => {
            leaveRideRoom(id)
            if (watchId) {
                navigator.geolocation.clearWatch(watchId)
            }
        }
    }, [id, fetchRide, joinRideRoom, leaveRideRoom])

    // Subscribe to ride updates
    useEffect(() => {
        const unsubscribe = onRideUpdate((updatedRide) => {
            if (updatedRide._id === id) {
                setRide(updatedRide)
            }
        })
        return unsubscribe
    }, [id, onRideUpdate])

    // Subscribe to location updates
    useEffect(() => {
        const unsubscribe = onLocationUpdate((data) => {
            if (data.rideId === id) {
                setVehicleLocation({ lat: data.lat, lng: data.lng })
            }
        })
        return unsubscribe
    }, [id, onLocationUpdate])

    // Start location tracking for creator when ride is ongoing
    useEffect(() => {
        if (isCreator && ride?.status === 'ongoing' && !watchId) {
            startLocationTracking()
        }
    }, [isCreator, ride?.status])

    const startLocationTracking = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported')
            return
        }

        const wId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                sendLocationUpdate(id, latitude, longitude)
                setVehicleLocation({ lat: latitude, lng: longitude })
            },
            (error) => {
                console.error('Location error:', error)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
            }
        )
        setWatchId(wId)
    }

    const handleJoin = async () => {
        setActionLoading(true)
        try {
            await ridesAPI.join(id)
            toast.success('Successfully joined the ride!')
            triggerRideUpdate(id)
            fetchRide()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join ride')
        } finally {
            setActionLoading(false)
        }
    }

    const handleLeave = async () => {
        setActionLoading(true)
        try {
            await ridesAPI.leave(id)
            toast.success('Left the ride')
            triggerRideUpdate(id)
            fetchRide()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to leave ride')
        } finally {
            setActionLoading(false)
        }
    }

    const handleVerifyOTP = async (otp) => {
        setActionLoading(true)
        try {
            await ridesAPI.verifyOTP(id, otp)
            toast.success('Ride started!')
            setShowOTPInput(false)
            triggerRideUpdate(id)
            fetchRide()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP')
        } finally {
            setActionLoading(false)
        }
    }

    const handleComplete = async () => {
        const distance = prompt('Enter distance traveled (km):', '10')
        if (!distance) return

        setActionLoading(true)
        try {
            await ridesAPI.complete(id, parseFloat(distance))
            toast.success('Ride completed!')
            triggerRideUpdate(id)
            navigate(`/bill/${id}`)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to complete ride')
        } finally {
            setActionLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this ride?')) return

        setActionLoading(true)
        try {
            await ridesAPI.cancel(id)
            toast.success('Ride cancelled')
            triggerRideUpdate(id)
            navigate('/')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel ride')
        } finally {
            setActionLoading(false)
        }
    }

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusClass = (status) => {
        switch (status) {
            case 'open': return 'status-open'
            case 'full': return 'status-full'
            case 'ongoing': return 'status-ongoing'
            case 'completed': return 'status-completed'
            case 'cancelled': return 'status-cancelled'
            default: return 'status-open'
        }
    }

    if (loading) {
        return <Loading text="Loading ride details..." />
    }

    if (!ride) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Ride not found</h2>
                    <Link to="/" className="btn-primary">Go to Dashboard</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Back button */}
                <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                </Link>

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Ride Details</h1>
                        <span className={`status-badge ${getStatusClass(ride.status)}`}>
                            {ride.status}
                        </span>
                    </div>
                    {isCreator && ride.otp && ride.status === 'open' && (
                        <div className="text-right">
                            <p className="text-white/50 text-sm mb-1">Your OTP</p>
                            <p className="text-3xl font-mono font-bold text-gradient">{ride.otp}</p>
                            <p className="text-white/40 text-xs mt-1">Share when starting ride</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Route Card */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Navigation className="w-5 h-5 text-primary-400" />
                                Route Details
                            </h3>
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                                    <div className="w-0.5 h-12 bg-gradient-to-b from-emerald-500 to-red-500"></div>
                                    <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div>
                                        <p className="text-white/50 text-sm">Pickup Location</p>
                                        <p className="text-white font-medium text-lg">{ride.pickupLocation}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/50 text-sm">Destination</p>
                                        <p className="text-white font-medium text-lg">{ride.destination}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map View (for ongoing rides) */}
                        {(ride.status === 'ongoing' || vehicleLocation) && (
                            <div className="card">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-primary-400" />
                                    Live Tracking
                                </h3>
                                <MapView
                                    vehicleLocation={vehicleLocation}
                                    isTracking={ride.status === 'ongoing'}
                                />
                            </div>
                        )}

                        {/* OTP Input Modal */}
                        {showOTPInput && isCreator && (
                            <div className="card">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-primary-400" />
                                    Enter OTP to Start Ride
                                </h3>
                                <p className="text-white/60 text-center mb-6">
                                    Enter the 6-digit OTP displayed above to verify and start the ride
                                </p>
                                <OTPInput
                                    onComplete={handleVerifyOTP}
                                    disabled={actionLoading}
                                />
                                <button
                                    onClick={() => setShowOTPInput(false)}
                                    className="btn-secondary w-full mt-4"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Passengers */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary-400" />
                                Passengers ({ride.passengers?.length || 0}/{ride.maxSeats})
                            </h3>

                            {/* Creator */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 mb-3">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                        <span className="text-lg font-bold text-white">
                                            {ride.creator?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{ride.creator?.name}</p>
                                        <p className="text-white/50 text-sm">Ride Creator</p>
                                    </div>
                                    {ride.creator?.phone && (
                                        <a href={`tel:${ride.creator.phone}`} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                                            <Phone className="w-5 h-5 text-white" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Passengers List */}
                            {ride.passengers?.map((passenger) => (
                                <div key={passenger._id} className="p-4 rounded-xl bg-white/5 mb-3 last:mb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                            <span className="text-lg font-bold text-white">
                                                {passenger.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{passenger.name}</p>
                                            <p className="text-white/50 text-sm">{passenger.email}</p>
                                        </div>
                                        {passenger.phone && (
                                            <a href={`tel:${passenger.phone}`} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                                                <Phone className="w-5 h-5 text-white" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {ride.passengers?.length === 0 && (
                                <p className="text-white/40 text-center py-4">No passengers yet</p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Fare Card */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">Fare Details</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                    <span className="text-white/60">Total Fare</span>
                                    <span className="text-white font-semibold">₹{ride.totalFare}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                                    <span className="text-white/60">Per Person</span>
                                    <span className="text-2xl font-bold text-emerald-400">₹{ride.farePerPerson}</span>
                                </div>
                            </div>
                        </div>

                        {/* Departure Card */}
                        <div className="card">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-5 h-5 text-primary-400" />
                                <span className="text-white/60">Departure</span>
                            </div>
                            <p className="text-white font-medium">{formatTime(ride.departureTime)}</p>
                        </div>

                        {/* Actions */}
                        <div className="card space-y-3">
                            {/* Join Ride */}
                            {!isInRide && ride.status === 'open' && (
                                <button
                                    onClick={handleJoin}
                                    disabled={actionLoading}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    <Users className="w-5 h-5" />
                                    <span>Join Ride</span>
                                </button>
                            )}

                            {/* Leave Ride (for passengers) */}
                            {isPassenger && (ride.status === 'open' || ride.status === 'full') && (
                                <button
                                    onClick={handleLeave}
                                    disabled={actionLoading}
                                    className="btn-secondary w-full flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Leave Ride</span>
                                </button>
                            )}

                            {/* Creator Actions */}
                            {isCreator && (
                                <>
                                    {(ride.status === 'open' || ride.status === 'full') && !ride.otpVerified && (
                                        <button
                                            onClick={() => setShowOTPInput(true)}
                                            disabled={actionLoading}
                                            className="btn-primary w-full flex items-center justify-center gap-2"
                                        >
                                            <Play className="w-5 h-5" />
                                            <span>Start Ride</span>
                                        </button>
                                    )}

                                    {ride.status === 'ongoing' && (
                                        <button
                                            onClick={handleComplete}
                                            disabled={actionLoading}
                                            className="btn-primary w-full flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            <span>Complete Ride</span>
                                        </button>
                                    )}

                                    {(ride.status === 'open' || ride.status === 'full') && (
                                        <button
                                            onClick={handleCancel}
                                            disabled={actionLoading}
                                            className="btn-danger w-full flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            <span>Cancel Ride</span>
                                        </button>
                                    )}
                                </>
                            )}

                            {/* View Bill (for completed rides) */}
                            {ride.status === 'completed' && (
                                <Link
                                    to={`/bill/${ride._id}`}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    <IndianRupee className="w-5 h-5" />
                                    <span>View Bill</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RideDetails
