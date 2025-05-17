// src/components/GooglePlacesSearch.js
import React, { useState } from 'react';
import { LoadScript, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];
const googleApiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

function GooglePlacesSearch() {
    const [address, setAddress] = useState('');

    const handlePlaceChanged = (autocomplete) => {
        const place = autocomplete.getPlace();
        console.log('Selected Place:', place);
        setAddress(place.formatted_address || '');
    };

    return (
        <LoadScript googleMapsApiKey={googleApiKey} libraries={libraries}>
            <Autocomplete
                onLoad={(autocomplete) => console.log('Autocomplete Loaded')}
                onPlaceChanged={(e) => handlePlaceChanged(e.target)}
            >
                <input
                    type="text"
                    placeholder="Search for a place..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ width: '300px', padding: '10px', marginBottom: '20px' }}
                />
            </Autocomplete>
        </LoadScript>
    );
}

export default GooglePlacesSearch;
