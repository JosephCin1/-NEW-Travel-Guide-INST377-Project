// src/pages/SearchResults/SearchResults.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './SearchResults.css';
import { fetchPersonalizedRecommendationsFromLLM } from 'src/api/geminiAPI'; 
import { resolveAndStorePlaceSuggestions } from 'src/api/poiSupabaseApi.js'; 
import { logUserSearch } from 'src/api/userSearchLogger';
import { logSearchMatches } from 'src/api/matchLogger';

const preferenceCategories = [ // These should be the keys expected in the characteristics object for logSearchMatches
  "outdoor", "activity_intensity", "cultural", "social", "budget",
  "local_flavor", "touristy", "indoor", "eventful", "romantic"
];

const RawDataModal = ({ data, onClose, title = "Raw Data" }) => {
  if (!data) return null;
  return (
    <div className="modal-overlay-sr">
      <div className="modal-content-sr raw-data-modal-content">
        <h3>{title}</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
        <button onClick={onClose} className="modal-close-btn-sr">Close</button>
      </div>
    </div>
  );
};

const SearchResults = () => {
  const location = useLocation();
  const { destination, user } = location.state || {};

  const [llmSuggestions, setLlmSuggestions] = useState([]);
  const [isLoadingLlm, setIsLoadingLlm] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const [selectedLlmItemData, setSelectedLlmItemData] = useState(null);
  const [currentSearchId, setCurrentSearchId] = useState(null);
  // const hasRunEffectRef = useRef(false); // For debugging duplicate useEffect runs if needed

  const mapRef = useRef(null);

  useEffect(() => {
    // if (hasRunEffectRef.current && import.meta.env.DEV) { // Debugging for strict mode
    //   console.log("Effect run skipped by ref");
    //   return;
    // }

    const loadAndProcessRecommendations = async () => {
      const preferencesSource = user && user.preferences ? user.preferences : user;

      const hasValidPreferences = !!(
        user && 
        preferencesSource && 
        preferenceCategories.every(catKey => {
          let keyInPrefs = catKey;
          if (catKey === 'activity_intensity' && !preferencesSource.hasOwnProperty('activity_intensity') && preferencesSource.hasOwnProperty('activity_intens')) {
            keyInPrefs = 'activity_intens';
          } else if (catKey === 'activity_intens' && !preferencesSource.hasOwnProperty('activity_intens') && preferencesSource.hasOwnProperty('activity_intensity')) {
            keyInPrefs = 'activity_intensity';
          }
          return preferencesSource.hasOwnProperty(keyInPrefs) && typeof preferencesSource[keyInPrefs] === 'number';
        })
      );
      
      const hasValidDestination = destination && destination.name;

      if (hasValidDestination && user && user.user_id && hasValidPreferences) {
        setIsLoadingLlm(true);
        setLlmError(null);
        setLlmSuggestions([]);
        // We only set currentSearchId once after a successful logUserSearch
        // If this useEffect runs again due to StrictMode and currentSearchId is already set,
        // logUserSearch might be called again if we don't guard it or reset currentSearchId.
        // For StrictMode, it's often best to ensure the logged function is robust or accept the dev-only double call.
        // Resetting here means if deps change, we try to log again.
        // setCurrentSearchId(null); // Let's remove this premature reset. currentSearchId acts as a guard.


        try {
          let newSearchId = currentSearchId; // Use existing if available and valid for current context
                                           // This simple assignment might not be enough if user/dest changes
                                           // and we intend a new search log.

          // Only log user search if we haven't done it yet for this particular user/destination context
          // or if currentSearchId is null. This is a simple guard.
          if (!newSearchId) { // A more robust check might involve comparing against previous user/destination
            const userPrefsForLogging = {};
            preferenceCategories.forEach(catKey => {
              const schemaKey = catKey === 'activity_intensity' ? 'activity_intens' : catKey;
              let keyInUserObject = catKey;
              if (catKey === 'activity_intensity') {
                  if (preferencesSource.hasOwnProperty('activity_intensity')) keyInUserObject = 'activity_intensity';
                  else if (preferencesSource.hasOwnProperty('activity_intens')) keyInUserObject = 'activity_intens';
              } else if (catKey === 'activity_intens') {
                   if (preferencesSource.hasOwnProperty('activity_intens')) keyInUserObject = 'activity_intens';
                   else if (preferencesSource.hasOwnProperty('activity_intensity')) keyInUserObject = 'activity_intensity';
              }
              if (preferencesSource.hasOwnProperty(keyInUserObject)) {
                userPrefsForLogging[schemaKey] = preferencesSource[keyInUserObject];
              }
            });
            
            const { search_id: loggedSearchId, error: searchLogError } = await logUserSearch({
              userId: user.user_id, 
              destination: destination,
              preferences: userPrefsForLogging 
            });

            if (searchLogError || !loggedSearchId) {
              console.error("Failed to log user search or get search_id:", searchLogError);
              setLlmError(prev => `${prev || ''} Failed to log search event. ${searchLogError?.message || ''}`.trim());
              setIsLoadingLlm(false);
              return;
            }
            newSearchId = loggedSearchId;
            setCurrentSearchId(newSearchId); // Set it only after successful logging
          }
          
          const rawLlmSuggestions = await fetchPersonalizedRecommendationsFromLLM(destination, user);
          
          if (rawLlmSuggestions && rawLlmSuggestions.length > 0) {
            const { data: finalSuggestionsForDisplay, error: dbProcessingError } = 
              await resolveAndStorePlaceSuggestions(rawLlmSuggestions, destination, user);
            
            const sortedSuggestions = (finalSuggestionsForDisplay || []).sort((a, b) => {
              const scoreA = a.match_score !== undefined ? a.match_score : (a.matchScore !== undefined ? a.matchScore : 0);
              const scoreB = b.match_score !== undefined ? b.match_score : (b.matchScore !== undefined ? b.matchScore : 0);
              return scoreB - scoreA;
            });
            
            setLlmSuggestions(sortedSuggestions);

            if (newSearchId && sortedSuggestions.length > 0) { // Ensure newSearchId is available
              const matchesToLog = sortedSuggestions.map(item => {
                const characteristicsForMatch = {};
                let allRequiredCharacteristicsPresent = true;

                // preferenceCategories should contain keys like 'activity_intensity'
                preferenceCategories.forEach(pCatKey => {
                  let keyOnItem = pCatKey; // e.g. 'activity_intensity'
                  // Check if item has 'activity_intensity' or 'activity_intens'
                  if (pCatKey === 'activity_intensity') {
                    if (item.hasOwnProperty('activity_intensity')) keyOnItem = 'activity_intensity';
                  }
                  // Add other similar mappings if item keys vary from preferenceCategories

                  if (item.hasOwnProperty(keyOnItem) && typeof item[keyOnItem] === 'number') {
                    // Store using the key from preferenceCategories (e.g. 'activity_intensity')
                    // as logSearchMatches expects this for its internal mapping to DB schema (e.g. to 'activity_intens')
                    characteristicsForMatch[pCatKey] = item[keyOnItem];
                  } else {
                    allRequiredCharacteristicsPresent = false;
                  }
                });

                const currentMatchScore = item.match_score !== undefined ? item.match_score : (item.matchScore !== undefined ? item.matchScore : null);

                if (typeof item.place_id !== 'number' || !allRequiredCharacteristicsPresent) {
                  console.warn(
                    `Skipping item for match logging due to missing place_id (expected int4, got ${typeof item.place_id}: ${item.place_id}) or incomplete/invalid characteristics. All characteristics found: ${allRequiredCharacteristicsPresent}. Required: ${preferenceCategories.join(', ')}`, 
                    item
                  );
                  return null;
                }
                return {
                  place_id: item.place_id, 
                  characteristics: characteristicsForMatch,
                  matchScore: currentMatchScore
                };
              }).filter(match => match !== null);

              if (matchesToLog.length > 0) {
                const { error: matchLogError } = await logSearchMatches({
                  searchId: newSearchId,
                  matches: matchesToLog,
                });
                if (matchLogError) {
                  console.warn("Failed to log search matches:", matchLogError.message);
                } else {
                  console.log("Search matches logged successfully for search_id:", newSearchId);
                }
              }
            }

            if (dbProcessingError) {
              setLlmError(prevError => 
                `${prevError ? prevError + '; ' : ''}DB Processing Issues: ${dbProcessingError.message}`
              );
            }
          } else {
            setLlmSuggestions([]);
            console.log("LLM returned no initial suggestions.");
          }
        } catch (error) {
          console.error("Failed to fetch or process LLM recommendations:", error);
          setLlmError(error.message || "An unknown error occurred while fetching AI recommendations.");
        } finally {
          setIsLoadingLlm(false);
          // if (import.meta.env.DEV) hasRunEffectRef.current = true; // For strict mode debugging
        }
      } else {
        let missingInfoError = "";
        if (!hasValidDestination) missingInfoError += "Destination data (including name) is missing or invalid. ";
        if (!user || !user.user_id) missingInfoError += "User data (including ID) is missing. ";
        if (!hasValidPreferences) {
            missingInfoError += "User preferences are missing, incomplete, or not in the expected format. ";
        }
        
        setLlmError(missingInfoError.trim() || "Required data missing to generate recommendations.");
        console.log("Data check failed for LLM recommendations. Destination:", destination, "User:", user, "HasValidPreferences:", hasValidPreferences);
        setIsLoadingLlm(false);
      }
    };

    // Guard against re-running if API key isn't set.
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        setLlmError("AI features are unavailable: Gemini API Key not configured.");
        setIsLoadingLlm(false);
        return;
    }
    
    loadAndProcessRecommendations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, user]); // IMPORTANT: Ensure 'destination' and 'user' are stable references.

  // ... (rest of the component: API key check, initial guards, JSX rendering)
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
     return (
      <div className="page-container">
        <h2>API Key Configuration Error</h2>
        <p>Gemini API Key (VITE_GEMINI_API_KEY) is missing for AI recommendations.</p>
      </div>
    );
  }

  if (!destination || !user || !user.user_id ) { 
    return (
      <div className="page-container">
        <h2>Search Results</h2>
        <p>User or destination information is missing or incomplete. Please ensure you have selected a destination and user data (including ID and all preferences) is available.</p>
        <Link to="/">Start a New Search</Link>
      </div>
    );
  }

  const handleLlmItemClick = (itemData) => setSelectedLlmItemData(itemData);
  const handleCloseModal = () => setSelectedLlmItemData(null);

  return (
    <div className="page-container search-results-page">
      <h2>Personalized Recommendations for {destination?.name}</h2>
      <p>For User: <strong>{user?.username || `ID: ${user?.user_id}`}</strong></p>
      {currentSearchId && <p className="debug-info">Search Session ID: {currentSearchId}</p>}
      
      <div ref={mapRef} style={{ display: 'none' }}></div>

      {isLoadingLlm && (
        <div className="loading-indicator">
          <p>🧠 Our AI is crafting and checking your personalized suggestions... this may take a moment!</p>
        </div>
      )}
      {llmError && <p className="error-message">{llmError}</p>}
      
      {!isLoadingLlm && !llmError && llmSuggestions.length === 0 && (
        <p>No personalized suggestions could be generated or found with the current information. You might want to adjust your preferences or try a different destination.</p>
      )}

      {llmSuggestions.length > 0 && (
        <div className="llm-suggestions-section">
          <h3>AI-Powered Suggestions:</h3>
          <ul className="places-list">
            {llmSuggestions.map((item, index) => (
              <li key={item.place_id || (item.placeName || `place-${index}`) } className="place-item"> {/* Use item.place_id for key */}
                <h4>{index + 1}. {item.placeName}</h4>
                <p>
                  <strong>AI Match Score:</strong> {item.match_score !== undefined ? item.match_score : (item.matchScore !== undefined ? item.matchScore : 'N/A')}/100
                </p>
                <button onClick={() => handleLlmItemClick(item)}>View Details</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{marginTop: '30px'}}>
        <Link to="/interactive_search" state={{ location: destination }} style={{marginRight: '10px'}}>
          Adjust User or Preferences
        </Link>
        <Link to="/">Start New Destination Search</Link>
      </div>
      <RawDataModal data={selectedLlmItemData} onClose={handleCloseModal} title="Suggestion Details" />
    </div>
  );
};

export default SearchResults;