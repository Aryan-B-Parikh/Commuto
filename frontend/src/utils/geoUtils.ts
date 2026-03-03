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
