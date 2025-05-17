import React, { useState } from 'react';
import { postPreferences } from '../api/supabaseClient';

const defaultSliders = {
  username: '',
  outdoor: 5,
  activity_intensity: 5,
  cultural: 5,
  social: 5,
  budget: 5,
  local_flavor: 5,
  touristy: 5,
  indoor: 5,
  eventful: 5,
  romantic: 5,
};

const PreferenceSliders = () => {
  const [sliders, setSliders] = useState(defaultSliders);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (key, value) => {
    setSliders((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleUsernameChange = (e) => {
    setSliders((prev) => ({ ...prev, username: e.target.value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    const result = await postPreferences([sliders]);
    if (result) {
      setSuccess(true);
      console.log(`submitted ${sliders.username} into supadatabase`);
    } else {
      setError('Failed to submit preferences.');
    }

    setSubmitting(false);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: 'auto' }}>
      <h2>Set Your Preferences</h2>

      <input
        type="text"
        placeholder="Enter username"
        value={sliders.username}
        onChange={handleUsernameChange}
        style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
      />

      {Object.entries(sliders).map(([key, value]) => {
        if (key === 'username') return null;
        return (
          <div key={key} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor={key} style={{ display: 'block', marginBottom: '0.25rem' }}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {value}
            </label>
            <input
              type="range"
              id={key}
              min={0}
              max={10}
              step={1}
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        );
      })}

      <button onClick={handleSubmit} disabled={submitting || !sliders.username}>
        {submitting ? 'Submitting...' : 'Submit Preferences'}
      </button>

      {success && <p style={{ color: 'green' }}>Preferences submitted successfully!</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default PreferenceSliders;
