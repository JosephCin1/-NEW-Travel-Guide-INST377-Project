
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

## 2. API Reference

### Authentication & Users (Supabase)

Backend database containing users and locations.

#### GET /users?username=<inputUsername>

- **Purpose:** Fetches an existing user by username to check for duplicates.
- **Function:** `fetchUsername(inputUsername)`
- **Returns:**
  - `false` if username exists
  - `true` if username is available
  - `null` if query fails

#### POST /users

- **Purpose:** Inserts a new username record into the users table.
- **Function:** `postUsername(newData)`
- **Request JSON Body:** New user data
- **Returns:**
  - Newly inserted username
  - `null` if insertion fails

#### POST /users (preferences)

- **Purpose:** Inserts an array of user preference records into the users table.
- **Function:** `postPreferences(newDataArray)`
- **Request JSON Body:** Array of preferences
- **Returns:**
  - Array of inserted usernames
  - `null` if insertion fails

---

### User API (Supabase Integration)

#### GET /users?username=<username>

- **Purpose:** Checks if a username already exists in the database.
- **Function:** `checkUserExists(username)`
- **Returns:**
  - Boolean indicating whether the username exists
  - Error object if the query fails

#### GET /users/:username

- **Purpose:** Fetches a user and their preferences by username.
- **Function:** `getUserByUsername(username)`
- **Returns:**
  - User data with all preference fields
  - Error object if not found or if a failure occurs

#### POST /users

- **Purpose:** Creates a new user with default (null) preferences.
- **Function:** `createUser(username)`
- **Returns:**
  - Newly created user record
  - Error object if creation fails

#### PATCH /users/:user_id

- **Purpose:** Updates a user’s preferences based on provided values.
- **Function:** `updateUserPreferences(userId, preferences)`
- **Behavior:**
  - Only updates preference keys with valid values (1–10)
  - Ignores or nullifies invalid preference values
- **Returns:**
  - Updated user record with preferences
  - Error object if update fails or no valid data provided

---

### Location Coordinates (OpenCage)

#### GET /geocode/v1/json

- **Purpose:** Retrieve geographic coordinates (latitude and longitude) for a given location query.
- **Endpoint:**  
  `GET https://api.opencagedata.com/geocode/v1/json?q=LOCATION_QUERY&key=YOUR_API_KEY`
- **Parameters:**
  - `q`: The location query string (e.g., "New York City")
  - `key`: Your OpenCage API key
- **Returns:**
  - JSON response containing an array of matching locations
  - Each result includes formatted address and geographic coordinates (`lat`, `lng`)
- **Usage:** Converts user-entered location names or addresses into coordinates for mapping or further processing

---

### SearchPage (OpenStreetMap API Integration)

- **Purpose:** Geocode user-entered location strings.
- **Endpoint:** `GET https://nominatim.openstreetmap.org/search`
- **Query Parameters:**
  - `q`: The location input by the user (URL-encoded)
  - `format`: `json` (response format)
  - `limit`: 5 (maximum number of results)
  - `addressdetails`: 1 (to include detailed address components)
- **Request Headers:** `Accept: application/json`
- **Response:**
  - Array of location results, each including:
    - Display name
    - Latitude
    - Longitude
    - Type
    - Address details
    - Bounding box
    - Place ID
- **Usage:** Results displayed in a modal for user confirmation; on confirmation, navigates to interactive search page with selected location data.

---

### Recommendations (Gemini API Integration)

- **Purpose:** Receive personalized travel recommendations from Google's Gemini API.
- **Endpoint:**  
  `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY`
- **Request JSON Body:**
  - `contents`: Array containing one prompt part with user preferences and destination
  - `generationConfig`: Specifies response formatting, temperature, and output length

---

## Future Developments / Roadmap

- Login/Sign-up authenticator
- Save feature for recommendations and searches
- Historical query of user requests/recommendations
- Generated links matching recommended locations
- Multilingual support
- Additional tags/filters for enhanced recommendations

---
