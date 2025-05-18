import React from 'react';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: 20 }}>About Our Travel Guide</h1>
      <p style={{ marginBottom: 30 }}>
        This app helps you find the best travel activities near you.
      </p>

      <h2 style={{ marginBottom: 15 }}>How to Use</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 20 }}>
          <strong>Search for a Location:</strong>  
          <br />
          Enter the name of a city, landmark, or place you want to explore in the search bar. The app will provide matching location options.
        </li>
        <li style={{ marginBottom: 20 }}>
          <strong>Find Matches:</strong>  
          <br />
          Select a location from the search results to see recommended attractions and points of interest nearby.
        </li>
        <li style={{ marginBottom: 20 }}>
          <strong>Create Your User Profile:</strong>  
          <br />
          Sign up with just a username to create a profile. This lets you save your preferences and search history for a personalized experience.
        </li>
        <li style={{ marginBottom: 20 }}>
          <strong>Select Your Preferences:</strong>  
          <br />
          Choose your interests and preferred types of activities to tailor your travel recommendations.
        </li>
        <li style={{ marginBottom: 20 }}>
          <strong>Get Tailored Suggestions:</strong>  
          <br />
          Based on your profile and preferences, the app will suggest locations and attractions that suit your travel style.
        </li>
        <li style={{ marginBottom: 20 }}>
          <strong>Lookup Search:</strong>  
          <br />
          Look up previous requests by submitting the search ID. It will pull up your previous searches.
        </li>
      </ol>

      <h2 style={{ marginTop: 40, marginBottom: 15 }}>APIs We Use</h2>
      <ul style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 15 }}>
          <strong>OpenCage Geocoding API: </strong>  
          Provides geographic coordinates (latitude and longitude) from location names, helping us convert your search inputs into map points.
        </li>
        <li style={{ marginBottom: 15 }}>
          <strong>Gemini API: </strong>  
          Google's AI service that generates personalized travel recommendations based on your preferences and selected destinations.
        </li>
        <li style={{ marginBottom: 15 }}>
          <strong>Supabase: </strong>  
          Our backend database solution that handles user accounts, stores your preferences, and manages your search history securely.
        </li>
        <li style={{ marginBottom: 15 }}>
          <strong>OpenStreetMap Nominatim API: </strong>  
          Helps geocode user-entered location strings with detailed address information using open-source map data.
        </li>
      </ul>

      <p style={{ marginTop: 30 }}>
        Enjoy exploring the world with recommendations made just for you!
      </p>
    </div>
  );
}
