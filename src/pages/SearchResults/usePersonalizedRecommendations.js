import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPersonalizedRecommendationsFromLLM } from 'src/api/geminiAPI';
import { resolveAndStorePlaceSuggestions } from 'src/api/poiSupabaseApi';
import { logUserSearch } from 'src/api/userSearchLogger';
import { logSearchMatches } from 'src/api/matchLogger';

const PREFERENCE_CATEGORIES = [
  "outdoor", "activity_intensity", "cultural", "social", "budget",
  "local_flavor", "touristy", "indoor", "eventful", "romantic"
];

const getMatchScore = (item, defaultValue = 0) => {
  if (typeof item.match_score === 'number') return item.match_score;
  if (typeof item.matchScore === 'number') return item.matchScore;
  return defaultValue;
};

export const usePersonalizedRecommendations = (destination, user, initialSearchId) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Main loading state for UI
  const [error, setError] = useState(null);
  const [processedSearchId, setProcessedSearchId] = useState(initialSearchId);

  const isLoadingRecommendationsRef = useRef(false);
  const currentLoadingOrLoadedSearchIdRef = useRef(null);

  useEffect(() => {
    currentLoadingOrLoadedSearchIdRef.current = null;
    isLoadingRecommendationsRef.current = false; 
  }, [destination, user]);


  const loadRecommendations = useCallback(async (currentSearchIdToProcess) => {
    if (!destination || !user || !user.user_id) {
      setError("User or destination data is critically missing for recommendations.");
      setIsLoading(false); 
      return;
    }

    const preferencesSource = user.preferences || user;
    const hasValidPreferences = PREFERENCE_CATEGORIES.every(catKey =>
      typeof preferencesSource[catKey] === 'number'
    );

    if (!destination.name || !hasValidPreferences) {
      let missingInfoError = "";
      if (!destination.name) missingInfoError += "Destination name is missing. ";
      if (!hasValidPreferences) missingInfoError += "User preferences are incomplete or invalid. ";
      setError(missingInfoError.trim() || "Required data for recommendations is missing.");
      setIsLoading(false); 
      return;
    }

    setIsLoading(true); 
    setError(null);

    let searchIdForThisRun = currentSearchIdToProcess;

    try {
      if (!searchIdForThisRun) {
        const userPrefsForLogging = PREFERENCE_CATEGORIES.reduce((acc, catKey) => {
          const value = preferencesSource[catKey];
          if (typeof value === 'number') {
            acc[catKey] = value;
          }
          return acc;
        }, {});

        const { search_id: loggedSearchId, error: searchLogError } = await logUserSearch({
          userId: user.user_id,
          destination: destination,
          preferences: userPrefsForLogging
        });

        if (searchLogError || !loggedSearchId) {
          throw new Error(`Failed to log user search or obtain search_id: ${searchLogError?.message || 'Unknown error'}`);
        }
        searchIdForThisRun = loggedSearchId;
        setProcessedSearchId(loggedSearchId); 
      }

      const rawLlmSuggestions = await fetchPersonalizedRecommendationsFromLLM(destination, preferencesSource);

      if (rawLlmSuggestions && rawLlmSuggestions.length > 0) {
        const { data: finalSuggestionsForDisplay, error: dbProcessingError } =
          await resolveAndStorePlaceSuggestions(rawLlmSuggestions, destination, preferencesSource);

        if (dbProcessingError) {
          console.error("DB Processing Error:", dbProcessingError);
          setError(prevErr => (prevErr ? `${prevErr}; ` : '') + `Issues processing suggestions: ${dbProcessingError.message}`);
        }

        const sortedSuggestions = (finalSuggestionsForDisplay || []).sort((a, b) => getMatchScore(b) - getMatchScore(a));
        setSuggestions(sortedSuggestions);

        if (searchIdForThisRun && sortedSuggestions.length > 0) {
          const matchesToLog = sortedSuggestions.map(item => {
            const characteristicsForMatch = {};
            const allRequiredPresent = PREFERENCE_CATEGORIES.every(pCatKey => {
              if (typeof item[pCatKey] === 'number') {
                characteristicsForMatch[pCatKey] = item[pCatKey];
                return true;
              }
              return false;
            });

            if (typeof item.place_id === 'number' && allRequiredPresent) {
              const matchScore = getMatchScore(item, null);
              if (matchScore !== null) {
                return {
                  place_id: item.place_id,
                  characteristics: characteristicsForMatch,
                  matchScore: matchScore
                };
              }
            }
            console.warn(`Skipping item for match logging (missing place_id, characteristics, or valid matchScore): ${item.placeName || item.place_id}`, item);
            return null;
          }).filter(match => match !== null);

          if (matchesToLog.length > 0) {
            const { error: matchLogError } = await logSearchMatches({
              searchId: searchIdForThisRun,
              matches: matchesToLog,
            });
            if (matchLogError) {
              console.warn("Failed to log search matches:", matchLogError.message);
            } else {
              console.log("Search matches logged successfully for search_id:", searchIdForThisRun);
            }
          }
        }
      } else {
        setSuggestions([]);
        console.log("LLM returned no initial suggestions.");
      }
    } catch (err) {
      console.error("Error during the recommendation loading process:", err);
      setError(err.message || "An unexpected error occurred while fetching recommendations.");
    } finally {
    }
  }, [destination, user]);

  useEffect(() => {
    if (!destination || !user || !user.user_id) {
      setIsLoading(false);
      return;
    }

    if (isLoadingRecommendationsRef.current) {
      return;
    }

    let searchIdToEvaluate = initialSearchId || processedSearchId; 

    let shouldLoad = false;
    if (searchIdToEvaluate) { 
        if (searchIdToEvaluate !== currentLoadingOrLoadedSearchIdRef.current) {
            shouldLoad = true;
        }
    } else { 
        if (currentLoadingOrLoadedSearchIdRef.current !== 'new_search_initiated') {
            shouldLoad = true;
        }
    }
    

    if (initialSearchId && initialSearchId !== processedSearchId && initialSearchId !== currentLoadingOrLoadedSearchIdRef.current) {
        shouldLoad = true;

        setProcessedSearchId(initialSearchId);
        searchIdToEvaluate = initialSearchId; 
    }


    if (shouldLoad) {
      isLoadingRecommendationsRef.current = true;
      setIsLoading(true); 
      setSuggestions([]); 
      setError(null); 

      currentLoadingOrLoadedSearchIdRef.current = searchIdToEvaluate ? searchIdToEvaluate : 'new_search_initiated';

      loadRecommendations(searchIdToEvaluate) 
        .finally(() => {
          isLoadingRecommendationsRef.current = false;
          setIsLoading(false); 

          const finalSearchIdProcessed = searchIdToEvaluate || processedSearchId;
          if (finalSearchIdProcessed) {
            currentLoadingOrLoadedSearchIdRef.current = finalSearchIdProcessed;
          }
        });
    }
  }, [initialSearchId, destination, user, loadRecommendations, processedSearchId]);


  return { suggestions, isLoading, error, searchId: processedSearchId };
};