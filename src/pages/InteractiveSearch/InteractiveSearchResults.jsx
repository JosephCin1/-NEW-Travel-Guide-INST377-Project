import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const InteractiveSearchResults = () => {
  const location = useLocation(); // Hook to get location object
  const searchData = location.state?.location; // Access the state passed from SearchPage

  useEffect(() => {
    if (searchData) {
      console.log('Received location data:', searchData);
      // Now you can use searchData.name, searchData.lat, searchData.lon, etc.
      // to fetch more details, display on a map, or perform other actions.
    } else {
      console.log('No location data received. Maybe redirect or show a message?');
      // Optionally, redirect back to search page or show a "no location selected" message.
    }
  }, [searchData]);

  if (!searchData) {
    return (
      <div className="page-container">
        <h2>Interactive Search</h2>
        <p>No location selected. Please go back to the search page and choose a destination.</p>
        {/* You might want a Link back to the search page here */}
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>Interactive Search Results for: {searchData.name}</h2>
      <p>Latitude: {searchData.lat}</p>
      <p>Longitude: {searchData.lon}</p>
      {/* Display map, points of interest, etc., based on these coordinates */}
      {/* You might want to display details from searchData.address or searchData.boundingBox */}
    </div>
  );
};

export default InteractiveSearchResults;