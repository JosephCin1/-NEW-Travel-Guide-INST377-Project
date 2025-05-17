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

export default UsersPage;
