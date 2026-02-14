// 📁 Composant/TableLoading.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

const TableLoading = ({ 
  message = "Chargement des données...", 
  colSpan = 6 
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-5">
        <div className="spinner-wrapper mb-3">
          <FaSpinner className="fa-spin text-primary" size={32} />
        </div>
        <p className="text-muted mb-0">{message}</p>
      </td>
    </tr>
  );
};

export default TableLoading;