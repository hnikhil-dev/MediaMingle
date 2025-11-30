import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Film, Tv, TrendingUp, Music, BookOpen, Gamepad2, User, Heart, Clock, LogOut, Home } from 'lucide-react';
import { useAuth } from './AuthContext';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const mainNavItems = [
    { path: '/', icon: Home, label: 'Home', color: '#6366f1' },
    { path: '/movies', icon: Film, label: 'Movies', color: '#ef4444' },
    { path: '/tv', icon: Tv, label: 'TV Shows', color: '#10b981' },
    { path: '/anime', icon: TrendingUp, label: 'Anime', color: '#f59e0b' },
  ];

  const contentNavItems = [
    { path: '/music', icon: Music, label: 'Music', color: '#8b5cf6', badge: 'Soon' },
    { path: '/books', icon: BookOpen, label: 'Books', color: '#06b6d4', badge: 'Soon' },
    { path: '/games', icon: Gamepad2, label: 'Games', color: '#ec4899', badge: 'Soon' },
  ];

  const userNavItems = isAuthenticated ? [
    { path: '/profile', icon: User, label: 'Profile', color: '#64748b' },
    { path: '/favorites', icon: Heart, label: 'My Favorites', color: '#f87171' },
    { path: '/history', icon: Clock, label: 'Watch History', color: '#94a3b8' },
  ] : [];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    if (path === '/movies') {
      navigate('/?tab=movies');
    } else if (path === '/tv') {
      navigate('/?tab=tv');
    } else if (path === '/anime') {
      navigate('/?tab=anime');
    } else if (path === '/favorites') {
      navigate('/?favorites=true');
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        {/* Main Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <p className="sidebar-section-title">Browse</p>
            {mainNavItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  style={{ '--item-color': item.color }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Types */}
          <div className="sidebar-section">
            <p className="sidebar-section-title">Discover</p>
            {contentNavItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  style={{ '--item-color': item.color }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                </button>
              );
            })}
          </div>

          {/* User Section */}
          {isAuthenticated && (
            <div className="sidebar-section">
              <p className="sidebar-section-title">Library</p>
              {userNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.path)}
                    style={{ '--item-color': item.color }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* User Profile at Bottom */}
      <div className="sidebar-footer">
        {isAuthenticated ? (
          <>
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                <User size={20} />
              </div>
              <div className="sidebar-user-info">
                <p className="sidebar-user-name">{user?.username}</p>
                <p className="sidebar-user-email">{user?.email}</p>
              </div>
            </div>
            <button className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <button 
            className="sidebar-login-btn"
            onClick={() => navigate('/?auth=login')}
          >
            <User size={18} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
