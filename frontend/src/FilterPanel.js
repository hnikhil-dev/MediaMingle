import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, Star, Calendar, Globe, ArrowUpDown } from 'lucide-react';
import './FilterPanel.css';

function FilterPanel({ contentType, onApplyFilters, onClose }) {
  const [yearRange, setYearRange] = useState([1990, 2025]);
  const [minRating, setMinRating] = useState(0);
  const [language, setLanguage] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [season, setSeason] = useState('');
  
  const languages = [
    { code: '', label: 'All Languages' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'hi', label: 'Hindi' },
    { code: 'zh', label: 'Chinese' },
  ];

  const sortOptions = {
    movies: [
      { value: 'popularity.desc', label: 'Most Popular' },
      { value: 'vote_average.desc', label: 'Highest Rated' },
      { value: 'primary_release_date.desc', label: 'Newest First' },
      { value: 'primary_release_date.asc', label: 'Oldest First' },
      { value: 'title.asc', label: 'Title (A-Z)' },
    ],
    tv: [
      { value: 'popularity.desc', label: 'Most Popular' },
      { value: 'vote_average.desc', label: 'Highest Rated' },
      { value: 'first_air_date.desc', label: 'Newest First' },
      { value: 'first_air_date.asc', label: 'Oldest First' },
      { value: 'name.asc', label: 'Title (A-Z)' },
    ],
    anime: [
      { value: 'POPULARITY_DESC', label: 'Most Popular' },
      { value: 'SCORE_DESC', label: 'Highest Rated' },
      { value: 'START_DATE_DESC', label: 'Newest First' },
      { value: 'START_DATE', label: 'Oldest First' },
      { value: 'TITLE_ROMAJI', label: 'Title (A-Z)' },
    ]
  };

  const movieGenres = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Sci-Fi' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
  ];

  const tvGenres = [
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 10762, name: 'Kids' },
    { id: 9648, name: 'Mystery' },
    { id: 10763, name: 'News' },
    { id: 10764, name: 'Reality' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 10766, name: 'Soap' },
    { id: 10767, name: 'Talk' },
    { id: 10768, name: 'War & Politics' },
    { id: 37, name: 'Western' },
  ];

  const animeGenres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy',
    'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
    'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
  ];

  const animeSeasons = [
    { value: '', label: 'All Seasons' },
    { value: 'WINTER', label: 'Winter' },
    { value: 'SPRING', label: 'Spring' },
    { value: 'SUMMER', label: 'Summer' },
    { value: 'FALL', label: 'Fall' },
  ];

  const genres = contentType === 'movies' ? movieGenres : contentType === 'tv' ? tvGenres : animeGenres;

  const toggleGenre = (genre) => {
    if (contentType === 'anime') {
      setSelectedGenres(prev => 
        prev.includes(genre) 
          ? prev.filter(g => g !== genre)
          : [...prev, genre]
      );
    } else {
      const genreId = genre.id;
      setSelectedGenres(prev => 
        prev.includes(genreId) 
          ? prev.filter(id => id !== genreId)
          : [...prev, genreId]
      );
    }
  };

  const handleApply = () => {
    const filters = {
      yearMin: yearRange[0],
      yearMax: yearRange[1],
      ratingMin: minRating,
      language: language,
      sortBy: sortBy,
      genres: contentType === 'anime' ? selectedGenres : selectedGenres.join(','),
      season: season
    };
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setYearRange([1990, 2025]);
    setMinRating(0);
    setLanguage('');
    setSortBy(contentType === 'anime' ? 'POPULARITY_DESC' : 'popularity.desc');
    setSelectedGenres([]);
    setSeason('');
  };

  return (
    <div className="filter-overlay" onClick={onClose}>
      <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filter-header">
          <div className="filter-title">
            <SlidersHorizontal size={24} />
            <h2>Advanced Filters</h2>
          </div>
          <button className="filter-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="filter-content">
          {/* Year Range */}
          <div className="filter-section">
            <label className="filter-label">
              <Calendar size={18} />
              Year Range: {yearRange[0]} - {yearRange[1]}
            </label>
            <div className="range-inputs">
              <input
                type="range"
                min="1960"
                max="2025"
                value={yearRange[0]}
                onChange={(e) => setYearRange([parseInt(e.target.value), yearRange[1]])}
                className="range-slider"
              />
              <input
                type="range"
                min="1960"
                max="2025"
                value={yearRange[1]}
                onChange={(e) => setYearRange([yearRange[0], parseInt(e.target.value)])}
                className="range-slider"
              />
            </div>
            <div className="range-values">
              <span>{yearRange[0]}</span>
              <span>{yearRange[1]}</span>
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="filter-section">
            <label className="filter-label">
              <Star size={18} />
              Minimum Rating: {minRating}/10
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="range-slider"
            />
            <div className="rating-display">
              {[...Array(10)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < minRating ? '#fbbf24' : 'none'}
                  color={i < minRating ? '#fbbf24' : '#64748b'}
                />
              ))}
            </div>
          </div>

          {/* Language */}
          {contentType !== 'anime' && (
            <div className="filter-section">
              <label className="filter-label">
                <Globe size={18} />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="filter-select"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Anime Season */}
          {contentType === 'anime' && (
            <div className="filter-section">
              <label className="filter-label">
                <Calendar size={18} />
                Season
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="filter-select"
              >
                {animeSeasons.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className="filter-section">
            <label className="filter-label">
              <ArrowUpDown size={18} />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              {sortOptions[contentType]?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Genres */}
          <div className="filter-section">
            <label className="filter-label">
              <SlidersHorizontal size={18} />
              Genres
            </label>
            <div className="genre-grid">
              {contentType === 'anime' ? (
                animeGenres.map(genre => (
                  <button
                    key={genre}
                    className={`genre-chip ${selectedGenres.includes(genre) ? 'active' : ''}`}
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </button>
                ))
              ) : (
                genres.map(genre => (
                  <button
                    key={genre.id}
                    className={`genre-chip ${selectedGenres.includes(genre.id) ? 'active' : ''}`}
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="filter-actions">
          <button className="filter-btn secondary" onClick={handleReset}>
            Reset All
          </button>
          <button className="filter-btn primary" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;
