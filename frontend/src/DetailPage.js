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
    if (isAuthenticated) {
      loadUserRating();
    }
  }, [id, contentType, isAuthenticated]);

  const loadUserRating = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/ratings/${contentType}/${id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.data.has_rating) {
        setUserRating(response.data);
      }
    } catch (error) {
      console.error('Failed to load rating', error);
    }
  };

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

      await axios.post(
        `${config.API_BASE_URL}/ratings`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      loadUserRating();
    } catch (error) {
      console.error('Failed to submit rating', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

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
              navigator.share({ title: title, url: url }).catch(() => {});
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
  }, [isFavorite, isAuthenticated, content, navigate]);

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
          setTrailer({
            key: trailerObj.youtube_id,
            site: 'YouTube'
          });
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
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading content:', error);
      setLoading(false);
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
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
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
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
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
    return <div className="detail-loading">Loading...</div>;
  }

  if (!content) {
    return <div className="detail-error">Content not found</div>;
  }

  const backdropUrl = contentType === 'anime'
    ? content.images?.jpg?.large_image_url
    : `https://image.tmdb.org/t/p/original${content.backdrop_path}`;

  const posterUrl = contentType === 'anime'
    ? content.images?.jpg?.image_url
    : `https://image.tmdb.org/t/p/w500${content.poster_path}`;

  const title = content.title || content.name;
  const overview = contentType === 'anime' ? content.synopsis : content.overview;
  const rating = contentType === 'anime' ? content.score : content.vote_average;

  const cast = contentType === 'anime'
    ? []
    : (content.credits?.cast || []).slice(0, 12);

  const similar = contentType === 'anime'
    ? []
    : filterIncompleteContent(content.similar?.results || [], contentType);

  return (
    <div className="detail-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="detail-hero" style={{ backgroundImage: `url(${backdropUrl})` }}>
        <div className="detail-hero-overlay"></div>
        <div className="detail-hero-content">
          <div className="detail-poster">
            {posterUrl ? (
              <img src={posterUrl} alt={title} />
            ) : (
              <div className="detail-poster-placeholder">
                <div className="poster-placeholder-content">
                  <Film className="poster-placeholder-icon" size={64} />
                  <h3 className="poster-placeholder-title">{title}</h3>
                  <span className="poster-placeholder-subtitle">No Poster Available</span>
                </div>
                <Sparkles className="poster-placeholder-decoration" size={32} />
              </div>
            )}
          </div>

          <div className="detail-info">
            <h1 className="detail-title">{title}</h1>

            <div className="detail-meta">
              {contentType === 'anime' && content.year && (
                <div className="detail-meta-item">
                  <Calendar size={18} />
                  {content.year}
                </div>
              )}
              {contentType !== 'anime' && content.release_date && (
                <div className="detail-meta-item">
                  <Calendar size={18} />
                  {new Date(content.release_date || content.first_air_date).getFullYear()}
                </div>
              )}
              {contentType === 'anime' && content.episodes && (
                <div className="detail-meta-item">
                  <Clock size={18} />
                  {content.episodes} Episodes
                </div>
              )}
              {contentType !== 'anime' && content.runtime && (
                <div className="detail-meta-item">
                  <Clock size={18} />
                  {content.runtime} min
                </div>
              )}
            </div>

            <p className="detail-overview">{overview}</p>

            <div className="detail-actions">
              {trailer && (
                <button
                  className="detail-btn primary"
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank')}
                >
                  <Play size={20} fill="white" />
                  Watch Trailer
                </button>
              )}
              <button
                className={`detail-btn secondary ${isFavorite ? 'active' : ''}`}
                onClick={toggleFavorite}
                disabled={!isAuthenticated}
              >
                <Heart size={20} fill={isFavorite ? '#f87171' : 'none'} />
                {isFavorite ? 'In Favorites' : 'Add to Favorites'}
              </button>
              <button 
                className="detail-btn rate-btn"
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

            {/* Ratings Comparison */}
            <div className="ratings-comparison">
              <div className="rating-box">
                <span className="rating-label">Community Rating</span>
                <div className="rating-value">
                  <Star size={24} fill="#fbbf24" stroke="#f59e0b" />
                  <span>{rating ? rating.toFixed(1) : 'N/A'} / 10</span>
                </div>
              </div>
              {userRating && (
                <div className="rating-box user-rating-box">
                  <span className="rating-label">Your Rating</span>
                  <div className="rating-value">
                    <Star size={24} fill="#8b5cf6" stroke="#7c3aed" />
                    <span>{userRating.rating.toFixed(1)} / 10</span>
                  </div>
                </div>
              )}
            </div>

            {/* User Rating Display */}
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
                    <p className="user-review">"{userRating.review}"</p>
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

      {cast.length > 0 && (
        <div className="detail-section">
          <h2 className="detail-section-title">
            <Users size={28} />
            Cast
          </h2>
          <div className="detail-cast-grid">
            {cast.map((person) => (
              <div key={person.id} className="cast-card">
                {person.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                    alt={person.name}
                  />
                ) : (
                  <div className="cast-placeholder">
                    <User size={40} />
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

      {similar.length > 0 && (
        <div className="detail-section">
          <h2 className="detail-section-title">
            <Sparkles size={28} />
            Similar {contentType === 'movies' ? 'Movies' : 'TV Shows'}
          </h2>
          <div className="detail-similar-grid">
            {similar.map((item) => (
              <div
                key={item.id}
                className="similar-card"
                onClick={() => navigate(`/${contentType}/${item.id}`)}
              >
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                    alt={item.title || item.name}
                  />
                ) : (
                  <div className="similar-placeholder">
                    <Film size={48} />
                    <span className="similar-placeholder-text">No Poster</span>
                  </div>
                )}
                <p className="similar-title">{item.title || item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={contextMenu.actions}
          onClose={() => setContextMenu(null)}
        />
      )}

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleSubmitRating}
        contentData={{
          title: title,
          poster: posterUrl,
          type: contentType
        }}
        existingRating={userRating}
      />
    </div>
  );
}

export default DetailPage;
