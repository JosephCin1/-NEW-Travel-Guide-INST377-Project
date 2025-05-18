import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './SearchResults.css';
import { usePersonalizedRecommendations } from './usePersonalizedRecommendations';

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


const getDisplayMatchScore = (item, defaultValue = 'N/A') => {
    if (typeof item.match_score === 'number') return item.match_score;
    if (typeof item.matchScore === 'number') return item.matchScore;
    return defaultValue;
};

const SearchResults = () => {
  const location = useLocation();
  const { destination, user } = location.state || {};

  const [selectedLlmItemData, setSelectedLlmItemData] = useState(null);
  const [currentSearchId, setCurrentSearchId] = useState(null);


  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return (
      <div className="page-container">
        <h2>API Key Configuration Error</h2>
        <p>VITE_GEMINI_API_KEY is missing. AI features are unavailable.</p>
      </div>
    );
  }

  if (!destination || !user || !user.user_id) {
    return (
      <div className="page-container">
        <h2>Search Results</h2>
        <p>User or destination information is missing or incomplete. Please ensure you have selected a destination and user data (including ID) is available.</p>
        <Link to="/">Start a New Search</Link>
      </div>
    );
  }

  const {
    suggestions: llmSuggestions,
    isLoading: isLoadingLlm,
    error: llmError,
    searchId: hookProcessedSearchId 
  } = usePersonalizedRecommendations(destination, user, currentSearchId);

  useEffect(() => {
    if (hookProcessedSearchId && hookProcessedSearchId !== currentSearchId) {
      setCurrentSearchId(hookProcessedSearchId);
    }
  }, [hookProcessedSearchId, currentSearchId]);

  const handleLlmItemClick = (itemData) => setSelectedLlmItemData(itemData);
  const handleCloseModal = () => setSelectedLlmItemData(null);

  return (
    <div className="page-container search-results-page">
      <h2>Personalized Recommendations for {destination?.name || 'your destination'}</h2>
      <p>For User: <strong>{user?.username || `ID: ${user?.user_id}`}</strong></p>
      {currentSearchId && <p className="debug-info">Search Session ID: {currentSearchId}</p>}

      {isLoadingLlm && (
        <div className="loading-indicator">
          <p>...Our AI is crafting and checking your personalized suggestions... this may take a moment!</p>
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
              <li key={item.place_id || item.placeName || `suggestion-${index}`} className="place-item">
                <h4>{index + 1}. {item.placeName || 'Unnamed Place'}</h4>
                <p>
                  <strong>AI Match Score:</strong> {getDisplayMatchScore(item)}/100
                </p>
                <button onClick={() => handleLlmItemClick(item)}>View Details</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <Link to="/interactive_search" state={{ location: destination }} style={{ marginRight: '10px' }}>
          Adjust User or Preferences
        </Link>
        <Link to="/">Start New Destination Search</Link>
      </div>
      <RawDataModal data={selectedLlmItemData} onClose={handleCloseModal} title="Suggestion Details" />
    </div>
  );
};

export default SearchResults;