import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Star, Heart, Clock, Users, UserPlus, UserMinus, ArrowLeft, Settings } from 'lucide-react';
import { useAuth } from './AuthContext';
import StarRating from './StarRating';
import config from './config';
import axios from 'axios';
import './UserProfile.css';

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('ratings');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user && user.id === parseInt(userId);

  useEffect(() => {
    loadProfile();
    loadUserRatings();
    loadUserFavorites();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/users/${userId}/profile`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setProfile(response.data);
      setIsFollowing(response.data.is_following);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    setLoading(false);
  };

  const loadUserRatings = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/users/${userId}/ratings?limit=20`
      );
      setRatings(response.data);
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const loadUserFavorites = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/users/${userId}/favorites?limit=20`
      );
      setFavorites(response.data);
    } catch (error) {
      console.error('Error loading favorites:', error);
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
          `${config.API_BASE_URL}/unfollow/${userId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setIsFollowing(false);
        setProfile({ ...profile, followers_count: profile.followers_count - 1 });
      } else {
        await axios.post(
          `${config.API_BASE_URL}/follow/${userId}`,
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

  if (loading) {
    return (
      <div className="profile-page loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page error">
        <User size={64} />
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* REMOVED: Top back button */}
      
      <div className="profile-header">
        {/* Banner with Avatar */}
        <div className="profile-banner">
          <div className="profile-avatar-large">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} />
            ) : (
              <User size={64} />
            )}
            <div className="online-indicator" />
          </div>
        </div>

        {/* Profile Info */}
        <div className="profile-info">
          <h1 className="profile-username">@{profile.username}</h1>
          <p className="profile-bio">{profile.bio || 'No bio yet'}</p>

          {/* Stats */}
          <div className="profile-stats">
            <div className="stat-item">
              <Star size={20} />
              <div>
                <div className="stat-value">{profile.ratings_count || 0}</div>
                <div className="stat-label">RATINGS</div>
              </div>
            </div>

            <div className="stat-item">
              <Heart size={20} />
              <div>
                <div className="stat-value">{profile.favorites_count || 0}</div>
                <div className="stat-label">FAVORITES</div>
              </div>
            </div>

            <div className="stat-item">
              <Users size={20} />
              <div>
                <div className="stat-value">{profile.followers_count || 0}</div>
                <div className="stat-label">FOLLOWERS</div>
              </div>
            </div>

            <div className="stat-item">
              <Users size={20} />
              <div>
                <div className="stat-value">{profile.following_count || 0}</div>
                <div className="stat-label">FOLLOWING</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="profile-actions">
            {isOwnProfile ? (
              <button className="profile-action-btn primary">
                <Settings size={18} />
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
                    <UserMinus size={18} />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      <div className="profile-content">
        {activeTab === 'ratings' && (
          <div className="ratings-grid">
            {ratings.length === 0 ? (
              <div className="empty-state">
                <Star size={64} />
                <p>No ratings yet</p>
              </div>
            ) : (
              ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="rating-card"
                  onClick={() => navigate(`/details/${rating.media_type}/${rating.content_id}`)}
                >
                  <img src={rating.poster_url} alt={rating.title} />
                  <div className="rating-card-info">
                    <h4>{rating.title}</h4>
                    <StarRating rating={rating.rating} readonly size={16} />
                    {rating.review && (
                      <p className="rating-review">
                        {rating.review.length > 100
                          ? `${rating.review.slice(0, 100)}...`
                          : rating.review}
                      </p>
                    )}
                    <div className="rating-date">
                      <Clock size={14} />
                      {new Date(rating.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="favorites-grid">
            {favorites.length === 0 ? (
              <div className="empty-state">
                <Heart size={64} />
                <p>No favorites yet</p>
              </div>
            ) : (
              favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="favorite-card"
                  onClick={() => navigate(`/details/${fav.media_type}/${fav.content_id}`)}
                >
                  <img src={fav.poster_url} alt={fav.title} />
                  <div className="favorite-overlay">
                    <h4>{fav.title}</h4>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating Back Button (Bottom-Right) */}
      <button className="floating-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={24} />
      </button>
    </div>
  );
}

export default UserProfile;
