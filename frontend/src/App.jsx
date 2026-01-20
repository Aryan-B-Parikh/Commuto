import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateRide from './pages/CreateRide'
import RideDetails from './pages/RideDetails'
import BillSummary from './pages/BillSummary'
import MyRides from './pages/MyRides'
import Loading from './components/Loading'

// Protected Route Component
// DEV MODE: Set to true to preview pages without authentication
const DEV_PREVIEW_MODE = false

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()

    // Bypass auth in dev preview mode
    if (DEV_PREVIEW_MODE) {
        return children
    }

    if (loading) {
        return <Loading />
    }

    if (!user) {
        return <Navigate to="/login" replace />
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
        return <Navigate to="/" replace />
    }

    return children
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

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/create"
                        element={
                            <ProtectedRoute>
                                <CreateRide />
                            </ProtectedRoute>
                        }
                    />
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
                        path="/my-rides"
                        element={
                            <ProtectedRoute>
                                <MyRides />
                            </ProtectedRoute>
                        }
                    />

                    {/* Catch all - redirect to dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    )
}

export default App
