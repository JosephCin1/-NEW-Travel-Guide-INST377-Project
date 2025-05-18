const openCageApiKey = import.meta.env.VITE_OPENCAGE_API_KEY;

export async function geocodePlace(place) {
try {
const response = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?key=${openCageApiKey}&q=${encodeURIComponent(place)}`
);
if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
}
const data = await response.json();
    return data;
} catch (error) {
console.error('Error fetching geocode data:', error);
    return null;
}
}

