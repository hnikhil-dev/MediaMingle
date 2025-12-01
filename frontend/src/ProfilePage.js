import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to UserProfile page
    if (isAuthenticated && user?.id) {
      navigate(`/user/${user.id}`, { replace: true });
    } else {
      // If not authenticated, redirect to login
      navigate('/?auth=login', { replace: true });
    }
  }, [user, isAuthenticated, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      color: '#cbd5e1',
      gap: '20px'
    }}>
      <div className="spinner"></div>
      <p>Redirecting to your profile...</p>
    </div>
  );
}

export default ProfilePage;
