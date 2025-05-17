import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './InteractiveSearchResults.css';
import { supabase } from 'src/api/supabaseClient'; 

// Updated fetchUserData function to use Supabase
const fetchUserData = async (usernameToFind) => {
  console.log(`Workspaceing data from Supabase for username: ${usernameToFind}`);
  try {
    // Ensure your 'users' table has a column named 'username' (or adjust the column name below).
    // Using .ilike() for a case-insensitive search. Use .eq() for case-sensitive.
    const { data, error, status } = await supabase
      .from('users') 
      .select('*')   
      .eq('username', usernameToFind) 
      .single();

    if (error) {
      console.error('Supabase lookup error:', error);
      if (status !== 406 && error.message !== 'JSON object requested, multiple (or no) rows returned') { // 406 is usually for .single() not finding rows
         return { success: false, message: `Database error: ${error.message}` };
      }
    }

    if (data) {
      return { success: true, data: data };
    } else {
      return { success: false, message: "User not found." };
    }
  } catch (err) {
    console.error("Unexpected error fetching user data:", err);
    return { success: false, message: "An unexpected error occurred while fetching user data." };
  }
};


const InteractiveSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const destinationData = location.state?.location;

  const [usernameInput, setUsernameInput] = useState('');
  const [userData, setUserData] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userError, setUserError] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  useEffect(() => {
    if (!destinationData) {
      console.log('No destination data received. Consider redirecting.');
      // navigate('/'); // Example redirect
    }
  }, [destinationData, navigate]);

  const handleUsernameChange = (e) => {
    setUsernameInput(e.target.value);
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setUserError("Please enter a username.");
      return;
    }
    setIsLoadingUser(true);
    setUserError(null);
    setUserData(null);

    // Call the updated fetchUserData function
    const response = await fetchUserData(usernameInput);

    if (response.success) {
      setUserData(response.data);
      setIsConfirmationModalOpen(true);
    } else {
      setUserError(response.message || "Failed to find user.");
    }
    setIsLoadingUser(false);
  };

  const handleFinalConfirmation = () => {
    setIsConfirmationModalOpen(false);
    navigate('/search_results', {
      state: {
        destination: destinationData,
        user: userData
      }
    });
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
  };

  if (!destinationData) {
    return (
      <div className="page-container">
        <h2>Interactive Search</h2>
        <p>No destination selected. Please go back to the search page and choose a destination.</p>
        <button onClick={() => navigate('/')}>Go to Search</button>
      </div>
    );
  }

  const renderUserDetails = (user) => {
    // This helper function remains the same, it will dynamically display
    // whatever key-value pairs are in the user data object fetched from Supabase.
    if (!user) return null;
    return Object.entries(user).map(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) { // Check if it's a non-array object
        return (
          <div key={key} className="user-detail-nested">
            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
            <div style={{ paddingLeft: '15px' }}>
              {renderUserDetails(value)}
            </div>
          </div>
        );
      } else if (Array.isArray(value)) { // Handle arrays
         return (
          <p key={key} className="user-detail-item">
            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value.join(', ')}
          </p>
        );
      }
      return (
        <p key={key} className="user-detail-item">
          <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {String(value)}
        </p>
      );
    });
  };

  // ... rest of the JSX for InteractiveSearchResults component remains the same ...
  // (username form, modal, etc.)
  return (
    <div className="page-container interactive-search-container">
      <h2>Interactive Search for: {destinationData.name}</h2>
      {/* <p>Lat: {destinationData.lat}, Lon: {destinationData.lon}</p> */}
      {/* <hr /> */}

      <form onSubmit={handleUsernameSubmit} className="username-form">
        <h3>Enter Your Username to Personalize</h3>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          value={usernameInput}
          onChange={handleUsernameChange}
          placeholder="Enter your username"
          disabled={isLoadingUser}
        />
        <button type="submit" disabled={isLoadingUser}>
          {isLoadingUser ? 'Looking up...' : 'Lookup User'}
        </button>
        {userError && <p className="error-message">{userError}</p>}
      </form>

      {isConfirmationModalOpen && userData && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <h3>Confirm Your Details</h3>
            <div className="confirmation-details">
              <h4>Destination:</h4>
              <p>{destinationData.name}</p>
              {destinationData.address?.country && <p><small>Country: {destinationData.address.country}</small></p>}
              {destinationData.address?.city && <p><small>City: {destinationData.address.city}</small></p>}


              <hr style={{margin: "15px 0"}}/>

              <h4>User Details:</h4>
              {renderUserDetails(userData)}
            </div>
            <div className="modal-actions">
              <button onClick={handleFinalConfirmation} className="confirm-btn">
                Confirm and Proceed
              </button>
              <button onClick={handleCloseConfirmationModal} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveSearchResults;