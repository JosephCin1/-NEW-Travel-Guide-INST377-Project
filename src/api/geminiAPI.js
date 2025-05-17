// src/api/gemini.js
import axios from 'axios';

const geminiApiUrl = process.env.REACT_APP_GEMINI_API_URL;
const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;

export const fetchGeminiBalances = async () => {
    try {
        const response = await axios.get(`${geminiApiUrl}/balances`, {
            headers: {
                'Content-Type': 'application/json',
                'X-GEMINI-APIKEY': geminiApiKey,
                'X-GEMINI-PAYLOAD': 'your_encoded_payload',  // Replace this with your payload
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching balances from Gemini:', error);
        return null;
    }
};
