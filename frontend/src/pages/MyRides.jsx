import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ridesAPI } from '../services/api'
import RideCard from '../components/RideCard'
import Loading from '../components/Loading'
import { Car, Users, ArrowRight, PlusCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const MyRides = () => {
    const [rides, setRides] = useState({ created: [], joined: [] })
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('created')

    useEffect(() => {
        fetchMyRides()
    }, [])

    const fetchMyRides = async () => {
        try {
            const response = await ridesAPI.getMyRides()
            setRides(response.data.data)
        } catch (error) {
            toast.error('Failed to fetch your rides')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loading text="Loading your rides..." />

    const currentRides = activeTab === 'created' ? rides.created : rides.joined

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Rides</h1>
                        <p className="text-white/60">View rides you've created or joined</p>
                    </div>
                    <Link to="/create" className="btn-primary flex items-center gap-2 w-fit">
                        <PlusCircle className="w-5 h-5" />
                        <span>Create Ride</span>
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'created'
                                ? 'bg-primary-500 text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                    >
                        <Car className="w-5 h-5" />
                        <span>Created ({rides.created.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('joined')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'joined'
                                ? 'bg-primary-500 text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        <span>Joined ({rides.joined.length})</span>
                    </button>
                </div>

                {/* Rides Grid */}
                {currentRides.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentRides.map((ride) => (
                            <RideCard key={ride._id} ride={ride} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            {activeTab === 'created' ? (
                                <Car className="w-10 h-10 text-white/30" />
                            ) : (
                                <Users className="w-10 h-10 text-white/30" />
                            )}
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            No rides {activeTab === 'created' ? 'created' : 'joined'} yet
                        </h3>
                        <p className="text-white/50 mb-6">
                            {activeTab === 'created'
                                ? 'Create your first ride to share with others'
                                : 'Browse available rides and join one'}
                        </p>
                        <Link to={activeTab === 'created' ? '/create' : '/'} className="btn-primary inline-flex items-center gap-2">
                            {activeTab === 'created' ? 'Create Ride' : 'Browse Rides'}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyRides
