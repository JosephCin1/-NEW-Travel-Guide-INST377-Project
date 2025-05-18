import React, { useState } from 'react';
import './UserPage.jsx'; // We'll create this for styling

const UserSearchForm = ({ onLookup, onCreate, loading }) => {
  const [username, setUsername] = useState('');

  const handleLookup = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLookup(username.trim());
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onCreate(username.trim());
    }
  };

  return (
    <form className="user-search-form">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        disabled={loading}
        className="user-form-input"
      />
      <div className="user-form-buttons">
        <button type="button" onClick={handleLookup} disabled={loading || !username.trim()} className="user-form-button">
          {loading ? 'Searching...' : 'Lookup User'}
        </button>
        <button type="button" onClick={handleCreate} disabled={loading || !username.trim()} className="user-form-button user-form-button-create">
          {loading ? 'Creating...' : 'Create New User'}
        </button>
      </div>
    </form>
  );
};

export default UserSearchForm;