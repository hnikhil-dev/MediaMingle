import React from 'react';
import { Music, Headphones, Radio, Mic2, ListMusic, TrendingUp } from 'lucide-react';
import './PlaceholderPage.css';

function MusicPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-hero" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}>
        <Music size={80} />
        <h1>Music Coming Soon</h1>
        <p>Discover your next favorite song, artist, or album</p>
      </div>

      <div className="placeholder-features">
        <div className="feature-card">
          <Headphones size={32} />
          <h3>Personalized Playlists</h3>
          <p>Get recommendations based on your taste</p>
        </div>
        <div className="feature-card">
          <Radio size={32} />
          <h3>Live Radio</h3>
          <p>Stream live music from around the world</p>
        </div>
        <div className="feature-card">
          <Mic2 size={32} />
          <h3>Artist Profiles</h3>
          <p>Explore your favorite artists' discographies</p>
        </div>
        <div className="feature-card">
          <ListMusic size={32} />
          <h3>Top Charts</h3>
          <p>See what's trending globally</p>
        </div>
        <div className="feature-card">
          <TrendingUp size={32} />
          <h3>New Releases</h3>
          <p>Stay updated with latest tracks</p>
        </div>
        <div className="feature-card">
          <Music size={32} />
          <h3>Mood-Based</h3>
          <p>Find music that matches your mood</p>
        </div>
      </div>

      <div className="placeholder-footer">
        <p>We're working hard to bring you the best music discovery experience!</p>
        <p className="placeholder-note">Stay tuned for updates 🎵</p>
      </div>
    </div>
  );
}

export default MusicPage;
