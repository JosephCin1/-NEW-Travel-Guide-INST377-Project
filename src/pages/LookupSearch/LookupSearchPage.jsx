// src/pages/LookupSearch/LookupSearchPage.jsx
import React, { useState } from 'react';
import { fetchSearchDetails, fetchArchivedSearchMatches } from '../../api/archivedSearchApi'; // Adjust path if needed
import ArchivedSearchResultsDisplay from '../../components/ArchivedSearchResultsDisplay'; // Adjust path if needed
import './LookupSearchPage.css'; // We'll create this for styling

const LookupSearchPage = () => {
  const [searchIdInput, setSearchIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retrievedSearchData, setRetrievedSearchData] = useState(null); // Will hold { details: {}, matches: [] }

  const handleInputChange = (e) => {
    setSearchIdInput(e.target.value);
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!searchIdInput.trim()) {
      setError('Please enter a Search ID.');
      return;
    }
    
    const parsedId = parseInt(searchIdInput);
    if (isNaN(parsedId) || parsedId <= 0) {
      setError('Please enter a valid positive Search ID.');
      setSearchIdInput('');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRetrievedSearchData(null);

    try {
      const detailsResult = await fetchSearchDetails(parsedId);
      if (detailsResult.error || !detailsResult.data) {
        throw new Error(detailsResult.error?.message || 'Failed to fetch search details. No search found with this ID.');
      }

      const matchesResult = await fetchArchivedSearchMatches(parsedId);
      // We can proceed even if matchesResult has an error, as details might still be useful.
      if (matchesResult.error) {
        console.error("Error fetching matches:", matchesResult.error);
        // Optionally set a partial error message if needed, but details will still show.
        setError(prev => `${prev || ''} Note: Could not fetch all associated matches. ${matchesResult.error.message}`.trim());
      }
      
      setRetrievedSearchData({
        details: detailsResult.data,
        matches: matchesResult.data || [] // Use empty array if matches are null or errored
      });

    } catch (err) {
      console.error("Lookup failed:", err);
      setError(err.message || 'An unexpected error occurred during lookup.');
      setRetrievedSearchData(null); // Ensure no partial data is shown on critical error
    } finally {
      setIsLoading(false);
    }
  };

  const clearLookup = () => {
    setSearchIdInput('');
    setRetrievedSearchData(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="lookup-search-page page-container"> {/* Assuming .page-container provides general padding/max-width */}
      <h1>Lookup Past Search</h1>
      {!retrievedSearchData && (
        <form onSubmit={handleLookup} className="lookup-form">
          <input
            type="number"
            value={searchIdInput}
            onChange={handleInputChange}
            placeholder="Enter Search ID (e.g., 123)"
            className="lookup-input"
            min="1"
          />
          <button type="submit" className="lookup-button" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Lookup Search'}
          </button>
        </form>
      )}

      {isLoading && <div className="loading-indicator">Loading search data...</div>}
      
      {error && !retrievedSearchData?.details && ( // Show error prominently if no details could be fetched
        <div className="error-message lookup-error">
          <p>{error}</p>
          {retrievedSearchData && <button onClick={clearLookup}>Try another Search ID</button>}
        </div>
      )}

      {retrievedSearchData?.details && (
        <ArchivedSearchResultsDisplay
          searchDetails={retrievedSearchData.details}
          fetchedMatches={retrievedSearchData.matches}
          onClearLookup={clearLookup} // Pass the clear function
        />
      )}
       {/* Display partial error message if details were fetched but matches had issues */}
      {error && retrievedSearchData?.details && error.includes("Could not fetch all associated matches") && (
        <div className="error-message lookup-error" style={{marginTop: '20px'}}>
            <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default LookupSearchPage;