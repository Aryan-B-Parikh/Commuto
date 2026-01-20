import { Link } from 'react-router-dom'
import {
    MapPin,
    Clock,
    Users,
    IndianRupee,
    ArrowRight,
    Navigation
} from 'lucide-react'

const RideCard = ({ ride }) => {
    const formatTime = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusClass = (status) => {
        switch (status) {
            case 'open':
                return 'status-open'
            case 'full':
                return 'status-full'
            case 'ongoing':
                return 'status-ongoing'
            case 'completed':
                return 'status-completed'
            case 'cancelled':
                return 'status-cancelled'
            default:
                return 'status-open'
        }
    }

    const filledSeats = ride.passengers?.length || 0
    const availableSeats = ride.maxSeats - filledSeats

    return (
        <Link to={`/ride/${ride._id}`} className="block group">
            <div className="card hover:border-primary-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                            <Navigation className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <p className="text-white/50 text-xs uppercase tracking-wider">Creator</p>
                            <p className="text-white font-medium">{ride.creator?.name || 'Unknown'}</p>
                        </div>
                    </div>
                    <span className={`status-badge ${getStatusClass(ride.status)}`}>
                        {ride.status}
                    </span>
                </div>

                {/* Route */}
                <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <div className="w-0.5 h-8 bg-white/20"></div>
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <p className="text-white/50 text-xs">From</p>
                                <p className="text-white font-medium truncate">{ride.pickupLocation}</p>
                            </div>
                            <div>
                                <p className="text-white/50 text-xs">To</p>
                                <p className="text-white font-medium truncate">{ride.destination}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                        <Clock className="w-4 h-4 text-primary-400 mx-auto mb-1" />
                        <p className="text-white/50 text-xs">Departure</p>
                        <p className="text-white text-sm font-medium">{formatTime(ride.departureTime)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                        <Users className="w-4 h-4 text-accent-400 mx-auto mb-1" />
                        <p className="text-white/50 text-xs">Seats</p>
                        <p className="text-white text-sm font-medium">
                            <span className={availableSeats === 0 ? 'text-red-400' : 'text-emerald-400'}>
                                {availableSeats}
                            </span>
                            /{ride.maxSeats}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                        <IndianRupee className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <p className="text-white/50 text-xs">Per Person</p>
                        <p className="text-white text-sm font-medium">₹{ride.farePerPerson}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex -space-x-2">
                        {ride.passengers?.slice(0, 3).map((passenger, idx) => (
                            <div
                                key={idx}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 border-2 border-dark-800 flex items-center justify-center"
                                title={passenger.name}
                            >
                                <span className="text-xs font-bold text-white">
                                    {passenger.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        ))}
                        {ride.passengers?.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-dark-800 flex items-center justify-center">
                                <span className="text-xs font-medium text-white/70">
                                    +{ride.passengers.length - 3}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-primary-400 group-hover:gap-3 transition-all">
                        <span className="text-sm font-medium">View Details</span>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default RideCard
