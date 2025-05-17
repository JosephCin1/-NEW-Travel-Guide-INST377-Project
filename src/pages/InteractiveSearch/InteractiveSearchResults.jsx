import React from 'react';
import { createClient } from "@supabase/supabase-js";
import { geocodePlace } from "src/api/openCageAPi.js";

export default function InteractiveSearchResults() {
return <div>Interactive Search Results</div>;
}

function App() {
const [instruments, setInstruments] = useState([]);
useEffect(() => {
getInstruments();
}, []);
async function getInstruments() {
const { data } = await supabase.from("instruments").select();
setInstruments(data);
}
return (
<div style={{ fontFamily: 'Arial, sans-serif', margin: '20px' }}>
    <h1>AI Travel Recommender Prototype</h1>
    
    <nav style={{ marginBottom: '20px' }}>
    <button onClick={() => setActiveSection('geocode')} style={{ marginRight: '10px', padding: '8px 12px' }}>OpenCage Geocoding</button>
    <button onClick={() => setActiveSection('places')} style={{ marginRight: '10px', padding: '8px 12px' }}>Google Places Search</button>
    <button onClick={() => setActiveSection('gemini')} style={{ padding: '8px 12px' }}>Google Gemini Chat</button>
    </nav>

    {/* Section 1: OpenCage Geocoding */}
    {activeSection === 'geocode' && (
    <section style={{ marginTop: '20px' }}>
        <h2>OpenCage Geocoding</h2>
        <form onSubmit={handleGeocodeSubmit} style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', margin: '5px 0' }}>
            Place Name:
            <input 
            type="text" 
            value={placeName}
            onChange={e => setPlaceName(e.target.value)}
            placeholder="e.g., Denver, CO"
            required
            style={{ padding: '6px', fontSize: '1em', width: '100%', marginTop: '5px' }}
            />
        </label>
        <button type="submit" style={{ padding: '6px 12px', marginTop: '10px' }}>Geocode</button>
        </form>
        <pre style={{ background: '#f4f4f4', padding: '10px', overflowX: 'auto' }}>{geocodeResult}</pre>
    </section>
    )}

</div>
);
}
