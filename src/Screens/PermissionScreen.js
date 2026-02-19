import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  FaKey, 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaSearch, 
  FaEllipsisV,
  FaUserShield,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaInfoCircle,
  FaSpinner
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';

const Permissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionDropdown, setActionDropdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });
  
  const itemsPerPage = 10;
  const token = GetTokenOrRedirect();

  const [formData, setFormData] = useState({
    code: '',
    description: ''
  });

  // Charger les données
  useEffect(() => {
    if (token) {
      fetchPermissions();
      fetchRoles();
    }
  }, [token, currentPage, search]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          per_page: itemsPerPage,
          search: search || undefined
        }
      });
      
      if (response.data && response.data.success) {
        const apiData = response.data.data;
        
        // Correction: La structure est {current_page, data, last_page, total, ...}
        setPermissions(apiData.data || []);
        setPagination({
          current_page: apiData.current_page || 1,
          last_page: apiData.last_page || 1,
          per_page: apiData.per_page || itemsPerPage,
          total: apiData.total || 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les permissions'
      });
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.success) {
        const apiData = response.data.data;
        setRoles(apiData.data || apiData || []);
      }
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingPermission) {
        // Mettre à jour
        const response = await axios.put(`${API_BASE_URL}/permissions/${editingPermission.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          // Rafraîchir la liste
          fetchPermissions();
          
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Permission mise à jour avec succès',
            showConfirmButton: false,
            timer: 1500
          });
        }
      } else {
        // Créer
        const response = await axios.post(`${API_BASE_URL}/permissions`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          // Rafraîchir la liste
          fetchPermissions();
          
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Permission créée avec succès',
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
      
      setShowModal(false);
      resetForm();
      
    } catch (error) {
      console.error('Erreur:', error);
      
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        let errorMessage = 'Veuillez corriger les erreurs suivantes:<br><ul>';
        Object.keys(errors).forEach(key => {
          errors[key].forEach(msg => {
            errorMessage += `<li>${msg}</li>`;
          });
        });
        errorMessage += '</ul>';
        
        Swal.fire({
          icon: 'error',
          title: 'Erreur de validation',
          html: errorMessage,
          confirmButtonColor: '#3085d6'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.response?.data?.message || error.message || 'Une erreur est survenue',
          confirmButtonColor: '#3085d6'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const permission = permissions.find(p => p.id === id);
    
    // Vérifier d'abord si la permission est utilisée
    try {
      const checkResponse = await axios.get(`${API_BASE_URL}/permissions/${id}/used-by`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (checkResponse.data.success && checkResponse.data.data.roles.length > 0) {
        const rolesUsing = checkResponse.data.data.roles;
        
        Swal.fire({
          title: 'Impossible de supprimer',
          html: `
            <div class="text-center">
              <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
              <p>Cette permission est utilisée par <strong>${rolesUsing.length}</strong> rôle(s)</p>
              <div class="mt-3">
                ${rolesUsing.slice(0, 3).map(role => 
                  `<span class="badge badge-info mr-1 mb-1">${role.nom}</span>`
                ).join('')}
                ${rolesUsing.length > 3 ? `<span class="badge badge-light">+${rolesUsing.length - 3} autres</span>` : ''}
              </div>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Compris'
        });
        return;
      }
    } catch (error) {
      console.error('Erreur vérification usage:', error);
    }
    
    Swal.fire({
      title: 'Supprimer cette permission ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      showCloseButton: true,
      focusCancel: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_BASE_URL}/permissions/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Rafraîchir la liste
          fetchPermissions();
          
          Swal.fire({
            icon: 'success',
            title: 'Supprimé !',
            text: 'La permission a été supprimée.',
            showConfirmButton: false,
            timer: 1500
          });
          
        } catch (error) {
          console.error('Erreur suppression:', error);
          
          if (error.response?.status === 403) {
            Swal.fire({
              icon: 'error',
              title: 'Impossible de supprimer',
              text: error.response.data.message || 'Cette permission est utilisée par des rôles',
              confirmButtonColor: '#3085d6'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: error.response?.data?.message || error.message || 'Impossible de supprimer la permission',
              confirmButtonColor: '#3085d6'
            });
          }
        }
      }
    });
  };

  const handleEdit = (permission) => {
    setEditingPermission(permission);
    setFormData({
      code: permission.code,
      description: permission.description || ''
    });
    setShowModal(true);
    setActionDropdown(null);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: ''
    });
    setEditingPermission(null);
  };

  const getRolesUsingPermission = (permissionId) => {
    // Utiliser roles_count de l'API
    const permission = permissions.find(p => p.id === permissionId);
    if (permission && permission.roles_count > 0) {
      // Si vous avez besoin des détails des rôles, vous devrez peut-être les récupérer séparément
      return [];
    }
    return [];
  };

  const toggleActionDropdown = (id, e) => {
    e.stopPropagation();
    setActionDropdown(actionDropdown === id ? null : id);
  };

  // Recherche avec délai
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        setCurrentPage(1);
        fetchPermissions();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const renderPagination = () => {
    if (pagination.last_page <= 1) return null;

    // Générer les pages à afficher
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.current_page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.last_page, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="text-muted small">
          Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur {pagination.total} permissions
        </div>
        <nav>
          <ul className="pagination mb-0">
            <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link"
                onClick={() => setCurrentPage(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
              >
                <FaChevronLeft />
              </button>
            </li>
            
            {startPage > 1 && (
              <>
                <li className="page-item">
                  <button className="page-link" onClick={() => setCurrentPage(1)}>1</button>
                </li>
                {startPage > 2 && (
                  <li className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                )}
              </>
            )}
            
            {pages.map(pageNum => (
              <li key={pageNum} className={`page-item ${pagination.current_page === pageNum ? 'active' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              </li>
            ))}
            
            {endPage < pagination.last_page && (
              <>
                {endPage < pagination.last_page - 1 && (
                  <li className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                )}
                <li className="page-item">
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(pagination.last_page)}
                  >
                    {pagination.last_page}
                  </button>
                </li>
              </>
            )}
            
            <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
              <button 
                className="page-link"
                onClick={() => setCurrentPage(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
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
    <div className="permissions-container">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h3 mb-0">
                <FaKey className="mr-2 text-primary" />
                Gestion des Permissions
              </h2>
              <p className="text-muted mb-0">
                Gérez les permissions système
              </p>
            </div>
            
            <div className="d-flex">
              <Link 
                to="/gestion-utilisateurs/dashboard"
                className="btn btn-outline-secondary mr-2"
              >
                <FaArrowLeft className="mr-1" />
                Retour
              </Link>
              
              <button 
                className="btn btn-primary"
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                disabled={loading}
              >
                <FaPlus className="mr-1" />
                Nouvelle Permission
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text bg-white border-right-0">
                    <FaSearch className="text-muted" />
                  </span>
                </div>
                <input
                  type="text"
                  className="form-control border-left-0"
                  placeholder="Rechercher une permission..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text bg-white">
                    <FaFilter className="text-muted" />
                  </span>
                </div>
                <select className="form-control" disabled={loading}>
                  <option>Toutes les permissions</option>
                  <option>Avec rôles associés</option>
                  <option>Sans rôles associés</option>
                </select>
              </div>
            </div>
            <div className="col-md-3 text-right">
              <div className="text-muted">
                {pagination.total} permission(s) au total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5">
            <FaSpinner className="fa-spin mb-3" size={32} />
            <p>Chargement des permissions...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="thead-light">
                    <tr>
                      <th className="border-0" style={{ width: '5%' }}>
                        #
                      </th>
                      <th className="border-0" style={{ width: '25%' }}>
                        <div className="d-flex align-items-center">
                          <FaKey className="mr-2 text-primary" />
                          Code Permission
                        </div>
                      </th>
                      <th className="border-0" style={{ width: '40%' }}>
                        Description
                      </th>
                      <th className="border-0" style={{ width: '20%' }}>
                        <FaUserShield className="mr-1" />
                        Utilisation
                      </th>
                      <th className="border-0 text-center" style={{ width: '10%' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <div className="d-flex flex-column align-items-center">
                            <FaKey className="text-muted mb-3" size={48} />
                            <h5 className="text-muted">Aucune permission trouvée</h5>
                            <p className="text-muted">
                              {search ? 'Essayez avec d\'autres termes de recherche' : 'Commencez par créer votre première permission'}
                            </p>
                            {!search && (
                              <button 
                                className="btn btn-primary mt-2"
                                onClick={() => {
                                  resetForm();
                                  setShowModal(true);
                                }}
                              >
                                <FaPlus className="mr-2" />
                                Créer une permission
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      permissions.map((permission, index) => {
                        return (
                          <tr key={permission.id} className="hover-row">
                            <td>
                              {((pagination.current_page - 1) * pagination.per_page) + index + 1}
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="mr-3">
                                  <div className="icon-circle bg-primary-light text-primary">
                                    <FaKey size={14} />
                                  </div>
                                </div>
                                <div>
                                  <div className="font-weight-bold text-dark">
                                    {permission.code}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="text-truncate-2">
                                {permission.description || (
                                  <span className="text-muted">Aucune description</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {permission.roles_count > 0 ? (
                                  <>
                                    <span className="badge badge-info">
                                      {permission.roles_count} rôle(s)
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-muted small">Aucun rôle</span>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="dropdown">
                                <button
                                  className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                  type="button"
                                  onClick={(e) => toggleActionDropdown(permission.id, e)}
                                >
                                  <FaEllipsisV />
                                </button>
                                
                                {actionDropdown === permission.id && (
                                  <div className="dropdown-menu show shadow border-0" style={{ minWidth: '150px' }}>
                                    <button 
                                      className="dropdown-item text-info"
                                      onClick={() => handleEdit(permission)}
                                    >
                                      <FaEdit className="mr-2" />
                                      Modifier
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button 
                                      className="dropdown-item text-danger"
                                      onClick={() => handleDelete(permission.id)}
                                    >
                                      <FaTrash className="mr-2" />
                                      Supprimer
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {renderPagination()}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-gradient-primary text-white">
                <h5 className="modal-title">
                  <FaKey className="mr-2" />
                  {editingPermission ? 'Modifier la permission' : 'Nouvelle Permission'}
                </h5>
                <button 
                  type="button" 
                  className="close text-white" 
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="font-weight-bold">
                      Code de la permission <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text bg-light">
                          <FaKey className="text-primary" />
                        </span>
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        required
                        placeholder="Ex: user_create, content_read, etc."
                        disabled={submitting}
                      />
                    </div>
                    <small className="text-muted">
                      <FaInfoCircle className="mr-1" />
                      Utilisez un format en snake_case (ex: user_create, content_delete)
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">Description</label>
                    <textarea
                      required
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Décrivez ce que cette permission permet..."
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={submitting}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <FaSpinner className="fa-spin mr-2" />
                        {editingPermission ? 'Mise à jour...' : 'Création...'}
                      </>
                    ) : (
                      editingPermission ? 'Mettre à jour' : 'Créer la permission'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .permissions-container {
          padding: 20px;
          background: #f8f9fa;
          min-height: calc(100vh - 76px);
        }
        
        .icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .bg-primary-light {
          background-color: rgba(0, 123, 255, 0.1);
        }
        
        .text-truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          max-height: 48px;
        }
        
        .hover-row:hover {
          background-color: #f8f9fa;
          transition: background-color 0.2s ease;
        }
        
        .dropdown-menu {
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .table th {
          font-weight: 600;
          border-top: none;
        }
        
        .table td {
          vertical-align: middle;
          border-top: 1px solid #f1f1f1;
        }
        
        .modal-backdrop {
          background-color: rgba(0,0,0,0.5) !important;
        }
        
        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .modal-content {
          border-radius: 16px;
          overflow: hidden;
        }
        
        .modal-header {
          border-radius: 0;
        }
        
        .close {
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        
        .close:hover {
          opacity: 1;
        }
        
        .pagination {
          gap: 5px;
        }
        
        .page-link {
          border-radius: 8px;
          color: #007bff;
          border: 1px solid #dee2e6;
          padding: 0.5rem 0.75rem;
        }
        
        .page-item.active .page-link {
          background: #007bff;
          border-color: #007bff;
          color: white;
        }
        
        .page-item.disabled .page-link {
          color: #6c757d;
          pointer-events: none;
          background: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default Permissions;