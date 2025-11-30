import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmModal.css';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="confirm-modal-icon">
          <AlertTriangle size={48} />
        </div>
        
        <h2 className="confirm-modal-title">{title}</h2>
        <p className="confirm-modal-message">{message}</p>
        
        <div className="confirm-modal-actions">
          <button 
            className="confirm-modal-btn cancel-btn" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-modal-btn confirm-btn ${isDanger ? 'danger' : ''}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
