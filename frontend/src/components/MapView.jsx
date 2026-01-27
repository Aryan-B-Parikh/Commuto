import { useEffect, useState, useCallback } from 'react'
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api'
import { Navigation, MapPin } from 'lucide-react'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '1rem'
}

const defaultCenter = {
    lat: 28.6139, // Default to Delhi
    lng: 77.2090
}

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64779e' }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
    { featureType: 'poi', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#023e58' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3C7680' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5ce' }] },
    { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#023e58' }] },
    { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'transit', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'transit.line', elementType: 'geometry.fill', stylers: [{ color: '#283d6a' }] },
    { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#3a4762' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] }
]

const MapView = ({
    origin = null,
    destination = null,
    driverLocation = null,
    vehicleLocation = null,
    pickupLocation = null,
    showRoute = false,
    isTracking = false
}) => {
    // Support both prop naming conventions
    const activeVehicleLocation = driverLocation || vehicleLocation
    const activePickup = origin || pickupLocation
    const [map, setMap] = useState(null)
    const [directions, setDirections] = useState(null)
    const [center, setCenter] = useState(defaultCenter)

    const onLoad = useCallback((map) => {
        setMap(map)
    }, [])

    const onUnmount = useCallback(() => {
        setMap(null)
    }, [])

    // Update center when vehicle location changes
    useEffect(() => {
        if (activeVehicleLocation?.lat && activeVehicleLocation?.lng) {
            setCenter({
                lat: activeVehicleLocation.lat,
                lng: activeVehicleLocation.lng
            })
        } else if (activePickup?.lat && activePickup?.lng) {
            setCenter({
                lat: activePickup.lat,
                lng: activePickup.lng
            })
        }
    }, [activeVehicleLocation, activePickup])

    // If no API key, show placeholder
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your-google-maps-api-key') {
        return (
            <div
                className="w-full h-[400px] rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 border border-white/10 flex items-center justify-center"
            >
                <div className="text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-primary-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Map View</h3>
                    <p className="text-white/50 text-sm max-w-xs">
                        Add your Google Maps API key in the .env file to enable live tracking
                    </p>
                    {vehicleLocation && (
                        <div className="mt-4 p-3 rounded-lg bg-white/5">
                            <p className="text-white/70 text-xs">Current Location</p>
                            <p className="text-white font-mono text-sm">
                                {vehicleLocation.lat?.toFixed(6)}, {vehicleLocation.lng?.toFixed(6)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: darkMapStyle,
                    disableDefaultUI: true,
                    zoomControl: true,
                    mapTypeControl: false,
                    scaleControl: false,
                    streetViewControl: false,
                    rotateControl: false,
                    fullscreenControl: true
                }}
            >
                {/* Vehicle marker */}
                {vehicleLocation?.lat && vehicleLocation?.lng && (
                    <Marker
                        position={vehicleLocation}
                        icon={{
                            path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW || 0,
                            scale: 6,
                            fillColor: '#0ea5e9',
                            fillOpacity: 1,
                            strokeColor: '#fff',
                            strokeWeight: 2,
                            rotation: 0
                        }}
                    />
                )}

                {/* Directions */}
                {directions && (
                    <DirectionsRenderer
                        directions={directions}
                        options={{
                            polylineOptions: {
                                strokeColor: '#8b5cf6',
                                strokeWeight: 4
                            }
                        }}
                    />
                )}
            </GoogleMap>
        </LoadScript>
    )
}

export default MapView
