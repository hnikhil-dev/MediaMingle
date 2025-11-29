import React, { useEffect, useState } from 'react';
import './App.css';
import { Search, Film, Tv, Sparkles, TrendingUp, Heart, Smile, Frown, Zap, Ghost, Brain, Coffee, Star, Play, Info, Github, Twitter, Instagram } from 'lucide-react';

function App() {
  const [content, setContent] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("movies");
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [featuredContent, setFeaturedContent] = useState(null);

  const moods = [
    { value: "happy", icon: Smile, label: "Happy", color: "#fbbf24" },
    { value: "sad", icon: Frown, label: "Sad", color: "#60a5fa" },
    { value: "exciting", icon: Zap, label: "Exciting", color: "#f87171" },
    { value: "scary", icon: Ghost, label: "Scary", color: "#a78bfa" },
    { value: "thoughtful", icon: Brain, label: "Thoughtful", color: "#34d399" },
    { value: "relaxing", icon: Coffee, label: "Relaxing", color: "#fb923c" }
  ];

  const genres = {
    movies: ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller"],
    tv: ["Drama", "Comedy", "Action", "Mystery", "Sci-Fi", "Reality"],
    anime: ["Shounen", "Slice of Life", "Action", "Romance", "Psychological", "Comedy"]
  };

  const loadTrending = (type) => {
    setLoading(true);
    const urls = {
      movies: 'http://localhost:8000/trending-movies',
      tv: 'http://localhost:8000/trending-tv',
      anime: 'http://localhost:8000/trending-anime'
    };

    fetch(urls[type])
      .then(res => res.json())
      .then(data => {
        const results = type === 'anime' ? (data.data || []) : (data.results || []);
        setContent(results);
        if (results.length > 0) {
          setFeaturedContent(results[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    const urls = {
      movies: `http://localhost:8000/search-movies?query=${encodeURIComponent(search)}`,
      tv: `http://localhost:8000/search-tv?query=${encodeURIComponent(search)}`,
      anime: `http://localhost:8000/search-anime?query=${encodeURIComponent(search)}`
    };

    const res = await fetch(urls[activeTab]);
    const data = await res.json();
    
    if (activeTab === 'anime') {
      setContent(data.data || []);
    } else {
      setContent(data.results || []);
    }
    setLoading(false);
  };

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    setSelectedGenre("");
    setLoading(true);
    const url = `http://localhost:8000/recommend?mood=${mood}&content_type=${activeTab}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (activeTab === 'anime') {
      setContent(data.data || []);
    } else {
      setContent(data.results || []);
    }
    
    setLoading(false);
    setShowMoodSelector(false);
  };

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
    setSelectedMood("");
    // For now, just filter existing content
    // In production, you'd make API call with genre parameter
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setSelectedMood("");
    setSelectedGenre("");
    setShowMoodSelector(false);
    loadTrending(tab);
  };

  useEffect(() => {
    loadTrending(activeTab);
  }, []);

  const renderCard = (item, index) => {
    if (activeTab === 'anime') {
      return (
        <div className="media-card" key={item.mal_id} style={{ animationDelay: `${index * 0.05}s` }}>
          <div className="card-image-wrapper">
            {item.images?.jpg?.image_url ? (
              <img src={item.images.jpg.image_url} alt={item.title} loading="lazy" />
            ) : (
              <div className="placeholder-image">No Image</div>
            )}
            <div className="card-overlay">
              <button className="card-action-btn play-btn">
                <Play size={20} fill="white" />
              </button>
              <button className="card-action-btn favorite-btn">
                <Heart size={18} />
              </button>
            </div>
            <div className="card-quick-info">
              <span className="info-badge">{item.type || 'TV'}</span>
              <span className="info-badge">{item.episodes ? `${item.episodes} eps` : 'Ongoing'}</span>
            </div>
          </div>
          <div className="card-content">
            <h3>{item.title}</h3>
            <div className="card-meta">
              <span className="rating">
                <Star size={14} fill="#fbbf24" color="#fbbf24" />
                {item.score || 'N/A'}
              </span>
              <span className="year">{item.year || 'N/A'}</span>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="media-card" key={item.id} style={{ animationDelay: `${index * 0.05}s` }}>
          <div className="card-image-wrapper">
            {item.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                alt={item.title || item.name}
                loading="lazy"
              />
            ) : (
              <div className="placeholder-image">No Poster</div>
            )}
            <div className="card-overlay">
              <button className="card-action-btn play-btn">
                <Play size={20} fill="white" />
              </button>
              <button className="card-action-btn favorite-btn">
                <Heart size={18} />
              </button>
            </div>
            <div className="card-quick-info">
              <span className="info-badge">{activeTab === 'movies' ? 'Movie' : 'TV'}</span>
              <span className="info-badge">
                <Star size={12} fill="#fbbf24" color="#fbbf24" />
                {item.vote_average?.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="card-content">
            <h3>{item.title || item.name}</h3>
            <div className="card-meta">
              <span className="year">{(item.release_date || item.first_air_date)?.split('-')[0]}</span>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderFeaturedSection = () => {
    if (!featuredContent) return null;

    const backdrop = activeTab === 'anime' 
      ? featuredContent.images?.jpg?.large_image_url
      : `https://image.tmdb.org/t/p/original${featuredContent.backdrop_path || featuredContent.poster_path}`;

    return (
      <div className="featured-section" style={{ backgroundImage: `url(${backdrop})` }}>
        <div className="featured-overlay"></div>
        <div className="featured-content">
          <span className="featured-label">Featured {activeTab === 'movies' ? 'Movie' : activeTab === 'tv' ? 'Show' : 'Anime'}</span>
          <h2 className="featured-title">{featuredContent.title || featuredContent.name}</h2>
          <div className="featured-meta">
            <span className="featured-rating">
              <Star size={18} fill="#fbbf24" color="#fbbf24" />
              {activeTab === 'anime' ? featuredContent.score : featuredContent.vote_average?.toFixed(1)}
            </span>
            <span className="featured-year">
              {activeTab === 'anime' 
                ? featuredContent.year 
                : (featuredContent.release_date || featuredContent.first_air_date)?.split('-')[0]}
            </span>
          </div>
          <p className="featured-overview">
            {activeTab === 'anime' 
              ? (featuredContent.synopsis?.slice(0, 180) + '...')
              : (featuredContent.overview?.slice(0, 180) + '...')}
          </p>
          <div className="featured-actions">
            <button className="featured-btn primary">
              <Play size={20} fill="white" />
              Watch Now
            </button>
            <button className="featured-btn secondary">
              <Info size={20} />
              More Info
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
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
                  placeholder={`Search ${activeTab}...`}
                  className="search-input-header"
                />
              </form>
            </div>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <nav className="content-tabs">
          <button 
            className={`tab-button ${activeTab === 'movies' ? 'active' : ''}`}
            onClick={() => handleTabChange('movies')}
          >
            <Film size={20} />
            <span>Movies</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'tv' ? 'active' : ''}`}
            onClick={() => handleTabChange('tv')}
          >
            <Tv size={20} />
            <span>TV Shows</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'anime' ? 'active' : ''}`}
            onClick={() => handleTabChange('anime')}
          >
            <TrendingUp size={20} />
            <span>Anime</span>
          </button>
        </nav>

        {renderFeaturedSection()}

        <div className="controls-section">
          <button 
            className={`mood-toggle-button ${showMoodSelector ? 'active' : ''}`}
            onClick={() => setShowMoodSelector(!showMoodSelector)}
          >
            <Sparkles size={18} />
            Mood Recommendations
          </button>

          <div className="genre-filters">
            {genres[activeTab].map(genre => (
              <button
                key={genre}
                className={`genre-badge ${selectedGenre === genre ? 'active' : ''}`}
                onClick={() => handleGenreSelect(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {showMoodSelector && (
          <div className="mood-panel">
            <h2>How are you feeling today?</h2>
            <div className="mood-options">
              {moods.map(mood => {
                const IconComponent = mood.icon;
                return (
                  <button
                    key={mood.value}
                    className={`mood-option ${selectedMood === mood.value ? 'selected' : ''}`}
                    onClick={() => handleMoodSelect(mood.value)}
                    style={{ '--mood-color': mood.color }}
                  >
                    <IconComponent size={28} strokeWidth={2} />
                    <span>{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="content-section">
          <h2 className="section-title">
            {selectedMood ? `${selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} Picks` : 
             selectedGenre ? selectedGenre :
             `Trending ${activeTab === 'movies' ? 'Movies' : activeTab === 'tv' ? 'TV Shows' : 'Anime'}`}
          </h2>

          {loading ? (
            <div className="loading-grid">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text short"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="content-grid">
              {content.length > 0 ? (
                activeTab === 'anime' 
                  ? content.map((item, index) => renderCard(item, index))
                  : content.map((item, index) => renderCard(item, index))
              ) : (
                <div className="empty-state">
                  <Film size={64} color="#64748b" />
                  <p>No results found</p>
                  <span>Try adjusting your search or filters</span>
                </div>
              )}
            </div>
          )}
        </div>
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
    </div>
  );
}

export default App;
