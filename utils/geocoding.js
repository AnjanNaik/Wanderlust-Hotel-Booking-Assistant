/**
 * Utility function to geocode a given location string.
 * @param {string} location - The location string to geocode
 * @returns {Promise<Object>} An object containing type 'Point' and coordinates array [lon, lat]
 */
module.exports.geocodeLocation = async (location) => {
    let geocodeData = null;
    try {
        let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`, {
            headers: { 'User-Agent': 'Wanderlust/1.0' }
        });
        geocodeData = await response.json();
    } catch (err) {
        console.error("Geocoding failed:", err);
    }
    
    // Default coordinates (New Delhi)
    let geometry = {
        type: 'Point',
        coordinates: [77.2090, 28.6139] 
    };

    if (geocodeData && geocodeData.length > 0) {
        geometry = {
            type: 'Point',
            coordinates: [parseFloat(geocodeData[0].lon), parseFloat(geocodeData[0].lat)]
        };
    }

    return geometry;
};
