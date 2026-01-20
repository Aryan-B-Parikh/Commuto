import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ridesAPI } from '../services/api'
import {
    MapPin,
    Clock,
    Users,
    IndianRupee,
    ArrowRight,
    Navigation,
    Info
} from 'lucide-react'
import toast from 'react-hot-toast'

const CreateRide = () => {
    const [formData, setFormData] = useState({
        pickupLocation: '',
        destination: '',
        departureTime: '',
        totalFare: '',
        maxSeats: ''
    })
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (!formData.pickupLocation || !formData.destination || !formData.departureTime || !formData.totalFare || !formData.maxSeats) {
            toast.error('Please fill in all fields')
            return
        }

        if (parseFloat(formData.totalFare) <= 0) {
            toast.error('Fare must be greater than 0')
            return
        }

        if (parseInt(formData.maxSeats) < 1 || parseInt(formData.maxSeats) > 10) {
            toast.error('Seats must be between 1 and 10')
            return
        }

        // Check if departure time is in the future
        if (new Date(formData.departureTime) < new Date()) {
            toast.error('Departure time must be in the future')
            return
        }

        setLoading(true)
        try {
            const response = await ridesAPI.create({
                ...formData,
                totalFare: parseFloat(formData.totalFare),
                maxSeats: parseInt(formData.maxSeats)
            })

            toast.success('Ride created successfully!')

            // Show OTP
            const otp = response.data.data.otp
            if (otp) {
                toast.success(`Your OTP: ${otp}`, { duration: 10000 })
            }

            navigate(`/ride/${response.data.data._id}`)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create ride')
        } finally {
            setLoading(false)
        }
    }

    // Get minimum datetime (now)
    const getMinDateTime = () => {
        const now = new Date()
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
        return now.toISOString().slice(0, 16)
    }

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-xl shadow-primary-500/30 mb-4">
                        <Navigation className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Create a Ride</h1>
                    <p className="text-white/60">Share your ride and split the fare with others</p>
                </div>

                {/* Form */}
                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Pickup Location */}
                        <div>
                            <label className="block text-white/70 text-sm font-medium mb-2">
                                <MapPin className="w-4 h-4 inline mr-2" />
                                Pickup Location
                            </label>
                            <input
                                type="text"
                                name="pickupLocation"
                                value={formData.pickupLocation}
                                onChange={handleChange}
                                placeholder="Enter pickup location"
                                className="input-field"
                                disabled={loading}
                            />
                        </div>

                        {/* Destination */}
                        <div>
                            <label className="block text-white/70 text-sm font-medium mb-2">
                                <Navigation className="w-4 h-4 inline mr-2" />
                                Destination
                            </label>
                            <input
                                type="text"
                                name="destination"
                                value={formData.destination}
                                onChange={handleChange}
                                placeholder="Enter destination"
                                className="input-field"
                                disabled={loading}
                            />
                        </div>

                        {/* Departure Time */}
                        <div>
                            <label className="block text-white/70 text-sm font-medium mb-2">
                                <Clock className="w-4 h-4 inline mr-2" />
                                Departure Time
                            </label>
                            <input
                                type="datetime-local"
                                name="departureTime"
                                value={formData.departureTime}
                                onChange={handleChange}
                                min={getMinDateTime()}
                                className="input-field"
                                disabled={loading}
                            />
                        </div>

                        {/* Total Fare & Max Seats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-white/70 text-sm font-medium mb-2">
                                    <IndianRupee className="w-4 h-4 inline mr-2" />
                                    Total Fare (₹)
                                </label>
                                <input
                                    type="number"
                                    name="totalFare"
                                    value={formData.totalFare}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="1"
                                    className="input-field"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-white/70 text-sm font-medium mb-2">
                                    <Users className="w-4 h-4 inline mr-2" />
                                    Max Seats
                                </label>
                                <input
                                    type="number"
                                    name="maxSeats"
                                    value={formData.maxSeats}
                                    onChange={handleChange}
                                    placeholder="1-10"
                                    min="1"
                                    max="10"
                                    className="input-field"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
                            <div className="flex gap-3">
                                <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-white font-medium mb-1">How it works</p>
                                    <ul className="text-white/60 text-sm space-y-1">
                                        <li>• When you create a ride, you'll receive a 6-digit OTP</li>
                                        <li>• Share this OTP when starting the ride to verify passengers</li>
                                        <li>• Fare is automatically split between all passengers</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        {formData.totalFare && formData.maxSeats && (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                                <p className="text-white/60 text-sm mb-2">Estimated fare per person (if all seats filled):</p>
                                <p className="text-2xl font-bold text-emerald-400">
                                    ₹{Math.ceil(parseFloat(formData.totalFare) / (parseInt(formData.maxSeats) + 1))}
                                </p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Creating Ride...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Ride</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default CreateRide
