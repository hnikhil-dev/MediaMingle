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

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('auth') === 'login') {
      setShowAuth(true);
    }
  }, [location]);

  const saveSearchToHistory = (query) => {
    if (!query.trim()) return;
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history = history.filter(item => item !== query);
    history.unshift(query);
    history = history.slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('searchHistory');
    setSearchHistory([]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    saveSearchToHistory(search);
    navigate(`/?search=${encodeURIComponent(search)}`);
    setShowMobileSearch(false);
    setSearch("");
  };

  const handleHistoryClick = (query) => {
    setSearch(query);
    navigate(`/?search=${encodeURIComponent(query)}`);
    setShowMobileSearch(false);
  };

  useEffect(() => {
    setShowMobileSidebar(false);
    setShowMobileSearch(false);
  }, [location]);

  return (
    <div className="app">
      <Sidebar />

      <div className="main-content">
        <header className="header">
          <button 
            className="mobile-menu-btn"
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          >
            <Menu size={24} />
          </button>

          <form className="search-bar desktop-search" onSubmit={handleSearch}>
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search movies, TV shows, anime..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input search-input-header"
            />
            {searchHistory.length > 0 && search === "" && (
              <div className="search-history-dropdown">
                <div className="search-history-header">
                  <span>Recent Searches</span>
                  <button type="button" onClick={clearSearchHistory}>
                    <Trash2 size={14} /> Clear
                  </button>
                </div>
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className="search-history-item"
                    onClick={() => handleHistoryClick(item)}
                  >
                    <Clock size={14} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </form>

          <button 
            className="mobile-search-btn"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            <Search size={20} />
          </button>

          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <button className="icon-btn" onClick={() => navigate('/?favorites=true')}>
                  <Heart size={20} />
                </button>
                <div className="user-menu">
                  <button className="user-btn">
                    <User size={20} />
                    <span>{user?.username}</span>
                  </button>
                  <div className="user-dropdown">
                    <div className="user-dropdown-item" onClick={() => navigate('/profile')}>
                      <User size={16} /> Profile
                    </div>
                    <div className="user-dropdown-item" onClick={logout}>
                      <LogOut size={16} /> Logout
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <button className="login-btn" onClick={() => setShowAuth(true)}>
                <Sparkles size={18} />
                Sign In
              </button>
            )}
          </div>
        </header>

        {showMobileSearch && (
          <div className="mobile-search-overlay">
            <div className="mobile-search-container">
              <form className="mobile-search-form" onSubmit={handleSearch}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                <button type="button" onClick={() => setShowMobileSearch(false)}>
                  <X size={20} />
                </button>
              </form>
              {searchHistory.length > 0 && (
                <div className="search-history-mobile">
                  <div className="search-history-header">
                    <span>Recent Searches</span>
                    <button onClick={clearSearchHistory}>
                      <Trash2 size={14} /> Clear
                    </button>
                  </div>
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      className="search-history-item"
                      onClick={() => handleHistoryClick(item)}
                    >
                      <Clock size={14} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showMobileSidebar && (
          <div className="mobile-sidebar-overlay" onClick={() => setShowMobileSidebar(false)}>
            <div className="mobile-sidebar" onClick={(e) => e.stopPropagation()}>
              <Sidebar />
            </div>
          </div>
        )}

        <main className="content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies/:id" element={<DetailPage contentType="movies" />} />
            <Route path="/tv/:id" element={<DetailPage contentType="tv" />} />
            <Route path="/anime/:id" element={<DetailPage contentType="anime" />} />
            <Route path="/music" element={<MusicPage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-ratings" element={<MyRatings />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-logo">
              <Sparkles size={24} />
              <span>MediaMingle</span>
            </div>
            <p className="footer-text">
              Your personalized entertainment hub for movies, TV shows, anime, and more.
            </p>
            <div className="footer-links">
              <div className="footer-section">
                <h4>Quick Links</h4>
                <a href="/#">About</a>
                <a href="/#">Contact</a>
                <a href="/#">Privacy Policy</a>
              </div>
              <div className="footer-section">
                <h4>Connect With Us</h4>
                <div className="social-links">
                  <a href="/#"><Github size={20} /></a>
                  <a href="/#"><Twitter size={20} /></a>
                  <a href="/#"><Instagram size={20} /></a>
                </div>
              </div>
            </div>
            <p className="footer-copyright">
              © 2025 MediaMingle. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

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
