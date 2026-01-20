import {
    Receipt,
    MapPin,
    Calendar,
    Users,
    IndianRupee,
    Navigation,
    Car
} from 'lucide-react'

const BillDisplay = ({ bill }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="card max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center pb-6 border-b border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                    <Receipt className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Ride Completed!</h2>
                <p className="text-white/50">Bill ID: #{bill.rideId}</p>
            </div>

            {/* Route */}
            <div className="py-6 border-b border-white/10">
                <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                        <div className="w-0.5 h-12 bg-gradient-to-b from-emerald-500 to-red-500"></div>
                        <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                    </div>
                    <div className="flex-1 space-y-6">
                        <div>
                            <p className="text-white/50 text-sm">Pickup Location</p>
                            <p className="text-white font-medium">{bill.pickupLocation}</p>
                        </div>
                        <div>
                            <p className="text-white/50 text-sm">Destination</p>
                            <p className="text-white font-medium">{bill.destination}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="py-6 grid grid-cols-2 gap-4 border-b border-white/10">
                <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Navigation className="w-4 h-4 text-primary-400" />
                        <span className="text-white/50 text-sm">Distance</span>
                    </div>
                    <p className="text-xl font-bold text-white">{bill.distance} km</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-accent-400" />
                        <span className="text-white/50 text-sm">Completed</span>
                    </div>
                    <p className="text-sm font-medium text-white">{formatDate(bill.completedAt)}</p>
                </div>
            </div>

            {/* Fare Breakdown */}
            <div className="py-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-400" />
                    Fare Split
                </h3>

                {/* Creator */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 mb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <Car className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-medium">{bill.creator?.name}</p>
                                <p className="text-white/50 text-sm">Ride Creator</p>
                            </div>
                        </div>
                        <p className="text-xl font-bold text-white">₹{bill.creator?.amount}</p>
                    </div>
                </div>

                {/* Passengers */}
                {bill.passengers?.map((passenger, index) => (
                    <div key={index} className="p-4 rounded-xl bg-white/5 mb-3 last:mb-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <span className="text-lg font-bold text-white">
                                        {passenger.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-white font-medium">{passenger.name}</p>
                                    <p className="text-white/50 text-sm">{passenger.email}</p>
                                </div>
                            </div>
                            <p className="text-xl font-bold text-white">₹{passenger.amount}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="pt-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <div className="flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-emerald-400" />
                        <span className="text-lg font-semibold text-white">Total Fare</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">₹{bill.totalFare}</p>
                </div>
            </div>
        </div>
    )
}

export default BillDisplay
