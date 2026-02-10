// Trip Data Transformers
// Converts between backend API types and frontend UI types

import type { TripResponse } from '@/types/api';
import type { Trip } from '@/types';

/**
 * Transform backend TripResponse to frontend Trip type
 * Used when displaying trips from the API in UI components
 */
export function transformTripResponse(trip: TripResponse): Trip {
    // Parse date and time from start_time (ISO 8601 format)
    const startDate = new Date(trip.start_time);
    const date = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = startDate.toTimeString().slice(0, 5); // HH:MM

    return {
        id: trip.id,
        from: {
            name: trip.from_address,
            address: trip.from_address,
            lat: 0, // TODO: Backend should return coordinates
            lng: 0
        },
        to: {
            name: trip.to_address,
            address: trip.to_address,
            lat: 0,
            lng: 0
        },
        date,
        time,
        pricePerSeat: trip.price_per_seat || 0,
        seatsAvailable: trip.available_seats,
        totalSeats: trip.total_seats,
        status: trip.status as 'upcoming' | 'active' | 'completed' | 'cancelled',
        driver: {
            id: trip.driver_id || 'unknown',
            name: trip.driver_name || 'Driver',
            role: 'driver',
            rating: trip.driver_rating || 4.8,
            verified: true,
            avatar: trip.driver_avatar || '',
            totalTrips: 0,
            phone: '',
            email: '',
            joinedDate: new Date().toISOString()
        },
        passengers: [], // Backend doesn't return passengers currently
        distance: '0 km', // Placeholder
        duration: '0 min', // Placeholder
        vehicleType: 'Sedan', // Placeholder
        vehicleNumber: 'Pending' // Placeholder
    };
}

/**
 * Transform array of TripResponse to Trip[]
 */
export function transformTripResponses(trips: TripResponse[]): Trip[] {
    return trips.map(transformTripResponse);
}

/**
 * Transform frontend Trip creation data to backend TripRequest
 * Used when creating a new trip
 */
export function prepareTripForBackend(
    formData: {
        pickup: string;
        destination: string;
        date: string;
        time: string;
        passengers: string;
    },
    fromCoords?: { lat: number; lng: number },
    toCoords?: { lat: number; lng: number }
) {
    return {
        from_location: {
            address: formData.pickup,
            lat: fromCoords ? fromCoords.lat : 0,
            lng: fromCoords ? fromCoords.lng : 0
        },
        to_location: {
            address: formData.destination,
            lat: toCoords ? toCoords.lat : 0,
            lng: toCoords ? toCoords.lng : 0
        },
        date: formData.date,
        time: formData.time,
        seats_requested: parseInt(formData.passengers)
    };
}
