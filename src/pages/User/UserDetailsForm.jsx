import React, { useState, useEffect } from 'react';
import './UserPage.jsx';

const PREFERENCE_KEYS = [
  "outdoor", "activity_intensity", "cultural", "social", "budget",
  "local_flavor", "touristy", "indoor", "eventful", "romantic"
]; //

const UserDetailsForm = ({ user, onSave, onCancel, loading }) => {
  const [preferences, setPreferences] = useState({});
  const [originalPreferences, setOriginalPreferences] = useState({});

  useEffect(() => {
    if (user) {
      const initialPrefs = PREFERENCE_KEYS.reduce((acc, key) => {
        acc[key] = user[key] === null || user[key] === undefined ? '' : String(user[key]);
        return acc;
      }, {});
      setPreferences(initialPrefs);
      setOriginalPreferences(initialPrefs);
    }
  }, [user]);

  const handleChange = (key, value) => {
    const numValue = value === '' ? '' : parseInt(value, 10);
    if (value === '' || (!isNaN(numValue) && numValue >= 1 && numValue <= 10)) {
      setPreferences(prev => ({ ...prev, [key]: value }));
    } else if (!isNaN(numValue) && numValue < 1) {
       setPreferences(prev => ({ ...prev, [key]: '1'}));
    } else if (!isNaN(numValue) && numValue > 10) {
       setPreferences(prev => ({ ...prev, [key]: '10'}));
    }
  };

  const handleSave = () => {
    const prefsToSave = {};
    PREFERENCE_KEYS.forEach(key => {
        prefsToSave[key] = preferences[key] === '' ? null : parseInt(preferences[key], 10);
    });
    onSave(user.user_id, prefsToSave);
  };

  const handleCancel = () => {
    setPreferences(originalPreferences); 
    if(onCancel) onCancel(); 
  }

  if (!user) return null;

  return (
    <div className="user-details-form">
      <h3>Editing User: {user.username}</h3>
      <div className="preferences-grid">
        {PREFERENCE_KEYS.map(key => (
          <div key={key} className="preference-item">
            <label htmlFor={`pref-${key}`}>{key.replace(/_/g, ' ')}:</label>
            <input
              type="number"
              id={`pref-${key}`}
              min="1"
              max="10"
              value={preferences[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              disabled={loading}
              className="preference-input"
              placeholder="1-10"
            />
          </div>
        ))}
      </div>
      <div className="user-form-buttons">
        <button onClick={handleSave} disabled={loading} className="user-form-button">
          {loading ? 'Saving...' : 'Confirm & Save Changes'}
        </button>
        {onCancel && (
            <button onClick={handleCancel} disabled={loading} className="user-form-button user-form-button-cancel">
              Cancel
            </button>
        )}
      </div>
    </div>
  );
};

export default UserDetailsForm;