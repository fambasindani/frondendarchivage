// components/Droplist.jsx
import React from "react";

const Droplist = ({ 
  name, 
  value, 
  onChange, 
  options = [], 
  placeholder = "-- Sélectionnez --", 
  error 
}) => {
  return (
    <div className="mb-3">
      <select
        name={name}
        className={`form-control ${error ? "is-invalid" : ""}`}
        value={value}
        onChange={onChange}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.nom || opt.nom_emplacement || opt.nom_classeur ||opt.nom_raison_sociale ||  "Option"}
          </option>
        ))}
      </select>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

export default Droplist;
