import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // adjust path if needed

const UsernameChecker = () => {
  const [username, setUsername] = useState('');
  const [available, setAvailable] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length > 2) {
        setChecking(true);
        const { data, error } = await supabase
          .from('users') // 👈 your table name here
          .select('id')
          .eq('username', username)
          .maybeSingle();

        setAvailable(!data); // data is null if username doesn't exist
        setChecking(false);
      } else {
        setAvailable(null);
      }
    };

    const delayDebounce = setTimeout(() => {
      checkUsername();
    }, 500); // debounce typing input

    return () => clearTimeout(delayDebounce);
  }, [username]);

  return (
    <div>
      <input
        type="text"
        placeholder="Choose a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      {checking && <p>Checking...</p>}
      {available === true && <p style={{ color: 'green' }}>Username is available ✅</p>}
      {available === false && <p style={{ color: 'red' }}>Username is taken ❌</p>}
    </div>
  );
};

export default UsernameChecker;
