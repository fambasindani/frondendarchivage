// components/Input.jsx
import React from "react";

const Input = ({
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  icon,
  error
}) => {
  return (
    <div className="input-group mb-3">
      <input
        type={type}
        name={name}
        className={`form-control ${error ? "is-invalid" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {icon && (
        <div className="input-group-append">
          <div className="input-group-text">
            <span className={icon}></span>
          </div>
        </div>
      )}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

export default Input;
