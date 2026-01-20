import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
    Car,
    Home,
    PlusCircle,
    LogOut,
    User,
    Menu,
    X,
    MapPin,
    Wifi,
    WifiOff
} from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
    const { user, logout } = useAuth()
    const { isConnected } = useSocket()
    const location = useLocation()
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
        setMobileMenuOpen(false)
    }

    const isActive = (path) => location.pathname === path

    const navLinks = [
        { path: '/', label: 'Dashboard', icon: Home },
        { path: '/create', label: 'Create Ride', icon: PlusCircle },
        { path: '/my-rides', label: 'My Rides', icon: Car },
    ]

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-all duration-300">
                            <Car className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gradient">Commuto</span>
                    </Link>

                    {/* Desktop Navigation */}
                    {user && (
                        <div className="hidden md:flex items-center gap-6">
                            {navLinks.map((link) => {
                                const Icon = link.icon
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive(link.path)
                                                ? 'bg-white/10 text-white'
                                                : 'text-white/70 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="font-medium">{link.label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {/* Connection status */}
                        {user && (
                            <div className="hidden sm:flex items-center gap-2">
                                {isConnected ? (
                                    <div className="flex items-center gap-1 text-emerald-400 text-sm">
                                        <Wifi className="w-4 h-4" />
                                        <span className="hidden lg:inline">Live</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                                        <WifiOff className="w-4 h-4" />
                                        <span className="hidden lg:inline">Reconnecting...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {user ? (
                            <>
                                {/* User info */}
                                <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white/90 font-medium">{user.name}</span>
                                </div>

                                {/* Logout button */}
                                <button
                                    onClick={handleLogout}
                                    className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>

                                {/* Mobile menu button */}
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-white/80 hover:text-white transition-colors font-medium"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary text-sm"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && user && (
                    <div className="md:hidden py-4 border-t border-white/10 animate-fade-in">
                        <div className="flex flex-col gap-2">
                            {navLinks.map((link) => {
                                const Icon = link.icon
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(link.path)
                                                ? 'bg-white/10 text-white'
                                                : 'text-white/70 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{link.label}</span>
                                    </Link>
                                )
                            })}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar
