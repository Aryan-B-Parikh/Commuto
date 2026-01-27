import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { billsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const BillSummary = () => {
    const { rideId } = useParams()
    const { isDriver } = useAuth()
    const navigate = useNavigate()

    const [bills, setBills] = useState([])
    const [singleBill, setSingleBill] = useState(null)
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (rideId) {
            loadSingleBill()
        } else {
            loadBillHistory()
        }
    }, [rideId])

    const loadSingleBill = async () => {
        try {
            const response = await billsAPI.getBill(rideId)
            setSingleBill(response.data.data)
        } catch (err) {
            console.error('Error loading bill:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadBillHistory = async () => {
        try {
            const response = await billsAPI.getHistory()
            setBills(response.data.data)
            setSummary(response.data.summary)
        } catch (err) {
            console.error('Error loading bills:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    // Single Bill View
    if (rideId && singleBill) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-md mx-auto">
                    <div className="glass-card p-6">
                        <div className="text-center mb-6">
                            <p className="text-4xl mb-2">🧾</p>
                            <h1 className="text-2xl font-bold text-white">Ride Receipt</h1>
                            <p className="text-gray-400 text-sm">
                                {new Date(singleBill.bill.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="p-3 bg-gray-800/50 rounded-lg">
                                <p className="text-xs text-gray-500">From</p>
                                <p className="text-gray-300">{singleBill.ride.originAddress}</p>
                            </div>
                            <div className="p-3 bg-gray-800/50 rounded-lg">
                                <p className="text-xs text-gray-500">To</p>
                                <p className="text-gray-300">{singleBill.ride.destAddress}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Fare</span>
                                <span className="text-white">₹{singleBill.bill.fare}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Distance</span>
                                <span className="text-white">{singleBill.bill.distance} km</span>
                            </div>
                            {singleBill.bill.duration && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Duration</span>
                                    <span className="text-white">{singleBill.bill.duration} mins</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-700 mt-4 pt-4">
                            <div className="flex justify-between text-lg font-bold">
                                <span className="text-white">Total</span>
                                <span className="text-emerald-400">₹{singleBill.bill.fare}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(-1)}
                            className="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Bill History View
    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="glass-card p-6">
                    <h1 className="text-2xl font-bold text-white">
                        {isDriver ? '💰 Earnings' : '🧾 Bills'}
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {isDriver ? 'Your earnings history' : 'Your payment history'}
                    </p>
                </div>

                {/* Summary */}
                {summary && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="glass-card p-4 text-center">
                            <p className="text-2xl font-bold text-emerald-400">₹{summary.totalFare}</p>
                            <p className="text-sm text-gray-400">
                                {isDriver ? 'Total Earned' : 'Total Spent'}
                            </p>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <p className="text-2xl font-bold text-blue-400">{summary.totalRides}</p>
                            <p className="text-sm text-gray-400">Rides</p>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <p className="text-2xl font-bold text-purple-400">{summary.totalDistance} km</p>
                            <p className="text-sm text-gray-400">Distance</p>
                        </div>
                    </div>
                )}

                {/* Bills List */}
                {bills.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <p className="text-4xl mb-4">💸</p>
                        <p className="text-gray-400">No bills yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bills.map(bill => (
                            <div
                                key={bill.id}
                                className="glass-card p-4 hover:bg-gray-800/30 transition-colors cursor-pointer"
                                onClick={() => navigate(`/bill/${bill.rideRequestId}`)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-white font-medium">
                                            {bill.rideRequest.originAddress.slice(0, 30)}...
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-emerald-400">₹{bill.fare}</p>
                                        <p className="text-xs text-gray-500">{bill.distance} km</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default BillSummary
