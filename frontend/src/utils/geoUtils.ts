/**
 * Utility for geographic calculations
 */

export interface Coordinates {
    lat: number;
    lng: number;
}

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLng = toRad(coord2.lng - coord1.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(value: number): number {
    return (value * Math.PI) / 180;
}

/**
 * Estimate CO2 saved in kg based on distance in km
 * Average car emits ~0.17kg per km. 
 * Carpooling with 1 other person saves 0.085kg per km per person.
 */
export function estimateCO2Saved(distanceKm: number): number {
    return distanceKm * 0.15; // Conservative estimate
}

// ---------------------------------------------------------------------------
// Geofence — Charusat Service Area
// ---------------------------------------------------------------------------

/**
 * Convex polygon vertices [lat, lng] defining the Commuto service area.
 * Covers Nadiad, Anand, Petlad, and Vadtal with ~500m buffer.
 * Must stay in sync with backend/services/geofence.py.
 */
export const CHARUSAT_SERVICE_POLYGON: [number, number][] = [
    [22.7450, 72.8100],   // North        — above Nadiad
    [22.7350, 72.9200],   // North-East
    [22.6100, 72.9750],   // East         — east of Anand
    [22.5100, 72.9700],   // South-East
    [22.4250, 72.8500],   // South        — below Petlad
    [22.4300, 72.7400],   // South-West
    [22.5100, 72.6950],   // West         — west of Vadtal
    [22.6500, 72.7200],   // North-West
];

/**
 * Ray-casting point-in-polygon check.
 * Returns true if the coordinate is inside the Charusat service area.
 */
export function isInsideServiceArea(lat: number, lng: number): boolean {
    const poly = CHARUSAT_SERVICE_POLYGON;
    const n = poly.length;
    let inside = false;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const [yi, xi] = poly[i];
        const [yj, xj] = poly[j];

        if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * Return the service area as a GeoJSON Polygon (for MapLibre rendering).
 * Note: GeoJSON uses [lng, lat] ordering.
 */
export function getServiceAreaGeoJSON(): GeoJSON.Feature {
    const coords = CHARUSAT_SERVICE_POLYGON.map(([lat, lng]) => [lng, lat]);
    coords.push(coords[0]); // close the ring

    return {
        type: 'Feature',
        properties: {
            name: 'Charusat Service Area',
            description: 'Commuto operates within this boundary.',
        },
        geometry: {
            type: 'Polygon',
            coordinates: [coords],
        },
    };
}
