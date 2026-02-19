import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaSearch,
  FaFilter,
  FaUser,
  FaUserCheck,
  FaUserTimes,
  FaUserLock,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaTimes,
  FaSpinner,
  FaExclamationCircle,
  FaCheck,
  FaCircle,
  FaLock,
  FaEnvelope
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';

const UserScreen = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    statut: 'active',
    role_ids: []
  });

  const token = GetTokenOrRedirect();

  // Effet pour charger les utilisateurs
  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchRoles();
    }
  }, [token, currentPage]);

  // API Calls
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/mon-utilisateurs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          per_page: pagination.per_page,
          search: search || undefined
        }
      });
      
      console.log('API Response Users:', response.data);
      
      if (response.data && response.data.success) {
        const apiData = response.data.data;
        setUsers(apiData.data || []);
        setPagination({
          current_page: apiData.current_page || 1,
          last_page: apiData.last_page || 1,
          per_page: apiData.per_page || 10,
          total: apiData.total || 0
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      Swal.fire('Erreur', 'Impossible de charger les utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('API Response Roles:', response.data);
      
      if (response.data && response.data.success) {
        // Votre API retourne response.data.data.data pour les rôles
        setRoles(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    }
  };

  // CRUD Operations
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      if (editingUser) {
        // Mettre à jour l'utilisateur
        const updateData = { 
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          statut: formData.statut,
          role_ids: formData.role_ids
        };
        
        // Inclure le mot de passe seulement s'il est fourni
        if (formData.password) {
          updateData.password = formData.password;
        }

        console.log('Données envoyées pour update:', updateData);

        await axios.put(`${API_BASE_URL}/mon-utilisateurs/${editingUser.id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire('Succès', 'Utilisateur mis à jour avec succès', 'success');
      } else {
        // Créer un nouvel utilisateur
        const createData = {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password,
          statut: formData.statut,
          role_ids: formData.role_ids
        };

        console.log('Données envoyées pour création:', createData);

        await axios.post(`${API_BASE_URL}/mon-utilisateurs`, createData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire('Succès', 'Utilisateur créé avec succès', 'success');
      }

      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error('Erreur complète:', error.response?.data);
      
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        Swal.fire('Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire', 'error');
      } else {
        Swal.fire('Erreur', error.response?.data?.message || 'Une erreur est survenue', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_BASE_URL}/mon-utilisateurs/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          Swal.fire('Supprimé !', 'L\'utilisateur a été supprimé.', 'success');
          fetchUsers();
        } catch (error) {
          console.error('Erreur suppression:', error);
          Swal.fire('Erreur', 'Impossible de supprimer l\'utilisateur', 'error');
        }
      }
    });
  };

  const handleEdit = (user) => {
    console.log('Édition utilisateur:', user);
    setEditingUser(user);
    setFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      password: '',
      statut: user.statut || 'active',
      role_ids: user.roles?.map(role => role.id) || []
    });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      statut: 'active',
      role_ids: []
    });
    setEditingUser(null);
    setErrors({});
  };

  // Ajouter un rôle
  const handleAddRole = (roleId) => {
    if (!roleId || formData.role_ids.includes(parseInt(roleId))) return;
    
    setFormData({
      ...formData,
      role_ids: [...formData.role_ids, parseInt(roleId)]
    });
  };

  // Retirer un rôle
  const handleRemoveRole = (roleId) => {
    setFormData({
      ...formData,
      role_ids: formData.role_ids.filter(id => id !== roleId)
    });
  };

  // Filtrage
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const matchesSearch = search === '' || 
      (user.nom && user.nom.toLowerCase().includes(search.toLowerCase())) ||
      (user.prenom && user.prenom.toLowerCase().includes(search.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || user.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusText = (statut) => {
    switch(statut) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'bloqué': return 'Bloqué';
      default: return statut;
    }
  };

  const getRoleBadges = (userRoles) => {
    if (!userRoles || !Array.isArray(userRoles)) return [];
    return userRoles.map(role => (
      <span key={role.id} className="badge badge-info mr-1 mb-1">
        {role.nom}
      </span>
    ));
  };

  const renderFieldError = (fieldName) => {
    if (errors[fieldName]) {
      return (
        <div className="invalid-feedback d-block">
          <FaExclamationCircle className="mr-1" />
          {errors[fieldName][0]}
        </div>
      );
    }
    return null;
  };

  const renderLoading = () => (
    <div className="text-center py-5">
      <FaSpinner className="fa-spin mb-3" size={32} />
      <p>Chargement des utilisateurs...</p>
    </div>
  );

  // Statistiques
  const activeUsers = users.filter(u => u.statut === 'active').length;
  const inactiveUsers = users.filter(u => u.statut === 'inactive').length;
  const blockedUsers = users.filter(u => u.statut === 'bloqué').length;

  return (
    <div className="users-container">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h3 mb-0">
                <FaUser className="mr-2 text-primary" />
                Gestion des Utilisateurs
              </h2>
              <p className="text-muted mb-0">
                Gérez les utilisateurs et leurs rôles
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
                Nouvel Utilisateur
              </button>
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
                  placeholder="Rechercher par nom, prénom ou email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
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
                <select 
                  className="form-control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={loading}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="bloqué">Bloqués</option>
                </select>
              </div>
            </div>
            <div className="col-md-2 text-right">
              <span className="badge badge-light p-2">
                {pagination.total} utilisateur(s)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="row mb-4">
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 bg-light shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaUser className="text-primary" size={24} />
              </div>
              <h3 className="mb-0">{pagination.total}</h3>
              <p className="text-muted mb-0">Total</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 bg-success-light shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaUserCheck className="text-success" size={24} />
              </div>
              <h3 className="mb-0">{activeUsers}</h3>
              <p className="text-muted mb-0">Actifs</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 bg-warning-light shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaUserTimes className="text-warning" size={24} />
              </div>
              <h3 className="mb-0">{inactiveUsers}</h3>
              <p className="text-muted mb-0">Inactifs</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 bg-danger-light shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaUserLock className="text-danger" size={24} />
              </div>
              <h3 className="mb-0">{blockedUsers}</h3>
              <p className="text-muted mb-0">Bloqués</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            renderLoading()
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="thead-light">
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Email</th>
                    <th>Rôles</th>
                    <th>Statut</th>
                    <th>Date création</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5">
                        <div className="py-4">
                          <FaUser className="text-muted mb-3" size={48} />
                          <h4 className="text-muted mb-2">Aucun utilisateur trouvé</h4>
                          <p className="text-muted">
                            {search ? 'Essayez avec d\'autres termes de recherche' : 'Commencez par créer votre premier utilisateur'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user, index) => (
                      <tr key={user.id}>
                        <td>{((currentPage - 1) * pagination.per_page) + index + 1}</td>
                        <td>
                          <strong>{user.nom || 'N/A'}</strong>
                        </td>
                        <td>{user.prenom || 'N/A'}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {getRoleBadges(user.roles)}
                            {(!user.roles || user.roles.length === 0) && (
                              <span className="text-muted small">Aucun rôle</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${user.statut === 'active' ? 'success' : 
                                            user.statut === 'inactive' ? 'warning' : 'danger'}`}>
                            {getStatusText(user.statut)}
                          </span>
                        </td>
                        <td>
                          {user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button 
                              className="btn btn-outline-primary mr-2"
                              onClick={() => handleEdit(user)}
                              title="Modifier"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(user.id)}
                              title="Supprimer"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Pagination - CORRIGÉE */}
        {!loading && pagination.last_page > 1 && (
          <div className="card-footer border-top">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="text-muted">
                  Affichage de {((currentPage - 1) * pagination.per_page) + 1} à{' '}
                  {Math.min(currentPage * pagination.per_page, pagination.total)} sur{' '}
                  {pagination.total} utilisateurs
                </div>
              </div>
              <div className="col-md-6">
                <nav className="d-flex justify-content-end">
                  <ul className="pagination mb-0">
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
                      
                      // Afficher les pages pertinentes (première, dernière, et autour de la page courante)
                      if (
                        pageNum === 1 || 
                        pageNum === pagination.last_page || 
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
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
                        // Afficher des points de suspension
                        return (
                          <li key={pageNum} className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        );
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
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="modal fade show" 
          style={{ 
            display: 'block', 
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)'
          }} 
          tabIndex="-1" 
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              
              {/* Header avec dégradé */}
              <div 
                className="modal-header bg-gradient-primary text-white position-relative py-3 px-4" 
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderBottom: 'none'
                }}
              >
                <h5 className="modal-title mb-0 font-weight-bold d-flex align-items-center">
                  <div className="rounded-circle bg-white bg-opacity-25 p-2 mr-3 d-flex align-items-center justify-content-center">
                    {editingUser ? <FaUser className="text-white" size={18} /> : <FaUser className="text-white" size={18} />}
                  </div>
                  {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel Utilisateur'}
                </h5>
                <button 
                  type="button" 
                  className="btn btn-sm btn-light position-absolute"
                  onClick={handleCloseModal}
                  disabled={submitting}
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
                    zIndex: 1,
                    width: '32px',
                    height: '32px'
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  
                  {/* Informations personnelles */}
                  <div className="mb-4">
                    <h6 className="font-weight-bold mb-3 d-flex align-items-center text-primary">
                      <FaUser className="mr-2" />
                      Informations personnelles
                    </h6>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="form-group">
                          <label className="font-weight-bold mb-2">
                            Nom <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <div className="input-group-prepend">
                              <span className="input-group-text bg-light border-right-0">
                                <FaUser className="text-primary" />
                              </span>
                            </div>
                            <input
                              type="text"
                              className={`form-control border-left-0 ${errors.nom ? 'is-invalid' : ''}`}
                              value={formData.nom}
                              onChange={(e) => setFormData({...formData, nom: e.target.value})}
                              disabled={submitting}
                              placeholder="Entrez le nom"
                              style={{ height: '45px' }}
                            />
                          </div>
                          {renderFieldError('nom')}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="form-group">
                          <label className="font-weight-bold mb-2">Prénom</label>
                          <div className="input-group">
                            <div className="input-group-prepend">
                              <span className="input-group-text bg-light border-right-0">
                                <FaUser className="text-info" />
                              </span>
                            </div>
                            <input
                              type="text"
                              className="form-control border-left-0"
                              value={formData.prenom}
                              onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                              disabled={submitting}
                              placeholder="Entrez le prénom"
                              style={{ height: '45px' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-4">
                    <h6 className="font-weight-bold mb-3 d-flex align-items-center text-primary">
                      <FaEnvelope className="mr-2" />
                      Contact
                    </h6>
                    
                    <div className="form-group">
                      <label className="font-weight-bold mb-2">
                        Adresse email <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text bg-light border-right-0">
                            <FaEnvelope className="text-primary" />
                          </span>
                        </div>
                        <input
                          type="email"
                          className={`form-control border-left-0 ${errors.email ? 'is-invalid' : ''}`}
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                          disabled={!!editingUser || submitting}
                          placeholder="exemple@email.com"
                          style={{ height: '45px' }}
                        />
                      </div>
                      {renderFieldError('email')}
                      {editingUser && (
                        <small className="form-text text-muted mt-2">
                          <FaCircle className="text-warning mr-1" size={8} />
                          L'email ne peut pas être modifié
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div className="mb-4">
                    <h6 className="font-weight-bold mb-3 d-flex align-items-center text-primary">
                      <FaLock className="mr-2" />
                      Sécurité
                    </h6>
                    
                    <div className="form-group">
                      <label className="font-weight-bold mb-2">
                        Mot de passe {!editingUser && <span className="text-danger">*</span>}
                      </label>
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text bg-light border-right-0">
                            <FaLock className="text-primary" />
                          </span>
                        </div>
                        <input
                          type="password"
                          className={`form-control border-left-0 ${errors.password ? 'is-invalid' : ''}`}
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          required={!editingUser}
                          disabled={submitting}
                          placeholder={editingUser ? "Laisser vide pour conserver le mot de passe actuel" : "Entrez le mot de passe"}
                          style={{ height: '45px' }}
                        />
                      </div>
                      {renderFieldError('password')}
                      {editingUser && (
                        <small className="form-text text-muted mt-2">
                          <FaCircle className="text-info mr-1" size={8} />
                          Laissez vide pour ne pas modifier le mot de passe
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Statut */}
                  <div className="mb-4">
                    <h6 className="font-weight-bold mb-3 d-flex align-items-center text-primary">
                      <FaCircle className="mr-2" />
                      Statut
                    </h6>
                    
                    <div className="form-group">
                      <select
                        className="form-control"
                        value={formData.statut}
                        onChange={(e) => setFormData({...formData, statut: e.target.value})}
                        disabled={submitting}
                        style={{ height: '45px' }}
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="bloqué">Bloqué</option>
                      </select>
                    </div>
                  </div>

                  {/* Section Rôles */}
                  <div className="mb-4">
                    <h6 className="font-weight-bold mb-3 d-flex align-items-center text-primary">
                      <FaUser className="mr-2" />
                      Rôles
                    </h6>
                    
                    {/* Sélecteur pour ajouter un rôle */}
                    <div className="mb-3">
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text bg-light border-right-0">
                            <FaPlus className="text-primary" />
                          </span>
                        </div>
                        <select
                          className="form-control border-left-0"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddRole(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          disabled={submitting}
                          style={{ height: '45px' }}
                        >
                          <option value="">Ajouter un rôle...</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.nom} - {role.description || 'Pas de description'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Liste des rôles sélectionnés */}
                    {formData.role_ids.length > 0 && (
                      <div className="selected-roles-container p-3 border rounded bg-light mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0 font-weight-bold">
                            Rôles attribués ({formData.role_ids.length})
                          </h6>
                        </div>
                        <div className="row">
                          {formData.role_ids.map(roleId => {
                            const role = roles.find(r => r.id === roleId);
                            return role ? (
                              <div key={roleId} className="col-md-6 mb-2">
                                <div className="d-flex align-items-center justify-content-between p-2 border rounded bg-white shadow-sm">
                                  <div>
                                    <strong>{role.nom}</strong>
                                    {role.description && (
                                      <div className="text-muted small">
                                        {role.description}
                                      </div>
                                    )}
                                  </div>
                                  <button 
                                    type="button"
                                    className="btn btn-sm btn-link text-danger p-0"
                                    onClick={() => handleRemoveRole(roleId)}
                                    disabled={submitting}
                                    style={{ minWidth: '30px' }}
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Liste de tous les rôles disponibles */}
                    <div>
                      <h6 className="mb-3 font-weight-bold">
                        Tous les rôles disponibles ({roles.length})
                      </h6>
                      <div className="row" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {roles.map(role => (
                          <div key={role.id} className="col-md-6 mb-2">
                            <div className="d-flex align-items-center justify-content-between p-2 border rounded bg-white">
                              <div>
                                <div className="font-weight-bold">{role.nom}</div>
                                {role.description && (
                                  <div className="text-muted small">
                                    {role.description}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                className={`btn btn-sm ${formData.role_ids.includes(role.id) ? 'btn-success' : 'btn-outline-primary'}`}
                                onClick={() => {
                                  if (formData.role_ids.includes(role.id)) {
                                    handleRemoveRole(role.id);
                                  } else {
                                    handleAddRole(role.id);
                                  }
                                }}
                                disabled={submitting}
                                style={{ minWidth: '70px' }}
                              >
                                {formData.role_ids.includes(role.id) ? (
                                  <>
                                    <FaCheck className="mr-1" size={10} />
                                    Ajouté
                                  </>
                                ) : (
                                  'Ajouter'
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="modal-footer border-0 bg-light py-3 px-4">
                  <button 
                    type="button" 
                    className="btn btn-light px-4" 
                    onClick={handleCloseModal}
                    disabled={submitting}
                    style={{ borderRadius: '8px', height: '45px' }}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary px-4"
                    disabled={submitting}
                    style={{ 
                      borderRadius: '8px', 
                      height: '45px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="fa-spin mr-2" />
                        {editingUser ? 'Mise à jour...' : 'Création...'}
                      </>
                    ) : (
                      editingUser ? 'Mettre à jour' : 'Créer l\'utilisateur'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .users-container {
          padding: 20px;
          background: #f8f9fa;
          min-height: calc(100vh - 76px);
        }
        
        .hover-lift {
          transition: all 0.2s;
        }
        
        .hover-lift:hover {
          background-color: #f8f9fa;
          transform: translateY(-1px);
        }
        
        .page-item.active .page-link {
          background: linear-gradient(45deg, #007bff, #6610f2);
          border-color: #007bff;
        }
        
        /* Stats cards backgrounds */
        .bg-success-light {
          background-color: rgba(40, 167, 69, 0.1) !important;
        }
        
        .bg-warning-light {
          background-color: rgba(255, 193, 7, 0.1) !important;
        }
        
        .bg-danger-light {
          background-color: rgba(220, 53, 69, 0.1) !important;
        }
        
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1050;
          overflow-y: auto;
        }
        
        .modal-dialog {
          margin: 50px auto;
          max-width: 800px;
        }
        
        .selected-roles-container {
          max-height: 200px;
          overflow-y: auto;
        }
        
        .invalid-feedback {
          display: flex;
          align-items: center;
          color: #dc3545;
          font-size: 0.875rem;
        }
        
        .page-link {
          border-radius: 8px;
          margin: 0 3px;
          color: #007bff;
          border: 1px solid #dee2e6;
          padding: 0.5rem 0.75rem;
        }
        
        .page-item.active .page-link {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          color: white;
        }
        
        .page-item.disabled .page-link {
          color: #6c757d;
          pointer-events: none;
          background: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .users-container {
            padding: 15px;
          }
          
          .table-responsive {
            font-size: 14px;
          }
          
          .btn-group-sm .btn {
            padding: 0.25rem 0.5rem;
          }
          
          .modal-dialog {
            margin: 20px auto;
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
};

export default UserScreen;