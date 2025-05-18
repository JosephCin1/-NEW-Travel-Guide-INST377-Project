import { supabase } from './supabaseClient'; //

const PREFERENCE_KEYS = [
  "outdoor", "activity_intensity", "cultural", "social", "budget",
  "local_flavor", "touristy", "indoor", "eventful", "romantic"
]; //

/**
 * Checks if a username already exists in the database.
 * @param {string} username - The username to check.
 * @returns {Promise<{ exists: boolean, error: object | null }>}
 */
export const checkUserExists = async (username) => {
  if (!username) {
    return { exists: false, error: { message: 'Username cannot be empty.' } };
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine here
      console.error('Error checking user existence:', error);
      return { exists: false, error };
    }
    return { exists: !!data, error: null };
  } catch (e) {
    console.error('Exception in checkUserExists:', e);
    return { exists: false, error: e };
  }
};

/**
 * Fetches a user and their preferences by username.
 * @param {string} username - The username to lookup.
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export const getUserByUsername = async (username) => {
  if (!username) {
    return { data: null, error: { message: 'Username cannot be empty.' } };
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*') // Select all columns, including preferences
      .eq('username', username)
      .single(); // Expecting only one user or null

    if (error && error.code === 'PGRST116') {
      return { data: null, error: { message: `User "${username}" not found.`} };
    }
    if (error) {
      console.error(`Error fetching user "${username}":`, error);
    }
    return { data, error };
  } catch (e) {
    console.error('Exception in getUserByUsername:', e);
    return { data: null, error: e };
  }
};

/**
 * Creates a new user with default (null or empty) preferences.
 * @param {string} username - The username for the new user.
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export const createUser = async (username) => {
  if (!username) {
    return { data: null, error: { message: 'Username cannot be empty for creation.' } };
  }

  const initialPreferences = PREFERENCE_KEYS.reduce((acc, key) => {
    acc[key] = null; // Or a default value like 5 if you prefer
    return acc;
  }, {});

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, ...initialPreferences }])
      .select()
      .single();

    if (error) {
      console.error(`Error creating user "${username}":`, error);
    }
    return { data, error };
  } catch (e) {
    console.error('Exception in createUser:', e);
    return { data: null, error: e };
  }
};

/**
 * Updates a user's preferences.
 * @param {string} userId - The ID of the user to update.
 * @param {object} preferences - An object containing the preference keys and their new values.
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export const updateUserPreferences = async (userId, preferences) => {
  if (!userId) {
    return { data: null, error: { message: 'User ID is required to update preferences.' } };
  }

  const validPreferences = {};
  PREFERENCE_KEYS.forEach(key => {
    if (preferences.hasOwnProperty(key)) {
      const value = parseInt(preferences[key], 10);
      // Ensure preferences are within a 1-10 range, or handle as needed
      if (!isNaN(value) && value >= 1 && value <= 10) {
        validPreferences[key] = value;
      } else {
        validPreferences[key] = null; // Or keep existing, or error
      }
    }
  });

  if (Object.keys(validPreferences).length === 0) {
    return { data: null, error: { message: 'No valid preferences provided to update.'} };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update(validPreferences)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating preferences for user ID "${userId}":`, error);
    }
    return { data, error };
  } catch (e) {
    console.error('Exception in updateUserPreferences:', e);
    return { data: null, error: e };
  }
};