import React, { useState } from 'react';
import { fetchSearchDetails, fetchArchivedSearchMatches } from '../../api/archivedSearchApi'; 
import ArchivedSearchResultsDisplay from '../../components/ArchivedSearchResultsDisplay'; 
import './LookupSearchPage.css'; 

const LookupSearchPage = () => {
  const [searchIdInput, setSearchIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retrievedSearchData, setRetrievedSearchData] = useState(null); 

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
      if (matchesResult.error) {
        console.error("Error fetching matches:", matchesResult.error);
        setError(prev => `${prev || ''} Note: Could not fetch all associated matches. ${matchesResult.error.message}`.trim());
      }
      
      setRetrievedSearchData({
        details: detailsResult.data,
        matches: matchesResult.data || [] 
      });

    } catch (err) {
      console.error("Lookup failed:", err);
      setError(err.message || 'An unexpected error occurred during lookup.');
      setRetrievedSearchData(null); 
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
    <div className="lookup-search-page page-container"> 
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
      
      {error && !retrievedSearchData?.details && ( 
        <div className="error-message lookup-error">
          <p>{error}</p>
          {retrievedSearchData && <button onClick={clearLookup}>Try another Search ID</button>}
        </div>
      )}

      {retrievedSearchData?.details && (
        <ArchivedSearchResultsDisplay
          searchDetails={retrievedSearchData.details}
          fetchedMatches={retrievedSearchData.matches}
          onClearLookup={clearLookup} 
        />
      )}
      {error && retrievedSearchData?.details && error.includes("Could not fetch all associated matches") && (
        <div className="error-message lookup-error" style={{marginTop: '20px'}}>
            <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default LookupSearchPage;