import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { FaPlus, FaEdit, FaTimes, FaFileInvoice, FaHashtag } from 'react-icons/fa';

const ModalMinistere = ({ isOpen, onClose, articleToEdit = null, onSuccess }) => {
  const [nom, setNom] = useState("");
  const [article_budgetaire, setArticleBudgetaire] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const token = GetTokenOrRedirect();

  // Initialiser les données si on édite un article
  useEffect(() => {
    if (articleToEdit) {
      setNom(articleToEdit.nom || "");
      setArticleBudgetaire(articleToEdit.article_budgetaire || "");
      setIsEditing(true);
    } else {
      setNom("");
      setArticleBudgetaire("");
      setIsEditing(false);
    }
    setErrors({});
  }, [articleToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!token) return;

    setLoading(true);

    try {
      if (isEditing && articleToEdit) {
        await axios.put(
          `${API_BASE_URL}/update-article/${articleToEdit.id}`,
          { nom, article_budgetaire },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: "Succès",
          text: "Service modifié avec succès",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await axios.post(
          `${API_BASE_URL}/create-article`,
          { nom, article_budgetaire },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: "Succès",
          text: "Service ajouté avec succès",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      }

      // Réinitialisation après soumission
      setNom("");
      setArticleBudgetaire("");
      setIsEditing(false);
      
      // Appeler le callback de succès
      if (onSuccess) {
        onSuccess();
      }
      
      // Fermer le modal
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
    setNom("");
    setArticleBudgetaire("");
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
              <FaFileInvoice className="mr-2" />
              {isEditing ? "Modifier le Service" : "Nouveau Service d'Assiette"}
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
              {/* Nom du service */}
              <div className="form-group mb-4">
                <label className="font-weight-bold mb-2">
                  Service d'assiette <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-light border-right-0">
                      <FaFileInvoice className="text-primary" />
                    </span>
                  </div>
                  <input
                    type="text"
                    className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                    placeholder="Nom du service"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    disabled={loading}
                  />
                  {errors.nom && (
                    <div className="invalid-feedback d-block mt-2">
                      {errors.nom[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Article budgétaire */}
              <div className="form-group mb-4">
                <label className="font-weight-bold mb-2">
                  Article budgétaire <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-light border-right-0">
                      <FaHashtag className="text-primary" />
                    </span>
                  </div>
                  <input
                    type="text"
                    className={`form-control ${errors.article_budgetaire ? 'is-invalid' : ''}`}
                    placeholder="Numéro d'article budgétaire"
                    value={article_budgetaire}
                    onChange={(e) => setArticleBudgetaire(e.target.value)}
                    disabled={loading}
                  />
                  {errors.article_budgetaire && (
                    <div className="invalid-feedback d-block mt-2">
                      {errors.article_budgetaire[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="row mt-4">
                <div className="col-6 px-1">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-3 font-weight-bold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                        Traitement...
                      </>
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

export default ModalMinistere;