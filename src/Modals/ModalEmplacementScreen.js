import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { FaPlus, FaEdit, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';

const ModalEmplacementScreen = ({ isOpen, onClose, emplacementToEdit = null, onSuccess }) => {
  const [nomEmplacement, setNomEmplacement] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const token = GetTokenOrRedirect();

  useEffect(() => {
    if (emplacementToEdit) {
      setNomEmplacement(emplacementToEdit.nom_emplacement);
      setIsEditing(true);
    } else {
      setNomEmplacement("");
      setIsEditing(false);
    }
    setErrors({});
  }, [emplacementToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!token) return;

    setLoading(true);

    try {
      if (isEditing && emplacementToEdit) {
        await axios.put(
          `${API_BASE_URL}/emplacements/${emplacementToEdit.id}`,
          { nom_emplacement: nomEmplacement },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire("Succès", "Emplacement modifié avec succès", "success");
      } else {
        await axios.post(
          `${API_BASE_URL}/emplacements`,
          { nom_emplacement: nomEmplacement },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire("Succès", "Emplacement ajouté avec succès", "success");
      }

      setNomEmplacement("");
      setIsEditing(false);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        Swal.fire("Erreur", "Erreur lors de l'enregistrement", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNomEmplacement("");
    setErrors({});
    setIsEditing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '500px' }}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white position-relative py-3 px-4">
            <h5 className="modal-title mb-0 font-weight-bold">
              <FaMapMarkerAlt className="mr-2" />
              {isEditing ? "Modifier l'Emplacement" : "Nouvel Emplacement"}
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-light position-absolute"
              onClick={handleCancel}
              style={{
                top: '12px',
                right: '15px',
                border: 'none',
                fontSize: '1.2rem',
                lineHeight: 1,
                padding: '0.25rem 0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
              }}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-4">
                <label className="font-weight-bold mb-2">
                  Nom de l'emplacement <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-light border-right-0">
                      <FaMapMarkerAlt className="text-primary" />
                    </span>
                  </div>
                  <input
                    type="text"
                    className={`form-control ${errors.nom_emplacement ? 'is-invalid' : ''}`}
                    placeholder="Nom de l'emplacement"
                    value={nomEmplacement}
                    onChange={(e) => setNomEmplacement(e.target.value)}
                    disabled={loading}
                  />
                  {errors.nom_emplacement && (
                    <div className="invalid-feedback d-block mt-2">
                      {errors.nom_emplacement[0]}
                    </div>
                  )}
                </div>
              </div>

              <div className="row mt-4">
                <div className="col-6 px-1">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-3 font-weight-bold"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                    ) : isEditing ? (
                      <>
                        <FaEdit className="mr-2" /> Modifier
                      </>
                    ) : (
                      <>
                        <FaPlus className="mr-2" /> Ajouter
                      </>
                    )}
                  </button>
                </div>
                <div className="col-6 px-1">
                  <button
                    type="button"
                    className="btn btn-secondary w-100 py-3 font-weight-bold"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <FaTimes className="mr-2" /> Annuler
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalEmplacementScreen;