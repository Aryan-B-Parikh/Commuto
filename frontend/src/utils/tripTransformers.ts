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
            name: trip.origin_address,
            address: trip.origin_address,
            lat: trip.origin_lat,
            lng: trip.origin_lng
        },
        to: {
            name: trip.dest_address,
            address: trip.dest_address,
            lat: trip.dest_lat,
            lng: trip.dest_lng
        },
        date,
        time,
        pricePerSeat: trip.price_per_seat || 0,
        seatsAvailable: trip.available_seats,
        totalSeats: trip.total_seats,
        status: trip.status as 'upcoming' | 'active' | 'completed' | 'cancelled',
        driver: {
            id: trip.driver_id || 'unknown',
            name: trip.driver_name || 'Finding Driver...',
            role: 'driver',
            rating: trip.driver_rating || 0,
            verified: !!trip.driver_name,
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
        vehicleNumber: 'Pending', // Placeholder
        bidCount: trip.bid_count || 0
    };
}

/**
 * Transform array of TripResponse to Trip[]
 */
export function transformTripResponses(trips: TripResponse[]): Trip[] {
    return trips.map(transformTripResponse);
}
