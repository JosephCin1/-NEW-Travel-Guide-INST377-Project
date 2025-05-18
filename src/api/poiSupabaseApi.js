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
  if (!suggestionsFromLLM || suggestionsFromLLM.length === 0) return { data: [], error: null };

  const processedSuggestionsForDisplay = [];
  let errorsEncountered = [];

  for (const llmPlace of suggestionsFromLLM) { 
    const derivedCityName = currentDestination.address?.city || 
                           (currentDestination.name.includes(',') ? currentDestination.name.split(',')[0].trim() : currentDestination.name);
    const derivedCountryName = currentDestination.address?.country || 
                              (currentDestination.name.includes(',') ? currentDestination.name.split(',').pop().trim() : null);

    try {
      const { data: existingPlaceFromDB, error: selectError } = await supabase
        .from('points_of_interest')
        .select('*')
        .eq('location_name', llmPlace.placeName)
        .eq('city_name', derivedCityName)
        .maybeSingle();

      if (selectError) {
        console.error(`Error checking for existing place "${llmPlace.placeName}":`, selectError);
        errorsEncountered.push({ placeName: llmPlace.placeName, error: `DB check failed: ${selectError.message}` });
        const fallbackMatchScore = calculateUserMatchScore(llmPlace.categoryRatings, currentUser);
        processedSuggestionsForDisplay.push({ 
            ...llmPlace, 
            match_score: fallbackMatchScore, 
            isFromDB: false, 
            dbError: selectError.message 
        });
        continue;
      }

      if (existingPlaceFromDB) {
        console.log(`Place "${existingPlaceFromDB.location_name}" in city "${derivedCityName}" already exists. Calculating user-specific match score.`);
        const userSpecificMatchScore = calculateUserMatchScore(existingPlaceFromDB, currentUser);
        processedSuggestionsForDisplay.push({
          ...existingPlaceFromDB, 
          placeName: existingPlaceFromDB.location_name,
          match_score: userSpecificMatchScore,
          isFromDB: true
        });
      } else {
        const recordToInsert = {
          location_name: llmPlace.placeName,
          city_name: derivedCityName,
          country: derivedCountryName,
          coordinates: null,
          description: llmPlace.description || `AI generated suggestion for ${llmPlace.placeName}.`,
          business_status: null,
          ratings: null,
          type: 'AI Suggestion',
          ...(llmPlace.categoryRatings || {})
        };
        preferenceCategories.forEach(catKey => {
          if (recordToInsert[catKey] === undefined && !(llmPlace.categoryRatings && catKey in llmPlace.categoryRatings)) {
            recordToInsert[catKey] = null;
          }
        });

        const { data: newPlaceFromDB, error: insertError } = await supabase
          .from('points_of_interest')
          .insert(recordToInsert)
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting new place "${llmPlace.placeName}":`, insertError);
          errorsEncountered.push({ placeName: llmPlace.placeName, error: `DB insert failed: ${insertError.message}` });
          const fallbackMatchScore = calculateUserMatchScore(llmPlace.categoryRatings, currentUser);
          processedSuggestionsForDisplay.push({ 
            ...llmPlace, 
            match_score: fallbackMatchScore,
            isFromDB: false, 
            dbError: insertError.message 
          });
        } else {
          console.log(`Successfully inserted new place "${llmPlace.placeName}".`, newPlaceFromDB);
          const userSpecificMatchScore = calculateUserMatchScore(newPlaceFromDB, currentUser);
          processedSuggestionsForDisplay.push({
            ...newPlaceFromDB, 
            placeName: newPlaceFromDB.location_name,
            match_score: userSpecificMatchScore,
            isFromDB: false,
            isNewInsert: true
          });
        }
      }
    } catch (loopError) {
      console.error(`Unexpected error processing suggestion "${llmPlace.placeName}":`, loopError);
      errorsEncountered.push({ placeName: llmPlace.placeName, error: `Unexpected error: ${loopError.message}` });
      const fallbackMatchScore = calculateUserMatchScore(llmPlace.categoryRatings, currentUser);
      processedSuggestionsForDisplay.push({ 
        ...llmPlace, 
        match_score: fallbackMatchScore,
        isFromDB: false, 
        dbError: loopError.message 
      });
    }
  }

  const overallError = errorsEncountered.length > 0 ? 
    new Error(errorsEncountered.map(e => `${e.placeName}: ${e.error}`).join('; ')) : 
    null;
    
  return { data: processedSuggestionsForDisplay, error: overallError };
};