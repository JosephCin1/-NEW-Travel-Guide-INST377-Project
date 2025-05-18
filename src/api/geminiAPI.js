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
    return `- ${category.replace(/_/g, ' ')}: ${typeof score === 'number' && score >= 1 && score <= 10 ? score + '/10' : '(not specified)'}`;
  }).join('\n');

  if (!preferencesString.trim() || preferencesString.split('\n').every(s => s.includes('(not specified)'))) {
    preferencesString = "User has not specified detailed preferences beyond general interest in the destination.";
  }

  return `
    You are an expert travel recommendation assistant.
    A user is planning a trip to: ${destination.name} ${destination.address?.country ? `(${destination.address.country})` : ''}.
    User's preferences (1-10 scale, 1=low, 10=high):
    ${preferencesString}
    Where cateogory ratings are:
    - outdoor: 1-10 (1 = not at all, 10 = very much)
    - activity intensity: 1-10 (1 = low intensity, 10 = high intensity)
    - cultural: 1-10 (1 = not at all, 10 = very much)
    - social: 1-10 (1 = not at all, 10 = very much)
    - budget: 1-10 (1 = very cheap, 10 = very expensive)
    - local flavor: 1-10 (1 = not at all, 10 = very much)
    - touristy: 1-10 (1 = not at all, 10 = very much)
    - indoor: 1-10 (1 = not at all, 10 = very much)
    - eventful: 1-10 (1 = not at all, 10 = very much)
    - romantic: 1-10 (1 = not at all, 10 = very much)


    Suggest exactly 10 distinct, specific points of interest (landmarks, restaurants, activities, parks, museums, neighborhoods, etc.).
    For each place, provide the following information:
    1. Place Name: The specific name of the place.
    2. Category Ratings: Your estimated rating (1-10) for this place for each: ${preferenceCategories.join(', ')}.
    3. Match Score: An overall score (1-100) indicating how well this specific place matches the user's complete preference profile for this destination.

    Format your response as a valid JSON array of objects. Each object must have:
    "placeName": "Name of the Place",
    "categoryRatings": { "${preferenceCategories.map(c => `"${c}": <rating 1-10>`).join(', ')}" },
    "description": "A brief description of the place and why it matches the user's preferences."
    Provide only the JSON array in your response. No other text, narration, or markdown.
  `;
};

export const fetchPersonalizedRecommendationsFromLLM = async (destination, userPreferences) => {
  if (!GEMINI_API_KEY) {
    console.error("Gemini API Key (VITE_GEMINI_API_KEY) is missing!");
    throw new Error("Gemini API Key is not configured.");
  }
  if (!userPreferences) {
    console.error("User preferences are missing for LLM call.");
    throw new Error("User preferences are required to get personalized recommendations.");
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
      headers: {
        'Content-Type': 'application/json'
      }
    });


    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      if (candidate.finishReason && candidate.finishReason !== "STOP" && candidate.finishReason !== "MAX_TOKENS") {
        console.warn("LLM generation finished with reason:", candidate.finishReason, candidate.safetyRatings);
        const safetyIssues = (candidate.safetyRatings || []).filter(r => r.blocked).map(r => r.category).join(', ');
        throw new Error(`AI response incomplete or blocked. Reason: ${candidate.finishReason}.${safetyIssues ? ' Categories: ' + safetyIssues : ''}`);
      }

      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        let llmResponseText = candidate.content.parts[0].text;

        if (llmResponseText.startsWith("```json")) {
          llmResponseText = llmResponseText.substring(7, llmResponseText.length - 3).trim();
        } else if (llmResponseText.startsWith("```")) {
          llmResponseText = llmResponseText.substring(3, llmResponseText.length - 3).trim();
        }
        
        try {
          let parsedSuggestions = JSON.parse(llmResponseText);
          if (!Array.isArray(parsedSuggestions)) {
             if (typeof parsedSuggestions === 'object' && parsedSuggestions !== null && parsedSuggestions.placeName) {
                  parsedSuggestions = [parsedSuggestions]; 
              } else {
                  throw new Error("LLM response, once parsed, was not an array of suggestions as requested.");
              }
          }
          return parsedSuggestions.slice(0, 10);
        } catch (parseError) {
          console.error("Error parsing LLM JSON response:", parseError, "Raw text was:", llmResponseText);
          throw new Error("AI response was not in the expected JSON format. Check console for raw text.");
        }
      } else {
        throw new Error("No content parts found in AI candidate response.");
      }
    } else if (response.data && response.data.promptFeedback) {
        console.error("Prompt feedback from AI:", response.data.promptFeedback);
        throw new Error(`AI could not process the request due to prompt issues: ${response.data.promptFeedback.blockReason || 'Unknown reason'}. Check safety settings or prompt clarity.`);
    } else {
      throw new Error("No candidates found in AI response or response format is unexpected.");
    }
  } catch (error) {
    console.error("Error calling Gemini API with Axios:", error.toJSON ? error.toJSON() : error);
    let message = error.message;
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      message = `AI API request failed with status ${error.response.status}: ${error.response.data?.error?.message || error.message}`;
    }
    throw new Error(message);
  }
};