
## Developer Manual

For detailed technical documentation on installation, running, testing, and API references, see the [Developer Manual](./docs/DEVELOPER_MANUAL.md).

---

## 1. Installation Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Clone the Repository

```bash
git clone https://github.com/your-username/travel-guide.git
cd travel-guide
npm install
npm run dev
```

---

## API Functions Overview

This section details the functions within your `src/api/` directory, outlining their purpose, conceptual HTTP method, and behavior.

---
### File: `src/api/userApi.js`

This file manages user-related operations, such as creation, retrieval, and preference updates, interacting with the Supabase backend.

#### `checkUserExists(username)`
**Conceptual Method:** `GET /users/exists?username={username}`  
**Purpose:** Checks if a username already exists in the database.  
**Parameters:** `username` (string): The username to check.  
**Returns:** `Promise<{ exists: boolean, error: object | null }>`  
  `exists: true` if the username is found.  
  `exists: false` if the username is not found or an error occurs (excluding 'no data found' errors).  
  `error`: An error object if the query fails or if the username is empty.

#### `getUserByUsername(username)`
**Conceptual Method:** `GET /users/{username}`  
**Purpose:** Fetches a user and their preferences by username.  
**Parameters:** `username` (string): The username to lookup.  
**Returns:** `Promise<{ data: object | null, error: object | null }>`  
  `data`: The user object containing all user fields including preferences if found.  
  `error`: An error object if the user is not found (`PGRST116`), if the username is empty, or if any other query failure occurs.

#### `createUser(username)`
**Conceptual Method:** `POST /users`  
**Purpose:** Creates a new user with default (null or empty) preferences for all defined `PREFERENCE_KEYS`.  
**Parameters:** `username` (string): The username for the new user.  
**Returns:** `Promise<{ data: object | null, error: object | null }>`  
  `data`: The newly created user record.  
  `error`: An error object if creation fails or if the username is empty.

#### `updateUserPreferences(userId, preferences)`
**Conceptual Method:** `PATCH /users/{userId}/preferences`  
**Purpose:** Updates a user’s preferences based on provided values.  
**Parameters:** `userId` (string/number): The ID of the user to update.  
  `preferences` (object): An object containing the preference keys (e.g., `outdoor`, `budget`) and their new values.  
**Behavior:** Only updates preference keys defined in `PREFERENCE_KEYS`.  
  Validates preference values to be integers between 1 and 10.  
  Invalid or non-numeric values for preferences are set to `null`.  
**Returns:** `Promise<{ data: object | null, error: object | null }>`  
  `data`: The updated user record with preferences.  
  `error`: An error object if the update fails, no valid preferences are provided, or if `userId` is missing.

---
### File: `src/api/archivedSearchApi.js`

This file is responsible for fetching details of past searches and related points of interest from the Supabase backend.

#### `WorkspaceSearchDetails(searchId)`
**Conceptual Method:** `GET /searches/{searchId}/details`  
**Purpose:** Fetches search details for a given `search_id`.  
**Parameters:** `searchId` (number | string): The ID of the search to fetch.  
**Behavior:** Parses `searchId` to an integer.  
  Returns an error if `searchId` is invalid.  
**Returns:** `Promise<{ data: object | null, error: object | null }>`  
  `data`: The search details object from the `user_searches` table.  
  `error`: An error object if the ID is invalid, fetching fails, or an unexpected error occurs.

#### `WorkspaceArchivedSearchMatches(searchId)`
**Conceptual Method:** `GET /searches/{searchId}/matches`  
**Purpose:** Fetches all matches for a given `search_id`, joining with `points_of_interest` to include `location_name`.  
**Parameters:** `searchId` (number | string): The ID of the search for which to fetch matches.  
**Behavior:** Parses `searchId` to an integer.  
  Transforms the fetched data to include `placeName`, `place_id`, and a general `id` field for each match.  
**Returns:** `Promise<{ data: Array<object> | null, error: object | null }>`  
  `data`: An array of transformed match objects. Each object includes details from the `matches` table and `location_name` from `points_of_interest`.  
  `error`: An error object if the ID is invalid, fetching fails, or an unexpected error occurs.

#### `WorkspacePointOfInterestDetails(placeId)`
**Conceptual Method:** `GET /pois/{placeId}`  
**Purpose:** Fetches details for a specific `point_of_interest` by its `place_id`.  
**Parameters:** `placeId` (number | string): The ID of the point of interest to fetch.  
**Behavior:** Parses `placeId` to an integer and validates it (must be > 0).  
  Provides specific error messages if the POI is not found (Supabase error code `PGRST116`).  
**Returns:** `Promise<{ data: object | null, error: object | null }>`  
  `data`: The point of interest object from the `points_of_interest` table.  
  `error`: An error object if the ID is invalid, fetching fails (including not found), or an unexpected error occurs.

---
### File: `src/api/geminiAPI.js`

This file handles interactions with the Google Gemini Large Language Model (LLM) to get personalized travel recommendations.

