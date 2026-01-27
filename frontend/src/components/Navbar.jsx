import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

const Navbar = () => {
    const { user, logout, isRider, isDriver } = useAuth()
    const { isConnected, isDriverOnline } = useSocket()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-b border-gray-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="text-2xl">🚗</span>
                        <span className="text-xl font-bold gradient-text">Commuto</span>
                    </Link>

                    {/* Navigation Links */}
                    {user && (
                        <div className="hidden md:flex items-center space-x-4">
                            {isRider && (
                                <>
                                    <Link
                                        to="/rider/dashboard"
                                        className="text-gray-300 hover:text-white transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/rides/history"
                                        className="text-gray-300 hover:text-white transition-colors"
                                    >
                                        History
                                    </Link>
                                </>
                            )}
                            {isDriver && (
                                <>
                                    <Link
                                        to="/driver/dashboard"
                                        className="text-gray-300 hover:text-white transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/rides/history"
                                        className="text-gray-300 hover:text-white transition-colors"
                                    >
                                        History
                                    </Link>
                                    <Link
                                        to="/earnings"
                                        className="text-gray-300 hover:text-white transition-colors"
                                    >
                                        Earnings
                                    </Link>
                                </>
                            )}
                        </div>
                    )}

                    {/* Right Side */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                {/* Status Indicators */}
                                <div className="flex items-center space-x-2">
                                    {isDriver && (
                                        <span className={`px-2 py-1 rounded-full text-xs ${isDriverOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {isDriverOnline ? '🟢 Online' : '🔴 Offline'}
                                        </span>
                                    )}
                                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                                        }`} title={isConnected ? 'Connected' : 'Disconnected'}></span>
                                </div>

                                {/* User Info */}
                                <div className="flex items-center space-x-3">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-medium text-white">{user.name}</p>
                                        <p className="text-xs text-gray-400">{user.role}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary px-4 py-2"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
