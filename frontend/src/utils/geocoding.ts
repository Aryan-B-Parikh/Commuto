/**
 * Geocoding Utility using Google Maps API
 * 
 * Fetches coordinates (lat, lng) for a given address string.
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in environment variables.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.warn("Google Maps API Key is missing! Defaulting to (0,0)");
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
            console.error("Geocoding failed:", data.status, data.error_message);
            return { lat: 0, lng: 0 };
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        return { lat: 0, lng: 0 };
    }
}
