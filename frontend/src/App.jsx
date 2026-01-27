import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import RiderDashboard from './pages/RiderDashboard'
import DriverDashboard from './pages/DriverDashboard'
import RideDetails from './pages/RideDetails'
import BillSummary from './pages/BillSummary'
import MyRides from './pages/MyRides'
import Loading from './components/Loading'

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return <Loading />
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Role-based redirect
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to={user.role === 'DRIVER' ? '/driver/dashboard' : '/rider/dashboard'} replace />
    }

    return children
}

// Public Route Component (redirect if logged in)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return <Loading />
    }

    if (user) {
        return <Navigate to={user.role === 'DRIVER' ? '/driver/dashboard' : '/rider/dashboard'} replace />
    }

    return children
}

// Home redirect based on role
const HomeRedirect = () => {
    const { user, loading } = useAuth()

    if (loading) {
        return <Loading />
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return <Navigate to={user.role === 'DRIVER' ? '/driver/dashboard' : '/rider/dashboard'} replace />
}

function App() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="pt-20">
                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <Register />
                            </PublicRoute>
                        }
                    />

                    {/* Home - redirect based on role */}
                    <Route path="/" element={<HomeRedirect />} />

                    {/* Rider Routes */}
                    <Route
                        path="/rider/dashboard"
                        element={
                            <ProtectedRoute requiredRole="RIDER">
                                <RiderDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Driver Routes */}
                    <Route
                        path="/driver/dashboard"
                        element={
                            <ProtectedRoute requiredRole="DRIVER">
                                <DriverDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Shared Protected Routes */}
                    <Route
                        path="/ride/:id"
                        element={
                            <ProtectedRoute>
                                <RideDetails />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/bill/:rideId"
                        element={
                            <ProtectedRoute>
                                <BillSummary />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rides/history"
                        element={
                            <ProtectedRoute>
                                <MyRides />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/bills"
                        element={
                            <ProtectedRoute>
                                <BillSummary />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/earnings"
                        element={
                            <ProtectedRoute requiredRole="DRIVER">
                                <BillSummary />
                            </ProtectedRoute>
                        }
                    />

                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    )
}

export default App
