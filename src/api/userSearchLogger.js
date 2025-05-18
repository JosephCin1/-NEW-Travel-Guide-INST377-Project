import { supabase } from './supabaseClient'; // Or 'src/api/supabaseClient'

export const logUserSearch = async ({ userId, destination, preferences }) => {
  if (!userId || !destination || !destination.name || !preferences) {
    console.error('User ID, destination name, and preferences are required to log user search.');
    return { search_id: null, error: { message: 'User ID, destination name, and preferences are required.' } };
  }
  let dbCoordinates = null;
  if (destination.coordinates) {
    if (Array.isArray(destination.coordinates) && destination.coordinates.length === 2) {
      dbCoordinates = { longitude: destination.coordinates[0], latitude: destination.coordinates[1] }; // lng, lat
    } else if (typeof destination.coordinates === 'object' && destination.coordinates.lat !== undefined && destination.coordinates.lng !== undefined) {
      dbCoordinates = { longitude: destination.coordinates.lng, latitude: destination.coordinates.lat };
    }
  }

  const searchRecord = {
    location_name: destination.name,
    city_name: destination.city || null, 
    country: destination.country || null,
    coordinates: dbCoordinates,
    outdoor: preferences.outdoor,
    activity_intens: preferences.activity_intensity,
    cultural: preferences.cultural,
    social: preferences.social,
    budget: preferences.budget,
    local_flavor: preferences.local_flavor,
    touristy: preferences.touristy,
    indoor: preferences.indoor,
    eventful: preferences.eventful,
    romantic: preferences.romantic,
  };

  try {
    const { data, error } = await supabase
      .from('user_searches')
      .insert(searchRecord)
      .select('search_id')
      .single(); 

    if (error) {
      console.error('Error logging user search:', error);
      return { search_id: null, error };
    }
    if (!data || data.search_id === undefined) {
        console.error('User search logged but search_id was not returned:', data);
        return { search_id: null, error: { message: 'search_id not returned after insert.'}};
    }
    return { search_id: data.search_id, error: null };
  } catch (error) {
    console.error('Supabase call failed for logUserSearch:', error);
    return { search_id: null, error };
  }
};