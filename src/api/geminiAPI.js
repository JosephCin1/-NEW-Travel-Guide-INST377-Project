import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL_NAME = "gemini-2.0-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

const preferenceCategories = [
  "outdoor", "activity_intensity", "cultural", "social", "budget",
  "local_flavor", "touristy", "indoor", "eventful", "romantic"
];

const constructGeminiPrompt = (destination, userPreferences) => {
  let preferencesString = preferenceCategories.map(category => {
    const score = userPreferences[category];
    return `- ${category.replace(/_/g, ' ')}: ${typeof score === 'number' && score >= 1 && score <= 10 ? score + '/10' : 'not specified'}`;
  }).join('\n');

  if (!preferencesString.trim() || preferencesString.split('\n').every(s => s.includes('not specified'))) {
    preferencesString = "User has not specified detailed preferences.";
  }

  return `
    You are an expert travel recommendation assistant.
    A user is planning a trip to: ${destination.name} ${destination.address?.country ? `(${destination.address.country})` : ''}.
    User's preferences (1-10 scale, 1=low, 10=high):
    ${preferencesString}
    Where category ratings are:
    - outdoor: 1-10 (1 = not at all, 10 = very much)
    - activity intensity: 1-10 (1 = low intensity, 10 = high intensity)
    - cultural: 1-10 (1 = not at all, 10 = very much)
    - social: 1-10 (1 = not at all, 10 = very much)
    - budget: 1-10 (1 = very cheap, 10 = very expensive)
    - local_flavor: 1-10 (1 = not at all, 10 = very much)
    - touristy: 1-10 (1 = not at all, 10 = very much)
    - indoor: 1-10 (1 = not at all, 10 = very much)
    - eventful: 1-10 (1 = not at all, 10 = very much)
    - romantic: 1-10 (1 = not at all, 10 = very much)

    Suggest exactly 10 distinct, specific points of interest (landmarks, restaurants, activities, parks, museums, neighborhoods, etc.).
    For each place, provide the following information:
    1. Place Name: The specific name of the place.
    2. Category Ratings: Your estimated rating (1-10) for this place for each: ${preferenceCategories.join(', ')}.
    3. Description: A brief description of the place and why it matches the user's preferences.

    Format your response as a valid JSON array of objects. Each object must have:
    "placeName": "Name of the Place",
    "categoryRatings": { "${preferenceCategories.map(c => `"${c}": <rating 1-10>`).join(', ')}" },
    "description": "A brief description of the place and why it matches the user's preferences."
    Provide only the JSON array in your response. No other text, narration, or markdown.
  `;
};

export const fetchPersonalizedRecommendationsFromLLM = async (destination, userPreferences) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }
  if (!userPreferences) {
    throw new Error("User preferences are required for personalized recommendations.");
  }

  const prompt = constructGeminiPrompt(destination, userPreferences);
  const requestBody = {
    contents: [{
      parts: [{ "text": prompt }]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7, 
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await axios.post(GEMINI_API_URL, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });

    const candidate = response?.data?.candidates?.[0];

    if (response?.data?.promptFeedback?.blockReason) {
      throw new Error(`AI request blocked: ${response.data.promptFeedback.blockReason}`);
    }

    if (!candidate?.content?.parts?.[0]?.text) {
      throw new Error("AI response is missing expected content or has an unexpected format.");
    }

    const finishReason = candidate.finishReason;
    if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
      throw new Error(`AI response may be incomplete. Reason: ${finishReason}`);
    }

    let llmResponseText = candidate.content.parts[0].text;

    if (llmResponseText.startsWith("```json")) {
      llmResponseText = llmResponseText.substring(7, llmResponseText.length - 3).trim();
    } else if (llmResponseText.startsWith("```")) {
      llmResponseText = llmResponseText.substring(3, llmResponseText.length - 3).trim();
    }

    try {
      let parsedSuggestions = JSON.parse(llmResponseText);

      if (!Array.isArray(parsedSuggestions)) {
        if (parsedSuggestions && typeof parsedSuggestions === 'object' && parsedSuggestions.placeName) {
          parsedSuggestions = [parsedSuggestions];
        } else {
          throw new Error("AI response, after parsing, was not the expected array of suggestions.");
        }
      }
      return parsedSuggestions.slice(0, 10); 
    } catch (parseError) {
      throw new Error("AI response was not in the expected JSON format.");
    }

  } catch (error) {
    let errorMessage = "Failed to fetch recommendations from AI.";
    if (error.response?.status) { 
      errorMessage = `AI API request failed (status ${error.response.status}).`;
    } else if (error.message) { 
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};