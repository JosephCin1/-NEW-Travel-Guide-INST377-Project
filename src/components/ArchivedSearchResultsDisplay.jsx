import React, { useState } from 'react';
import { fetchPointOfInterestDetails } from 'src/api/archivedSearchApi';

const SimpleRawDataModal = ({ data, onClose, title = "Details", isLoading, error }) => {
  if (!data && !isLoading && !error) return null; 

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1001
  };
  const contentStyle = {
    background: 'white', padding: '20px', borderRadius: '5px',
    maxHeight: '80vh', overflowY: 'auto', minWidth: '300px', maxWidth: '600px', textAlign: 'left'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        {isLoading && <p>Loading details...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!isLoading && !error && data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        {!isLoading && !error && data === null && <p>Details not found.</p>}
        <button onClick={onClose} style={{ marginTop: '10px' }}>Close</button>
      </div>
    </div>
  );
};


const ArchivedSearchResultsDisplay = ({ searchDetails, fetchedMatches, onClearLookup }) => {
  const [selectedPoiData, setSelectedPoiData] = useState(null); 
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  if (!searchDetails || !fetchedMatches) {
    return <p>No data to display for the looked-up search.</p>;
  }

  const handleViewDetailsClick = async (matchItem) => {
    if (!matchItem?.place_id) {
      setModalError("Place ID is missing, cannot fetch details.");
      setSelectedPoiData(null); 
    }

    setIsModalLoading(true);
    setModalError(null);
    setSelectedPoiData(null); 

    const { data: poiData, error: poiError } = await fetchPointOfInterestDetails(matchItem.place_id);

    setIsModalLoading(false);
    if (poiError) {
      setModalError(poiError.message || "Failed to load Point of Interest details.");
      setSelectedPoiData(null); 
    } else {
      setSelectedPoiData(poiData); 
    }
  };

  const closeAndResetModal = () => {
    setSelectedPoiData(null);
    setModalError(null);
    setIsModalLoading(false); 
  };

  const userPreferencesDisplay = Object.keys(searchDetails)
    .filter(key => !['search_id', 'location_name', 'city_name', 'country', 'coordinates', 'user_id'].includes(key) && typeof searchDetails[key] === 'number')
    .map(key => `${key.replace(/_/g, ' ')}: ${searchDetails[key]}`)
    .join(', ');

  return (
    <div className="archived-results-container" style={{ padding: '20px' }}>
      <button onClick={onClearLookup} style={{ marginBottom: '20px' }}>Clear Lookup & Search Again</button>
      <h2>Archived Search Results for: {searchDetails.location_name}</h2>
      {searchDetails.city_name && <p>City: {searchDetails.city_name}{searchDetails.country && `, ${searchDetails.country}`}</p>}
      <p><strong>Search ID:</strong> {searchDetails.search_id}</p>
      <p><strong>Search Preferences:</strong> {userPreferencesDisplay || "N/A"}</p>

      {fetchedMatches.length > 0 ? (
        <div className="llm-suggestions-section">
          <h3>Matched Places:</h3>
          <ul className="places-list">
            {fetchedMatches.map((item, index) => (
              <li key={item.id || item.place_id || `archive-match-${index}`} className="place-item">
                <h4>{index + 1}. {item.placeName || 'Name not available'}</h4>
                <p>
                  <strong>Place ID:</strong> {item.place_id || 'N/A'}
                </p>
                <p>
                  <strong>Archived Match Score:</strong> {item.match_score !== undefined ? `${item.match_score}/100` : 'N/A'}
                </p>
                <button onClick={() => handleViewDetailsClick(item)}>View Details</button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No matches found for this search ID.</p>
      )}

      {(selectedPoiData || isModalLoading || modalError) && (
        <SimpleRawDataModal
          data={selectedPoiData}
          onClose={closeAndResetModal}
          title="Point of Interest Details"
          isLoading={isModalLoading}
          error={modalError}
        />
      )}
    </div>
  );
};

export default ArchivedSearchResultsDisplay;