import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ContextMenu from './ContextMenu';
import { Film, Tv, TrendingUp, Music, BookOpen, Gamepad2, User, Heart, Clock, Star, LogOut, Home, Copy, ExternalLink } from 'lucide-react';
import { useAuth } from './AuthContext';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contextMenu, setContextMenu] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
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
    { path: '/my-ratings', icon: Star, label: 'My Ratings', color: '#fbbf24' },
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
    } else if (path === '/history') {
      navigate('/?history=true');
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleItemContextMenu = (e, item) => {
    e.preventDefault();
    const actions = [
      {
        label: 'Open in New Tab',
        icon: ExternalLink,
        onClick: () => {
          const fullPath = `${window.location.origin}${item.path}`;
          window.open(fullPath, '_blank');
        }
      },
      {
        label: 'Copy Link',
        icon: Copy,
        onClick: () => {
          const fullPath = `${window.location.origin}${item.path}`;
          navigator.clipboard.writeText(fullPath);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        }
      }
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      actions: actions,
      item: item
    });
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-logo">MediaMingle</h2>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <div className="sidebar-section">
              <span className="sidebar-section-title">BROWSE</span>
              {mainNavItems.map((item) => (
                <div
                  key={item.path}
                  className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  onContextMenu={(e) => handleItemContextMenu(e, item)}
                  style={{ '--item-color': item.color }}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="sidebar-section">
              <span className="sidebar-section-title">DISCOVER</span>
              {contentNavItems.map((item) => (
                <div
                  key={item.path}
                  className="sidebar-item disabled"
                  style={{ '--item-color': item.color }}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                </div>
              ))}
            </div>

            {isAuthenticated && (
              <div className="sidebar-section">
                <span className="sidebar-section-title">LIBRARY</span>
                {userNavItems.map((item) => (
                  <div
                    key={item.path}
                    className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.path)}
                    onContextMenu={(e) => handleItemContextMenu(e, item)}
                    style={{ '--item-color': item.color }}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </nav>
        </div>

        {isAuthenticated && (
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                <User size={20} />
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.username}</span>
                <span className="sidebar-user-email">{user?.email}</span>
              </div>
            </div>
            <button className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={contextMenu.actions}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

export default Sidebar;
