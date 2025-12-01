import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Calendar, Star, Film, Tv, TrendingUp, UserPlus, UserCheck } from 'lucide-react';
import axios from 'axios';
import config from './config';
import './PublicProfile.css';

function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
    checkFollowStatus();
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user profile
      const profileRes = await axios.get(`${config.API_BASE_URL}/users/${username}`);
      setProfile(profileRes.data);
      
      // Fetch user's ratings
      const ratingsRes = await axios.get(`${config.API_BASE_URL}/users/${username}/ratings`);
      setRatings(ratingsRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.response?.data?.detail || 'User not found');
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`${config.API_BASE_URL}/follow/check/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFollowing(response.data.is_following);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      if (isFollowing) {
        await axios.delete(`${config.API_BASE_URL}/follow/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(false);
        setProfile(prev => ({ ...prev, followers_count: prev.followers_count - 1 }));
      } else {
        await axios.post(`${config.API_BASE_URL}/follow/${username}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(true);
        setProfile(prev => ({ ...prev, followers_count: prev.followers_count + 1 }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert(error.response?.data?.detail || 'Failed to update follow status');
    }
  };

  const handleContentClick = (rating) => {
    navigate(`/detail/${rating.content_type}/${rating.content_id}`);
  };

  if (loading) {
    return (
      <div className="public-profile-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-profile-page">
        <div className="error-state">
          <User size={64} />
          <h3>User not found</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/home')} className="back-btn">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} />
          ) : (
            <User size={80} />
          )}
        </div>
        
        <div className="profile-info">
          <h1>@{profile.username}</h1>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          
          <div className="profile-meta">
            <span>
              <Calendar size={16} />
              Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        <button 
          onClick={handleFollowToggle}
          className={`follow-btn ${isFollowing ? 'following' : ''}`}
        >
          {isFollowing ? (
            <>
              <UserCheck size={20} />
              Following
            </>
          ) : (
            <>
              <UserPlus size={20} />
              Follow
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat-box">
          <Star size={24} />
          <div className="stat-content">
            <span className="stat-value">{profile.ratings_count}</span>
            <span className="stat-label">Ratings</span>
          </div>
        </div>
        
        <div className="stat-box">
          <User size={24} />
          <div className="stat-content">
            <span className="stat-value">{profile.followers_count}</span>
            <span className="stat-label">Followers</span>
          </div>
        </div>
        
        <div className="stat-box">
          <TrendingUp size={24} />
          <div className="stat-content">
            <span className="stat-value">{profile.following_count}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>
      </div>

      {/* Recent Ratings */}
      <div className="profile-ratings-section">
        <h2>
          <Star size={24} />
          Recent Ratings
        </h2>
        
        {ratings.length === 0 ? (
          <div className="empty-ratings">
            <Star size={48} />
            <p>No ratings yet</p>
          </div>
        ) : (
          <div className="ratings-grid">
            {ratings.map((rating) => (
              <div key={rating.id} className="rating-card" onClick={() => handleContentClick(rating)}>
                <div className="rating-card-poster">
                  {rating.poster_url ? (
                    <img src={rating.poster_url} alt={rating.title} />
                  ) : (
                    <div className="placeholder-poster">
                      {rating.content_type === 'movies' ? <Film size={48} /> : <Tv size={48} />}
                    </div>
                  )}
                  <div className="rating-badge">
                    <Star size={16} fill="#fbbf24" />
                    {rating.rating}
                  </div>
                </div>
                
                <div className="rating-card-content">
                  <h3>{rating.title}</h3>
                  {rating.review && (
                    <p className="rating-review">{rating.review}</p>
                  )}
                  <span className="rated-date">
                    {new Date(rating.rated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicProfile;
