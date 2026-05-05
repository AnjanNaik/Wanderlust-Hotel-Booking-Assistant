const fs = require('fs');
const dataFile = require('../../init/data.js');

const coordsMap = {
  "Malibu": [-118.7798, 34.0259],
  "New York City": [-74.006, 40.7128],
  "Aspen": [-106.8175, 39.1911],
  "Florence": [11.2558, 43.7696],
  "Portland": [-122.6587, 45.5152],
  "Cancun": [-86.8515, 21.1619],
  "Lake Tahoe": [-120.0324, 39.0968],
  "Los Angeles": [-118.2437, 34.0522],
  "Verbier": [7.2286, 46.0961],
  "Serengeti National Park": [34.8333, -2.3333],
  "Amsterdam": [4.9041, 52.3676],
  "Fiji": [178.065, -17.7134],
  "Cotswolds": [-1.8833, 51.8333],
  "Boston": [-71.0589, 42.3601],
  "Bali": [115.1889, -8.4095],
  "Banff": [-115.5708, 51.1784],
  "Miami": [-80.1918, 25.7617],
  "Phuket": [98.3923, 7.8804],
  "Scottish Highlands": [-4.2264, 57.1200],
  "Dubai": [55.2708, 25.2048],
  "Montana": [-110.3626, 46.9653],
  "Mykonos": [25.3273, 37.4415],
  "Costa Rica": [-83.7534, 9.7489],
  "Charleston": [-79.9311, 32.7765],
  "Tokyo": [139.6917, 35.6895],
  "New Hampshire": [-71.5724, 43.1939],
  "Maldives": [73.2207, 3.2028]
};

const updatedData = dataFile.data.map(listing => {
    let coords = coordsMap[listing.location];
    if (!coords) {
        coords = [77.2090, 28.6139]; // default
    }
    return {
        ...listing,
        geometry: {
            type: "Point",
            coordinates: coords
        }
    }
});

const fileContent = `const sampleListings = ${JSON.stringify(updatedData, null, 2)};\n\nmodule.exports = { data: sampleListings };\n`;

fs.writeFileSync('./init/data.js', fileContent);
console.log('Successfully updated init/data.js with geometry.');