#### `WorkspacePersonalizedRecommendationsFromLLM(destination, userPreferences)`
**Conceptual Method:** `POST /recommendations/llm`  
**Purpose:** Fetches personalized travel recommendations from the Gemini AI based on user preferences and a destination.  
**Parameters:** `destination` (object): An object containing `name` and optionally `address.country` for the destination.  
  `userPreferences` (object): An object containing user's scores for various preference categories (e.g., `outdoor`, `cultural`).  
**Behavior:** Constructs a detailed prompt for the Gemini API, including destination and formatted user preferences.  
  Requires `GEMINI_API_KEY` to be configured.  
  Makes a POST request to the Gemini API URL.  
  Expects a JSON array response from the LLM and parses it.  
  Handles potential errors such as API key issues, blocked prompts, unexpected response formats, and incomplete responses.  
  Cleans the LLM response text if it's wrapped in markdown JSON blocks (e.g., ` ```json ... ``` `).  
**Returns:** `Promise<Array<object>>`  
  An array of up to 10 recommendation objects. Each object should have `placeName`, `categoryRatings` (with scores for each preference category), and `description`.  
  Throws an `Error` if the API key is not configured, user preferences are missing, the request fails, the response is malformed, or the request is blocked.

---
### File: `src/api/matchLogger.js`

This file is dedicated to logging the individual recommendations (matches) generated during a user's search to the Supabase database.

#### `logSearchMatches({ searchId, matches })`
**Conceptual Method:** `POST /searches/{searchId}/matches/log` (Upsert operation)  
**Purpose:** Writes the individual search results (matches) for a given `search_id` to the `matches` table. Uses an "upsert" operation to insert new matches or update existing ones if a conflict occurs on `search_id` and `place_id`.  
**Parameters:** `searchId` (number): The `search_id` from the `user_searches` table.  
  `matches` (Array<object>): An array of match objects. Each match object must have:  
    `place_id` (number): Internal place ID.  
    `characteristics` (object): Contains scores for preference categories.  
    `matchScore` (number): The overall AI match score for this item.  
**Behavior:** Validates that `searchId` and a non-empty `matches` array are provided.  
  Filters out matches with missing or invalid `place_id`, `characteristics`, or `matchScore`.  
  Constructs records for insertion, mapping `characteristics` to individual columns.  
  Adds the current `date` to each record.  
  Performs an `upsert` operation on the `matches` table with `search_id` and `place_id` as conflict targets.  
**Returns:** `Promise<{ data: any, error: any }>`  
  `data`: The result from the Supabase upsert operation.  
  `error`: An error object if `searchId` or `matches` are invalid, if no valid matches remain, or if the Supabase operation fails.

---
### File: `src/api/poiSupabaseApi.js`

This file handles the logic for resolving Points of Interest (POIs) suggested by the LLM against the existing POIs in the Supabase database, and storing new ones.

#### `resolveAndStorePlaceSuggestions(suggestionsFromLLM, currentDestination, currentUser)`
**Conceptual Method:** `POST /pois/resolve-and-store`  
**Purpose:** Processes place suggestions received from an LLM. For each suggestion, it checks if a POI with the same name and city already exists. If so, it uses the existing record; otherwise, it inserts a new POI. It also calculates a `match_score` for each suggestion based on user preferences.  
**Parameters:** `suggestionsFromLLM` (Array<object>): An array of place suggestions from the LLM. Each should have `placeName`, `description`, and `categoryRatings`.  
  `currentDestination` (object): Represents the current search destination, used to derive `city_name` and `country`.  
  `currentUser` (object): Contains the current user's preferences for calculating the `match_score`.  
**Behavior:** Iterates through each LLM suggestion.  
  Derives `derivedCityName` and `derivedCountryName` from `currentDestination`.  
  Queries `points_of_interest` for an existing place matching `location_name` and `city_name`.  
  If found, existing data is used; otherwise, a new record is created with `type` 'AI Suggestion'.  
  Calculates a `match_score` for each POI using `calculateUserMatchScore`.  
  Adds status flags like `isFromDB`, `isNewInsert`, `errorStatus` to processed suggestions.  
**Returns:** `Promise<{ data: Array<object>, error: Error | null }>`  
  `data`: An array of processed suggestion objects, augmented with database info, `match_score`, and status flags.  
  `error`: An `Error` object if any suggestion failed during processing, otherwise `null`.

---
### File: `src/api/supabaseClient.js`

This file initializes the Supabase client and exports it. It also contains a few direct data interaction functions.

#### `supabase` (exported client)
**Purpose:** The initialized Supabase JavaScript client instance, used by other API files to interact with the Supabase backend.  
**Behavior:** Created using `createClient` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from environment variables. Logs an error if these are missing.

---
### File: `src/api/userSearchLogger.js`

This file is responsible for logging the details of a user's search query (destination and preferences) to the Supabase database.

