// src/components/LookupSearchModal.jsx
import React, { useState } from 'react';
import './LookupSearchModal.css'; // Create this CSS file for styling

const LookupSearchModal = ({ isOpen, onClose, onSubmit }) => {
  const [searchIdInput, setSearchIdInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const parsedId = parseInt(searchIdInput);
    if (isNaN(parsedId) || parsedId <= 0) {
      setError('Please enter a valid positive Search ID.');
      return;
    }
    onSubmit(parsedId);
    setSearchIdInput(''); // Clear input after submit
  };

  return (
    <div className="lookup-modal-overlay">
      <div className="lookup-modal-content">
        <h3>Lookup Past Search</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="number"
            value={searchIdInput}
            onChange={(e) => setSearchIdInput(e.target.value)}
            placeholder="Enter Search ID"
            className="lookup-modal-input"
            min="1"
          />
          {error && <p className="lookup-modal-error">{error}</p>}
          <div className="lookup-modal-actions">
            <button type="submit" className="lookup-modal-button submit">Lookup</button>
            <button type="button" onClick={onClose} className="lookup-modal-button cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LookupSearchModal;