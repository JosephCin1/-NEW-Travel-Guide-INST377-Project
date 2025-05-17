import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchPage.css'; // We'll create this for modal and basic styling

const SearchPage = () => {
  const [locationInput, setLocationInput] = useState('');
  const [geocodedResults, setGeocodedResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (event) => {
    setLocationInput(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!locationInput.trim()) {
      setError('Please enter a location.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeocodedResults(null);

    // --- Geocoding API Call ---
    // Using OpenStreetMap Nominatim API
    // Docs: https://nominatim.org/release-docs/latest/api/Search/
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationInput)}&format=json&limit=5&addressdetails=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data && data.length > 0) {
        // For simplicity, we'll present the first few results if many are returned.
        // You might want more sophisticated disambiguation if multiple results are common.
        setGeocodedResults(data);
        setIsModalOpen(true);
      } else {
        setError('Location not found. Please try a different search term or be more specific.');
      }
    } catch (err) {
      console.error("Geocoding API error:", err);
      setError(err.message === 'Failed to fetch' ? 'Network error. Please check your connection.' : 'Could not fetch location data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLocation = (confirmedLocation) => {
    setIsModalOpen(false);
    // Pass the confirmed location data to the interactive search page
    // We're passing latitude, longitude, and display name. Adjust as needed.
    navigate('/interactive_search', {
      state: {
        location: {
          name: confirmedLocation.display_name,
          lat: parseFloat(confirmedLocation.lat),
          lon: parseFloat(confirmedLocation.lon),
          boundingBox: confirmedLocation.boundingbox, // [south, north, west, east]
          address: confirmedLocation.address // Detailed address components
        }
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGeocodedResults(null); // Clear results if modal is dismissed
  };

  return (
    <div className="page-container search-page-container">
      <h2>Find Your Next Destination</h2>
      <form onSubmit={handleSubmit} className="search-form">
        <label htmlFor="location">Enter your location:</label>
        <input
          type="text"
          id="location"
          value={locationInput}
          onChange={handleInputChange}
          placeholder="e.g. Paris, France"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {isModalOpen && geocodedResults && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Is this the location you meant?</h3>
            {geocodedResults.length === 1 ? (
              <div className="location-option">
                <p><strong>{geocodedResults[0].display_name}</strong></p>
                <p><small>Type: {geocodedResults[0].type}</small></p>
                <button onClick={() => handleConfirmLocation(geocodedResults[0])}>
                  Yes, this is it
                </button>
              </div>
            ) : (
              <>
                <p>We found a few possible matches. Please select the correct one:</p>
                <ul className="location-options-list">
                  {geocodedResults.slice(0, 5).map((result) => ( // Show top 5 results
                    <li key={result.place_id} className="location-option">
                      <p><strong>{result.display_name}</strong></p>
                      <p><small>Type: {result.type}{result.address?.country ? `, ${result.address.country}` : ''}</small></p>
                      <button onClick={() => handleConfirmLocation(result)}>
                        Select this one
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button onClick={handleCloseModal} className="modal-close-btn">
              Cancel / Search Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;