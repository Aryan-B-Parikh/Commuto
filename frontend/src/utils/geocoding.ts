export interface Coordinates {
    lat: number;
    lng: number;
}

/**
 * Geocode an address using Google Maps API
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable
 */
export async function geocodeAddress(address: string): Promise<Coordinates> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // If no API key or empty address, return default coordinates
    if (!apiKey || !address) {
        console.warn('Geocoding skipped: No API key or address provided');
        return { lat: 0, lng: 0 };
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        );

        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng
            };
        } else {
            console.error('Geocoding failed:', data.status, data.error_message);
            return { lat: 0, lng: 0 };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        return { lat: 0, lng: 0 };
    }
}
