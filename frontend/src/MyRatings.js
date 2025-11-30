import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Film, Tv, TrendingUp, Trash2, Edit, BarChart3, Award } from 'lucide-react';
import axios from 'axios';
import config from './config';
import { useAuth } from './AuthContext';
import StarRating from './StarRating';
import RatingModal from './RatingModal';
import ConfirmModal from './ConfirmModal';
import './MyRatings.css';

function MyRatings() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rated_at');
  const [editingRating, setEditingRating] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadRatings();
    loadStats();
  }, [isAuthenticated, navigate, activeFilter, sortBy]);

  const loadRatings = async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilter !== 'all') params.append('content_type', activeFilter);
      params.append('sort_by', sortBy);

      const response = await axios.get(`${config.API_BASE_URL}/ratings?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRatings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load ratings', error);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/ratings/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  const handleEditRating = (rating) => {
    setEditingRating(rating);
    setShowEditModal(true);
  };

  const handleUpdateRating = async (updatedData) => {
    try {
      await axios.put(
        `${config.API_BASE_URL}/ratings/${editingRating.id}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      loadRatings();
      loadStats();
    } catch (error) {
      console.error('Failed to update rating', error);
      alert('Failed to update rating. Please try again.');
    }
  };

  const handleDeleteRating = async () => {
    try {
      await axios.delete(`${config.API_BASE_URL}/ratings/${deleteId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRatings(ratings.filter(r => r.id !== deleteId));
      loadStats();
    } catch (error) {
      console.error('Failed to delete rating', error);
      alert('Failed to delete rating. Please try again.');
    }
  };

  const getContentIcon = (type) => {
    switch(type) {
      case 'movies': return <Film size={16} />;
      case 'tv': return <Tv size={16} />;
      case 'anime': return <TrendingUp size={16} />;
      default: return <Film size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="my-ratings-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-ratings-page">
      {/* Stats Section */}
      {stats && stats.total_ratings > 0 && (
        <div className="ratings-stats">
          <h2><BarChart3 size={28} /> Your Rating Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <Star className="stat-icon" size={32} />
              <div className="stat-content">
                <span className="stat-value">{stats.total_ratings}</span>
                <span className="stat-label">Total Ratings</span>
              </div>
            </div>
            <div className="stat-card">
              <Award className="stat-icon" size={32} />
              <div className="stat-content">
                <span className="stat-value">{stats.average_rating}</span>
                <span className="stat-label">Average Rating</span>
              </div>
            </div>
            {stats.highest_rated && (
              <div className="stat-card highlight">
                <img 
                  src={stats.highest_rated.poster_url} 
                  alt={stats.highest_rated.title}
                  onError={(e) => e.target.style.display = 'none'}
                />
                <div className="stat-content">
                  <span className="stat-value">{stats.highest_rated.rating} ⭐</span>
                  <span className="stat-label">Highest Rated</span>
                  <span className="stat-title">{stats.highest_rated.title}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="ratings-controls">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All ({ratings.length})
          </button>
          <button 
            className={`filter-tab ${activeFilter === 'movies' ? 'active' : ''}`}
            onClick={() => setActiveFilter('movies')}
          >
            <Film size={18} /> Movies
          </button>
          <button 
            className={`filter-tab ${activeFilter === 'tv' ? 'active' : ''}`}
            onClick={() => setActiveFilter('tv')}
          >
            <Tv size={18} /> TV Shows
          </button>
          <button 
            className={`filter-tab ${activeFilter === 'anime' ? 'active' : ''}`}
            onClick={() => setActiveFilter('anime')}
          >
            <TrendingUp size={18} /> Anime
          </button>
        </div>

        <select 
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="rated_at">Recently Rated</option>
          <option value="rating">Highest Rating</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>

      {/* Ratings Grid */}
      {ratings.length === 0 ? (
        <div className="empty-ratings">
          <Star size={64} />
          <h3>No Ratings Yet</h3>
          <p>Start rating content to see them here!</p>
          <button onClick={() => navigate('/')} className="browse-btn">
            Browse Content
          </button>
        </div>
      ) : (
        <div className="ratings-grid">
          {ratings.map(rating => (
            <div key={rating.id} className="rating-card">
              <div className="rating-card-poster" onClick={() => navigate(`/${rating.content_type}/${rating.content_id}`)}>
                {rating.poster_url ? (
                  <img src={rating.poster_url} alt={rating.title} loading="lazy" />
                ) : (
                  <div className="placeholder-poster">
                    {getContentIcon(rating.content_type)}
                  </div>
                )}
                <div className="rating-badge">
                  <Star size={16} fill="#fbbf24" stroke="#f59e0b" />
                  {rating.rating}
                </div>
              </div>

              <div className="rating-card-content">
                <h3 onClick={() => navigate(`/${rating.content_type}/${rating.content_id}`)}>
                  {rating.title}
                </h3>
                
                <div className="rating-display">
                  <StarRating 
                    rating={rating.rating}
                    size={20}
                    maxRating={10}
                    readonly={true}
                    showNumber={false}
                  />
                </div>

                {rating.review && (
                  <p className="rating-review">{rating.review}</p>
                )}

                <div className="rating-meta">
                  <span className="content-type-badge">
                    {getContentIcon(rating.content_type)}
                    {rating.content_type}
                  </span>
                  <span className="rated-date">
                    {new Date(rating.rated_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="rating-actions">
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => handleEditRating(rating)}
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => {
                      setDeleteId(rating.id);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <RatingModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingRating(null);
        }}
        onSubmit={handleUpdateRating}
        contentData={editingRating ? {
          title: editingRating.title,
          poster: editingRating.poster_url,
          type: editingRating.content_type
        } : null}
        existingRating={editingRating}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteId(null);
        }}
        onConfirm={handleDeleteRating}
        title="Delete Rating?"
        message="Are you sure you want to delete this rating? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}

export default MyRatings;
