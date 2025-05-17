import React, { useState } from 'react';
import TestFetchUsername from './components/TestFetchUsername'; // adjust path if needed

const UserPage = () => {
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  return (
    <div className="user-page" style={{ padding: '1rem' }}>
      {/* Button to open UsernameChecker modal */}
      <button
        onClick={() => setShowUsernameModal(true)}
        style={{
          padding: '10px 20px',
          marginBottom: '1rem',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        Go to Username Checker
      </button>

      {showUsernameModal && (
        <CreateUserPopup onClose={() => setShowUsernameModal(false)} />
      )}

      {/* Inline quick username test feature */}
      <div style={{ marginTop: '2rem' }}>
        <TestFetchUsername />
      </div>
    </div>
  );
};

export default UserPage;
