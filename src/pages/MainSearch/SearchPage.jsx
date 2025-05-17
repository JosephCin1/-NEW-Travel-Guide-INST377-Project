// src/pages/SearchPage.jsx
import React, { useState } from 'react';

export default function SearchPage() {
const [inputLocation, setInputLocation] = useState('');
const [confirmedLocation, setConfirmedLocation] = useState(null);
const [isConfirmed, setIsConfirmed] = useState(false);

function handleSubmit(e) {
e.preventDefault();
// When user submits, show confirmation
setConfirmedLocation(inputLocation.trim());
setIsConfirmed(false);
}

function handleConfirm() {
setIsConfirmed(true);
// Here you could navigate to the next step/page or trigger other logic
alert(`Location confirmed: ${confirmedLocation}`);
}

function handleEdit() {
setConfirmedLocation(null);
setInputLocation('');
setIsConfirmed(false);
}

return (
<div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
    {!confirmedLocation ? (
    <form onSubmit={handleSubmit}>
        <label>
        Enter your location:
        <input
            type="text"
            value={inputLocation}
            onChange={(e) => setInputLocation(e.target.value)}
            placeholder="e.g. New York City"
            required
            style={{ width: '100%', padding: 8, marginTop: 8, marginBottom: 12 }}
        />
        </label>
        <button type="submit">Submit</button>
    </form>
    ) : (
    <div>
        <p>
        You entered: <strong>{confirmedLocation}</strong>
        </p>
        <p>Is this correct?</p>
        <button onClick={handleConfirm} style={{ marginRight: 10 }}>
        Yes, Confirm
        </button>
        <button onClick={handleEdit}>No, Edit</button>
        {isConfirmed && <p style={{ color: 'green' }}>Location confirmed! Moving on...</p>}
    </div>
    )}
</div>
);
}
