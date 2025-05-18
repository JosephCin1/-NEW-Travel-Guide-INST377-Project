import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './InteractiveSearchResults.css'; 
import { supabase } from 'src/api/supabaseClient';

const fetchUserData = async (usernameToFind) => {
  const trimmedUsername = usernameToFind.trim();
  if (!trimmedUsername) {
    return { data: null, error: { message: 'Username cannot be empty.' } };
  }

  try {
    const { data, error, status } = await supabase
      .from('users')
      .select('*')
      .eq('username', trimmedUsername)
      .single();

    if (error) {
      const message = (status === 406 || error.code === 'PGRST116')
        ? `User "${trimmedUsername}" not found.`
        : `Database error.`; 
      return { data: null, error: { message } };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: "An unexpected error occurred." } };
  }
};

const renderUserDetails = (user) => {
  if (!user) return null;
  return Object.entries(user)
    .map(([key, value]) => {
      if (key === 'user_id' || key === 'created_at' || typeof value === 'object' || Array.isArray(value)) {
        return null;
      }
      const displayKey = key.replace(/_/g, ' '); 
      return (
        <p key={key} className="user-detail-item">
          <strong>{displayKey}:</strong> {String(value)}
        </p>
      );
    })
    .filter(Boolean);
};

const InteractiveSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const destinationData = location.state?.location || {};
  const initialUsername = location.state?.username || '';

  const [usernameInput, setUsernameInput] = useState(initialUsername);
  const [userData, setUserData] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userError, setUserError] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [showRegisterButton, setShowRegisterButton] = useState(false);


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

    const { data, error } = await fetchUserData(usernameInput);

    if (data) {
      setUserData(data);
      setIsConfirmationModalOpen(true);
    } else if (error) {
      setUserError(error.message || "Failed to find user.");
      if (error.message && error.message.toLowerCase().includes("not found")) {
        setShowRegisterButton(true);
      }
    }
    setIsLoadingUser(false);
  };

  const handleFinalConfirmation = () => {
    setIsConfirmationModalOpen(false);
    if (userData && destinationData?.name) { 
      navigate('/search_results', {
        state: {
          destination: destinationData,
          user: userData,
          preferences: userData
        }
      });
    } else {
      setUserError("Missing data to proceed. Please try again."); 
    }
  };

  const handleCloseConfirmationModal = () => setIsConfirmationModalOpen(false);
  const navigateToUserPage = () => navigate('/users');

  if (!destinationData?.name) {
    return (
      <div className="page-container">
        <h2>Interactive Search</h2>
        <p>No destination selected. Please go back and choose a destination.</p>
        <button onClick={() => navigate('/')}>Go to Search Page</button>
      </div>
    );
  }

  return (
    <div className="page-container interactive-search-container">
      <h2>Interactive Search for: {destinationData.name}</h2>

      <form onSubmit={handleUsernameSubmit} className="username-form">
        <h3>Enter Username for Personalized Results</h3>
        <input
          type="text"
          id="username"
          value={usernameInput}
          onChange={handleUsernameChange}
          placeholder="Your username"
          disabled={isLoadingUser}
          aria-label="Username"
        />
        <button type="submit" disabled={isLoadingUser}>
          {isLoadingUser ? 'Searching...' : 'Find User'}
        </button>
        {userError && (
          <div className="user-message-container">
            <p className="error-message">{userError}</p>
            {showRegisterButton && (
              <button type="button" onClick={navigateToUserPage} className="register-button-inline action-button">
                Create New User
              </button>
            )}
          </div>
        )}
      </form>

      {isConfirmationModalOpen && userData && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <h3>Confirm Details</h3>
            <div className="confirmation-details">
              <h4>Destination:</h4>
              <p>{destinationData.name}</p>
              {(destinationData.address?.city || destinationData.city) && <p><small>City: {destinationData.address?.city || destinationData.city}</small></p>}
              {(destinationData.address?.country || destinationData.country) && <p><small>Country: {destinationData.address?.country || destinationData.country}</small></p>}
              <hr style={{ margin: "15px 0" }} />
              <h4>User Profile:</h4>
              {renderUserDetails(userData)}
            </div>
            <div className="modal-actions">
              <button onClick={handleFinalConfirmation} className="confirm-btn">Confirm & See Results</button>
              <button onClick={handleCloseConfirmationModal} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveSearchResults;