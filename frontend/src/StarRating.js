import React, { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

function StarRating({ rating, onRate, maxRating = 10, size = 24, readonly = false, showNumber = true }) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const handleClick = (value) => {
    if (!readonly && onRate) {
      onRate(value);
    }
  };

  const renderStars = () => {
    const stars = [];
    const numStars = 5;
    const starsPerPoint = maxRating / numStars; // 10/5 = 2 points per star
    
    for (let i = 1; i <= numStars; i++) {
      const starValue = i * starsPerPoint;
      const fillPercentage = (() => {
        const currentRating = hoverRating || rating || 0;
        if (currentRating >= starValue) return 100;
        if (currentRating > starValue - starsPerPoint) {
          return ((currentRating - (starValue - starsPerPoint)) / starsPerPoint) * 100;
        }
        return 0;
      })();

      stars.push(
        <div
          key={i}
          className={`star-wrapper ${readonly ? 'readonly' : 'interactive'}`}
          onMouseEnter={() => !readonly && setHoverRating(starValue)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          onClick={() => handleClick(starValue)}
        >
          <Star
            size={size}
            className="star-bg"
            fill="none"
            stroke="#475569"
          />
          <div className="star-fill" style={{ width: `${fillPercentage}%` }}>
            <Star
              size={size}
              fill="#fbbf24"
              stroke="#f59e0b"
              className="star-filled"
            />
          </div>
        </div>
      );
    }
    return stars;
  };

  const displayRating = hoverRating || rating || 0;

  return (
    <div className="star-rating">
      <div className="stars-container">
        {renderStars()}
      </div>
      {showNumber && (
        <span className="rating-number">
          {displayRating.toFixed(1)}/{maxRating}
        </span>
      )}
    </div>
  );
}

export default StarRating;
