import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search-input-header')?.focus();
      }

      // Alt + Left Arrow: Go back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(-1);
      }

      // Alt + Right Arrow: Go forward
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        navigate(1);
      }

      // F5: Refresh (let default behavior)
      // Already handled by browser

      // Escape: Close modals/menus
      if (e.key === 'Escape') {
        document.querySelectorAll('.context-menu').forEach(menu => {
          menu.style.display = 'none';
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);
};