#### `logUserSearch({ userId, destination, preferences })`
**Conceptual Method:** `POST /searches/log-query`  
**Purpose:** Logs a user's search details (location and preferences) into the `user_searches` table and returns the `search_id`.  
**Parameters:** `userId` (any): The ID of the user performing the search.  
  `destination` (object): Contains destination details:  
    `name` (string): Name of the location.  
    `city` (string, optional): City of the location.  
    `country` (string, optional): Country of the location.  
    `coordinates` (object or Array, optional): Coordinates as `[lng, lat]` or `{lng, lat}`.  
  `preferences` (object): User's preference scores for categories like `outdoor`, `cultural`.  
**Behavior:** Validates that `userId`, `destination.name`, and `preferences` are provided.  
  Formats `destination.coordinates` to `{ longitude, latitude }`.  
  Constructs a `searchRecord` mapping details to `user_searches` columns.  
  Inserts the `searchRecord` into the `user_searches` table.  
**Returns:** `Promise<{ search_id: number | null, error: object | null }>`  
  `search_id`: The `search_id` of the newly inserted record.  
  `error`: An error object if parameters are missing, insert fails, or `search_id` isn't returned.
  
## Project File Overview (Non-API Frontend Files)

| File Path                                                  | Role                                                                                                                       |
| :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Core Application Setup**                                 |                                                                                                                            |
| `src/main.jsx`                                             | **Application Entry Point:** Initializes the React application and renders the root `App` component into the DOM.           |
| `src/App.jsx`                                              | **Root Component:** Sets up the main application structure, including React Router for navigation and defines global layout elements. |
| `src/index.css`                                            | **Global Styles:** Provides base styling for the entire application.                                                        |
| `src/App.css`                                              | **App Component Styles:** Styles specific to the main `App` component layout.                                               |
| **Reusable UI Components (`src/components/`)**             |                                                                                                                            |
| `src/components/Footer/Footer.jsx`                         | **Footer Component:** Renders the common footer displayed across various pages.                                             |
| `src/components/Navbar/Navbar.jsx`                         | **Navigation Bar Component:** Renders the main navigation bar, providing links to different parts of the application.       |
| `src/components/Navbar/Navbar.css`                         | **Navbar Styles:** Specific styling for the navigation bar component.                                                       |
| `src/components/ArchivedSearchResultsDisplay.jsx`          | **Archived Results UI:** A component designed to display the results of a previously saved/archived search.                 |
| **Page Components (`src/pages/`)**                         |                                                                                                                            |
| `src/pages/About/AboutPage.jsx`                            | **About Page:** Renders the content for the "About Us" section of the application.                                          |
| `src/pages/InteractiveSearch/InteractiveSearchResults.jsx` | **Interactive Search Results Page:** Starts the search logic based on location entered. Collects username and passes ot the results stage. |
| `src/pages/InteractiveSearch/InteractiveSearchResults.css` | **Interactive Search Results Styles:** Styling for the interactive search results page.                                     |
| `src/pages/LookupSearch/LookupSearchPage.jsx`              | **Lookup Search Page:** Provides an interface for users to look up or find past searches using a search ID.         |
| `src/pages/LookupSearch/LookupSearchPage.css`              | **Lookup Search Page Styles:** Styling for the lookup search page.                                                          |
| `src/pages/MainSearch/SearchPage.jsx`                      | **Main Search Interface:** The primary page where users input their destination and initiate a new travel recommendation search. Also handles fetching location suggestions from OpenStreetMap. |
| `src/pages/MainSearch/SearchPage.css`                      | **Main Search Page Styles:** Styling for the main search interface.                                                         |
| `src/pages/SearchResults/SearchResults.jsx`                | **Search Results Display Page:** Renders the personalized recommendations received after a user performs a search.          |
| `src/pages/SearchResults/SearchResults.css`                | **Search Results Page Styles:** Styling for the search results display.                                                     |
| `src/pages/User/UserPage.jsx`                              | **User Profile Page:** The main page for displaying user information and potentially managing their preferences. |
| `src/pages/User/UserPage.css`                              | **User Profile Page Styles:** Styling for the user profile page.                                                            |
| `src/pages/User/UserDetailsForm.jsx`                       | **User Details Form:** A form component allowing users to view and update their personal details and travel preferences.    |
| `src/pages/User/UserSearchForm.jsx`                        | **User Specific Search Form:** Lookup for user within UserPage.jsx. |
| **Custom Hooks / Logic**                                   |                                                                                                                            |
| `src/pages/SearchResults/usePersonalizedRecommendations.js`| **Logic Hook:** A React Hook that encapsulates the logic for fetching, processing, and managing the state of personalized recommendations from the backend for proper visualization. |

## Future Developments / Roadmap

- Login/Sign-up authenticator
- Save feature for recommendations and searches
- Historical query of user requests/recommendations
- Generated links matching recommended locations
- Multilingual support
- Additional tags/filters for enhanced recommendations

---
