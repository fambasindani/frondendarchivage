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
    
    if (isEditing && articleToEdit) {
        if (!userPermissions.includes('modifier_service_assiette')) {
            Swal.fire({
                icon: 'error',
                title: 'Permission refusée',
                text: "Vous n'avez pas la permission 'modifier service assiette' pour modifier un service"
            });
            return;
        }
    } else {
        if (!userPermissions.includes('creer_service_assiette')) {
            Swal.fire({
                icon: 'error',
                title: 'Permission refusée',
                text: "Vous n'avez pas la permission 'créer service assiette' pour ajouter un service"
            });
            return;
        }
    }

    // Validation des champs
    if (!nom || nom.trim() === '') {
        setErrors({ nom: ["Le nom est obligatoire"] });
        Swal.fire({
            icon: 'warning',
            title: 'Validation',
            text: "Le nom du service est obligatoire",
            timer: 2000
        });
        return;
    }

    if (!article_budgetaire || article_budgetaire.trim() === '') {
        setErrors({ article_budgetaire: ["L'article budgétaire est obligatoire"] });
        Swal.fire({
            icon: 'warning',
            title: 'Validation',
            text: "L'article budgétaire est obligatoire",
            timer: 2000
        });
        return;
    }

    setLoading(true);

    try {
        const payload = {
            nom: nom.trim(),
            article_budgetaire: article_budgetaire.trim()
        };

        if (isEditing && articleToEdit) {
            // Route: PUT /update-article/{id} avec middleware permission:modifier_service_assiette
            await axios.put(
                `${API_BASE_URL}/update-article/${articleToEdit.id}`,
                payload,
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
            // Route: POST /create-article avec middleware permission:creer_service_assiette
            await axios.post(
                `${API_BASE_URL}/create-article`,
                payload,
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
        console.error('Erreur:', error);
        
        // Gestion des erreurs
        if (error.response) {
            const { status, data } = error.response;
            
            // Erreur 403 - Permission denied (middleware Laravel)
            if (status === 403) {
                const permission = isEditing ? 'modifier_service_assiette' : 'creer_service_assiette';
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
                    localStorage.clear();
                    window.location.href = '/';
                }, 3000);
            }
            // Erreur 404 - Non trouvé
            else if (status === 404) {
                Swal.fire({
                    icon: 'error',
                    title: 'Non trouvé',
                    text: data.message || "Le service n'existe pas",
                    timer: 3000
                });
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