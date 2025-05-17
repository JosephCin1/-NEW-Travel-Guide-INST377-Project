// src/api/openCage.js
import axios from 'axios';

const openCageApiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
const openCageBaseUrl = 'https://api.opencagedata.com/geocode/v1/json';

export async function geocodePlace(place) {
try {
const response = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?key=${openCageApiKey}&q=${encodeURIComponent(place)}`
);
if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
}
const data = await response.json();
    return data; // return the parsed JSON result
} catch (error) {
console.error('Error fetching geocode data:', error);
    return null; // or throw error depending on your error handling strategy
}
}

