import { supabase } from './supabaseClient'; //

/**
 * Fetches search details for a given search_id from the 'user_searches' table.
 * @param {number} searchId - The ID of the search to fetch.
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export const fetchSearchDetails = async (searchId) => {
  if (!searchId || isNaN(parseInt(searchId))) {
    return { data: null, error: { message: 'Invalid Search ID provided.' } };
  }
  try {
    const { data, error } = await supabase
      .from('user_searches')
      .select('*')
      .eq('search_id', parseInt(searchId))
      .single();

    if (error && error.code === 'PGRST116') { // PGRST116: "The result contains 0 rows"
        return { data: null, error: { message: `No search found with ID: ${searchId}` } };
    }
    return { data, error };
  } catch (e) {
    console.error('Error in fetchSearchDetails:', e);
    return { data: null, error: e };
  }
};

/**
 * Fetches all matches for a given search_id.
 * It joins 'matches' with 'points_of_interest' table to get placeName.
 * @param {number} searchId - The ID of the search for which to fetch matches.
 * @returns {Promise<{ data: Array<object> | null, error: object | null }>}
 */
export const fetchArchivedSearchMatches = async (searchId) => {
  if (!searchId || isNaN(parseInt(searchId))) {
    return { data: null, error: { message: 'Invalid Search ID provided for matches.' } };
  }
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *, 
        points_of_interest (
          place_id,
          location_name
        )
      `)
      .eq('search_id', parseInt(searchId));

    if (error) {
        console.error("Error fetching archived search matches:", error);
        return { data: null, error };
    }

    const transformedData = data ? data.map(match => {
        const placeName = match.points_of_interest ? match.points_of_interest.location_name : 'Unknown Place';
        const placeIdFromPoiTable = match.points_of_interest ? match.points_of_interest.id : match.place_id;
        
        const { points_of_interest, ...restOfMatch } = match; 
        
        return {
            ...restOfMatch,
            placeName: placeName, 
            id: placeIdFromPoiTable 
        };
    }) : [];

    return { data: transformedData, error: null };
  } catch (e) {
    console.error('Exception in fetchArchivedSearchMatches:', e);
    return { data: null, error: e };
  }
};