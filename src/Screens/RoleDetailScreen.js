import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  FaUserShield, 
  FaKey, 
  FaUsers, 
  FaEdit,
  FaArrowLeft,
  FaSpinner,
  FaTrash,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import { Link, useParams, useHistory } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';

const RoleDetailScreen = () => {
  const { id } = useParams();
  const history = useHistory();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const token = GetTokenOrRedirect();

  useEffect(() => {
    if (token && id) {
      fetchRoleDetails();
    }
  }, [token, id]);

  const fetchRoleDetails = async () => {
    setLoading(true);
    try {
      // Essayer d'abord l'endpoint avec détails complets
      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/roles/${id}/with-details`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        // Si échec, utiliser l'endpoint standard
        console.log('Endpoint with-details non disponible, utilisation standard');
        response = await axios.get(`${API_BASE_URL}/roles/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (response.data && response.data.success) {
        console.log('Détails du rôle chargés:', response.data.data);
        setRole(response.data.data);
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails du rôle:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.response?.data?.message || 'Impossible de charger les détails du rôle',
        confirmButtonColor: '#3085d6'
      });
      history.push('/gestion-utilisateurs/roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!role || role.nom === 'Admin') {
      Swal.fire({
        icon: 'error',
        title: 'Impossible',
        text: 'Le rôle Admin ne peut pas être supprimé',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: `Vous allez supprimer le rôle "${role.nom}". Cette action est irréversible !`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      setDeleting(true);
      try {
        await axios.delete(`${API_BASE_URL}/roles/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Supprimé !',
          text: 'Le rôle a été supprimé avec succès.',
          timer: 2000,
          showConfirmButton: false
        });
        
        history.push('/gestion-utilisateurs/roles');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.response?.data?.message || 'Impossible de supprimer le rôle',
          confirmButtonColor: '#3085d6'
        });
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleRefresh = async () => {
    await fetchRoleDetails();
    Swal.fire({
      icon: 'success',
      title: 'Rafraîchi',
      text: 'Informations du rôle mises à jour',
      timer: 1500,
      showConfirmButton: false
    });
  };

  if (loading) {
    return (
      <div className="role-details-page">
        <div className="text-center py-5">
          <FaSpinner className="fa-spin mb-3" size={32} />
          <p>Chargement des détails du rôle...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="role-details-page">
        <div className="container mt-5">
          <div className="alert alert-danger">
            <FaExclamationTriangle className="mr-2" />
            <h4>Rôle non trouvé</h4>
            <p>Le rôle demandé n'existe pas ou vous n'y avez pas accès.</p>
            <button 
              onClick={() => history.push('/gestion-utilisateurs/roles')}
              className="btn btn-secondary"
            >
              <FaArrowLeft className="mr-1" />
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fonctions utilitaires
  const getUserCount = () => {
    if (role.monutilisateurs_count !== undefined) return role.monutilisateurs_count;
    if (role.users_count !== undefined) return role.users_count;
    if (role.monutilisateurs && Array.isArray(role.monutilisateurs)) return role.monutilisateurs.length;
    if (role.users && Array.isArray(role.users)) return role.users.length;
    return 0;
  };

  const getPermissionCount = () => {
    if (role.permissions_count !== undefined) return role.permissions_count;
    if (role.permissions && Array.isArray(role.permissions)) return role.permissions.length;
    return 0;
  };

  const getUsers = () => {
    if (role.monutilisateurs && Array.isArray(role.monutilisateurs)) return role.monutilisateurs;
    if (role.users && Array.isArray(role.users)) return role.users;
    return [];
  };

  const getPermissions = () => {
    return role.permissions || [];
  };

  const userCount = getUserCount();
  const permissionCount = getPermissionCount();
  const users = getUsers();
  const permissions = getPermissions();
  const isAdminRole = role.nom === 'Admin';

  return (
    <div className="role-details-page">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h3 mb-0">
                <FaUserShield className={`mr-2 ${isAdminRole ? 'text-warning' : 'text-primary'}`} />
                {role.nom}
              </h2>
              <p className="text-muted mb-0">
                Détails du rôle
              </p>
            </div>
            
            <div className="d-flex gap-2">
              <button 
                onClick={() => history.push('/gestion-utilisateurs/roles')}
                className="btn btn-outline-secondary"
              >
                <FaArrowLeft className="mr-1" />
                Retour
              </button>
              
              <button
                onClick={handleRefresh}
                className="btn btn-outline-info"
                disabled={loading}
              >
                <FaSpinner className={loading ? 'fa-spin mr-1' : 'd-none'} />
                {!loading && 'Rafraîchir'}
              </button>
              
              <Link 
                to={`/gestion-utilisateurs/roles/${id}/modifier`}
                className={`btn btn-warning ${isAdminRole ? 'disabled' : ''}`}
                title={isAdminRole ? "Le rôle Admin ne peut pas être modifié" : "Modifier le rôle"}
              >
                <FaEdit className="mr-1" />
                Modifier
              </Link>
              
              <button 
                onClick={handleDelete}
                className={`btn btn-danger ${isAdminRole ? 'disabled' : deleting ? 'disabled' : ''}`}
                disabled={isAdminRole || deleting}
                title={isAdminRole ? "Le rôle Admin ne peut pas être supprimé" : "Supprimer le rôle"}
              >
                {deleting ? (
                  <FaSpinner className="fa-spin mr-1" />
                ) : (
                  <FaTrash className="mr-1" />
                )}
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="row mb-4">
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaUserShield className="text-primary" size={24} />
              </div>
              <h3 className="mb-0">1</h3>
              <p className="text-muted mb-0">Rôle</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaUsers className="text-info" size={24} />
              </div>
              <h3 className="mb-0">{userCount}</h3>
              <p className="text-muted mb-0">Utilisateur{userCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaKey className="text-success" size={24} />
              </div>
              <h3 className="mb-0">{permissionCount}</h3>
              <p className="text-muted mb-0">Permission{permissionCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaInfoCircle className="text-warning" size={24} />
              </div>
              <h3 className="mb-0">{isAdminRole ? 'Admin' : 'Standard'}</h3>
              <p className="text-muted mb-0">Type</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="mb-4">
                <h5 className="card-title mb-3">Informations du rôle</h5>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small d-block">Nom du rôle</label>
                    <h5 className="mb-0">{role.nom}</h5>
                    {isAdminRole && (
                      <small className="text-warning mt-1 d-block">
                        <FaInfoCircle className="mr-1" />
                        Rôle administrateur système
                      </small>
                    )}
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small d-block">Date de création</label>
                    <h5 className="mb-0">
                      {role.created_at ? new Date(role.created_at).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                    </h5>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="text-muted small d-block">Description</label>
                  <p className="mb-0 lead">
                    {role.description || 'Aucune description fournie'}
                  </p>
                </div>
              </div>

              {/* Permissions */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0">
                    <FaKey className="mr-2" />
                    Permissions ({permissionCount})
                  </h5>
                </div>

                {permissions.length > 0 ? (
                  <div className="row">
                    {permissions.map(perm => (
                      <div key={perm.id} className="col-md-6 mb-3">
                        <div className="permission-detail-card">
                          <div className="d-flex align-items-start">
                            <FaKey className="mr-3 mt-1 text-primary" />
                            <div>
                              <h6 className="mb-1">{perm.code || 'Permission'}</h6>
                              <p className="text-muted small mb-0">
                                {perm.description || 'Aucune description'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <FaInfoCircle className="mr-2" />
                    Aucune permission attribuée à ce rôle
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Utilisateurs */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-light">
              <h6 className="mb-0">
                <FaUsers className="mr-2" />
                Utilisateurs avec ce rôle ({userCount})
              </h6>
            </div>
            <div className="card-body">
              {users.length > 0 ? (
                <div className="users-list">
                  {users.slice(0, 10).map(user => (
                    <div key={user.id} className="user-item mb-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar-circle mr-3">
                          {user.prenom?.[0]}{user.nom?.[0]}
                        </div>
                        <div className="flex-grow-1">
                          <div className="font-weight-bold">
                            {user.prenom} {user.nom}
                          </div>
                          <small className="text-muted d-block">
                            {user.email}
                          </small>
                          <small className={`badge badge-${
                            user.statut === 'active' ? 'success' : 
                            user.statut === 'inactive' ? 'warning' : 'danger'
                          }`}>
                            {user.statut}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.length > 10 && (
                    <div className="text-center mt-3">
                      <span className="text-muted">
                        + {users.length - 10} autre{users.length - 10 !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaUsers className="text-muted mb-3" size={32} />
                  <p className="text-muted mb-0">
                    Aucun utilisateur avec ce rôle
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h6 className="mb-0">Actions</h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link 
                  to={`/gestion-utilisateurs/roles/${id}/modifier`}
                  className={`btn btn-outline-warning ${isAdminRole ? 'disabled' : ''}`}
                >
                  <FaEdit className="mr-2" />
                  Modifier ce rôle
                </Link>
                
                <button 
                  onClick={handleDelete}
                  className={`btn btn-outline-danger ${isAdminRole ? 'disabled' : ''}`}
                  disabled={isAdminRole}
                >
                  <FaTrash className="mr-2" />
                  Supprimer ce rôle
                </button>
                
                <Link 
                  to="/gestion-utilisateurs/roles"
                  className="btn btn-outline-secondary"
                >
                  <FaArrowLeft className="mr-2" />
                  Retour à la liste
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .role-details-page {
          padding: 20px;
          background: #f8f9fa;
          min-height: calc(100vh - 76px);
        }
        
        .permission-detail-card {
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          background: white;
          transition: all 0.2s;
        }
        
        .permission-detail-card:hover {
          border-color: #007bff;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .avatar-circle {
          width: 40px;
          height: 40px;
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
        
        .users-list {
          max-height: 400px;
          overflow-y: auto;
          padding: 10px;
        }
        
        .user-item {
          padding: 10px;
          border-bottom: 1px solid #f1f1f1;
          transition: all 0.2s;
        }
        
        .user-item:hover {
          background-color: #f8f9fa;
          border-radius: 6px;
        }
        
        .user-item:last-child {
          border-bottom: none;
        }
        
        /* Scrollbar styling */
        .users-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .users-list::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .users-list::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .users-list::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        
        @media (max-width: 768px) {
          .role-details-page {
            padding: 15px;
          }
          
          .d-flex.gap-2 {
            flex-wrap: wrap;
          }
          
          .btn {
            margin-bottom: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default RoleDetailScreen;