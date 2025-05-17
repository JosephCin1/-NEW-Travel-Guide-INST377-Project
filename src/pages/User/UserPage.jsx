import React, { useState } from 'react';

const initialUsers = [
    { username: 'john_doe', preferences: { travel: 8 } },
    { username: 'jane_smith', preferences: { travel: 5 } }
];

export default function UserManagementPage() {
    const [users, setUsers] = useState(initialUsers);
    const [searchUsername, setSearchUsername] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [travelPreference, setTravelPreference] = useState('');
    const [message, setMessage] = useState('');

    const handleUserLookup = () => {
        const user = users.find(u => u.username === searchUsername.trim());
        if (user) {
            setSelectedUser(user);
            setTravelPreference(user.preferences.travel);
            setMessage('');
        } else {
            setMessage('User not found.');
            setSelectedUser(null);
        }
    };

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

    const handleUpdatePreferences = () => {
        const updatedUsers = users.map(u => 
            u.username === selectedUser.username ? { ...u, preferences: { travel: travelPreference } } : u
        );
        setUsers(updatedUsers);
        setMessage(`Preferences updated for ${selectedUser.username}.`);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '20px' }}>
                <input 
                    placeholder="Search username..." 
                    value={searchUsername} 
                    onChange={e => setSearchUsername(e.target.value)} 
                    style={{ marginRight: '10px', padding: '5px', width: '200px' }}
                />
                <button onClick={handleUserLookup} style={{ marginRight: '10px', padding: '5px 15px' }}>Lookup User</button>
                <button onClick={handleCreateUser} style={{ padding: '5px 15px' }}>Create User</button>
            </div>
            {message && <div style={{ color: 'red', marginBottom: '20px' }}>{message}</div>}
            {selectedUser && (
                <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
                    <h2>User: {selectedUser.username}</h2>
                    <label>Travel Preference</label>
                    <input 
                        type="number" 
                        value={travelPreference} 
                        onChange={e => setTravelPreference(e.target.value)} 
                        style={{ display: 'block', marginTop: '10px', marginBottom: '10px', padding: '5px', width: '100px' }}
                    />
                    <button onClick={handleUpdatePreferences} style={{ padding: '5px 15px' }}>Update Preferences</button>
                </div>
            )}
            <div>
                <input 
                    placeholder="New username..." 
                    value={newUsername} 
                    onChange={e => setNewUsername(e.target.value)} 
                    style={{ marginRight: '10px', padding: '5px', width: '200px' }}
                />
                <button onClick={handleCreateUser} style={{ padding: '5px 15px' }}>Create User</button>
            </div>
        </div>
    );
}
