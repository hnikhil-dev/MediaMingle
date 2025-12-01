import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { Search, Sparkles, User, LogOut, Heart, Github, Twitter, Instagram, X, Menu, Clock, Trash2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import Auth from './Auth';
import Sidebar from './Sidebar';
import HomePage from './HomePage';
import DetailPage from './DetailPage';
import MusicPage from './MusicPage';
import BooksPage from './BooksPage';
import GamesPage from './GamesPage';
import ProfilePage from './ProfilePage';
import MyRatings from './MyRatings';
import UserProfile from './UserProfile';
import PublicProfile from './PublicProfile';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function AppContent() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [search, setSearch] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  useKeyboardShortcuts();

  // Load search history from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
  }, []);

  // Check for auth query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('auth') === 'login') {
      setShowAuth(true);
    }
  }, [location]);

  // Save search to history
  const saveSearchToHistory = (query) => {
    if (!query.trim()) return;
    
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history = history.filter(item => item !== query);
    history.unshift(query);
    history = history.slice(0, 10);
    
    localStorage.setItem('searchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  // Clear search history
  const clearSearchHistory = () => {
    localStorage.removeItem('searchHistory');
    setSearchHistory([]);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    saveSearchToHistory(search);
    navigate(`/?search=${encodeURIComponent(search)}`);
    setShowMobileSearch(false);
    setSearch("");
  };

  // Handle search history click
  const handleHistoryClick = (query) => {
    setSearch(query);
    navigate(`/?search=${encodeURIComponent(query)}`);
    setShowMobileSearch(false);
  };

  // Close sidebar/search when route changes
  useEffect(() => {
    setShowMobileSidebar(false);
    setShowMobileSearch(false);
  }, [location]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          {/* Mobile Hamburger */}
          <button className="hamburger-btn" onClick={() => setShowMobileSidebar(true)}>
            <Menu size={24} />
          </button>

          <div className="logo-section" onClick={() => navigate('/')}>
            <Sparkles className="logo-icon" size={32} />
            <h1>MediaMingle</h1>
          </div>

          <nav className="header-nav">
            <div className="search-container-header">
              <form onSubmit={handleSearch} className="search-form-header">
                <Search className="search-icon-header" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search movies, TV shows, anime..."
                  className="search-input-header"
                />
              </form>
            </div>

            {/* Mobile: Search Button */}
            <button className="search-toggle-btn" onClick={() => setShowMobileSearch(true)}>
              <Search size={20} />
            </button>
          </nav>

          {/* Desktop: User Avatar */}
          <div className="desktop-user-avatar">
            {isAuthenticated ? (
              <div className="user-avatar" onClick={() => navigate('/profile')}>
                <User size={20} />
              </div>
            ) : (
              <button className="login-button" onClick={() => setShowAuth(true)}>
                <User size={18} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <>
          <div className="sidebar-overlay" onClick={() => setShowMobileSidebar(false)}></div>
          <div className="mobile-sidebar-container">
            <Sidebar />
          </div>
        </>
      )}

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="mobile-search-overlay">
          <div className="mobile-search-container">
            <div className="mobile-search-header">
              <h2 className="mobile-search-title">Search</h2>
              <button className="mobile-search-close" onClick={() => setShowMobileSearch(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="mobile-search-form">
              <Search className="search-icon-header" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search movies, TV shows, anime..."
                autoFocus
              />
            </form>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="search-history">
                <div className="search-history-header">
                  <h3>
                    <Clock size={16} />
                    Recent Searches
                  </h3>
                  <button onClick={clearSearchHistory} className="clear-history-btn">
                    <Trash2 size={14} />
                    Clear
                  </button>
                </div>
                <div className="search-history-list">
                  {searchHistory.map((query, index) => (
                    <div 
                      key={index} 
                      className="search-history-item"
                      onClick={() => handleHistoryClick(query)}
                    >
                      <Clock size={14} />
                      <span>{query}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="main-content-with-sidebar">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies/:id" element={<DetailPage contentType="movies" />} />
          <Route path="/tv/:id" element={<DetailPage contentType="tv" />} />
          <Route path="/anime/:id" element={<DetailPage contentType="anime" />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<HomePage />} />
          <Route path="/history" element={<HomePage />} />
          <Route path="/my-ratings" element={<MyRatings />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/user/:username" element={<PublicProfile />} />
          <Route path="/users/:username" element={<PublicProfile />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <Sparkles size={28} />
              <h3>MediaMingle</h3>
            </div>
            <p>Your personalized entertainment hub for movies, TV shows, anime, and more.</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Connect With Us</h4>
            <div className="social-links">
              <a href="https://github.com/hnikhil-dev" aria-label="GitHub"><Github size={24} /></a>
              <a href="https://x.com/NikhilDabhade17" aria-label="Twitter"><Twitter size={24} /></a>
              <a href="#instagram" aria-label="Instagram"><Instagram size={24} /></a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 MediaMingle. All rights reserved. | Data provided by TMDb & Jikan API</p>
        </div>
      </footer>

      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
