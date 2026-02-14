import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  FaBuilding, 
  FaUsers, 
  FaCalendarAlt,
  FaArrowLeft,
  FaEdit,
  FaUserPlus,
  FaTimes,
  FaSpinner,
  FaExclamationCircle
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";

const DirectionDetailScreen = () => {
  const { id } = useParams();
  const history = useHistory();
  const token = GetTokenOrRedirect();
  
  const [direction, setDirection] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [removingUser, setRemovingUser] = useState(null);

  // 🔹 Obtenir les en-têtes d'authentification
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  };

  // 🔹 Charger les données de la direction
  useEffect(() => {
    if (id && token) {
      fetchDirectionData();
    }
  }, [id, token]);

  const fetchDirectionData = async () => {
    setLoading(true);
    try {
      // 🔹 Charger les détails de la direction
      const response = await axios.get(
        `${API_BASE_URL}/departements/${id}/with-details`,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        const directionData = response.data.data;
        setDirection(directionData);
        
        // 🔹 Extraire les utilisateurs assignés
        if (directionData.monutilisateurs) {
          setAssignedUsers(directionData.monutilisateurs);
        }
        
        // 🔹 Charger les utilisateurs disponibles
        await fetchAvailableUsers();
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

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/departements/${id}/available-users`,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setAvailableUsers(response.data.data.utilisateurs_disponibles || []);
      }
    } catch (error) {
      console.error('Erreur utilisateurs disponibles:', error);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 🔹 Assigner un utilisateur
  const handleAddUser = async (userId) => {
    if (!userId) {
      Swal.fire('Erreur', 'Veuillez sélectionner un utilisateur', 'error');
      return;
    }
    
    try {
      setLoadingUsers(true);
      const response = await axios.post(
        `${API_BASE_URL}/departements/${id}/assign-user/${userId}`,
        {},
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Succès !',
          text: 'Utilisateur assigné avec succès',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Réinitialiser la sélection
        setSelectedUserId('');
        
        // Recharger les données
        await fetchDirectionData();
      }
    } catch (error) {
      console.error('Erreur assignation:', error);
      
      if (error.response?.status === 401) {
        // GetTokenOrRedirect gère déjà la redirection
        return;
      }
      
      if (error.response?.status === 409) {
        Swal.fire({
          icon: 'warning',
          title: 'Déjà assigné',
          text: 'Cet utilisateur est déjà assigné à cette direction'
        });
      } else if (error.response?.status === 404) {
        Swal.fire({
          icon: 'error',
          title: 'Non trouvé',
          text: 'Utilisateur ou direction non trouvé'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.response?.data?.message || error.message
        });
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // 🔹 Retirer un utilisateur
  const handleRemoveUser = async (userId) => {
    const user = assignedUsers.find(u => u.id === userId);
    if (!user) return;
    
    const result = await Swal.fire({
      title: 'Confirmer la suppression',
      html: `
        <div>
          <p>Êtes-vous sûr de vouloir retirer cet utilisateur de la direction ?</p>
          <p><strong>${user.prenom} ${user.nom}</strong></p>
          <p class="text-muted">Email: ${user.email}</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, retirer',
      cancelButtonText: 'Annuler'
    });
    
    if (result.isConfirmed) {
      setRemovingUser(userId);
      try {
        const response = await axios.post(
          `${API_BASE_URL}/departements/${id}/remove-user/${userId}`,
          {},
          { headers: getAuthHeaders() }
        );
        
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Retiré !',
            text: 'Utilisateur retiré de la direction',
            timer: 2000,
            showConfirmButton: false
          });
          
          // Recharger les données
          await fetchDirectionData();
        }
      } catch (error) {
        console.error('Erreur retrait utilisateur:', error);
        
        if (error.response?.status === 401) {
          // GetTokenOrRedirect gère déjà la redirection
          return;
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.response?.data?.message || error.message
        });
      } finally {
        setRemovingUser(null);
      }
    }
  };

  // 🔹 Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="direction-detail-page">
        <div className="text-center py-5">
          <FaSpinner className="fa-spin mb-3" size={32} />
          <p>Chargement de la direction...</p>
        </div>
      </div>
    );
  }

  if (!direction) {
    return (
      <div className="direction-detail-page">
        <div className="alert alert-danger m-4">
          <FaExclamationCircle className="mr-2" />
          Direction non trouvée
        </div>
      </div>
    );
  }

  return (
    <div className="direction-detail-page">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h3 mb-0">
                <FaBuilding className="mr-2 text-primary" />
                {direction.sigle} - {direction.nom}
              </h2>
              <p className="text-muted mb-0">
                Gestion des utilisateurs de cette direction
              </p>
            </div>
            
            <div className="d-flex">
              <button 
                onClick={() => history.push('/gestion-utilisateurs/directions')}
                className="btn btn-outline-secondary mr-2"
              >
                <FaArrowLeft className="mr-1" />
                Retour
              </button>
              
              <Link 
                to={`/gestion-utilisateurs/directions/${direction.id}/modifier`}
                className="btn btn-primary"
              >
                <FaEdit className="mr-1" />
                Modifier
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="mb-4">
                <h5 className="card-title mb-3">Informations de la direction</h5>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small d-block">
                      <FaBuilding className="mr-1" />
                      Sigle
                    </label>
                    <h5 className="mb-0">
                      <span className="badge badge-primary px-3 py-2">
                        {direction.sigle}
                      </span>
                    </h5>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small d-block">
                      <FaCalendarAlt className="mr-1" />
                      Date de création
                    </label>
                    <h6 className="mb-0">
                      {formatDate(direction.datecreation)}
                    </h6>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="text-muted small d-block">Description complète</label>
                  <p className="mb-0">
                    {direction.nom}
                  </p>
                </div>
              </div>

              {/* Utilisateurs assignés */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0">
                    <FaUsers className="mr-2" />
                    Utilisateurs assignés ({assignedUsers.length})
                  </h5>
                </div>

                {assignedUsers.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Nom & Prénom</th>
                          <th>Email</th>
                          <th>Statut</th>
                          <th style={{ width: '120px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedUsers.map(user => (
                          <tr key={user.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar-circle mr-3">
                                  {user.prenom?.[0]}{user.nom?.[0]}
                                </div>
                                <div>
                                  {user.prenom} {user.nom}
                                </div>
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`badge badge-${user.statut === 'active' ? 'success' : 
                                                user.statut === 'inactive' ? 'warning' : 'danger'}`}>
                                {user.statut}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveUser(user.id)}
                                disabled={removingUser === user.id || loadingUsers}
                              >
                                {removingUser === user.id ? (
                                  <FaSpinner className="fa-spin" />
                                ) : (
                                  <>
                                    <FaTimes /> Retirer
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <FaUsers className="mr-2" />
                    Aucun utilisateur assigné à cette direction
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Ajouter des utilisateurs */}
        <div className="col-lg-4">
          <div className="sticky-top" style={{ top: '20px' }}>
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-light">
                <h6 className="mb-0">
                  <FaUserPlus className="mr-2" />
                  Ajouter un utilisateur
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="text-muted small">Sélectionner un utilisateur</label>
                  <select 
                    className="form-control"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    disabled={loadingUsers || availableUsers.length === 0}
                  >
                    <option value="">Choisir un utilisateur...</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.prenom} {user.nom} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddUser(selectedUserId)}
                    disabled={!selectedUserId || loadingUsers}
                  >
                    {loadingUsers ? (
                      <>
                        <FaSpinner className="fa-spin mr-2" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <FaUserPlus className="mr-2" />
                        Assigner l'utilisateur
                      </>
                    )}
                  </button>
                </div>
                
                {availableUsers.length === 0 && !loadingUsers && (
                  <div className="alert alert-info mt-3">
                    <FaUsers className="mr-2" />
                    Tous les utilisateurs sont déjà assignés à cette direction
                  </div>
                )}
                
                {loadingUsers && availableUsers.length === 0 && (
                  <div className="text-center mt-3">
                    <FaSpinner className="fa-spin mr-2" />
                    <small>Chargement des utilisateurs...</small>
                  </div>
                )}
                
                <div className="mt-4 pt-3 border-top">
                  <h6 className="text-muted mb-3">Statistiques</h6>
                  <div className="d-flex justify-content-between">
                    <div className="text-center">
                      <div className="h4 mb-0 text-primary">{assignedUsers.length}</div>
                      <small className="text-muted">Assignés</small>
                    </div>
                    <div className="text-center">
                      <div className="h4 mb-0 text-success">{availableUsers.length}</div>
                      <small className="text-muted">Disponibles</small>
                    </div>
                    <div className="text-center">
                      <div className="h4 mb-0 text-info">{assignedUsers.length + availableUsers.length}</div>
                      <small className="text-muted">Total actifs</small>
                    </div>
                  </div>
                </div>
                
                <div className="alert alert-light border mt-4">
                  <small>
                    <FaExclamationCircle className="mr-1" />
                    <strong>Note :</strong> Seuls les utilisateurs avec statut "active" apparaissent ici
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .direction-detail-page {
          padding: 20px;
          background: #f8f9fa;
          min-height: calc(100vh - 76px);
        }
        
        .avatar-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(45deg, #007bff, #6610f2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .badge-primary {
          font-size: 1.1rem;
        }
        
        .card {
          border-radius: 10px;
          overflow: hidden;
        }
        
        .card-header {
          border-bottom: 1px solid rgba(0,0,0,.125);
          background-color: #f8f9fa;
        }
        
        .hover-lift {
          transition: all 0.2s;
        }
        
        .hover-lift:hover {
          background-color: #f8f9fa;
          transform: translateY(-1px);
        }
        
        @media (max-width: 992px) {
          .direction-detail-page {
            padding: 15px;
          }
          
          .sticky-top {
            position: static !important;
          }
          
          .table-responsive {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default DirectionDetailScreen;