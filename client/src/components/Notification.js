import React, { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import './Notification.css';

const Notification = ({ 
  type = 'success', 
  title, 
  message, 
  isVisible, 
  onClose, 
  autoClose = true, 
  duration = 4000 
}) => {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`notification-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`notification notification-${type}`}>
        <div className="notification-content">
          <div className="notification-icon">
            {getIcon()}
          </div>
          <div className="notification-text">
            {title && <div className="notification-title">{title}</div>}
            {message && <div className="notification-message">{message}</div>}
          </div>
          <button
            className="notification-close"
            onClick={onClose}
            title="Close notification"
          >
            <X size={16} />
          </button>
        </div>
        <div className="notification-progress">
          <div 
            className="notification-progress-bar" 
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Notification; 