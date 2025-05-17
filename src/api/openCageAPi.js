// src/api/openCage.js
import axios from 'axios';

const openCageApiKey = process.env.REACT_APP_OPENCAGE_API_KEY;
const openCageBaseUrl = 'https://api.opencagedata.com/geocode/v1/json';

export const geocodeAddress = async (address) => {
    try {
        const response = await axios.get(openCageBaseUrl, {
            params: {
                q: address,
                key: openCageApiKey,
                limit: 1,
                language: 'en',
                pretty: 1
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching geocode data:', error);
        return null;
    }
};
