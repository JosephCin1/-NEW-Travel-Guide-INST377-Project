// src/components/GooglePlacesSearch.js
import React, { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';

function GooglePlacesSearch() {
    const [address, setAddress] = useState('');
    const autocompleteRef = useRef(null);

    const handlePlaceChanged = () => {
        const place = autocompleteRef.current.getPlace();
        console.log('Selected Place:', place);
        setAddress(place.formatted_address || '');
    };

    return (
        <Autocomplete
            onLoad={ref => autocompleteRef.current = ref}
            onPlaceChanged={handlePlaceChanged}
        >
            <input
                type="text"
                placeholder="Search for a place..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '300px', padding: '10px', marginBottom: '20px' }}
            />
        </Autocomplete>
    );
}

export default GooglePlacesSearch;
