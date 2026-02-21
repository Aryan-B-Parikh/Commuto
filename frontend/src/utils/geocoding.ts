export interface Coordinates {
    lat: number;
    lng: number;
}

export interface GeocodingResult {
    coordinates: Coordinates;
    status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
    error_message?: string;
}

/**
 * Geocode an address using Google Maps API
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // If no API key or empty address, return default
    if (!apiKey) {
        console.warn('Google Maps API key is missing. Using fallback coordinates.');
        return {
            coordinates: { lat: 23.0225, lng: 72.5714 },
            status: 'OK'
        };
    }

    if (!address) {
        return {
            coordinates: { lat: 0, lng: 0 },
            status: 'INVALID_REQUEST',
            error_message: 'Address is empty'
        };
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        );

        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
                coordinates: {
                    lat: location.lat,
                    lng: location.lng
                },
                status: 'OK'
            };
        } else {
            console.error('Geocoding failed:', data.status, data.error_message);
            return {
                coordinates: { lat: 0, lng: 0 },
                status: data.status,
                error_message: data.error_message
            };
        }
    } catch (error: any) {
        console.error('Geocoding error:', error);
        return {
            coordinates: { lat: 0, lng: 0 },
            status: 'UNKNOWN_ERROR',
            error_message: error.message
        };
    }
}
