import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SearchPage from './pages/MainSearch/SearchPage';
import AboutPage from './pages/About/AboutPage';
import UserPage from './pages/User/UserPage';

export default function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Search</Link> | <Link to="/about">About</Link>|
        <Link to="/user">User</Link> |
      </nav>

      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/user" element={<UserPage />} />

      </Routes>

      <footer>© 2025 Travel Guide</footer>
    </Router>
  );
}
