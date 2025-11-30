import React from 'react';
import { Gamepad2, Trophy, Users, Star, TrendingUp, Zap } from 'lucide-react';
import './PlaceholderPage.css';

function GamesPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-hero" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
        <Gamepad2 size={80} />
        <h1>Games Coming Soon</h1>
        <p>Discover your next gaming adventure</p>
      </div>

      <div className="placeholder-features">
        <div className="feature-card">
          <Trophy size={32} />
          <h3>Top Rated</h3>
          <p>Explore highest-rated games</p>
        </div>
        <div className="feature-card">
          <Users size={32} />
          <h3>Multiplayer</h3>
          <p>Find games to play with friends</p>
        </div>
        <div className="feature-card">
          <Star size={32} />
          <h3>Reviews</h3>
          <p>Read community reviews and ratings</p>
        </div>
        <div className="feature-card">
          <TrendingUp size={32} />
          <h3>New Releases</h3>
          <p>Stay updated with latest games</p>
        </div>
        <div className="feature-card">
          <Zap size={32} />
          <h3>Quick Match</h3>
          <p>Find games based on your mood</p>
        </div>
        <div className="feature-card">
          <Gamepad2 size={32} />
          <h3>All Platforms</h3>
          <p>PC, Console, Mobile, and more</p>
        </div>
      </div>

      <div className="placeholder-footer">
        <p>Level up your gaming discovery experience!</p>
        <p className="placeholder-note">Stay tuned for updates 🎮</p>
      </div>
    </div>
  );
}

export default GamesPage;
