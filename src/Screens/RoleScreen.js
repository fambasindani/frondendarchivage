import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaPlus, 
  FaSearch,
  FaUserShield,
  FaKey,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaSpinner,
  FaSync,
  FaUsers
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  const token = GetTokenOrRedirect();

  useEffect(() => {
    if (token) {
      fetchRoles();
    }
  }, [token, currentPage]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: pagination.per_page,
        search: search || undefined
      };

      const response = await axios.get(`${API_BASE_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      console.log('📊 Réponse API rôles:', response.data);
      
      if (response.data && response.data.success) {
        const apiData = response.data.data;
        
        // Structure Laravel pagination standard
        if (apiData && apiData.data) {
          setRoles(apiData.data || []);
          setPagination({
            current_page: apiData.current_page || 1,
            last_page: apiData.last_page || 1,
            per_page: apiData.per_page || 10,
            total: apiData.total || 0
          });
          
          // Debug: vérifier les permissions
          apiData.data.forEach(role => {
            console.log(`📋 Rôle ${role.nom}:`, {
              id: role.id,
              permissions: role.permissions,
              permissions_count: role.permissions_count
            });
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.response?.data?.message || 'Impossible de charger les rôles',
        confirmButtonColor: '#3085d6'
      });
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        setCurrentPage(1);
        fetchRoles();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRoles();
    setRefreshing(false);
    Swal.fire({
      icon: 'success',
      title: 'Rafraîchi',
      text: 'Liste des rôles mise à jour',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleDelete = async (id, roleName) => {
    if (roleName === 'Admin') {
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
      text: `Vous allez supprimer le rôle "${roleName}". Cette action est irréversible !`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
      reverseButtons: true
    });

    if (result.isConfirmed) {
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
        
        fetchRoles();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.response?.data?.message || 'Impossible de supprimer le rôle',
          confirmButtonColor: '#3085d6'
        });
      }
    }
  };

  // Fonctions utilitaires
  const getPermissionCount = (role) => {
    return role.permissions?.length || role.permissions_count || 0;
  };

  const getUserCount = (role) => {
    return role.monutilisateurs_count || role.users_count || 0;
  };

  const getPermissionNames = (role) => {
    if (!role.permissions || !Array.isArray(role.permissions)) return [];
    return role.permissions.slice(0, 3).map(perm => perm.code || 'Permission');
  };

  // Filtrage local
  const filteredRoles = Array.isArray(roles) ? roles.filter(role => {
    if (!role) return false;
    const matchesSearch = search === '' ||
      (role.nom && role.nom.toLowerCase().includes(search.toLowerCase())) ||
      (role.description && role.description.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  }) : [];

  // Calcul des statistiques
  const totalUsers = filteredRoles.reduce((acc, role) => acc + getUserCount(role), 0);
  const totalPermissions = filteredRoles.reduce((acc, role) => acc + getPermissionCount(role), 0);
  const activeRoles = filteredRoles.filter(role => getUserCount(role) > 0).length;

  const renderLoading = () => (
    <div className="text-center py-5">
      <FaSpinner className="fa-spin mb-3" size={32} />
      <p>Chargement des rôles...</p>
    </div>
  );

  const renderEmptyState = () => (
    <div className="col-12">
      <div className="card shadow-sm border-0">
        <div className="card-body text-center py-5">
          <div className="mb-3">
            <FaUserShield className="text-muted" size={64} />
          </div>
          <h4 className="text-muted mb-2">Aucun rôle trouvé</h4>
          <p className="text-muted mb-4">
            {search ? 'Essayez avec d\'autres termes de recherche' : 'Commencez par créer votre premier rôle'}
          </p>
          {!search && (
            <Link 
              to="/gestion-utilisateurs/roles/nouveau"
              className="btn btn-primary"
            >
              <FaPlus className="mr-2" />
              Créer un rôle
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  const renderRoleCard = (role) => {
    const userCount = getUserCount(role);
    const permissionCount = getPermissionCount(role);
    const permissionNames = getPermissionNames(role);

    console.log(`🎨 Rendu carte: ${role.nom}`, {
      permissions: role.permissions,
      permissionCount,
      permissionNames
    });

    return (
      <div key={role.id} className="col-lg-4 col-md-6 mb-4">
        <div className="card shadow-sm h-100 border-0 hover-lift">
          <div className="card-header bg-gradient-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaUserShield className="mr-2" />
                {role.nom || 'Sans nom'}
              </h5>
              <span className="badge badge-light">
                {userCount} utilisateur(s)
              </span>
            </div>
          </div>
          
          <div className="card-body">
            <p className="card-text text-muted mb-3">
              {role.description || 'Aucune description'}
            </p>
            
            <div className="mb-3">
              <small className="text-uppercase text-muted d-block mb-2">
                <FaKey className="mr-1" /> Permissions ({permissionCount})
              </small>
              <div className="d-flex flex-wrap gap-1">
                {permissionNames.length > 0 ? (
                  <>
                    {permissionNames.map((permName, index) => (
                      <span key={index} className="badge badge-info">
                        {permName}
                      </span>
                    ))}
                    {permissionCount > 3 && (
                      <span className="badge badge-light">
                        +{permissionCount - 3} plus
                      </span>
                    )}
                  </>
                ) : (
                  <span className="badge badge-secondary">
                    Aucune permission
                  </span>
                )}
              </div>
            </div>
            
            <div className="small text-muted">
              <div className="d-flex justify-content-between">
                <span>
                  <FaKey className="mr-1" />
                  {permissionCount} permission(s)
                </span>
                <span>
                  <FaUsers className="mr-1" />
                  {userCount} utilisateur(s)
                </span>
              </div>
            </div>
          </div>
          
          <div className="card-footer bg-white border-top">
            <div className="d-flex justify-content-between">
              <Link 
                to={`/gestion-utilisateurs/roles/${role.id}`}
                className="btn btn-outline-info btn-sm"
              >
                <FaEye className="mr-1" /> Détails
              </Link>
              <div>
                <Link 
                  to={`/gestion-utilisateurs/roles/${role.id}/modifier`}
                  className="btn btn-outline-warning btn-sm mr-2"
                  disabled={role.nom === 'Admin'}
                >
                  <FaEdit />
                </Link>
                <button 
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleDelete(role.id, role.nom)}
                  disabled={role.nom === 'Admin'}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (loading || pagination.last_page <= 1) return null;

    return (
      <div className="d-flex justify-content-center mt-4">
        <nav>
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>
            </li>
            
            {[...Array(pagination.last_page)].map((_, i) => {
              const pageNum = i + 1;
              const isCurrent = pageNum === currentPage;
              
              if (pageNum === 1 || pageNum === pagination.last_page || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                return (
                  <li key={pageNum} className={`page-item ${isCurrent ? 'active' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  </li>
                );
              } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
              }
              return null;
            })}
            
            <li className={`page-item ${currentPage === pagination.last_page ? 'disabled' : ''}`}>
              <button 
                className="page-link"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.last_page}
              >
                <FaChevronRight />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  return (
    <div className="roles-container">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h3 mb-0">
                <FaUserShield className="mr-2 text-primary" />
                Gestion des Rôles
              </h2>
              <p className="text-muted mb-0">Gérez les rôles et leurs permissions</p>
            </div>
            
            <div className="d-flex">
              <Link to="/gestion-utilisateurs/dashboard" className="btn btn-outline-secondary mr-2">
                <FaArrowLeft className="mr-1" /> Retour
              </Link>
              
              <button className="btn btn-outline-info mr-2" onClick={handleRefresh} disabled={loading || refreshing}>
                <FaSync className={refreshing ? 'fa-spin mr-1' : 'mr-1'} />
                {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
              </button>
              
              <Link to="/gestion-utilisateurs/roles/nouveau" className="btn btn-primary" disabled={loading}>
                <FaPlus className="mr-1" /> Nouveau Rôle
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text bg-white border-right-0">
                    <FaSearch className="text-muted" />
                  </span>
                </div>
                <input
                  type="text"
                  className="form-control border-left-0"
                  placeholder="Rechercher un rôle par nom ou description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="col-md-4 mb-3 mb-md-0">
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text bg-white">
                    <FaFilter className="text-muted" />
                  </span>
                </div>
                <select className="form-control" disabled={loading}>
                  <option value="all">Tous les rôles</option>
                  <option value="with_users">Avec utilisateurs</option>
                  <option value="without_users">Sans utilisateurs</option>
                  <option value="with_permissions">Avec permissions</option>
                </select>
              </div>
            </div>
            <div className="col-md-2 text-right">
              <div className="badge badge-light p-2">
                {pagination.total} rôle(s)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="row mb-4">
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 bg-light shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2"><FaUserShield className="text-primary" size={24} /></div>
              <h3 className="mb-0">{pagination.total}</h3>
              <p className="text-muted mb-0">Total rôles</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 bg-info-light shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2"><FaUsers className="text-info" size={24} /></div>
              <h3 className="mb-0">{totalUsers}</h3>
              <p className="text-muted mb-0">Utilisateurs totaux</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 bg-success-light shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2"><FaKey className="text-success" size={24} /></div>
              <h3 className="mb-0">{totalPermissions}</h3>
              <p className="text-muted mb-0">Permissions totales</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 bg-warning-light shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2"><FaUsers className="text-warning" size={24} /></div>
              <h3 className="mb-0">{activeRoles}</h3>
              <p className="text-muted mb-0">Rôles actifs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {loading ? renderLoading() : (
        <>
          <div className="row">
            {filteredRoles.length === 0 ? renderEmptyState() : filteredRoles.map(renderRoleCard)}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default Roles;