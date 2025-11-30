import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Star, Heart, Clock, Calendar, ArrowLeft, Users, Copy, Share2, ExternalLink, Check, RotateCw, User, Sparkles, Film } from 'lucide-react';
import { useAuth } from './AuthContext';
import ContextMenu from './ContextMenu';
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
      <div className="detail-page">
        <div className="detail-loading">Loading details...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="detail-page">
        <div className="detail-error">Content not found</div>
      </div>
    );
  }

  const title = contentType === 'anime' ? content.title : (content.title || content.name);
  const year = contentType === 'anime'
    ? content.year
    : (content.release_date || content.first_air_date)?.split('-')[0];
  const rating = contentType === 'anime' ? content.score : content.vote_average?.toFixed(1);
  const overview = contentType === 'anime' ? content.synopsis : content.overview;
  const backdrop = contentType === 'anime'
    ? content.images?.jpg?.large_image_url
    : (content.backdrop_path || content.poster_path)
      ? `https://image.tmdb.org/t/p/original${content.backdrop_path || content.poster_path}`
      : null;
  const poster = contentType === 'anime'
    ? content.images?.jpg?.image_url
    : `https://image.tmdb.org/t/p/w500${content.poster_path}`;

  const cast = contentType === 'anime'
    ? (content.characters?.slice(0, 6).map(char => ({
      name: char.character?.name,
      character: char.role,
      profile_path: char.character?.images?.jpg?.image_url
    })) || [])
    : (content.credits?.cast?.slice(0, 6) || []);

  const similar = contentType === 'anime'
    ? (content.recommendations?.slice(0, 6) || [])
    : (content.similar?.results?.slice(0, 6) || []);

  return (
    <div className="detail-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="detail-hero" style={{ backgroundImage: backdrop ? `url(${backdrop})` : 'none' }}>
        <div className="detail-hero-overlay"></div>
        <div className="detail-hero-content">
          <div className="detail-poster">
            {poster ? (
              <img src={poster} alt={title} onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }} />
            ) : null}
            <div className="detail-poster-placeholder" style={{ display: poster ? 'none' : 'flex' }}>
              <div className="poster-placeholder-content">
                <Film size={64} className="poster-placeholder-icon" />
                <h3 className="poster-placeholder-title">{title}</h3>
                <span className="poster-placeholder-subtitle">No Poster Available</span>
                <div className="poster-placeholder-decoration">
                  <Sparkles size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="detail-info">
            <h1 className="detail-title">{title}</h1>

            <div className="detail-meta">
              <span className="detail-meta-item">
                <Calendar size={16} />
                {year || 'TBA'}
              </span>
              <span className="detail-meta-item">
                <Star size={16} fill="#fbbf24" color="#fbbf24" />
                {rating || 'N/A'}
              </span>
              {contentType === 'anime' && content.episodes && (
                <span className="detail-meta-item">
                  <Clock size={16} />
                  {content.episodes} episodes
                </span>
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
                <Heart size={18} fill={isFavorite ? '#f87171' : 'none'} />
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {cast.length > 0 && (
        <div className="detail-section">
          <h2 className="detail-section-title">
            <Users size={24} />
            Cast
          </h2>
          <div className="detail-cast-grid">
            {cast.map((person, index) => (
              <div key={index} className="cast-card">
                {(person.profile_path || person.profile_path) ? (
                  <img
                    src={contentType === 'anime' ? person.profile_path : `https://image.tmdb.org/t/p/w185${person.profile_path}`}
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
            <Sparkles size={24} />
            You May Also Like
          </h2>
          <div className="detail-similar-grid">
            {similar.map((item, index) => {
              const itemId = contentType === 'anime' ? item.entry?.mal_id : item.id;
              const itemTitle = contentType === 'anime'
                ? (item.entry?.title || item.title)
                : (item.title || item.name);
              const itemPoster = contentType === 'anime'
                ? item.entry?.images?.jpg?.image_url
                : (item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null);

              return (
                <div
                  key={index}
                  className="similar-card"
                  onClick={() => navigate(`/${contentType}/${itemId}`)}
                >
                  {itemPoster ? (
                    <img src={itemPoster} alt={itemTitle} />
                  ) : (
                    <div className="similar-placeholder">
                      <Film size={48} />
                      <span className="similar-placeholder-text">{itemTitle}</span>
                    </div>
                  )}
                  <p className="similar-title">{itemTitle || 'Unknown Title'}</p>
                </div>
              );
            })}
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

      {copiedLink && (
        <div className="toast-notification">
          <Check size={16} />
          <span>Link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
}

export default DetailPage;
