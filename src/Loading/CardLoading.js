// 📁 Composant/CardLoading.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

const CardLoading = ({ 
  message = "Chargement...", 
  height = "200px" 
}) => {
  return (
    <div 
      className="card border-0 shadow-sm"
      style={{ 
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="text-center">
        <div className="spinner-wrapper mb-3">
          <FaSpinner className="fa-spin text-primary" size={32} />
        </div>
        <p className="text-muted mb-0">{message}</p>
      </div>
    </div>
  );
};

export default CardLoading;