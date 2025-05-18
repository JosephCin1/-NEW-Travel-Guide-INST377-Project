import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import UserSearchForm from './UserSearchForm';
import UserDetailsForm from './UserDetailsForm';
import {
  checkUserExists,
  getUserByUsername,
  createUser,
  updateUserPreferences
} from '../../api/userApi';
import './UserPage.css';

const UserPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchedUsername, setLastSearchedUsername] = useState('');
  const navigate = useNavigate(); 

  const PREFERENCE_KEYS = [
    "outdoor", "activity_intensity", "cultural", "social", "budget",
    "local_flavor", "touristy", "indoor", "eventful", "romantic"
  ]; //

  const handleLookupUser = async (username) => {
    setIsLoading(true);
    setMessage('');
    setEditingUser(null);
    setLastSearchedUsername(username);

    const { data, error } = await getUserByUsername(username);
    if (error) {
      setMessage(error.message || `Could not find user: ${username}.`);
      setCurrentUser(null);
    } else {
      setCurrentUser(data);
      setEditingUser(data);
      setMessage(`User "${username}" found. You can now edit their preferences.`);
    }
    setIsLoading(false);
  };

  const handleCreateNewUser = async (username) => {
    setIsLoading(true);
    setMessage('');
    setEditingUser(null);
    setLastSearchedUsername(username);

    const { exists, error: checkError } = await checkUserExists(username);
    if (checkError) {
      setMessage(`Error checking username: ${checkError.message}`);
      setIsLoading(false);
      return;
    }
    if (exists) {
      setMessage(`Username "${username}" is already taken. Please choose another.`);
      setIsLoading(false);
      return;
    }

    const { data: newUser, error: createError } = await createUser(username);
    if (createError) {
      setMessage(`Failed to create user: ${createError.message}`);
    } else {
      setCurrentUser(newUser);
      setEditingUser(newUser);
      setMessage(`User "${username}" created successfully! Please set their preferences below.`);
    }
    setIsLoading(false);
  };

  const handleSaveChanges = async (userId, preferences) => {
    setIsLoading(true);
    setMessage('');
    const { data: updatedUser, error } = await updateUserPreferences(userId, preferences);
    if (error) {
      setMessage(`Failed to update preferences: ${error.message}`);
      setIsLoading(false); 
    } else {
      setCurrentUser(updatedUser);
      setMessage('Preferences updated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/'); 
      }, 1500); 
    }
  };

  const handleCancelEdit = () => {
    if (currentUser && editingUser && currentUser.user_id === editingUser.user_id) {
        setEditingUser(currentUser);
    } else {
        setEditingUser(null);
    }
     setMessage(currentUser ? `Editing cancelled for ${editingUser?.username}. User ${currentUser.username} details are shown.` : 'Editing cancelled.');
  };


  return (
    <div className="user-page-container">
      <h2>User Management</h2>
      <UserSearchForm
        onLookup={handleLookupUser}
        onCreate={handleCreateNewUser}
        loading={isLoading}
      />
      {message && <p className={`user-page-message ${message.includes('Failed') || message.includes('Error') || message.includes('Could not find') || message.includes('taken') ? 'error-message' : 'success-message'}`}>{message}</p>}

      {editingUser && (
        <UserDetailsForm
          user={editingUser}
          onSave={handleSaveChanges}
          onCancel={() => {
            setEditingUser(null);
            setMessage(currentUser && currentUser.username === editingUser.username ? `Changes cancelled. Displaying current details for ${currentUser.username}.` : 'Editor closed.');
          }}
          loading={isLoading}
        />
=======
import React, { useState } from 'react';
import UsernameChecker from '../../components/UsernameChecker';
import PreferenceSlider from '../../components/PreferenceSlider';

const UsersPage = () => {
  const [searchText, setSearchText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);
  const [username, setUsername] = useState('');

  const handleUsernameAvailability = (available) => {
    setIsUsernameAvailable(available);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: 'auto' }}>
      <input
        type="text"
        placeholder="Search users"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', marginBottom: '1rem' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button
          onClick={() => alert(`Look up feature not implemented.\nSearch text: ${searchText}`)}
          style={{ flex: 1, marginRight: '0.5rem', padding: '0.5rem' }}
        >
          Look Up
        </button>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setUsername('');
            setIsUsernameAvailable(null);
          }}
          style={{ flex: 1, marginLeft: '0.5rem', padding: '0.5rem' }}
        >
          Create User
        </button>
      </div>

      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#121212',
              padding: '2rem',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.8)',
              position: 'relative',
              color: 'white',
            }}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'white',
              }}
              aria-label="Close modal"
            >
              &times;
            </button>

            <h3>Create New User</h3>

            <div style={{ marginBottom: '1rem' }}>
              <UsernameChecker
                onAvailabilityChange={handleUsernameAvailability}
                setUsername={setUsername}
              />
            </div>

            <PreferenceSlider active={false} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
