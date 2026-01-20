/**
 * Calculate fare per person
 * @param {number} totalFare - Total ride fare
 * @param {number} passengerCount - Number of passengers including creator
 * @returns {number} Fare per person (rounded up)
 */
const calculateFarePerPerson = (totalFare, passengerCount) => {
    if (passengerCount <= 0) return totalFare;
    return Math.ceil(totalFare / passengerCount);
};

/**
 * Calculate estimated distance between two points (Haversine formula)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

module.exports = {
    calculateFarePerPerson,
    calculateDistance
};
