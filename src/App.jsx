import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';

import SearchPage from './pages/MainSearch/SearchPage';
import AboutPage from './pages/About/AboutPage';
import UserPage from './pages/User/UserPage';
import SearchResults from './pages/SearchResults/SearchResults';
import InteractiveSearchResults from './pages/InteractiveSearch/InteractiveSearchResults';
import LookupSearchPage from './pages/LookupSearch/LookupSearchPage';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer'

import './App.css';

const libraries = ['places'];

export default function App() {
  return (
    <LoadScript
      libraries={libraries}
      loadingElement={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '2rem'
        }}>
          <span role="img" aria-label="Loading">🗺️</span> Loading Map Services...
        </div>
      }
    >
      <Router>
        <Navbar />

        <div className="app-content">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/user" element={<UserPage />} />
            <Route path="/interactive_search" element={<InteractiveSearchResults />} />
            <Route path="/search_results" element={<SearchResults />} />
            <Route path="/lookup-search" element={<LookupSearchPage />} /> 
            <Route path="/users" element={<UserPage />} />
          </Routes>
        </div>
      <Footer />
      </Router>
    </LoadScript>
  );
}
