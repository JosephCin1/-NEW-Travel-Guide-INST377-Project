import { supabase } from './supabaseClient';

/**
 * Writes the individual search results (matches) for a given search_id.
 * Uses an "upsert" operation to insert new matches or update existing ones
 * if a conflict occurs on the unique constraint (assumed to be search_id and place_id).
 *
 * @param {object} logData - The data for logging matches.
 * @param {number} logData.searchId - The search_id from the 'user_searches' table.
 * @param {Array<object>} logData.matches - An array of match objects. Each should have:
 * - place_id (number, int4 - internal place ID)
 * - characteristics (object with keys like outdoor, cultural, etc., storing the place's scores)
 * - matchScore (number - the overall AI match score for this item in this search)
 * @returns {Promise<{ data: any, error: any }>} The result from Supabase.
 */
export const logSearchMatches = async ({ searchId, matches }) => {
  if (!searchId || !Array.isArray(matches) || matches.length === 0) {
    console.error('Search ID and a non-empty array of matches are required.');
    return { data: null, error: { message: 'Search ID and a non-empty array of matches are required.' } };
  }

  const recordsToInsert = matches.map(match => {
    if (!match.place_id || typeof match.place_id !== 'number') {
        console.warn('Skipping match due to missing or invalid place_id (must be int4):', match);
        return null;
    }
    if (!match.characteristics) {
        console.warn('Skipping match due to missing characteristics for place_id:', match.place_id);
        return null;
    }
    if (typeof match.matchScore !== 'number') {
        console.warn('Skipping match due to missing or invalid matchScore for place_id:', match.place_id, match);
        return null;
    }

    return {
      search_id: searchId,
      place_id: match.place_id,
      match_score: match.matchScore,
      outdoor: match.characteristics.outdoor,
      activity_intensity: match.characteristics.activity_intensity,
      cultural: match.characteristics.cultural,
      social: match.characteristics.social,
      budget: match.characteristics.budget,
      local_flavor: match.characteristics.local_flavor,
      touristy: match.characteristics.touristy,
      indoor: match.characteristics.indoor,
      eventful: match.characteristics.eventful,
      romantic: match.characteristics.romantic,
      date: new Date().toISOString().split('T')[0], 
    };
  }).filter(record => record !== null);

  if (recordsToInsert.length === 0) {
    console.warn('No valid matches to log after filtering.');
    return { data: null, error: { message: 'No valid matches to log.' } };
  }

  try {
    const { data, error } = await supabase
      .from('matches')
      .upsert(recordsToInsert, {
        onConflict: 'search_id, place_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error logging search matches (upsert operation):', error);
    } else {
      console.log('Search matches logged/updated successfully for search_id:', searchId);
    }
    return { data, error };
  } catch (error) {
    console.error('Supabase call failed for logSearchMatches (upsert operation):', error);
    return { data: null, error };
  }
};