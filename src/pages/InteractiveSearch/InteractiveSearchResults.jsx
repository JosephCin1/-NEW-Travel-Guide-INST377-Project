// src/pages/InteractiveSearch/InteractiveSearchResults.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import LookupSearchModal from '../../components/LookupSearchModal'; // Adjust path as needed
import ArchivedSearchResultsDisplay from '../../components/ArchivedSearchResultsDisplay'; // Adjust path
import { fetchSearchDetails, fetchArchivedSearchMatches } from '../../api/archivedSearchApi'; // Adjust path
import './InteractiveSearchResults.css'; //

const InteractiveSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Assuming destinationName comes via state like: location.state?.destinationName
  const destinationNameFromState = location.state?.destinationName; 
  const initialFilters = location.state?.filters; // If you pass filters

  const [isLoading, setIsLoading] = useState(false); // For regular interactive search
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // State for Lookup Search functionality
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [archivedError, setArchivedError] = useState(null);
  const [archivedSearchData, setArchivedSearchData] = useState(null); // { details: {}, matches: [] }

  // Simulate fetching results based on destinationNameFromState or filters
  useEffect(() => {
    if (destinationNameFromState && !archivedSearchData) { // Only run if not showing archived results
      // setIsLoading(true);
      // setError(null);
      // console.log("Simulating interactive search for:", destinationNameFromState, "with filters:", initialFilters);
      // Replace with your actual interactive search logic if this page does more than just being a placeholder
      // For now, if destinationNameFromState is present, we assume it's for an active search,
      // but the user prompt focuses on the "no destination" case.
      // If this page is *only* for when no destination is passed, this useEffect might not be needed.
      // Let's assume for now this page primarily handles the lookup if no destination.
    }
  }, [destinationNameFromState, initialFilters, archivedSearchData]);


  const handleLookupModalOpen = () => {
    setArchivedSearchData(null); // Clear previous lookup
    setArchivedError(null);
    setShowLookupModal(true);
  };

  const handleLookupModalClose = () => {
    setShowLookupModal(false);
  };

  const handleLookupSubmit = async (searchId) => {
    setShowLookupModal(false);
    setIsLoadingArchived(true);
    setArchivedError(null);
    setArchivedSearchData(null);

    const detailsResult = await fetchSearchDetails(searchId);
    if (detailsResult.error || !detailsResult.data) {
      setArchivedError(detailsResult.error?.message || 'Failed to fetch search details.');
      setIsLoadingArchived(false);
      return;
    }

    const matchesResult = await fetchArchivedSearchMatches(searchId);
    if (matchesResult.error) {
      // Log error but might still show details if matches fail
      console.error("Error fetching matches:", matchesResult.error);
      setArchivedError(prev => `${prev || ''} Failed to fetch matches. Some data might be incomplete.`.trim());
    }
    
    setArchivedSearchData({
      details: detailsResult.data,
      matches: matchesResult.data || [] // Use empty array if matches are null
    });
    setIsLoadingArchived(false);
  };
  
  const clearArchivedLookup = () => {
    setArchivedSearchData(null);
    setArchivedError(null);
    // Potentially navigate back to a state where user can input destination
    // or simply re-show the initial buttons.
  }

  // If actively showing archived results
  if (isLoadingArchived) {
    return <div className="page-container loading-indicator">Loading archived search results...</div>;
  }
  if (archivedError && !archivedSearchData?.details) { // Show critical error if details failed
    return (
      <div className="page-container error-message">
        <p>Error: {archivedError}</p>
        <button onClick={clearArchivedLookup} style={{marginRight: '10px'}}>Try Lookup Again</button>
        <Link to="/">Go to New Search</Link>
      </div>
    );
  }
  if (archivedSearchData) {
    return <ArchivedSearchResultsDisplay 
              searchDetails={archivedSearchData.details} 
              fetchedMatches={archivedSearchData.matches}
              onClearLookup={clearArchivedLookup} 
           />;
  }

  // Original logic for when no destination is provided
  if (!destinationNameFromState) {
    return (
      <div className="interactive-search-results-page page-container">
        <div className="no-destination-content">
          <h2>No Destination Selected</h2>
          <p>Please select a destination from the main search page to see interactive results.</p>
          <div className="navigation-buttons">
            <button onClick={() => navigate('/')} className="action-button">
              Go to Main Search
            </button>
            <button onClick={handleLookupModalOpen} className="action-button secondary">
              Lookup Past Search by ID
            </button>
          </div>
        </div>
        <LookupSearchModal 
          isOpen={showLookupModal} 
          onClose={handleLookupModalClose} 
          onSubmit={handleLookupSubmit} 
        />
      </div>
    );
  }

  // If destinationNameFromState IS present, and we are NOT showing archived results:
  // This is where your original UI for an active interactive search would go.
  // For now, it's a placeholder:
  return (
    <div className="interactive-search-results-page page-container">
      <h2>Interactive Search for: {destinationNameFromState}</h2>
      <p>Filters: {JSON.stringify(initialFilters)}</p>
      {/* Add your interactive search UI, filters, and results display here */}
      <p><em>(Interactive search UI for a selected destination to be implemented here)</em></p>
      <hr />
       <p>Or, you can lookup a different search:</p>
        <button onClick={handleLookupModalOpen} className="action-button secondary">
          Lookup Past Search by ID
        </button>
        <LookupSearchModal 
          isOpen={showLookupModal} 
          onClose={handleLookupModalClose} 
          onSubmit={handleLookupSubmit} 
        />
    </div>
  );
};

export default InteractiveSearchResults;