import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { FaPlus, FaEdit, FaTimes, FaFolder } from 'react-icons/fa';

const ModalClasseurScreen = ({ isOpen, onClose, classeurToEdit = null, onSuccess }) => {
  const [nomClasseur, setNomClasseur] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const token = GetTokenOrRedirect();

  useEffect(() => {
    if (classeurToEdit) {
      setNomClasseur(classeurToEdit.nom_classeur);
      setIsEditing(true);
    } else {
      setNomClasseur("");
      setIsEditing(false);
    }
    setErrors({});
  }, [classeurToEdit]);




const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({});
  
  // Vérification du token
  if (!token) {
    Swal.fire({
      icon: 'error',
      title: 'Non authentifié',
      text: "Vous n'êtes pas authentifié. Veuillez vous reconnecter.",
      timer: 3000,
      timerProgressBar: true
    });
    return;
  }

  // Récupérer les permissions de l'utilisateur
  const userPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  
  // Vérification des permissions selon l'action
  if (isEditing && classeurToEdit) {
    if (!userPermissions.includes('modifier_classeur')) {
      Swal.fire({
        icon: 'error',
        title: 'Accès refusé',
        text: "Vous n'avez pas la permission 'modifier_classeur' pour modifier un classeur",
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }
  } else {
    if (!userPermissions.includes('creer_classeur')) {
      Swal.fire({
        icon: 'error',
        title: 'Accès refusé',
        text: "Vous n'avez pas la permission 'creer_classeur' pour ajouter un classeur",
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }
  }

  setLoading(true);

  try {
    if (isEditing && classeurToEdit) {
      // Route: PUT /classeurs/{id} avec middleware permission:modifier_classeur
      await axios.put(
        `${API_BASE_URL}/classeurs/${classeurToEdit.id}`,
        { nom_classeur: nomClasseur },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Classeur modifié avec succès',
        timer: 2000,
        timerProgressBar: true
      });
      
    } else {
      // Route: POST /classeurs avec middleware permission:creer_classeur
      await axios.post(
        `${API_BASE_URL}/classeurs`,
        { nom_classeur: nomClasseur },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Classeur ajouté avec succès',
        timer: 2000,
        timerProgressBar: true
      });
    }

    // Réinitialisation
    setNomClasseur("");
    setIsEditing(false);
    
    if (onSuccess) {
      onSuccess();
    }
    
    onClose();
    
  } catch (error) {
    console.error('Erreur:', error);
    
    // Gestion des erreurs
    if (error.response) {
      const { status, data } = error.response;
      
      // Erreur 403 - Permission denied (renvoyée par votre middleware)
      if (status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Permission refusée',
          text: data.message || "Vous n'avez pas la permission d'effectuer cette action",
          timer: 3000,
          timerProgressBar: true
        });
      }
      // Erreur 422 - Validation errors
      else if (status === 422 && data.errors) {
        setErrors(data.errors);
        
        // Afficher la première erreur de validation
        const firstError = Object.values(data.errors)[0]?.[0];
        if (firstError) {
          Swal.fire({
            icon: 'warning',
            title: 'Erreur de validation',
            text: firstError,
            timer: 3000,
            timerProgressBar: true
          });
        }
      }
      // Erreur 401 - Non authentifié
      else if (status === 401) {
        Swal.fire({
          icon: 'error',
          title: 'Session expirée',
          text: 'Votre session a expiré. Veuillez vous reconnecter.',
          timer: 3000,
          timerProgressBar: true
        });
        
        // Redirection vers login après 3 secondes
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
          timer: 3000,
          timerProgressBar: true
        });
      }
    } else if (error.request) {
      // Pas de réponse du serveur
      Swal.fire({
        icon: 'error',
        title: 'Erreur réseau',
        text: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
        timer: 3000,
        timerProgressBar: true
      });
    } else {
      // Autre erreur
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || "Une erreur inattendue s'est produite",
        timer: 3000,
        timerProgressBar: true
      });
    }
  } finally {
    setLoading(false);
  }
};

  const handleCancel = () => {
    setNomClasseur("");
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
              <FaFolder className="mr-2" />
              {isEditing ? "Modifier le Classeur" : "Nouveau Classeur"}
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
                  Nom du classeur <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-light border-right-0">
                      <FaFolder className="text-primary" />
                    </span>
                  </div>
                  <input
                    type="text"
                    className={`form-control ${errors.nom_classeur ? 'is-invalid' : ''}`}
                    placeholder="Nom du classeur"
                    value={nomClasseur}
                    onChange={(e) => setNomClasseur(e.target.value)}
                    disabled={loading}
                  />
                  {errors.nom_classeur && (
                    <div className="invalid-feedback d-block mt-2">
                      {errors.nom_classeur[0]}
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

export default ModalClasseurScreen;