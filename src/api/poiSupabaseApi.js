import { supabase } from './supabaseClient';

const preferenceCategories = [
  "outdoor", "activity_intensity", "cultural", "social", "budget",
  "local_flavor", "touristy", "indoor", "eventful", "romantic"
];

const calculateUserMatchScore = (placeData, userPreferences) => {
  if (!userPreferences || !placeData) return 50;
  let totalWeightedSimilarity = 0;
  let totalMaxPossibleWeightedSimilarity = 0;
  preferenceCategories.forEach(category => {
    const userPref = userPreferences[category];
    const placeScore = placeData[category];
    if (typeof userPref === 'number' && userPref >= 1 && userPref <= 10 &&
        typeof placeScore === 'number' && placeScore >= 1 && placeScore <= 10) {
      const diff = Math.abs(userPref - placeScore);
      const categorySimilarity = 9 - diff;
      totalWeightedSimilarity += categorySimilarity * userPref;
      totalMaxPossibleWeightedSimilarity += 9 * userPref;
    }
  });
  if (totalMaxPossibleWeightedSimilarity === 0) return 50;
  const score = (totalWeightedSimilarity / totalMaxPossibleWeightedSimilarity) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const resolveAndStorePlaceSuggestions = async (suggestionsFromLLM, currentDestination, currentUser) => {
  if (!suggestionsFromLLM || suggestionsFromLLM.length === 0) {
    return { data: [], error: null };
  }

  const processedSuggestions = [];
  let encounteredAnyError = false; 

  for (const llmPlace of suggestionsFromLLM) {
    const derivedCityName = currentDestination.address?.city ||
                           (currentDestination.name.includes(',') ? currentDestination.name.split(',')[0].trim() : currentDestination.name);
    const derivedCountryName = currentDestination.address?.country ||
                              (currentDestination.name.includes(',') ? currentDestination.name.split(',').pop().trim() : null);

    const cleanPlaceName = (llmPlace.placeName || "").trim();
    if (!cleanPlaceName) { 
        encounteredAnyError = true; 
        continue;
    }

    try {
      const { data: existingPlace, error: selectError } = await supabase
        .from('points_of_interest')
        .select('*')
        .eq('location_name', cleanPlaceName) 
        .eq('city_name', derivedCityName)
        .maybeSingle();

      if (selectError) {
        encounteredAnyError = true;
        processedSuggestions.push({
          placeName: cleanPlaceName,
          description: llmPlace.description || "Description not available.",
          categoryRatings: llmPlace.categoryRatings || {},
          match_score: calculateUserMatchScore(llmPlace.categoryRatings, currentUser),
          isFromDB: false,
          errorStatus: "Database query failed", 
        });
        continue;
      }

      if (existingPlace) {
        processedSuggestions.push({
          ...existingPlace,
          placeName: existingPlace.location_name, 
          match_score: calculateUserMatchScore(existingPlace, currentUser),
          isFromDB: true,
        });
      } else { 
        const recordToInsert = {
          location_name: cleanPlaceName,
          city_name: derivedCityName,
          country: derivedCountryName,
          coordinates: null, 
          description: llmPlace.description || `AI suggestion for ${cleanPlaceName}.`,
          business_status: null, 
          ratings: null, 
          type: 'AI Suggestion',
          ...(llmPlace.categoryRatings || {}), 
        };

        const { data: newPlace, error: insertError } = await supabase
          .from('points_of_interest')
          .insert(recordToInsert)
          .select()
          .single();

        if (insertError) {
          encounteredAnyError = true;
          processedSuggestions.push({
            placeName: cleanPlaceName,
            description: llmPlace.description || "Description not available.",
            categoryRatings: llmPlace.categoryRatings || {},
            match_score: calculateUserMatchScore(llmPlace.categoryRatings, currentUser),
            isFromDB: false,
            errorStatus: "Database insert failed", 
          });
        } else if (newPlace) {
          processedSuggestions.push({
            ...newPlace,
            placeName: newPlace.location_name, 
            match_score: calculateUserMatchScore(newPlace, currentUser),
            isFromDB: false, 
            isNewInsert: true,
          });
        }
      }
    } catch (loopError) {
      encounteredAnyError = true;
      processedSuggestions.push({
        placeName: cleanPlaceName || "Unknown place (processing error)",
        description: llmPlace.description || "Error processing this suggestion.",
        match_score: 50, 
        isFromDB: false,
        errorStatus: "Unexpected error during processing", 
      });
    }
  }

  const overallError = encounteredAnyError ? new Error("Some suggestions encountered issues during processing.") : null;

  return { data: processedSuggestions, error: overallError };
};