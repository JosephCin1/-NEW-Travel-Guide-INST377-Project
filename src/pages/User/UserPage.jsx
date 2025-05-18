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
      )}
    </div>
  );
};

export default UserPage;