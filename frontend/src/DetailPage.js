import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Star, Heart, Clock, Calendar, ArrowLeft, Users, Copy, Share2, ExternalLink, Check, RotateCw, User, Sparkles, Film } from 'lucide-react';
import { useAuth } from './AuthContext';
import ContextMenu from './ContextMenu';
import StarRating from './StarRating';
import RatingModal from './RatingModal';
import config from './config';
import axios from 'axios';
import './DetailPage.css';

function DetailPage({ contentType }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [trailer, setTrailer] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Rating System States
  const [userRating, setUserRating] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const filterIncompleteContent = (items, type) => {
    return items.filter(item => {
      if (type === 'anime') {
        const entry = item.entry || item;
        const hasImage = entry.images?.jpg?.image_url;
        const hasScore = entry.score && entry.score > 0;
        return hasImage && hasScore;
      } else {
        const hasPoster = item.poster_path;
        const hasRating = item.vote_average && item.vote_average > 0;
        return hasPoster && hasRating;
      }
    });
  };

  useEffect(() => {
    loadContentDetails();
  }, [id, contentType]);

  // Context menu listener
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();

      const actions = [
        {
          label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
          icon: Heart,
          onClick: () => {
            if (isAuthenticated) {
              toggleFavorite();
            } else {
              alert('Please sign in to use favorites');
            }
          },
          disabled: !isAuthenticated
        },
        {
          label: userRating ? 'Update Rating' : 'Rate This',
          icon: Star,
          onClick: () => {
            if (isAuthenticated) {
              setShowRatingModal(true);
            } else {
              alert('Please sign in to rate content');
            }
          },
          disabled: !isAuthenticated
        },
        { divider: true },
        {
          label: 'Copy Link',
          icon: Copy,
          onClick: () => {
            const url = window.location.href;
            navigator.clipboard.writeText(url);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
          },
          shortcut: 'Ctrl+C'
        },
        {
          label: 'Share',
          icon: Share2,
          onClick: () => {
            const url = window.location.href;
            const title = content?.title || content?.name;
            if (navigator.share) {
              navigator.share({ title: title, url: url }).catch(() => { });
            } else {
              navigator.clipboard.writeText(url);
              alert('Link copied to clipboard!');
            }
          }
        },
        {
          label: 'Open in New Tab',
          icon: ExternalLink,
          onClick: () => {
            window.open(window.location.href, '_blank');
          }
        },
        { divider: true },
        {
          label: 'Go Back',
          icon: ArrowLeft,
          onClick: () => navigate(-1),
          shortcut: 'Alt+←'
        },
        {
          label: 'Refresh',
          icon: RotateCw,
          onClick: () => window.location.reload(),
          shortcut: 'F5'
        }
      ];

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        actions: actions
      });
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isFavorite, isAuthenticated, content, navigate, userRating]);

  const loadContentDetails = async () => {
    setLoading(true);
    try {
      const urls = {
        movies: `${config.API_BASE_URL}/movie/${id}`,
        tv: `${config.API_BASE_URL}/tv/${id}`,
        anime: `${config.API_BASE_URL}/anime/${id}`
      };

      const response = await fetch(urls[contentType]);
      const data = await response.json();

      if (contentType === 'anime') {
        setContent(data.data);
        const trailerObj = data.data?.trailer;
        if (trailerObj?.youtube_id) {
          setTrailer({ key: trailerObj.youtube_id, site: 'YouTube' });
        }
      } else {
        setContent(data);
        const videos = data.videos?.results || [];
        const trailerVideo = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        setTrailer(trailerVideo);
      }

      if (isAuthenticated) {
        await addToHistory(data);
        await checkIfFavorite();
        await loadUserRating(); // ← NEW: Load user's rating
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading content:', error);
      setLoading(false);
    }
  };

  // ← NEW: Load User Rating Function
  const loadUserRating = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/ratings/${contentType}/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.has_rating) {
        setUserRating({
          rating: response.data.rating,
          review: response.data.review,
          rated_at: response.data.rated_at,
          rating_id: response.data.rating_id
        });
      }
    } catch (error) {
      console.error('Error loading user rating:', error);
    }
  };

  // ← NEW: Submit Rating Function
  const handleSubmitRating = async (ratingData) => {
    try {
      const payload = {
        content_type: contentType,
        content_id: String(id),
        title: content.title || content.name,
        poster_url: contentType === 'anime'
          ? content.images?.jpg?.image_url
          : `https://image.tmdb.org/t/p/w500${content.poster_path}`,
        rating: ratingData.rating,
        review: ratingData.review
      };

      await axios.post(`${config.API_BASE_URL}/ratings`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Reload user rating
      await loadUserRating();
      setShowRatingModal(false);
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

  const addToHistory = async (data) => {
    try {
      const historyData = {
        content_type: contentType,
        content_id: String(id),
        title: contentType === 'anime' ? data.data?.title : (data.title || data.name),
        poster_url: contentType === 'anime'
          ? data.data?.images?.jpg?.image_url
          : `https://image.tmdb.org/t/p/w300${data.poster_path}`
      };

      await axios.post(`${config.API_BASE_URL}/history`, historyData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/favorites/check/${contentType}/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setIsFavorite(response.data.is_favorite);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) return;

    try {
      if (isFavorite) {
        const response = await axios.get(
          `${config.API_BASE_URL}/favorites/check/${contentType}/${id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        await axios.delete(`${config.API_BASE_URL}/favorites/${response.data.favorite_id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setIsFavorite(false);
      } else {
        const favoriteData = {
          content_type: contentType,
          content_id: String(id),
          title: contentType === 'anime' ? content.title : (content.title || content.name),
          poster_url: contentType === 'anime'
            ? content.images?.jpg?.image_url
            : `https://image.tmdb.org/t/p/w300${content.poster_path}`
        };

        await axios.post(`${config.API_BASE_URL}/favorites`, favoriteData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="detail-page loading">
        <div className="spinner"></div>
        <p>Loading details...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="detail-page error">
        <p>Content not found</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const backdrop = contentType === 'anime'
    ? content.images?.jpg?.large_image_url
    : `https://image.tmdb.org/t/p/original${content.backdrop_path || content.poster_path}`;

  const poster = contentType === 'anime'
    ? content.images?.jpg?.image_url
    : `https://image.tmdb.org/t/p/w500${content.poster_path}`;

  const title = content.title || content.name;
  const releaseDate = contentType === 'anime'
    ? content.year
    : (content.release_date || content.first_air_date);

  const rating = contentType === 'anime'
    ? content.score
    : content.vote_average;

  const overview = contentType === 'anime'
    ? content.synopsis
    : content.overview;

  // Get genres
  const genres = contentType === 'anime'
    ? content.genres?.map(g => g.name) || []
    : content.genres?.map(g => g.name) || [];

  // Get cast
  const cast = contentType === 'anime'
    ? []
    : content.credits?.cast?.slice(0, 6) || [];

  // Get similar/recommendations with filtering
  const similar = contentType === 'anime'
    ? filterIncompleteContent(content.recommendations || [], 'anime')
    : filterIncompleteContent(content.similar?.results || [], contentType);

  const recommendations = contentType === 'anime'
    ? []
    : filterIncompleteContent(content.recommendations?.results || [], contentType);

  return (
    <div className="detail-page">
      {/* Hero Section */}
      <div className="detail-hero" style={{ backgroundImage: `url(${backdrop})` }}>
        <div className="detail-hero-overlay"></div>
        <div className="detail-hero-content">
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="detail-main">
            <div className="detail-poster">
              <img src={poster} alt={title} />
            </div>

            <div className="detail-info">
              <h1 className="detail-title">{title}</h1>

              <div className="detail-meta">
                {releaseDate && (
                  <span className="meta-item">
                    <Calendar size={16} />
                    {new Date(releaseDate).getFullYear()}
                  </span>
                )}
                {rating && (
                  <span className="meta-item rating">
                    <Star size={16} fill="#fbbf24" stroke="#fbbf24" />
                    {rating.toFixed(1)}
                  </span>
                )}
                {genres.length > 0 && (
                  <span className="meta-item">
                    {genres.slice(0, 3).join(', ')}
                  </span>
                )}
              </div>

              {overview && (
                <p className="detail-overview">{overview}</p>
              )}

              <div className="detail-actions">
                {trailer && (
                  <button
                    className="detail-action-btn primary"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank')}
                  >
                    <Play size={20} fill="white" />
                    Watch Trailer
                  </button>
                )}

                <button
                  className={`detail-action-btn ${isFavorite ? 'active' : ''}`}
                  onClick={() => {
                    if (isAuthenticated) {
                      toggleFavorite();
                    } else {
                      alert('Please sign in to use favorites');
                    }
                  }}
                >
                  <Heart size={20} fill={isFavorite ? '#f87171' : 'none'} />
                  {isFavorite ? 'Favorited' : 'Add to Favorites'}
                </button>

                {/* ← NEW: Rate Button */}
                <button
                  className={`detail-action-btn rate-btn ${userRating ? 'rated' : ''}`}
                  onClick={() => {
                    if (isAuthenticated) {
                      setShowRatingModal(true);
                    } else {
                      alert('Please sign in to rate content');
                    }
                  }}
                >
                  <Star size={20} fill={userRating ? '#fbbf24' : 'none'} />
                  {userRating ? 'Update Rating' : 'Rate This'}
                </button>
              </div>

              {/* ← NEW: Ratings Comparison Section */}
              {(rating || userRating) && (
                <div className="ratings-comparison">
                  {rating && (
                    <div className="rating-box">
                      <span className="rating-label">Community Rating</span>
                      <div className="rating-value">
                        <Star size={24} fill="#fbbf24" stroke="#f59e0b" />
                        <span>{rating.toFixed(1)}/10</span>
                      </div>
                    </div>
                  )}

                  {userRating && (
                    <div className="rating-box user-rating-box">
                      <span className="rating-label">Your Rating</span>
                      <div className="rating-value">
                        <Star size={24} fill="#8b5cf6" stroke="#7c3aed" />
                        <span>{userRating.rating.toFixed(1)}/10</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ← NEW: User Rating Display */}
              {userRating && (
                <div className="user-rating-section">
                  <h3>Your Rating</h3>
                  <div className="user-rating-display">
                    <StarRating
                      rating={userRating.rating}
                      size={28}
                      maxRating={10}
                      readonly={true}
                    />
                    {userRating.review && (
                      <p className="user-review">{userRating.review}</p>
                    )}
                    <button
                      className="edit-rating-btn"
                      onClick={() => setShowRatingModal(true)}
                    >
                      Edit Rating
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cast Section (Movies/TV only) */}
      {cast.length > 0 && (
        <div className="detail-section">
          <h2 className="section-title">
            <Users size={24} />
            Cast
          </h2>
          <div className="cast-grid">
            {cast.map((person) => (
              <div key={person.id} className="cast-card">
                {person.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                    alt={person.name}
                  />
                ) : (
                  <div className="cast-placeholder">
                    <User size={32} />
                  </div>
                )}
                <div className="cast-info">
                  <p className="cast-name">{person.name}</p>
                  <p className="cast-character">{person.character}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar Content */}
      {similar.length > 0 && (
        <div className="detail-section">
          <h2 className="section-title">
            <Sparkles size={24} />
            Similar {contentType === 'movies' ? 'Movies' : contentType === 'tv' ? 'TV Shows' : 'Anime'}
          </h2>
          <div className="similar-grid">
            {similar.slice(0, 6).map((item) => {
              const itemId = contentType === 'anime' ? (item.entry?.mal_id || item.mal_id) : item.id;
              const itemTitle = contentType === 'anime' ? (item.entry?.title || item.title) : (item.title || item.name);
              const itemPoster = contentType === 'anime'
                ? (item.entry?.images?.jpg?.image_url || item.images?.jpg?.image_url)
                : `https://image.tmdb.org/t/p/w300${item.poster_path}`;
              const itemRating = contentType === 'anime'
                ? (item.entry?.score || item.score)
                : item.vote_average;

              return (
                <div
                  key={itemId}
                  className="similar-card"
                  onClick={() => navigate(`/${contentType}/${itemId}`)}
                >
                  <img src={itemPoster} alt={itemTitle || 'Unknown Title'} />
                  <div className="similar-overlay">
                    <h4>{itemTitle || 'Unknown Title'}</h4>
                    {itemRating && (
                      <span className="similar-rating">
                        <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                        {itemRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations (Movies/TV only) */}
      {recommendations.length > 0 && (
        <div className="detail-section">
          <h2 className="section-title">
            <Film size={24} />
            Recommended
          </h2>
          <div className="similar-grid">
            {recommendations.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="similar-card"
                onClick={() => navigate(`/${contentType}/${item.id}`)}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                  alt={item.title || item.name}
                />
                <div className="similar-overlay">
                  <h4>{item.title || item.name}</h4>
                  {item.vote_average && (
                    <span className="similar-rating">
                      <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                      {item.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={contextMenu.actions}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* ← NEW: Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleSubmitRating}
        contentData={{
          title: title,
          poster: poster,
          type: contentType
        }}
        existingRating={userRating}
      />

      {/* Copied Link Notification */}
      {copiedLink && (
        <div className="copied-notification">
          <Check size={20} />
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
}

export default DetailPage;
