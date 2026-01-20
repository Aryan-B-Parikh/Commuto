import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ridesAPI } from '../services/api'
import { useSocket } from '../context/SocketContext'
import RideCard from '../components/RideCard'
import Loading from '../components/Loading'
import {
    PlusCircle,
    Search,
    Filter,
    Car,
    MapPin,
    TrendingUp,
    Users,
    RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const Dashboard = () => {
    const [rides, setRides] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [refreshing, setRefreshing] = useState(false)
    const { onRideUpdate } = useSocket()

    useEffect(() => {
        fetchRides()
    }, [statusFilter])

    // Subscribe to real-time ride updates
    useEffect(() => {
        const unsubscribe = onRideUpdate((updatedRide) => {
            setRides(prevRides =>
                prevRides.map(ride =>
                    ride._id === updatedRide._id ? updatedRide : ride
                )
            )
        })
        return unsubscribe
    }, [onRideUpdate])

    const fetchRides = async () => {
        try {
            const params = {}
            if (statusFilter) params.status = statusFilter
            if (searchQuery) params.destination = searchQuery

            const response = await ridesAPI.getAll(params)
            setRides(response.data.data)
        } catch (error) {
            toast.error('Failed to fetch rides')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        setRefreshing(true)
        fetchRides()
        toast.success('Rides refreshed')
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setLoading(true)
        fetchRides()
    }

    const filteredRides = rides.filter(ride => {
        if (!searchQuery) return true
        return (
            ride.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ride.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })

    const stats = {
        total: rides.length,
        open: rides.filter(r => r.status === 'open').length,
        ongoing: rides.filter(r => r.status === 'ongoing').length
    }

    if (loading) {
        return <Loading text="Loading rides..." />
    }

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Find Your Ride
                        </h1>
                        <p className="text-white/60">
                            Browse available rides or create your own
                        </p>
                    </div>
                    <Link to="/create" className="btn-primary flex items-center gap-2 w-fit">
                        <PlusCircle className="w-5 h-5" />
                        <span>Create Ride</span>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <Car className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                            <p className="text-white/50 text-sm">Total Rides</p>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                        </div>
                    </div>
                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-white/50 text-sm">Open Rides</p>
                            <p className="text-2xl font-bold text-emerald-400">{stats.open}</p>
                        </div>
                    </div>
                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-accent-400" />
                        </div>
                        <div>
                            <p className="text-white/50 text-sm">Ongoing Rides</p>
                            <p className="text-2xl font-bold text-accent-400">{stats.ongoing}</p>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by destination or pickup..."
                            className="input-field pl-12 w-full"
                        />
                    </form>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input-field w-40"
                        >
                            <option value="">All Status</option>
                            <option value="open">Open</option>
                            <option value="full">Full</option>
                            <option value="ongoing">Ongoing</option>
                        </select>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="btn-secondary p-3"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Rides Grid */}
                {filteredRides.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRides.map((ride) => (
                            <RideCard key={ride._id} ride={ride} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-10 h-10 text-white/30" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No rides found</h3>
                        <p className="text-white/50 mb-6">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Be the first to create a ride!'}
                        </p>
                        <Link to="/create" className="btn-primary inline-flex items-center gap-2">
                            <PlusCircle className="w-5 h-5" />
                            <span>Create Ride</span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
