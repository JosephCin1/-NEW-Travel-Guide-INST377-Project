import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET username FROM SupaBASE
// takes inputUsername and runs through the column to check
export const fetchUsername = async (inputUsername) => {
    const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', inputUsername)
        .maybeSingle(); 
    //if input cant reach, console log pop
    if (error) {
    console.error('Error fetching data:', error);
    return null;
    } else {
    // if inputUsername exists then console log taken and return false
    if (data) {
        console.log('Username already taken:', inputUsername);
        return false;
    // if inputUsername does not exist, console log yay and return true
    } else {
        console.log('Username is available!');
        return true;
    }
    }
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