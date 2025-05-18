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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedSearchId, setProcessedSearchId] = useState(initialSearchId);

  const isLoadingRecommendationsRef = useRef(false);

  const lastLoadedSearchContextIdRef = useRef(null);

  useEffect(() => {
    lastLoadedSearchContextIdRef.current = null; 
    isLoadingRecommendationsRef.current = false; 
  }, [destination, user]);

  const loadRecommendations = useCallback(async (currentSearchIdToProcess) => {
    if (!destination?.name || !user?.user_id) {
      setError("User or destination data is missing.");
      setIsLoading(false);
      return;
    }
    const preferencesSource = user.preferences || user;
    const hasValidPreferences = PREFERENCE_CATEGORIES.every(catKey =>
      typeof preferencesSource[catKey] === 'number'
    );
    if (!hasValidPreferences) {
      setError("User preferences are incomplete or invalid.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    let searchIdForThisRun = currentSearchIdToProcess;

    try {
      if (!searchIdForThisRun) {
        const userPrefsForLogging = PREFERENCE_CATEGORIES.reduce((acc, catKey) => {
          if (typeof preferencesSource[catKey] === 'number') acc[catKey] = preferencesSource[catKey];
          return acc;
        }, {});

        const { search_id: loggedSearchId, error: searchLogError } = await logUserSearch({
          userId: user.user_id,
          destination: destination,
          preferences: userPrefsForLogging
        });

        if (searchLogError || !loggedSearchId) {
          throw new Error(`Failed to log user search: ${searchLogError?.message || 'Unknown error'}`);
        }
        searchIdForThisRun = loggedSearchId;
        setProcessedSearchId(loggedSearchId);
      }

      const rawLlmSuggestions = await fetchPersonalizedRecommendationsFromLLM(destination, preferencesSource);

      if (rawLlmSuggestions && rawLlmSuggestions.length > 0) {
        const { data: finalSuggestionsForDisplay, error: dbProcessingError } =
          await resolveAndStorePlaceSuggestions(rawLlmSuggestions, destination, preferencesSource);

        if (dbProcessingError) {
          setError(`Issues processing suggestions: ${dbProcessingError.message}`);
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
            return null; 
          }).filter(match => match !== null);

          if (matchesToLog.length > 0) {
            await logSearchMatches({ searchId: searchIdForThisRun, matches: matchesToLog });
          }
        }
      } else {
        setSuggestions([]); 
      }
    } catch (err) {
      console.error("Error in loadRecommendations:", err); 
      setError(err.message || "An unexpected error occurred.");
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

    const idToLoad = initialSearchId; 

    if (idToLoad) { 
      if (idToLoad === lastLoadedSearchContextIdRef.current) {
        return; 
      }
      if (idToLoad !== processedSearchId) {
        setProcessedSearchId(idToLoad);
      }
    } else {
      if (lastLoadedSearchContextIdRef.current !== null) {

        if (processedSearchId && lastLoadedSearchContextIdRef.current === processedSearchId) return;

      }
    }

    isLoadingRecommendationsRef.current = true;
    setIsLoading(true);
    setSuggestions([]);
    setError(null);


    loadRecommendations(idToLoad)
      .finally(() => {
        isLoadingRecommendationsRef.current = false;
        setIsLoading(false);
        lastLoadedSearchContextIdRef.current = idToLoad || processedSearchId;
      });

  }, [initialSearchId, destination, user, loadRecommendations, processedSearchId]);

  return { suggestions, isLoading, error, searchId: processedSearchId };
};