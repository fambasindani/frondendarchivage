import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { FaPlus, FaEdit, FaTimes, FaBuilding, FaAlignLeft, FaFolder } from 'react-icons/fa';

const ModalCentre = ({ isOpen, onClose, centreToEdit = null, ministeres = [], onSuccess }) => {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [ministereId, setMinistereId] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const token = GetTokenOrRedirect();

  // Initialiser les données si on édite un centre
  useEffect(() => {
    if (centreToEdit) {
      setNom(centreToEdit.nom || "");
      setDescription(centreToEdit.description || "");
      setMinistereId(String(centreToEdit.id_ministere || ""));
      setIsEditing(true);
    } else {
      setNom("");
      setDescription("");
      setMinistereId("");
      setIsEditing(false);
    }
    setErrors({});
  }, [centreToEdit]);

 const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Vérification du token
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Non authentifié',
            text: "Vous n'êtes pas authentifié. Veuillez vous reconnecter."
        });
        return;
    }

    // Vérification des permissions
    const userPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');
    
    if (isEditing && centreToEdit) {
        if (!userPermissions.includes('modifier_centre')) {
            Swal.fire({
                icon: 'error',
                title: 'Permission refusée',
                text: "Vous n'avez pas la permission 'modifier centre' pour modifier un centre"
            });
            return;
        }
    } else {
        if (!userPermissions.includes('creer_centre')) {
            Swal.fire({
                icon: 'error',
                title: 'Permission refusée',
                text: "Vous n'avez pas la permission 'créer centre' pour ajouter un centre"
            });
            return;
        }
    }

    // Validation du ministère
    if (!ministereId) {
        setErrors({ id_ministere: ["Veuillez sélectionner un ministère"] });
        return;
    }

    setLoading(true);

    try {
        const payload = {
            nom,
            description,
            id_ministere: parseInt(ministereId),
        };

        if (isEditing && centreToEdit) {
            // Route: PUT centre_ordonnancements/{id} avec middleware permission:modifier_centre
            await axios.put(
                `${API_BASE_URL}/centre_ordonnancements/${centreToEdit.id}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            Swal.fire({
                title: "Succès",
                text: "Centre modifié avec succès",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            // Route: POST centre_ordonnancements avec middleware permission:creer_centre
            await axios.post(
                `${API_BASE_URL}/centre_ordonnancements`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            Swal.fire({
                title: "Succès",
                text: "Centre ajouté avec succès",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });
        }

        // Réinitialisation après soumission
        setNom("");
        setDescription("");
        setMinistereId("");
        setIsEditing(false);
        
        // Appeler le callback de succès
        if (onSuccess) {
            onSuccess();
        }
        
        // Fermer le modal
        onClose();
        
    } catch (error) {
        console.error('Erreur:', error);
        
        // Gestion des erreurs
        if (error.response) {
            const { status, data } = error.response;
            
            // Erreur 403 - Permission denied (middleware Laravel)
            if (status === 403) {
                const permission = isEditing ? 'modifier_centre' : 'creer_centre';
                Swal.fire({
                    icon: 'error',
                    title: 'Action non autorisée',
                    text: data.message || `Vous n'avez pas la permission ${permission}`,
                    timer: 3000
                });
            }
            // Erreur 422 - Validation errors
            else if (status === 422 && data.errors) {
                setErrors(data.errors);
                
                // Afficher la première erreur
                const firstError = Object.values(data.errors)[0]?.[0];
                if (firstError) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Erreur de validation',
                        text: firstError,
                        timer: 3000
                    });
                }
            }
            // Erreur 401 - Non authentifié
            else if (status === 401) {
                Swal.fire({
                    icon: 'error',
                    title: 'Session expirée',
                    text: data.message || 'Votre session a expiré. Veuillez vous reconnecter.',
                    timer: 3000
                });
                
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            }
            // Autres erreurs
            else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: data.message || "Erreur lors de l'enregistrement",
                    timer: 3000
                });
            }
        } else if (error.request) {
            Swal.fire({
                icon: 'error',
                title: 'Erreur réseau',
                text: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
                timer: 3000
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: error.message || "Une erreur inattendue s'est produite",
                timer: 3000
            });
        }
    } finally {
        setLoading(false);
    }
};

  const handleCancel = () => {
    setNom("");
    setDescription("");
    setMinistereId("");
    setErrors({});
    setIsEditing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '550px' }}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white position-relative py-3 px-4">
            <h5 className="modal-title mb-0 font-weight-bold">
              <FaBuilding className="mr-2" />
              {isEditing ? "Modifier le Centre" : "Nouveau Centre d'Ordonnancement"}
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
              {/* Ministère */}
              <div className="form-group mb-4">
                <label className="font-weight-bold mb-2">
                  Service d'assiette <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-light border-right-0">
                      <FaFolder className="text-primary" />
                    </span>
                  </div>
                  <select
                    className={`form-control ${errors.id_ministere ? 'is-invalid' : ''}`}
                    value={ministereId}
                    onChange={(e) => setMinistereId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">-- Sélectionnez un service d'assiette --</option>
                    {ministeres.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.nom}
                      </option>
                    ))}
                  </select>
                  {errors.id_ministere && (
                    <div className="invalid-feedback d-block mt-2">
                      {errors.id_ministere[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Nom du centre */}
              <div className="form-group mb-4">
                <label className="font-weight-bold mb-2">
                  Nom du centre <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-light border-right-0">
                      <FaBuilding className="text-primary" />
                    </span>
                  </div>
                  <input
                    type="text"
                    className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                    placeholder="Nom du centre d'ordonnancement"
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

              {/* Description */}
              <div className="form-group mb-4">
                <label className="font-weight-bold mb-2">
                  Description
                </label>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-light border-right-0" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                      <FaAlignLeft className="text-primary" />
                    </span>
                  </div>
                  <textarea
                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                    placeholder="Description du centre (optionnelle)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                  {errors.description && (
                    <div className="invalid-feedback d-block mt-2">
                      {errors.description[0]}
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

export default ModalCentre;