import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Film, Tv, Sparkles, TrendingUp, Heart, Smile, Frown, Zap, Ghost, Brain, Coffee, Star, Play, Clock, SlidersHorizontal, Eye, Copy, Share2, ExternalLink, ArrowLeft, RotateCw, HeartOff, Check, Trash2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import config from './config';
import axios from 'axios';
import FilterPanel from './FilterPanel';
import ContextMenu from './ContextMenu';
import ConfirmModal from './ConfirmModal';

function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState([]);
  const [activeTab, setActiveTab] = useState("movies");
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [featuredContent, setFeaturedContent] = useState(null);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { isAuthenticated } = useAuth();

  const filterIncompleteContent = (items, type) => {
    return items.filter(item => {
      if (type === 'anime') {
        // For anime: must have image and score
        const hasImage = item.images?.jpg?.image_url;
        const hasScore = item.score && item.score > 0;
        return hasImage && hasScore;
      } else {
        // For movies/TV: must have poster and rating
        const hasPoster = item.poster_path;
        const hasRating = item.vote_average && item.vote_average > 0;
        return hasPoster && hasRating;
      }
    });
  };

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

  const genreMapping = {
    movies: {
      "Action": 28,
      "Comedy": 35,
      "Drama": 18,
      "Horror": 27,
      "Sci-Fi": 878,
      "Romance": 10749,
      "Thriller": 53
    },
    tv: {
      "Drama": 18,
      "Comedy": 35,
      "Action": 10759,
      "Mystery": 9648,
      "Sci-Fi": 10765,
      "Reality": 10764
    }
  };

  // Check URL params for search, favorites, or tab
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    const showFavs = searchParams.get('favorites');
    const showHist = searchParams.get('history');
    const tabParam = searchParams.get('tab');

    if (showFavs === 'true') {
      setShowFavorites(true);
      setShowHistory(false);
    } else if (showHist === 'true') {
      setShowHistory(true);
      setShowFavorites(false);
    } else if (searchQuery) {
      handleSearchFromURL(searchQuery);
    } else if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
      loadTrending(tabParam);
    } else {
      setShowFavorites(false);
      setShowHistory(false);
      if (content.length === 0) {
        loadTrending(activeTab);
      }
    }
  }, [searchParams]);

  // Handle right-click on media card
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();

    const contentId = activeTab === 'anime' ? item.mal_id : item.id;
    const favoriteKey = `${activeTab}-${contentId}`;
    const isFavorite = favoriteIds.has(favoriteKey);
    const favoriteItem = favorites.find(fav =>
      fav.content_type === activeTab && fav.content_id === String(contentId)
    );

    const actions = [
      {
        label: 'View Details',
        icon: Eye,
        onClick: (item) => {
          const id = activeTab === 'anime' ? item.mal_id : item.id;
          navigate(`/${activeTab}/${id}`);
        }
      },
      {
        label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
        icon: isFavorite ? HeartOff : Heart,
        onClick: (item) => {
          if (isAuthenticated) {
            toggleFavorite(item, isFavorite, favoriteItem?.id);
          } else {
            alert('Please sign in to use favorites');
          }
        },
        disabled: !isAuthenticated
      },
      { divider: true },
      {
        label: 'Copy Link',
        icon: Copy,
        onClick: (item) => {
          const id = activeTab === 'anime' ? item.mal_id : item.id;
          const url = `${window.location.origin}/${activeTab}/${id}`;
          navigator.clipboard.writeText(url);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        },
        shortcut: 'Ctrl+C'
      },
      {
        label: 'Share',
        icon: Share2,
        onClick: (item) => {
          const id = activeTab === 'anime' ? item.mal_id : item.id;
          const url = `${window.location.origin}/${activeTab}/${id}`;
          const title = item.title || item.name;

          if (navigator.share) {
            navigator.share({
              title: title,
              url: url
            }).catch(() => { });
          } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
          }
        }
      },
      {
        label: 'Open in New Tab',
        icon: ExternalLink,
        onClick: (item) => {
          const id = activeTab === 'anime' ? item.mal_id : item.id;
          window.open(`/${activeTab}/${id}`, '_blank');
        },
        shortcut: 'Ctrl+Click'
      }
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      actions: actions,
      item: item
    });
  };

  // Handle right-click on page (general)
  const handlePageContextMenu = (e) => {
    // Only show if not on a card
    if (!e.target.closest('.media-card') && !e.target.closest('.history-card')) {
      e.preventDefault();

      const actions = [
        {
          label: 'Go Back',
          icon: ArrowLeft,
          onClick: () => navigate(-1),
          shortcut: 'Alt+←'
        },
        {
          label: 'Refresh Page',
          icon: RotateCw,
          onClick: () => window.location.reload(),
          shortcut: 'F5'
        },
        { divider: true },
        {
          label: 'Search',
          icon: Search,
          onClick: () => document.querySelector('.search-input-header')?.focus(),
          shortcut: 'Ctrl+K'
        }
      ];

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        actions: actions
      });
    }
  };

  // Add page context menu listener
  useEffect(() => {
    document.addEventListener('contextmenu', handlePageContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handlePageContextMenu);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search-input-header')?.focus();
      }

      // Alt + Left Arrow: Go back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(-1);
      }

      // Escape: Close context menu
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  const handleSearchFromURL = async (query) => {
    if (!query.trim()) return;

    setLoading(true);
    setShowFavorites(false);
    setActiveFilters(null);

    const urls = {
      movies: `${config.API_BASE_URL}/search-movies?query=${encodeURIComponent(query)}`,
      tv: `${config.API_BASE_URL}/search-tv?query=${encodeURIComponent(query)}`,
      anime: `${config.API_BASE_URL}/search-anime?query=${encodeURIComponent(query)}`
    };

    try {
      const res = await fetch(urls[activeTab]);
      const data = await res.json();

      const results = activeTab === 'anime' ? (data.data || []) : (data.results || []);

      // FILTER OUT INCOMPLETE CONTENT
      const filteredResults = filterIncompleteContent(results, activeTab);

      setContent(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      setContent([]);
    }

    setLoading(false);
  };


  const loadTrending = async (type, retryCount = 0) => {
    setLoading(true);
    setError(null);

    const urls = {
      movies: `${config.API_BASE_URL}/trending-movies`,
      tv: `${config.API_BASE_URL}/trending-tv`,
      anime: `${config.API_BASE_URL}/trending-anime`
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(urls[type], {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const results = type === 'anime' ? (data.data || []) : (data.results || []);

      // FILTER OUT INCOMPLETE CONTENT
      const filteredResults = filterIncompleteContent(results, type);

      setContent(filteredResults);
      if (filteredResults.length > 0) {
        setFeaturedContent(filteredResults[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading content:', err);

      if (retryCount < 2 && err.name === 'AbortError') {
        setRetrying(true);
        setError('Waking up the server... Please wait.');
        setTimeout(() => {
          loadTrending(type, retryCount + 1);
        }, 3000);
      } else {
        setError(err.name === 'AbortError'
          ? 'Server is taking too long to respond. Please refresh the page.'
          : 'Failed to load content. Please check your connection and try again.');
        setLoading(false);
        setRetrying(false);
      }
    }
  };

  const loadWithFilters = async (filters) => {
    setLoading(true);
    setError(null);

    try {
      let url;
      let params = new URLSearchParams({
        year_min: filters.yearMin,
        year_max: filters.yearMax,
        rating_min: filters.ratingMin,
        sort_by: filters.sortBy,
        page: 1
      });

      if (activeTab === 'anime') {
        url = `${config.API_BASE_URL}/discover-anime?${params}`;
        if (filters.genres && filters.genres.length > 0) {
          url += `&genre=${encodeURIComponent(filters.genres[0])}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        // FILTER OUT INCOMPLETE CONTENT
        const filteredResults = filterIncompleteContent(data.data || [], 'anime');
        setContent(filteredResults);
      } else {
        if (filters.language) {
          params.append('language', filters.language);
        }
        if (filters.genres) {
          params.append('with_genres', filters.genres);
        }

        url = activeTab === 'movies'
          ? `${config.API_BASE_URL}/discover-movies?${params}`
          : `${config.API_BASE_URL}/discover-tv?${params}`;

        const response = await fetch(url);
        const data = await response.json();

        // FILTER OUT INCOMPLETE CONTENT
        const filteredResults = filterIncompleteContent(data.results || [], activeTab);
        setContent(filteredResults);
      }

      setLoading(false);
    } catch (error) {
      console.error('Filter error:', error);
      setError('Failed to load content with filters');
      setLoading(false);
    }
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    setSelectedMood("");
    setSelectedGenre("");
    setShowMoodSelector(false);
    navigate('/');
    loadWithFilters(filters);
  };

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    setSelectedGenre("");
    setActiveFilters(null);
    setLoading(true);
    const url = `${config.API_BASE_URL}/recommend?mood=${mood}&content_type=${activeTab}`;

    const res = await fetch(url);
    const data = await res.json();

    const results = activeTab === 'anime' ? (data.data || []) : (data.results || []);

    // FILTER OUT INCOMPLETE CONTENT
    const filteredResults = filterIncompleteContent(results, activeTab);

    setContent(filteredResults);
    setLoading(false);
    setShowMoodSelector(false);
  };

  const handleGenreSelect = async (genre) => {
    setSelectedGenre(genre);
    setSelectedMood("");
    setActiveFilters(null);
    setLoading(true);

    try {
      if (activeTab === 'anime') {
        const url = `${config.API_BASE_URL}/discover-anime?year_min=1960&year_max=2025&rating_min=0&sort_by=popularity&genre=${encodeURIComponent(genre)}&page=1`;

        const response = await fetch(url);
        const data = await response.json();

        // FILTER OUT INCOMPLETE CONTENT
        const filteredResults = filterIncompleteContent(data.data || [], 'anime');
        setContent(filteredResults);
      } else {
        const genreId = genreMapping[activeTab][genre];

        if (genreId) {
          const endpoint = activeTab === 'movies' ? 'discover-movies' : 'discover-tv';
          const url = `${config.API_BASE_URL}/${endpoint}?year_min=1900&year_max=2025&rating_min=0&language=&sort_by=popularity.desc&with_genres=${genreId}&page=1`;

          const response = await fetch(url);
          const data = await response.json();

          // FILTER OUT INCOMPLETE CONTENT
          const filteredResults = filterIncompleteContent(data.results || [], activeTab);
          setContent(filteredResults);
        }
      }
    } catch (error) {
      console.error('Genre filter error:', error);
      setError('Failed to load genre content');
      setContent([]);
    }

    setLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedMood("");
    setSelectedGenre("");
    setShowMoodSelector(false);
    setShowFavorites(false);
    setActiveFilters(null);
    navigate(`/?tab=${tab}`);
    loadTrending(tab);
  };

  const loadFavorites = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.get(`${config.API_BASE_URL}/favorites`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFavorites(response.data);

      const ids = new Set(response.data.map(fav => `${fav.content_type}-${fav.content_id}`));
      setFavoriteIds(ids);
    } catch (error) {
      console.error('Failed to load favorites', error);
    }
  };

  const loadHistory = async () => {
    if (!isAuthenticated) return;

    try {
      const limit = showHistory ? 50 : 10;
      const response = await axios.get(`${config.API_BASE_URL}/history?limit=${limit}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to load history', error);
    }
  };

  // Delete all history
  const clearAllHistory = async () => {
    if (!isAuthenticated) return;

    try {
      await axios.delete(`${config.API_BASE_URL}/history/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history', error);
      alert('Failed to clear history. Please try again.');
    }
  };

  // Delete single history item
  const deleteHistoryItem = async (historyId) => {
    if (!isAuthenticated) return;

    try {
      await axios.delete(`${config.API_BASE_URL}/history/${historyId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHistory(history.filter(h => h.id !== historyId));
    } catch (error) {
      console.error('Failed to delete history item', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const toggleFavorite = async (item, isFavorite, favoriteId) => {
    if (!isAuthenticated) return;

    try {
      if (isFavorite) {
        await axios.delete(`${config.API_BASE_URL}/favorites/${favoriteId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        const favoriteData = {
          content_type: activeTab,
          content_id: String(activeTab === 'anime' ? item.mal_id : item.id),
          title: item.title || item.name,
          poster_url: activeTab === 'anime'
            ? item.images?.jpg?.image_url
            : `https://image.tmdb.org/t/p/w300${item.poster_path}`
        };

        await axios.post(`${config.API_BASE_URL}/favorites`, favoriteData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }

      await loadFavorites();
    } catch (error) {
      console.error('Failed to toggle favorite', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
      loadHistory();
    }
  }, [isAuthenticated, showHistory]);

  const renderCard = (item, index, cardActiveTab) => {
    const contentId = cardActiveTab === 'anime' ? item.mal_id : item.id;
    const favoriteKey = `${cardActiveTab}-${contentId}`;
    const isFavorite = favoriteIds.has(favoriteKey);
    const favoriteItem = favorites.find(fav =>
      fav.content_type === cardActiveTab && fav.content_id === String(contentId)
    );

    if (cardActiveTab === 'anime') {
      return (
        <div
          className="media-card"
          key={item.mal_id}
          style={{ animationDelay: `${index * 0.05}s` }}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          <div className="card-image-wrapper" onClick={() => navigate(`/anime/${item.mal_id}`)}>
            {item.images?.jpg?.image_url ? (
              <img src={item.images.jpg.image_url} alt={item.title} loading="lazy" />
            ) : (
              <div className="placeholder-image">No Image</div>
            )}
            <div className="card-overlay">
              <button className="card-action-btn play-btn">
                <Play size={20} fill="white" />
              </button>
              <button
                className={`card-action-btn favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item, isFavorite, favoriteItem?.id);
                }}
              >
                <Heart size={18} fill={isFavorite ? '#f87171' : 'none'} />
              </button>
            </div>
            <div className="card-quick-info">
              <span className="info-badge">{item.type || 'TV'}</span>
              <span className="info-badge">{item.episodes ? `${item.episodes} eps` : 'Ongoing'}</span>
            </div>
          </div>
          <div className="card-content" onClick={() => navigate(`/anime/${item.mal_id}`)}>
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
        <div
          className="media-card"
          key={item.id}
          style={{ animationDelay: `${index * 0.05}s` }}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          <div className="card-image-wrapper" onClick={() => navigate(`/${cardActiveTab}/${item.id}`)}>
            {item.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                alt={item.title || item.name}
                loading="lazy"
              />
            ) : (
              <div className="placeholder-image">
                <Film className="placeholder-icon" size={40} />
                <span>No Poster</span>
              </div>
            )}
            <div className="card-overlay">
              <button className="card-action-btn play-btn">
                <Play size={20} fill="white" />
              </button>
              <button
                className={`card-action-btn favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item, isFavorite, favoriteItem?.id);
                }}
              >
                <Heart size={18} fill={isFavorite ? '#f87171' : 'none'} />
              </button>
            </div>
            <div className="card-quick-info">
              <span className="info-badge">{cardActiveTab === 'movies' ? 'Movie' : 'TV'}</span>
              <span className="info-badge">
                <Star size={12} fill="#fbbf24" color="#fbbf24" />
                {item.vote_average?.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="card-content" onClick={() => navigate(`/${cardActiveTab}/${item.id}`)}>
            <h3>{item.title || item.name}</h3>
            <div className="card-meta">
              <span className="year">{(item.release_date || item.first_air_date)?.split('-')[0]}</span>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderHistoryCard = (hist) => {
    const handleHistoryContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const actions = [
        {
          label: 'View Details',
          icon: Eye,
          onClick: () => navigate(`/${hist.content_type}/${hist.content_id}`)
        },
        {
          label: 'Remove from History',
          icon: Trash2,
          onClick: () => deleteHistoryItem(hist.id),
          danger: true
        },
        { divider: true },
        {
          label: 'Copy Link',
          icon: Copy,
          onClick: () => {
            const url = `${window.location.origin}/${hist.content_type}/${hist.content_id}`;
            navigator.clipboard.writeText(url);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
          }
        },
        {
          label: 'Open in New Tab',
          icon: ExternalLink,
          onClick: () => {
            window.open(`/${hist.content_type}/${hist.content_id}`, '_blank');
          }
        }
      ];

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        actions: actions
      });
    };

    return (
      <div
        className="media-card"
        key={hist.id}
        onContextMenu={handleHistoryContextMenu}
      >
        <div className="card-image-wrapper" onClick={() => navigate(`/${hist.content_type}/${hist.content_id}`)}>
          {hist.poster_url ? (
            <img src={hist.poster_url} alt={hist.title} loading="lazy" />
          ) : (
            <div className="placeholder-image">
              <Film className="placeholder-icon" size={40} />
              <span>No Poster</span>
            </div>
          )}
          <div className="card-overlay">
            <button className="card-action-btn play-btn">
              <Play size={20} fill="white" />
            </button>
            <button
              className="card-action-btn delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteHistoryItem(hist.id);
              }}>
              <Trash2 size={18} color="#fff" />
            </button>
          </div>
          <div className="card-quick-info">
            <span className="info-badge">{hist.content_type}</span>
            <span className="info-badge">
              <Clock size={12} />
              {new Date(hist.viewed_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="card-content" onClick={() => navigate(`/${hist.content_type}/${hist.content_id}`)}>
          <h3>{hist.title}</h3>
          <div className="card-meta">
            <span className="year">Watched {new Date(hist.viewed_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderFavoriteCard = (fav) => {
    return (
      <div
        className="media-card"
        key={fav.id}
      >
        <div className="card-image-wrapper" onClick={() => navigate(`/${fav.content_type}/${fav.content_id}`)}>
          {fav.poster_url ? (
            <img src={fav.poster_url} alt={fav.title} loading="lazy" />
          ) : (
            <div className="placeholder-image">No Image</div>
          )}
          <div className="card-overlay">
            <button className="card-action-btn play-btn">
              <Play size={20} fill="white" />
            </button>
            <button
              className="card-action-btn favorite-btn active"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite({}, true, fav.id);
              }}
            >
              <Heart size={18} fill="#f87171" />
            </button>
          </div>
          <div className="card-quick-info">
            <span className="info-badge">{fav.content_type}</span>
          </div>
        </div>
        <div className="card-content" onClick={() => navigate(`/${fav.content_type}/${fav.content_id}`)}>
          <h3>{fav.title}</h3>
          <div className="card-meta">
            <span className="year">{new Date(fav.added_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderFeaturedSection = () => {
    if (!featuredContent || showFavorites) return null;

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
            <button
              className="featured-btn primary"
              onClick={() => {
                const contentId = activeTab === 'anime' ? featuredContent.mal_id : featuredContent.id;
                navigate(`/${activeTab}/${contentId}`);
              }}
            >
              <Play size={20} fill="white" />
              Watch Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {!showFavorites && !showHistory && (
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
      )}

      {(showFavorites || showHistory) && (
        <nav className="content-tabs">
          <button
            className={`tab-button ${activeTab === 'movies' ? 'active' : ''}`}
            onClick={() => setActiveTab('movies')}
          >
            <Film size={20} />
            <span>Movies</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'tv' ? 'active' : ''}`}
            onClick={() => setActiveTab('tv')}
          >
            <Tv size={20} />
            <span>TV Shows</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'anime' ? 'active' : ''}`}
            onClick={() => setActiveTab('anime')}
          >
            <TrendingUp size={20} />
            <span>Anime</span>
          </button>
        </nav>
      )}

      {!showFavorites && !showHistory && renderFeaturedSection()}

      {!showFavorites && !showHistory && (
        <div className="controls-section">
          <div className="controls-row">
            <button
              className={`mood-toggle-button ${showMoodSelector ? 'active' : ''}`}
              onClick={() => setShowMoodSelector(!showMoodSelector)}
            >
              <Sparkles size={18} />
              Mood Recommendations
            </button>

            <button
              className={`filter-toggle-button ${activeFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(true)}
            >
              <SlidersHorizontal size={18} />
              Advanced Filters
              {activeFilters && <span className="filter-badge">Active</span>}
            </button>
          </div>

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
      )}

      {showMoodSelector && !showHistory && (
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

      {error && (
        <div className="error-banner">
          <div className="error-content">
            <p>{error}</p>
            {retrying && <div className="retry-spinner"></div>}
            {!retrying && (
              <button
                className="retry-button"
                onClick={() => loadTrending(activeTab)}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      <div className="content-section">
        <div className="section-header">
          <h2 className="section-title">
            {showFavorites ? 'My Favorites' :
              showHistory ? 'Watch History' :
                searchParams.get('search') ? `Search Results for "${searchParams.get('search')}"` :
                  activeFilters ? 'Filtered Results' :
                    selectedMood ? `${selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} Picks` :
                      selectedGenre ? selectedGenre :
                        `Trending ${activeTab === 'movies' ? 'Movies' : activeTab === 'tv' ? 'TV Shows' : 'Anime'}`}
          </h2>
          {showHistory && history.length > 0 && (
            <button className="clear-history-btn" onClick={() => setShowConfirmModal(true)}>
              <Trash2 size={18} />
              <span>Clear All History</span>
            </button>
          )}
        </div>

        {loading && !retrying ? (
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
            {showFavorites ? (
              favorites.filter(fav => fav.content_type === activeTab).length > 0 ? (
                favorites.filter(fav => fav.content_type === activeTab).map(fav => renderFavoriteCard(fav))
              ) : (
                <div className="empty-state">
                  <Heart size={64} color="#64748b" />
                  <p>No favorites yet</p>
                  <span>Start adding content to your favorites!</span>
                </div>
              )
            ) : showHistory ? (
              history.filter(hist => hist.content_type === activeTab).length > 0 ? (
                history.filter(hist => hist.content_type === activeTab).map(hist => renderHistoryCard(hist))
              ) : (
                <div className="empty-state">
                  <Clock size={64} color="#64748b" />
                  <p>No watch history yet</p>
                  <span>Start watching content to build your history!</span>
                </div>
              )
            ) : (
              content.length > 0 ? (
                activeTab === 'anime'
                  ? content.map((item, index) => renderCard(item, index, 'anime'))
                  : content.map((item, index) => renderCard(item, index, activeTab))
              ) : (
                !error && (
                  <div className="empty-state">
                    <Film size={64} color="#64748b" />
                    <p>No results found</p>
                    <span>Try adjusting your search or filters</span>
                  </div>
                )
              )
            )}
          </div>
        )}
      </div>

      {showFilters && (
        <FilterPanel
          contentType={activeTab}
          onApplyFilters={handleApplyFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={contextMenu.actions}
          item={contextMenu.item}
          onClose={() => setContextMenu(null)}
        />
      )}

      {copiedLink && (
        <div className="toast-notification">
          <Check size={16} />
          <span>Link copied to clipboard!</span>
        </div>
      )}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={clearAllHistory}
        title="Clear All History?"
        message="This will permanently delete your entire watch history. This action cannot be undone."
        confirmText="Yes, Clear All"
        cancelText="Cancel"
        isDanger={true}
      />
    </>
  );
}

export default HomePage;
