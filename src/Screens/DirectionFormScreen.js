import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {  
  FaBuilding, 
  FaInfoCircle,
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";

const DirectionForm = () => {
  const { id } = useParams();
  const history = useHistory();
  const token = GetTokenOrRedirect();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    sigle: '',
    nom: ''
  });

  // 🔹 Obtenir les en-têtes d'authentification
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  };

  // 🔹 Charger la direction à modifier
  useEffect(() => {
    if (isEditMode && token) {
      loadDirection();
    }
  }, [isEditMode, token]);

  const loadDirection = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/departements/${id}`,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        const directionData = response.data.data;
        setFormData({
          sigle: directionData.sigle || '',
          nom: directionData.nom || ''
        });
      } else {
        throw new Error('Direction non trouvée');
      }
    } catch (error) {
      console.error('Erreur chargement direction:', error);
      
      if (error.response?.status === 401) {
        // GetTokenOrRedirect gère déjà la redirection
        return;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Direction non trouvée',
        text: 'Cette direction n\'existe pas ou a été supprimée.'
      }).then(() => {
        history.push('/gestion-utilisateurs/directions');
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Validation client simple
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.sigle.trim()) {
      newErrors.sigle = ['Le sigle est requis'];
    } else if (formData.sigle.trim().length > 10) {
      newErrors.sigle = ['Le sigle ne doit pas dépasser 10 caractères'];
    }
    
    if (!formData.nom.trim()) {
      newErrors.nom = ['Le nom est requis'];
    } else if (formData.nom.trim().length > 100) {
      newErrors.nom = ['Le nom ne doit pas dépasser 100 caractères'];
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Gérer la soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setErrors({});
    
    try {
      const dataToSend = {
        sigle: formData.sigle.trim().toUpperCase(),
        nom: formData.nom.trim()
      };

      if (isEditMode) {
        // 🔹 Mise à jour d'une direction existante
        const response = await axios.put(
          `${API_BASE_URL}/departements/${id}`,
          dataToSend,
          { headers: getAuthHeaders() }
        );
        
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Succès !',
            text: 'Direction mise à jour avec succès',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            history.push(`/gestion-utilisateurs/directions/${id}`);
          });
        }
      } else {
        // 🔹 Création d'une nouvelle direction
        const response = await axios.post(
          `${API_BASE_URL}/departements`,
          dataToSend,
          { headers: getAuthHeaders() }
        );
        
        if (response.data.success) {
          const newDirectionId = response.data.data.id;
          
          Swal.fire({
            icon: 'success',
            title: 'Succès !',
            text: 'Direction créée avec succès',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            history.push(`/gestion-utilisateurs/directions/${newDirectionId}`);
          });
        }
      }
    } catch (error) {
      console.error('Erreur soumission:', error);
      
      if (error.response?.status === 401) {
        // GetTokenOrRedirect gère déjà la redirection
        return;
      }
      
      if (error.response?.status === 422) {
        // 🔹 Erreurs de validation du serveur
        setErrors(error.response.data.errors || {});
        
        Swal.fire({
          icon: 'error',
          title: 'Erreur de validation',
          text: 'Veuillez corriger les erreurs dans le formulaire'
        });
      } else if (error.response?.status === 409) {
        Swal.fire({
          icon: 'error',
          title: 'Sigle déjà utilisé',
          text: 'Ce sigle est déjà utilisé par une autre direction'
        });
      } else if (error.response?.status === 404 && isEditMode) {
        Swal.fire({
          icon: 'error',
          title: 'Non trouvé',
          text: "La direction n'existe plus"
        });
        history.push('/gestion-utilisateurs/directions');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.response?.data?.message || error.message
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 🔹 Afficher les erreurs de champ
  const renderFieldError = (fieldName) => {
    if (!errors[fieldName]) return null;

    return (
      <div className="invalid-feedback d-block">
        <FaExclamationCircle className="mr-1" />
        {Array.isArray(errors[fieldName]) ? errors[fieldName][0] : errors[fieldName]}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="direction-form-page">
        <div className="text-center py-5">
          <FaSpinner className="fa-spin mb-3" size={32} />
          <p>Chargement de la direction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="direction-form-page">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h3 mb-0">
              <FaBuilding className="mr-2 text-primary" />
              {isEditMode ? 'Modifier la direction' : 'Créer une nouvelle direction'}
            </h2>
            <p className="text-muted mb-0">
              {isEditMode 
                ? 'Modifiez les informations de la direction' 
                : 'Définissez une nouvelle direction'}
            </p>
          </div>

          <Link 
            to={isEditMode ? `/gestion-utilisateurs/directions/${id}` : '/gestion-utilisateurs/directions'}
            className="btn btn-outline-secondary"
            disabled={submitting}
          >
            <FaArrowLeft className="mr-1" />
            {isEditMode ? 'Retour aux détails' : 'Retour à la liste'}
          </Link>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <h5 className="card-title mb-4">Informations de la direction</h5>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="font-weight-bold">
                          Sigle <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.sigle ? 'is-invalid' : ''}`}
                          value={formData.sigle}
                          onChange={(e) => {
                            setFormData({...formData, sigle: e.target.value});
                            // Supprimer l'erreur quand l'utilisateur commence à taper
                            if (errors.sigle) {
                              setErrors(prev => ({...prev, sigle: undefined}));
                            }
                          }}
                          required
                          placeholder="Ex: DRH, DSI, etc."
                          maxLength="10"
                          disabled={submitting}
                        />
                        {renderFieldError('sigle')}
                        <small className="text-muted">
                          Maximum 10 caractères (sera automatiquement converti en majuscules)
                        </small>
                      </div>
                    </div>
                    
                    <div className="col-md-8">
                      <div className="form-group">
                        <label className="font-weight-bold">
                          Nom complet <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                          value={formData.nom}
                          onChange={(e) => {
                            setFormData({...formData, nom: e.target.value});
                            // Supprimer l'erreur quand l'utilisateur commence à taper
                            if (errors.nom) {
                              setErrors(prev => ({...prev, nom: undefined}));
                            }
                          }}
                          required
                          placeholder="Ex: Direction des Ressources Humaines"
                          maxLength="100"
                          disabled={submitting}
                        />
                        {renderFieldError('nom')}
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-light border mt-4">
                    <small>
                      <FaInfoCircle className="mr-1" />
                      <strong>Conseil :</strong> Le sigle doit être unique et représentatif de la direction.
                      Il sera utilisé pour identifier rapidement la direction dans les interfaces.
                    </small>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex justify-content-end border-top pt-4">
                  <Link 
                    to={isEditMode ? `/gestion-utilisateurs/directions/${id}` : '/gestion-utilisateurs/directions'}
                    className="btn btn-outline-secondary mr-3"
                    disabled={submitting}
                  >
                    Annuler
                  </Link>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="fa-spin mr-2" />
                        {isEditMode ? 'Mise à jour...' : 'Création...'}
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        {isEditMode ? 'Mettre à jour' : 'Créer la direction'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .direction-form-page {
          padding: 20px;
          background: #f8f9fa;
          min-height: calc(100vh - 76px);
        }
        
        .card {
          border-radius: 10px;
          overflow: hidden;
        }
        
        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }
        
        @media (max-width: 768px) {
          .direction-form-page {
            padding: 15px;
          }
          
          .row {
            margin-left: -10px;
            margin-right: -10px;
          }
          
          .col-lg-8 {
            padding-left: 10px;
            padding-right: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default DirectionForm;