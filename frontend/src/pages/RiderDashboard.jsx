import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { ridesAPI, authAPI } from '../services/api'

const RiderDashboard = () => {
    const { user } = useAuth()
    const { onReceiveBid, joinRideRoom } = useSocket()
    const navigate = useNavigate()

    const [activeRide, setActiveRide] = useState(null)
    const [bids, setBids] = useState([])
    const [onlineDrivers, setOnlineDrivers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        originAddress: '',
        originLat: '',
        originLng: '',
        destAddress: '',
        destLat: '',
        destLng: '',
        specificDriverId: ''
    })

    // Load active ride on mount
    useEffect(() => {
        loadActiveRide()
        loadOnlineDrivers()
    }, [])

    // Subscribe to bids when there's an active ride
    useEffect(() => {
        if (activeRide && activeRide.status === 'NEGOTIATING') {
            joinRideRoom(activeRide.id)

            const unsubscribe = onReceiveBid(({ rideId, bid }) => {
                if (rideId === activeRide.id) {
                    setBids(prev => {
                        const exists = prev.find(b => b.id === bid.id)
                        if (exists) {
                            return prev.map(b => b.id === bid.id ? bid : b)
                        }
                        return [...prev, bid]
                    })
                }
            })

            return unsubscribe
        }
    }, [activeRide, onReceiveBid, joinRideRoom])

    const loadActiveRide = async () => {
        try {
            const response = await ridesAPI.getMyRides()
            const rides = response.data.data
            const active = rides.find(r =>
                ['PENDING', 'NEGOTIATING', 'CONFIRMED', 'ONGOING'].includes(r.status)
            )
            if (active) {
                setActiveRide(active)
                setBids(active.bids || [])
            }
        } catch (err) {
            console.error('Error loading rides:', err)
        }
    }

    const loadOnlineDrivers = async () => {
        try {
            const response = await authAPI.getOnlineDrivers()
            setOnlineDrivers(response.data.data)
        } catch (err) {
            console.error('Error loading drivers:', err)
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            // For demo, use mock coordinates if not provided
            const data = {
                originAddress: formData.originAddress,
                originLat: formData.originLat || 28.6139,
                originLng: formData.originLng || 77.2090,
                destAddress: formData.destAddress,
                destLat: formData.destLat || 28.5355,
                destLng: formData.destLng || 77.3910,
                specificDriverId: formData.specificDriverId || undefined
            }

            const response = await ridesAPI.createRequest(data)
            setActiveRide(response.data.data)
            setSuccess('Ride request created! Waiting for driver bids...')
            setBids([])
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create ride request')
        } finally {
            setLoading(false)
        }
    }

    const handleAcceptBid = async (bidId) => {
        try {
            const response = await ridesAPI.acceptBid(activeRide.id, bidId)
            setActiveRide(response.data.data.ride)
            setSuccess(`Ride confirmed! OTP: ${response.data.data.otp}`)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to accept bid')
        }
    }

    const handleRejectBid = async (bidId) => {
        try {
            await ridesAPI.rejectBid(activeRide.id, bidId)
            setBids(prev => prev.filter(b => b.id !== bidId))
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject bid')
        }
    }

    const handleCancelRide = async () => {
        try {
            await ridesAPI.cancelRide(activeRide.id)
            setActiveRide(null)
            setBids([])
            setSuccess('Ride cancelled')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel ride')
        }
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="glass-card p-6">
                    <h1 className="text-2xl font-bold text-white">
                        👋 Hello, {user?.name}!
                    </h1>
                    <p className="text-gray-400 mt-1">Ready for your next ride?</p>
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

                {/* Active Ride or Request Form */}
                {activeRide ? (
                    <div className="glass-card p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Active Ride</h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${activeRide.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                    activeRide.status === 'NEGOTIATING' ? 'bg-blue-500/20 text-blue-400' :
                                        activeRide.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                                            activeRide.status === 'ONGOING' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-gray-500/20 text-gray-400'
                                }`}>
                                {activeRide.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-800/50 rounded-lg">
                                <p className="text-sm text-gray-400">From</p>
                                <p className="text-white font-medium">{activeRide.originAddress}</p>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-lg">
                                <p className="text-sm text-gray-400">To</p>
                                <p className="text-white font-medium">{activeRide.destAddress}</p>
                            </div>
                        </div>

                        {activeRide.finalFare && (
                            <div className="p-4 bg-emerald-500/10 rounded-lg">
                                <p className="text-sm text-gray-400">Final Fare</p>
                                <p className="text-2xl font-bold text-emerald-400">₹{activeRide.finalFare}</p>
                            </div>
                        )}

                        {/* Bids Section */}
                        {(activeRide.status === 'PENDING' || activeRide.status === 'NEGOTIATING') && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-medium text-white">
                                    Driver Bids {bids.length > 0 && `(${bids.length})`}
                                </h3>
                                {bids.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">
                                        Waiting for drivers to bid...
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {bids.filter(b => b.status === 'PENDING').map(bid => (
                                            <div key={bid.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                                <div>
                                                    <p className="text-white font-medium">{bid.driver?.name}</p>
                                                    <p className="text-sm text-gray-400">
                                                        {bid.driver?.vehicleModel} • {bid.driver?.vehiclePlateNumber}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-xl font-bold text-blue-400">₹{bid.offeredFare}</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAcceptBid(bid.id)}
                                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectBid(bid.id)}
                                                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* View Ride Details */}
                        {(activeRide.status === 'CONFIRMED' || activeRide.status === 'ONGOING') && (
                            <button
                                onClick={() => navigate(`/ride/${activeRide.id}`)}
                                className="w-full btn-primary py-3"
                            >
                                View Ride Details
                            </button>
                        )}

                        {activeRide.status !== 'COMPLETED' && activeRide.status !== 'CANCELLED' && (
                            <button
                                onClick={handleCancelRide}
                                className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
                            >
                                Cancel Ride
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="glass-card p-6 space-y-6">
                        <h2 className="text-xl font-semibold text-white">Request a Ride</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Pickup Location
                                </label>
                                <input
                                    type="text"
                                    name="originAddress"
                                    value={formData.originAddress}
                                    onChange={handleChange}
                                    required
                                    className="input-field"
                                    placeholder="Enter pickup address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Drop Location
                                </label>
                                <input
                                    type="text"
                                    name="destAddress"
                                    value={formData.destAddress}
                                    onChange={handleChange}
                                    required
                                    className="input-field"
                                    placeholder="Enter destination address"
                                />
                            </div>

                            {/* Direct Booking Option */}
                            {onlineDrivers.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Book Specific Driver (Optional)
                                    </label>
                                    <select
                                        name="specificDriverId"
                                        value={formData.specificDriverId}
                                        onChange={handleChange}
                                        className="input-field"
                                    >
                                        <option value="">Broadcast to all drivers</option>
                                        {onlineDrivers.map(driver => (
                                            <option key={driver.id} value={driver.id}>
                                                {driver.name} - {driver.vehicleModel}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full btn-primary py-3 ${loading ? 'opacity-50' : ''}`}
                            >
                                {loading ? 'Creating Request...' : 'Find Drivers'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/rides/history')}
                        className="glass-card p-4 text-center hover:bg-gray-800/30 transition-colors"
                    >
                        <span className="text-2xl">📋</span>
                        <p className="text-gray-300 mt-2">Ride History</p>
                    </button>
                    <button
                        onClick={() => navigate('/bills')}
                        className="glass-card p-4 text-center hover:bg-gray-800/30 transition-colors"
                    >
                        <span className="text-2xl">🧾</span>
                        <p className="text-gray-300 mt-2">Bills</p>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RiderDashboard
