import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Link is no longer needed here directly
import SearchPage from './pages/MainSearch/SearchPage';
import AboutPage from './pages/About/AboutPage';
import UserPage from './pages/User/UserPage';
import DestinationsPage from './pages/Destinations/DestinationsPage';

import InteractiveSearchResults from './pages/InteractiveSearch/InteractiveSearchResults';
import Navbar from './components/Navbar/Navbar'; // Your new Navbar component

import './App.css';

export default function App() {
  return (
    <Router>
      <Navbar /> {/* Place your new Navbar component here. It will be at the top. */}

      <div className="app-content"> {/* Optional: wrapper for content below navbar */}
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/interactive_search" element={<InteractiveSearchResults />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          {/* Add other routes as needed */}
        </Routes>
      </div>

      <footer>© 2025 Travel Guide</footer>
    </Router>
  );
}