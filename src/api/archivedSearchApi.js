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
    return { data, error: null }; // error should be null if data is present from .single() without issues
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
        id: points_of_interest?.place_id || match.place_id,
      };
    });

    return { data: transformedData, error: null };
  } catch (e) {
    return { data: null, error: { message: 'An error occurred while fetching matches.' } };
  }
};