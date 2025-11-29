import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import { Search, Sparkles, User, LogOut, Heart, Github, Twitter, Instagram } from 'lucide-react';
import { useAuth } from './AuthContext';
import Auth from './Auth';
import HomePage from './HomePage';
import DetailPage from './DetailPage';

function AppContent() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/?search=${encodeURIComponent(search)}`);
  };

  const showMyFavorites = () => {
    setShowUserMenu(false);
    navigate('/?favorites=true');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
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

            {isAuthenticated ? (
              <div className="user-menu-container">
                <button className="user-menu-button" onClick={() => setShowUserMenu(!showUserMenu)}>
                  <User size={20} />
                  <span>{user?.username}</span>
                </button>
                
                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <button onClick={showMyFavorites}>
                      <Heart size={18} />
                      My Favorites
                    </button>
                    <button onClick={() => { logout(); setShowUserMenu(false); }}>
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="login-button" onClick={() => setShowAuth(true)}>
                <User size={18} />
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies/:id" element={<DetailPage contentType="movies" />} />
          <Route path="/tv/:id" element={<DetailPage contentType="tv" />} />
          <Route path="/anime/:id" element={<DetailPage contentType="anime" />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <Sparkles size={28} />
              <h3>MediaMingle</h3>
            </div>
            <p>Your personalized entertainment hub for movies, TV shows, and anime.</p>
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
              <a href="#github" aria-label="GitHub"><Github size={24} /></a>
              <a href="#twitter" aria-label="Twitter"><Twitter size={24} /></a>
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
