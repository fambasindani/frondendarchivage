// components/Button.jsx
import React from "react";

const Button = ({ onClick, type = "button", loading, children, className = "btn-primary", icon, block = true }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn ${className} ${block ? "btn-block" : ""}`}
      disabled={loading}
    >
      {icon && <i className={`${icon} mr-2`}></i>}
      {loading ? "Chargement..." : children}
    </button>
  );
};


export default Button;
