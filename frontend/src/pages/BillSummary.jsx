import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { billsAPI } from '../services/api'
import BillDisplay from '../components/BillDisplay'
import Loading from '../components/Loading'
import { ArrowLeft, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'

const BillSummary = () => {
    const { rideId } = useParams()
    const [bill, setBill] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBill()
    }, [rideId])

    const fetchBill = async () => {
        try {
            const response = await billsAPI.getOne(rideId)
            setBill(response.data.data)
        } catch (error) {
            toast.error('Failed to load bill')
        } finally {
            setLoading(false)
        }
    }

    const handleShare = () => {
        const text = `Commuto Ride Bill - From: ${bill.pickupLocation} To: ${bill.destination} - Total: ₹${bill.totalFare}`
        navigator.clipboard.writeText(text)
        toast.success('Bill details copied!')
    }

    if (loading) return <Loading text="Loading bill..." />

    if (!bill) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Bill not found</h2>
                    <Link to="/" className="btn-primary">Go to Dashboard</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                </Link>
                <BillDisplay bill={bill} />
                <div className="flex gap-4 mt-6">
                    <button onClick={handleShare} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                        <Share2 className="w-5 h-5" />
                        <span>Share</span>
                    </button>
                    <Link to="/" className="btn-primary flex-1 text-center">Back to Home</Link>
                </div>
            </div>
        </div>
    )
}

export default BillSummary
