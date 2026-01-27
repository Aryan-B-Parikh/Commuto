import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
    const [role, setRole] = useState('RIDER')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        contactNumber: '',
        // Driver fields
        driverLicenseNumber: '',
        licenseExpiryDate: '',
        vehicleModel: '',
        vehicleColor: '',
        vehiclePlateNumber: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { registerRider, registerDriver } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            if (role === 'RIDER') {
                await registerRider({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    contactNumber: formData.contactNumber
                })
                navigate('/rider/dashboard')
            } else {
                if (!formData.driverLicenseNumber || !formData.vehicleModel || !formData.vehiclePlateNumber) {
                    setError('Please fill in all driver details')
                    setLoading(false)
                    return
                }
                await registerDriver({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    contactNumber: formData.contactNumber,
                    driverLicenseNumber: formData.driverLicenseNumber,
                    licenseExpiryDate: formData.licenseExpiryDate,
                    vehicleModel: formData.vehicleModel,
                    vehicleColor: formData.vehicleColor,
                    vehiclePlateNumber: formData.vehiclePlateNumber
                })
                navigate('/driver/dashboard')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="glass-card w-full max-w-md p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold gradient-text">Join Commuto</h1>
                    <p className="mt-2 text-gray-400">Create your account</p>
                </div>

                {/* Role Selection */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setRole('RIDER')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${role === 'RIDER'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        🚶 Rider
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('DRIVER')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${role === 'DRIVER'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        🚗 Driver
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="input-field"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="input-field"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            name="contactNumber"
                            value={formData.contactNumber}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="+1 234 567 8900"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* Driver-specific Fields */}
                    {role === 'DRIVER' && (
                        <div className="space-y-4 pt-4 border-t border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-200">Driver Details</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">License Number</label>
                                    <input
                                        type="text"
                                        name="driverLicenseNumber"
                                        value={formData.driverLicenseNumber}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="DL123456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">License Expiry</label>
                                    <input
                                        type="date"
                                        name="licenseExpiryDate"
                                        value={formData.licenseExpiryDate}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle Model</label>
                                <input
                                    type="text"
                                    name="vehicleModel"
                                    value={formData.vehicleModel}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Toyota Camry"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle Color</label>
                                    <input
                                        type="text"
                                        name="vehicleColor"
                                        value={formData.vehicleColor}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="White"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Plate Number</label>
                                    <input
                                        type="text"
                                        name="vehiclePlateNumber"
                                        value={formData.vehiclePlateNumber}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="ABC 1234"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full btn-primary py-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Creating Account...' : `Register as ${role === 'RIDER' ? 'Rider' : 'Driver'}`}
                    </button>
                </form>

                <p className="text-center text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Register
