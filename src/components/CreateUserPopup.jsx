import React, { useState } from 'react';

const CreateUserPopup = () => {
const [showPopup, setShowPopup] = useState(false);
const [inputUsername, setUsername] = useState('');
const [viableUsername, setviableUsername] = useState(null);
const [isViable, setIsViable] = useState(false);

// username not allowed
function handleSubmit(u) {
e.preventDefault();
// When user submits, show confirmation
setviableUsername(inputUsername.trim());
setIsViable(false);
}
const handleCreateUser = () => {
        const trimmedUsername = newUsername.trim();
        if (trimmedUsername === '' || users.some(u => u.username === trimmedUsername)) {
            setMessage('Username is taken or invalid.');
            return;
        }
        const newUser = { username: trimmedUsername, preferences: { travel: 0 } };
        setUsers([...users, newUser]);
        setNewUsername('');
        setMessage(`User ${trimmedUsername} created successfully.`);
};
return (
    <div>
    <button onClick={() => setShowPopup(true)}>Create New User</button>
    {showPopup && (
        <div style={{ position: 'fixed', top: '75%', left: '75%', transform: 'translate(-50%, -50%)', background: 'white', padding: '20px', border: '1px solid black' }}>
        <h2>Create New User</h2>
        <form onSubmit={handleSubmit}>
            <label>
            Enter your Username:
            <input
                type="text"
                value={inputLocation}
                onChange={(u) => setInputLocation(u.target.value)}
                placeholder="e.g. New York City"
                required
                style={{ width: '100%', padding: 8, marginTop: 8, marginBottom: 12 }}
            />
            </label>
        <button type="submit">Submit</button>
    </form>
        <button onClick={() => setShowPopup(false)}>Close</button>
        </div>
    )}
    </div>
);
};

export default CreateUserPopup;