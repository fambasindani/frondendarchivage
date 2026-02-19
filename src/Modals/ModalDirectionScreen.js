import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { FaPlus, FaEdit, FaTimes, FaBuilding, FaArrowLeft } from 'react-icons/fa';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';

const ModalDirectionScreen = ({ isOpen, onClose, directionToEdit = null, onSuccess }) => {
    const history = useHistory();
  const [nom, setNom] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const token = GetTokenOrRedirect();

  // Initialiser les données si on édite une direction
  useEffect(() => {
    if (directionToEdit) {
      setNom(directionToEdit.nom);
      setIsEditing(true);
    } else {
      setNom("");
      setIsEditing(false);
    }
    setErrors({});
  }, [directionToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!token) return;

    setLoading(true);

    try {
      if (isEditing && directionToEdit) {
        await axios.put(
          `${API_BASE_URL}/directions/${directionToEdit.id}`,
          { nom },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: "Succès",
          text: "Direction modifiée avec succès",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await axios.post(
          `${API_BASE_URL}/directions`,
          { nom },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: "Succès",
          text: "Direction ajoutée avec succès",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      }

      // Réinitialisation après soumission
      setNom("");
      setIsEditing(false);
      
      // Appeler le callback de succès
      if (onSuccess) {
        onSuccess();
      }
      
      // Fermer le modal
      onClose();
    } catch (error) {
      console.error('Erreur complète:', error);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        // Gestion spécifique selon le code HTTP
        switch (status) {
          case 403:
            // Permission refusée
            const userPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');
            const permissionlist = JSON.parse(localStorage.getItem('permissionlist') || '[]');
           // const permissionsList  = userPermissions?.details?.map(p => p.description);
              alert(userPermissions[1])
             //console.log(descriptions);

            
            Swal.fire({
              icon: 'error',
              title: '⛔ Action non autorisée',
              html: `
                <div style="text-align: left;">
                  <p style="font-size: 1.1em; margin-bottom: 15px;">
                    <strong>❌ Vous ne pouvez pas ${isEditing ? 'modifier' : 'créer'} une direction</strong>
                  </p>
                  <p>Raison : <strong>Permission manquante</strong></p>
                  
                  <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <p style="margin-bottom: 10px; color: #666;">
                      <strong>Vos permissions actuelles :</strong>
                    </p>
                    ${userPermissions.length > 0 ? 
                      `<ul style="list-style: none; padding: 0; margin: 0;">
                        ${permissionlist?.details?.map(p => `<li style="padding: 3px 0;">• ${p.description}</li>`).join('')}
                      </ul>` : 
                      '<p style="color: #999; font-style: italic;">Aucune permission</p>'
                    }
                  </div>
                  
                
                  
                  <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
                    Contactez l'administrateur pour obtenir cette permission.
                  </p>
                </div>
              `,
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Compris'
               // <p style="margin-top: 15px; color: #dc3545; font-weight: bold;">
                  //  Permission requise : <strong>creer_direction</strong>
                 // </p>
            });
            break;
            
          case 401:
            Swal.fire({
              icon: 'warning',
              title: 'Session expirée',
              text: 'Votre session a expiré. Veuillez vous reconnecter.',
              confirmButtonText: 'OK'
            }).then(() => {
              localStorage.clear();
                history.push("/");
            
            });
            break;
            
          case 422:
            // Erreurs de validation
            if (data.errors) {
              setErrors(data.errors);
              
              // Afficher le message d'erreur
              const firstError = Object.values(data.errors)[0]?.[0];
              Swal.fire({
                icon: 'error',
                title: 'Données invalides',
                text: firstError || 'Vérifiez les champs du formulaire',
                timer: 3000,
                showConfirmButton: false
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur de validation',
                text: data.message || 'Vérifiez les informations saisies'
              });
            }
            break;
            
          case 500:
            Swal.fire({
              icon: 'error',
              title: 'Erreur serveur',
              text: 'Une erreur interne est survenue. Réessayez plus tard.',
              confirmButtonText: 'OK'
            });
            break;
            
          default:
            // Autres erreurs
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: data.message || `Erreur ${status} lors de l'enregistrement`
            });
        }
      } else if (error.request) {
        // Pas de réponse du serveur
        Swal.fire({
          icon: 'error',
          title: 'Erreur réseau',
          text: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
          confirmButtonText: 'OK'
        });
      } else {
        // Erreur de configuration
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur inattendue est survenue',
          confirmButtonText: 'OK'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNom("");
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
              <FaBuilding className="mr-2" />
              {isEditing ? "Modifier la Direction" : "Nouvelle Direction"}
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
                  Nom de la direction <span className="text-danger">*</span>
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
                    placeholder="Nom de la direction"
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

export default ModalDirectionScreen;