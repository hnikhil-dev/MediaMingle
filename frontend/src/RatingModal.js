import React, { useState, useEffect } from 'react';
import { X, Star as StarIcon, Save } from 'lucide-react';
import StarRating from './StarRating';
import './RatingModal.css';

function RatingModal({ isOpen, onClose, onSubmit, contentData, existingRating = null }) {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [review, setReview] = useState(existingRating?.review || '');

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setReview(existingRating.review || '');
    }
  }, [existingRating]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Please select a rating!');
      return;
    }

    onSubmit({
      rating,
      review: review.trim()
    });
    
    // Reset form
    setRating(0);
    setReview('');
    onClose();
  };

  return (
    <div className="rating-modal-overlay" onClick={onClose}>
      <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
        <button className="rating-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="rating-modal-header">
          <StarIcon size={32} className="rating-modal-icon" />
          <h2>Rate This {contentData?.type || 'Content'}</h2>
        </div>

        {contentData?.poster && (
          <div className="rating-modal-poster">
            <img src={contentData.poster} alt={contentData.title} />
            <h3>{contentData.title}</h3>
          </div>
        )}

        <div className="rating-modal-body">
          <div className="rating-section">
            <label>Your Rating</label>
            <StarRating
              rating={rating}
              onRate={setRating}
              size={36}
              maxRating={10}
              showNumber={true}
            />
          </div>

          <div className="review-section">
            <label>Your Review (Optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this content..."
              maxLength={500}
              rows={4}
            />
            <span className="char-count">{review.length}/500</span>
          </div>
        </div>

        <div className="rating-modal-footer">
          <button className="rating-btn cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="rating-btn submit-btn" onClick={handleSubmit}>
            <Save size={18} />
            {existingRating ? 'Update Rating' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RatingModal;
