import React from 'react';
import { User, Settings, Bell, Shield, Mail } from 'lucide-react';
import { useAuth } from './AuthContext';
import './PlaceholderPage.css';

function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="placeholder-page">
        <div className="placeholder-hero" style={{ background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' }}>
          <User size={80} />
          <h1>Please Sign In</h1>
          <p>Sign in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="placeholder-page">
      <div className="placeholder-hero" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
        <div className="profile-avatar-large">
          <User size={60} />
        </div>
        <h1>{user?.username}</h1>
        <p>{user?.email}</p>
      </div>

      <div className="placeholder-features">
        <div className="feature-card">
          <Settings size={32} />
          <h3>Account Settings</h3>
          <p>Manage your account preferences</p>
        </div>
        <div className="feature-card">
          <Bell size={32} />
          <h3>Notifications</h3>
          <p>Configure notification settings</p>
        </div>
        <div className="feature-card">
          <Shield size={32} />
          <h3>Privacy & Security</h3>
          <p>Control your privacy settings</p>
        </div>
        <div className="feature-card">
          <Mail size={32} />
          <h3>Email Preferences</h3>
          <p>Manage email subscriptions</p>
        </div>
      </div>

      <div className="placeholder-footer">
        <p>Profile customization features coming soon!</p>
        <p className="placeholder-note">Member since: {new Date(user?.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default ProfilePage;
