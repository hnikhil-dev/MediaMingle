import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Star, Heart, Clock, Users, UserPlus, UserMinus, ArrowLeft, Settings } from 'lucide-react';
import { useAuth } from './AuthContext';
import StarRating from './StarRating';
import config from './config';
import axios from 'axios';
import './UserProfile.css';

function UserProfile() {
  const { username } = useParams();  // ✅ Changed from userId
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('ratings');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user && user.username === username;  // ✅ Compare usernames

  useEffect(() => {
    loadProfile();
    loadUserRatings();
    if (!isOwnProfile && isAuthenticated) {
      checkFollowStatus();
    }
  }, [username]);

  // ✅ NEW: Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/users/${username}`  // ✅ Fixed endpoint
      );
      setProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    setLoading(false);
  };

  const loadUserRatings = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/users/${username}/ratings?limit=20`  // ✅ Fixed
      );
      setRatings(response.data);
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/follow/check/${username}`,  // ✅ Fixed
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setIsFollowing(response.data.is_following);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to follow users');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await axios.delete(
          `${config.API_BASE_URL}/follow/${username}`,  // ✅ Fixed
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setIsFollowing(false);
        setProfile({ ...profile, followers_count: profile.followers_count - 1 });
      } else {
        await axios.post(
          `${config.API_BASE_URL}/follow/${username}`,  // ✅ Fixed
          {},
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setIsFollowing(true);
        setProfile({ ...profile, followers_count: profile.followers_count + 1 });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status');
    }
    setFollowLoading(false);
  };

  const handleContentClick = (contentType, contentId) => {
    navigate(`/detail/${contentType}/${contentId}`);
  };

  if (loading) {
    return (
      <div className="profile-page loading">
        <Clock size={48} />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page error">
        <User size={48} />
        <p>User not found</p>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="profile-banner">
          <div className="profile-avatar-large">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} />
            ) : (
              <User size={48} />
            )}
            {isOwnProfile && <div className="online-indicator" />}
          </div>
        </div>

        <div className="profile-info">
          <h1 className="profile-username">@{profile.username}</h1>
          <p className="profile-bio">{profile.bio || 'No bio yet'}</p>

          <div className="profile-stats">
            <div className="stat-item">
              <Star size={20} style={{ color: '#fbbf24' }} />
              <div>
                <div className="stat-value">{profile.ratings_count || 0}</div>
                <div className="stat-label">RATINGS</div>
              </div>
            </div>

            <div className="stat-item">
              <Heart size={20} style={{ color: '#f87171' }} />
              <div>
                <div className="stat-value">0</div>
                <div className="stat-label">FAVORITES</div>
              </div>
            </div>

            <div className="stat-item">
              <Users size={20} style={{ color: '#6366f1' }} />
              <div>
                <div className="stat-value">{profile.followers_count || 0}</div>
                <div className="stat-label">FOLLOWERS</div>
              </div>
            </div>

            <div className="stat-item">
              <Users size={20} style={{ color: '#8b5cf6' }} />
              <div>
                <div className="stat-value">{profile.following_count || 0}</div>
                <div className="stat-label">FOLLOWING</div>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <button
                className="profile-action-btn primary"
                onClick={() => navigate('/settings')}
              >
                <Settings size={20} />
                Edit Profile
              </button>
            ) : (
              <button
                className={`profile-action-btn ${isFollowing ? 'following' : 'primary'}`}
                onClick={toggleFollow}
                disabled={followLoading}
              >
                {isFollowing ? (
                  <>
                    <UserMinus size={20} />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('ratings')}
        >
          <Star size={18} />
          Ratings
        </button>
        <button
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <Heart size={18} />
          Favorites
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'ratings' && (
          <div className="ratings-grid">
            {ratings.length === 0 ? (
              <div className="empty-state">
                <Star size={48} />
                <p>No ratings yet</p>
              </div>
            ) : (
              ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="rating-card"
                  onClick={() => handleContentClick(rating.content_type, rating.content_id)}
                >
                  <img
                    src={
                      rating.poster_url?.startsWith('http')
                        ? rating.poster_url
                        : `https://image.tmdb.org/t/p/w500${rating.poster_url}`
                    }
                    alt={rating.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
                    }}
                  />
                  <div className="rating-card-info">
                    <h4>{rating.title}</h4>
                    <StarRating rating={rating.rating} readOnly size={20} />
                    {rating.review && (
                      <p className="rating-review">
                        {rating.review.length > 100
                          ? `${rating.review.slice(0, 100)}...`
                          : rating.review}
                      </p>
                    )}
                    <div className="rating-date">
                      <Clock size={14} />
                      {formatDate(rating.rated_at)}  {/* ✅ FIXED */}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="empty-state">
            <Heart size={48} />
            <p>Favorites feature coming soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
