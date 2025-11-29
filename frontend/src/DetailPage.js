import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Star, Heart, Clock, Calendar, ArrowLeft, Users } from 'lucide-react';
import { useAuth } from './AuthContext';
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

  useEffect(() => {
    loadContentDetails();
  }, [id, contentType]);

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
        // Find trailer from anime data
        const trailerObj = data.data?.trailer;
        if (trailerObj?.youtube_id) {
          setTrailer({ key: trailerObj.youtube_id, site: 'YouTube' });
        }
      } else {
        setContent(data);
        // Find trailer from videos
        const videos = data.videos?.results || [];
        const trailerVideo = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        setTrailer(trailerVideo);
      }

      // Add to history if logged in
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
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
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
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
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
        <div className="detail-loading">
          <div className="spinner"></div>
          <p>Loading details...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <p>Content not found</p>
          <button onClick={() => navigate('/')}>Go Back</button>
        </div>
      </div>
    );
  }

  const backdropUrl = contentType === 'anime' 
    ? content.images?.jpg?.large_image_url 
    : `https://image.tmdb.org/t/p/original${content.backdrop_path || content.poster_path}`;

  const posterUrl = contentType === 'anime'
    ? content.images?.jpg?.image_url
    : `https://image.tmdb.org/t/p/w500${content.poster_path}`;

  const title = contentType === 'anime' ? content.title : (content.title || content.name);
  const releaseDate = contentType === 'anime' 
    ? content.aired?.string 
    : (content.release_date || content.first_air_date);
  const rating = contentType === 'anime' ? content.score : content.vote_average;
  const overview = contentType === 'anime' ? content.synopsis : content.overview;
  const runtime = contentType === 'anime' 
    ? `${content.episodes || '?'} episodes` 
    : content.runtime ? `${content.runtime} min` : content.episode_run_time?.[0] ? `${content.episode_run_time[0]} min` : 'N/A';

  const cast = contentType === 'anime' 
    ? [] 
    : (content.credits?.cast || []).slice(0, 10);

  const similar = contentType === 'anime'
    ? []
    : (content.similar?.results || []).slice(0, 6);

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
            <img src={posterUrl} alt={title} />
          </div>
          
          <div className="detail-info">
            <h1 className="detail-title">{title}</h1>
            
            <div className="detail-meta">
              <span className="detail-rating">
                <Star size={18} fill="#fbbf24" color="#fbbf24" />
                {rating ? rating.toFixed(1) : 'N/A'}
              </span>
              <span className="detail-date">
                <Calendar size={16} />
                {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}
              </span>
              <span className="detail-runtime">
                <Clock size={16} />
                {runtime}
              </span>
            </div>

            <div className="detail-genres">
              {content.genres?.map(genre => (
                <span key={genre.id || genre.mal_id} className="genre-tag">
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="detail-overview">{overview}</p>

            <div className="detail-actions">
              {trailer && (
                <a 
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-btn primary"
                >
                  <Play size={20} fill="white" />
                  Watch Trailer
                </a>
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
          <h2 className="section-heading">
            <Users size={24} />
            Cast
          </h2>
          <div className="cast-grid">
            {cast.map(person => (
              <div key={person.id} className="cast-card">
                {person.profile_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} 
                    alt={person.name}
                  />
                ) : (
                  <div className="cast-placeholder">
                    <Users size={32} />
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

      {trailer && (
        <div className="detail-section">
          <h2 className="section-heading">Trailer</h2>
          <div className="trailer-container">
            <iframe
              width="100%"
              height="500"
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title="Trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <div className="detail-section">
          <h2 className="section-heading">Similar {contentType === 'movies' ? 'Movies' : 'Shows'}</h2>
          <div className="similar-grid">
            {similar.map(item => (
              <div 
                key={item.id} 
                className="similar-card"
                onClick={() => {
                  navigate(`/${contentType}/${item.id}`);
                  window.scrollTo(0, 0);
                }}
              >
                {item.poster_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} 
                    alt={item.title || item.name}
                  />
                ) : (
                  <div className="similar-placeholder">No Image</div>
                )}
                <p className="similar-title">{item.title || item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DetailPage;
