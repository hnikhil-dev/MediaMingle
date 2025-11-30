import React from 'react';
import { BookOpen, Library, Bookmark, Star, TrendingUp, Search } from 'lucide-react';
import './PlaceholderPage.css';

function BooksPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-hero" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
        <BookOpen size={80} />
        <h1>Books Coming Soon</h1>
        <p>Discover your next great read</p>
      </div>

      <div className="placeholder-features">
        <div className="feature-card">
          <Library size={32} />
          <h3>Vast Library</h3>
          <p>Millions of books across all genres</p>
        </div>
        <div className="feature-card">
          <Bookmark size={32} />
          <h3>Reading Lists</h3>
          <p>Create and share your reading lists</p>
        </div>
        <div className="feature-card">
          <Star size={32} />
          <h3>Reviews & Ratings</h3>
          <p>Read and write book reviews</p>
        </div>
        <div className="feature-card">
          <TrendingUp size={32} />
          <h3>Bestsellers</h3>
          <p>Explore current bestselling books</p>
        </div>
        <div className="feature-card">
          <Search size={32} />
          <h3>Advanced Search</h3>
          <p>Find books by genre, author, year</p>
        </div>
        <div className="feature-card">
          <BookOpen size={32} />
          <h3>Recommendations</h3>
          <p>Get personalized book suggestions</p>
        </div>
      </div>

      <div className="placeholder-footer">
        <p>Your digital library is being curated!</p>
        <p className="placeholder-note">Stay tuned for updates 📚</p>
      </div>
    </div>
  );
}

export default BooksPage;
