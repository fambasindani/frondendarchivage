// 📁 Composant/LoadingSpinner.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

const LoadingSpinner = ({ 
  message = "Chargement...", 
  subtitle = "Veuillez patienter",
  size = 48,
  color = "primary",
  fullScreen = false,
  className = ""
}) => {
  const content = (
    <div className={`text-center py-5 ${className}`}>
      <div className="spinner-wrapper mb-4">
        <FaSpinner className={`fa-spin text-${color}`} size={size} />
      </div>
      <h5 className="text-dark mb-2">{message}</h5>
      {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.9)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;