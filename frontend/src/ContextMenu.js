import React, { useEffect, useRef } from 'react';
import { Heart, Eye, Copy, Share2, ExternalLink, ArrowLeft, RotateCw, Search, Check, HeartOff } from 'lucide-react';
import './ContextMenu.css';

function ContextMenu({ x, y, onClose, actions, item }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('contextmenu', onClose);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('contextmenu', onClose);
    };
  }, [onClose]);

  const adjustPosition = () => {
    if (!menuRef.current) return { x, y };

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuRect.width > viewportWidth) {
      adjustedX = viewportWidth - menuRect.width - 10;
    }

    if (y + menuRect.height > viewportHeight) {
      adjustedY = viewportHeight - menuRect.height - 10;
    }

    return { x: adjustedX, y: adjustedY };
  };

  const position = adjustPosition();

  const handleAction = (action) => {
    if (action.onClick) {
      action.onClick(item);
    }
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      className="context-menu" 
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px` 
      }}
    >
      {actions.map((action, index) => {
        if (action.divider) {
          return <div key={index} className="context-menu-divider" />;
        }

        const Icon = action.icon;
        
        return (
          <button
            key={index}
            className={`context-menu-item ${action.danger ? 'danger' : ''} ${action.disabled ? 'disabled' : ''}`}
            onClick={() => !action.disabled && handleAction(action)}
            disabled={action.disabled}
          >
            <Icon size={16} />
            <span>{action.label}</span>
            {action.shortcut && <span className="context-menu-shortcut">{action.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default ContextMenu;
