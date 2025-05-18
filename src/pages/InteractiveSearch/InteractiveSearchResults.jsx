import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './InteractiveSearchResults.css'; 
import { supabase } from 'src/api/supabaseClient'; 

const fetchUserData = async (usernameToFind) => {
  console.log(`Workspaceing data from Supabase for username: ${usernameToFind}`);
  try {
    const { data, error, status } = await supabase
      .from('users')
      .select('*')
      .eq('username', usernameToFind)
      .single();

    if (error) {
      if (status === 406 || (error.details && error.details.includes("0 rows"))) {
        return { success: false, message: `User "${usernameToFind}" not found.` };
      }
      console.error('Supabase lookup error:', error);
      return { success: false, message: `Database error: ${error.message}` };
    }

    if (data) {
      return { success: true, data: data };
    } else {
      return { success: false, message: `User "${usernameToFind}" not found.` };
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
  const initialUsername = location.state?.username || '';

  const [usernameInput, setUsernameInput] = useState(initialUsername);
  const [userData, setUserData] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userError, setUserError] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [showRegisterButton, setShowRegisterButton] = useState(false);

  useEffect(() => {
    if (!destinationData) {
      console.log('No destination data received in InteractiveSearchResults. Check navigation state from SearchPage.');
    }
  }, [destinationData, navigate]);

  const handleUsernameChange = (e) => {
    setUsernameInput(e.target.value);
    setUserError(null);
    setShowRegisterButton(false);
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setUserError("Please enter a username.");
      setShowRegisterButton(false);
      return;
    }
    setIsLoadingUser(true);
    setUserError(null);
    setUserData(null);
    setShowRegisterButton(false);
    setIsConfirmationModalOpen(false);

    const response = await fetchUserData(usernameInput.trim());

    if (response.success) {
      setUserData(response.data);
      setIsConfirmationModalOpen(true);
    } else {
      setUserError(response.message || "Failed to find user.");
      if (response.message && response.message.toLowerCase().includes("not found")) {
        setShowRegisterButton(true);
      }
    }
    setIsLoadingUser(false);
  };

  const handleFinalConfirmation = () => {
    setIsConfirmationModalOpen(false);
    navigate('/search_results', {
      state: {
        destination: destinationData,
        user: userData,
        preferences: userData
      }
    });
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
  };

  const navigateToUserPage = () => {
    navigate('/users');
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
    if (!user) return null;
    return Object.entries(user).map(([key, value]) => {
      if (key === 'user_id' || key === 'created_at') return null;
      const displayKey = key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
          <div key={key} className="user-detail-nested">
            <strong>{displayKey}:</strong>
            <div style={{ paddingLeft: '15px' }}>
              {renderUserDetails(value)}
            </div>
          </div>
        );
      } else if (Array.isArray(value)) {
         return (
          <p key={key} className="user-detail-item">
            <strong>{displayKey}:</strong> {value.join(', ')}
          </p>
        );
      }
      return (
        <p key={key} className="user-detail-item">
          <strong>{displayKey}:</strong> {String(value)}
        </p>
      );
    });
  };

  return (
    <div className="page-container interactive-search-container">
      <h2>Interactive Search for: {destinationData?.name || 'your destination'}</h2>

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
        {userError && (
          <div className="user-message-container">
            <p className="error-message">{userError}</p>
            {showRegisterButton && (
              <button type="button" onClick={navigateToUserPage} className="register-button-inline action-button">
                Create User
              </button>
            )}
          </div>
        )}
      </form>

      {isConfirmationModalOpen && userData && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <h3>Confirm Your Details</h3>
            <div className="confirmation-details">
              <h4>Destination:</h4>
              <p>{destinationData?.name || 'N/A'}</p>
              {(destinationData?.address?.city || destinationData?.city) &&
                <p><small>City: {destinationData?.address?.city || destinationData?.city}</small></p>}
              {(destinationData?.address?.country || destinationData?.country) &&
                <p><small>Country: {destinationData?.address?.country || destinationData?.country}</small></p>}
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