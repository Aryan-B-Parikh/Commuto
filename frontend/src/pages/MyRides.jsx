import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ridesAPI } from '../services/api'

const MyRides = () => {
    const { user, isDriver } = useAuth()
    const navigate = useNavigate()

    const [rides, setRides] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        loadRides()
    }, [])

    const loadRides = async () => {
        try {
            const response = await ridesAPI.getMyRides()
            setRides(response.data.data)
        } catch (err) {
            console.error('Error loading rides:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredRides = rides.filter(ride => {
        if (filter === 'all') return true
        return ride.status === filter
    })

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500/20 text-yellow-400'
            case 'NEGOTIATING': return 'bg-blue-500/20 text-blue-400'
            case 'CONFIRMED': return 'bg-green-500/20 text-green-400'
            case 'ONGOING': return 'bg-purple-500/20 text-purple-400'
            case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400'
            case 'CANCELLED': return 'bg-red-500/20 text-red-400'
            default: return 'bg-gray-500/20 text-gray-400'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="glass-card p-6">
                    <h1 className="text-2xl font-bold text-white">
                        📋 {isDriver ? 'My Trips' : 'My Rides'}
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {isDriver ? 'View all rides you have completed' : 'View your ride history'}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                    {['all', 'PENDING', 'NEGOTIATING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {status === 'all' ? 'All' : status}
                        </button>
                    ))}
                </div>

                {/* Rides List */}
                {filteredRides.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <p className="text-4xl mb-4">🚗</p>
                        <p className="text-gray-400">No rides found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredRides.map(ride => (
                            <div
                                key={ride.id}
                                className="glass-card p-4 hover:bg-gray-800/30 transition-colors cursor-pointer"
                                onClick={() => navigate(`/ride/${ride.id}`)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-sm text-gray-400">
                                            {new Date(ride.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                                        {ride.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div className="flex items-start gap-2">
                                        <span className="text-green-400">📍</span>
                                        <div>
                                            <p className="text-xs text-gray-500">From</p>
                                            <p className="text-gray-300 text-sm">{ride.originAddress}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-red-400">🎯</span>
                                        <div>
                                            <p className="text-xs text-gray-500">To</p>
                                            <p className="text-gray-300 text-sm">{ride.destAddress}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                                    <div>
                                        {isDriver ? (
                                            <p className="text-sm text-gray-400">
                                                Rider: <span className="text-white">{ride.rider?.name}</span>
                                            </p>
                                        ) : ride.bids?.find(b => b.status === 'ACCEPTED') && (
                                            <p className="text-sm text-gray-400">
                                                Driver: <span className="text-white">
                                                    {ride.bids.find(b => b.status === 'ACCEPTED')?.driver?.name}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-xl font-bold text-emerald-400">
                                        {ride.finalFare ? `₹${ride.finalFare}` : '—'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary */}
                {rides.length > 0 && (
                    <div className="glass-card p-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-white">{rides.length}</p>
                                <p className="text-sm text-gray-400">Total Rides</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-400">
                                    {rides.filter(r => r.status === 'COMPLETED').length}
                                </p>
                                <p className="text-sm text-gray-400">Completed</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-400">
                                    ₹{rides
                                        .filter(r => r.status === 'COMPLETED' && r.finalFare)
                                        .reduce((sum, r) => sum + r.finalFare, 0)
                                    }
                                </p>
                                <p className="text-sm text-gray-400">
                                    {isDriver ? 'Total Earned' : 'Total Spent'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyRides
