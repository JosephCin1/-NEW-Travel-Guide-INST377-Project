import React, { useState, useEffect } from 'react';
import { fetchUsername } from '../api/supabaseClient';
import { postUsername } from '../api/supabaseClient'; // import the function

const UsernameChecker = ({ onAvailabilityChange }) => {
  const [username, setUsername] = useState('');
  const [available, setAvailable] = useState(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const check = async () => {
      if (username.length > 1) {
        setChecking(true);
        const result = await fetchUsername(username);
        if (isCurrent) {
          setAvailable(result);
          onAvailabilityChange(result);
          setChecking(false);
          console.log('fetchUsername returned:', result);
        }
      } else {
        setAvailable(null);
        onAvailabilityChange(null);
      }
    };

    const delayDebounce = setTimeout(check, 500);
    return () => {
      isCurrent = false;
      clearTimeout(delayDebounce);
    };
  }, [username, onAvailabilityChange]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const result = await postUsername({ username });
    if (result) {
      console.log(`submitted ${username} into supadatabase`);
      setSaveSuccess(true);
    } else {
      setSaveError('Failed to save username');
    }
    setSaving(false);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          setSaveSuccess(false);
          setSaveError(null);
        }}
      />
      {checking && <p>Checking...</p>}
      {available === true && <p style={{ color: 'green' }}>Username is available!</p>}
      {available === false && <p style={{ color: 'red' }}>Username is taken.</p>}

      {/* Show button if username length > 1 */}
      {username.length > 1 && (
        <button
          onClick={handleSave}
          disabled={saving || available === false}
          title={available === false ? 'Username is taken' : ''}
        >
          {saving ? 'Saving...' : 'Save Username'}
        </button>
      )}

      {saveSuccess && <p style={{ color: 'green' }}>Username saved successfully!</p>}
      {saveError && <p style={{ color: 'red' }}>{saveError}</p>}
    </div>
  );
};

export default UsernameChecker;
