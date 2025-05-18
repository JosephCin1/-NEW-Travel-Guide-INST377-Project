import { supabase } from './supabaseClient';

/**
 * Fetches search details for a given search_id.
 * Simplified for brevity.
 * @param {number | string} searchId - The ID of the search to fetch.
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export const fetchSearchDetails = async (searchId) => {
  const id = parseInt(searchId);
  if (isNaN(id)) {
    return { data: null, error: { message: 'Invalid Search ID provided.' } };
  }

  try {
    const { data, error } = await supabase
      .from('user_searches')
      .select('*')
      .eq('search_id', id)
      .single();

    if (error) {
      return { data: null, error: { message: `Could not fetch details for search ID: ${id}.` } };
    }
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: 'An unexpected error occurred.' } };
  }
};

/**
 * Fetches all matches for a given search_id, joining with points_of_interest.
 * Simplified for brevity.
 * @param {number | string} searchId - The ID of the search for which to fetch matches.
 * @returns {Promise<{ data: Array<object> | null, error: object | null }>}
 */
export const fetchArchivedSearchMatches = async (searchId) => {
  const id = parseInt(searchId);
  if (isNaN(id)) {
    return { data: null, error: { message: 'Invalid Search ID for matches.' } };
  }

  try {
    const { data, error: supabaseError } = await supabase
      .from('matches')
      .select(`
        *,
        points_of_interest (
          place_id,
          location_name
        )
      `)
      .eq('search_id', id);

    if (supabaseError) {
      return { data: null, error: { message: 'Could not load matches.' } };
    }

    const transformedData = (data || []).map(match => {
      const { points_of_interest, ...restOfMatch } = match;
      return {
        ...restOfMatch,
        placeName: points_of_interest?.location_name || 'N/A',
        place_id: match.place_id || points_of_interest?.place_id,
        id: match.match_id || points_of_interest?.place_id || match.place_id
      };
    });

    return { data: transformedData, error: null };
  } catch (e) {
    return { data: null, error: { message: 'An error occurred while fetching matches.' } };
  }
};

/**
 * Fetches details for a specific point_of_interest by its place_id.
 * @param {number | string} placeId - The ID of the point of interest to fetch.
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export const fetchPointOfInterestDetails = async (placeId) => {
  const id = parseInt(placeId);
  if (isNaN(id) || id <= 0) { 
    return { data: null, error: { message: 'Invalid Place ID provided.' } };
  }

  try {
    const { data, error } = await supabase
      .from('points_of_interest')
      .select('*') 
      .eq('place_id', id)
      .single(); 

    if (error) {
      const message = error.code === 'PGRST116' 
        ? `Point of Interest with ID ${id} not found.`
        : `Could not fetch Point of Interest details.`;
      return { data: null, error: { message, details: error } };
    }
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: 'An unexpected error occurred while fetching Point of Interest details.' } };
  }
};