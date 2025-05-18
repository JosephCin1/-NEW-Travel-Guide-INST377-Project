import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase URL or Anon Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file and the server was restarted."
  );
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const fetchUsername = async (inputUsername) => {
    const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', inputUsername)
        .maybeSingle();

    if (error) {
        console.error('Error fetching data:', error);
        return null; 
    }
    if (data) {
        console.log('Username already taken:', inputUsername);
        return false;
    }
    console.log('Username is available!');
    return true;
};
export const postUsername = async (newData) => {
  const { data, error } = await supabase
    .from('users')
    .insert([newData])
    .select('username');

  if (error) {
    console.error("Error inserting data:", error);
    return null;
  }

  return data;
};

export const postPreferences = async (newDataArray) => {
  const { data, error } = await supabase
    .from('users')
    .insert(newDataArray)
    .select('username');

  if (error) {
    console.error("Error inserting data:", error);
    return null;
  }

  return data;
};
