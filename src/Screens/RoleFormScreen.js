import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  FaKey,
  FaInfoCircle,
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaUserShield,
  FaSearch,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { Link, useParams, useHistory } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';

const RoleForm = () => {
  const { id } = useParams();
  const history = useHistory();

  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // États pour la pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const token = GetTokenOrRedirect();

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    permissions: []
  });

  /**
   * 🔹 Charger les permissions avec pagination
   */
  const fetchPermissions = async (page = 1, search = '') => {
    try {
      const params = {
        page: page,
        per_page: pagination.per_page
      };
      
      if (search) {
        params.search = search;
      }

      const response = await axios.get(`${API_BASE_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });

      console.log("Réponse permissions:", response.data);
      
      // Adapter selon la structure de votre API
      if (response.data?.success && response.data?.data) {
        setPermissions(response.data.data.data || []);
        setPagination({
          current_page: response.data.data.current_page || page,
          last_page: response.data.data.last_page || 1,
          total: response.data.data.total || 0,
          per_page: response.data.data.per_page || 10
        });
      }
    } catch (error) {
      console.error('❌ Erreur chargement permissions:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les permissions'
      });
    }
  };

  /**
   * 🔹 Charger le rôle en mode édition
   */
  const fetchRole = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles/${id}/with-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const role = response?.data?.data;

      if (!role || !role.id) {
        Swal.fire({
          icon: 'error',
          title: 'Rôle non trouvé',
          text: 'Ce rôle n’existe pas ou a été supprimé.'
        });
        history.push('/gestion-utilisateurs/roles');
        return;
      }

      const permissionIds = Array.isArray(role.permissions)
        ? role.permissions.filter(p => p && p.id).map(p => p.id)
        : [];

      setFormData({
        nom: role.nom || '',
        description: role.description || '',
        permissions: permissionIds
      });
    } catch (err) {
      console.error('❌ Erreur chargement rôle:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger ce rôle'
      });
      history.push('/gestion-utilisateurs/roles');
    }
  };

  /**
   * 🔹 Chargement initial
   */
  useEffect(() => {
    if (!token) return;
    
    const initializeData = async () => {
      setLoading(true);
      try {
        // Charger les permissions avec pagination
        await fetchPermissions(1, '');
        
        // Charger le rôle si en mode édition
        if (id) {
          await fetchRole();
        }
      } catch (error) {
        console.error('❌ Erreur d\'initialisation:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [token, id]);

  /**
   * 🔹 Recharger les permissions quand la page ou la recherche change
   */
  useEffect(() => {
    if (token && !loading) {
      fetchPermissions(pagination.current_page, searchTerm);
    }
  }, [pagination.current_page, searchTerm]);

  /**
   * 🔹 Gestionnaire de recherche
   */
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  /**
   * 🔹 Changement de page
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setPagination(prev => ({ ...prev, current_page: newPage }));
    }
  };

  /**
   * 🔹 Soumission formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = ['Le nom du rôle est obligatoire'];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitting(false);
      return;
    }

    try {
      const dataToSend = {
        nom: formData.nom.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions
      };

      if (id) {
        await axios.put(`${API_BASE_URL}/roles/${id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire({
          icon: 'success',
          title: 'Succès !',
          text: 'Rôle mis à jour avec succès',
          timer: 2000,
          showConfirmButton: false
        });

        history.push('/gestion-utilisateurs/roles');
      } else {
        const response = await axios.post(`${API_BASE_URL}/roles`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          const newRoleId = response.data.data.id;

          Swal.fire({
            icon: 'success',
            title: 'Succès !',
            text: 'Rôle créé avec succès',
            timer: 2000,
            showConfirmButton: false
          });

          history.push(`/gestion-utilisateurs/roles/${newRoleId}`);
        } else {
          throw new Error('Réponse serveur invalide');
        }
      }
    } catch (error) {
      console.error('❌ Erreur:', error.response?.data || error.message);

      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});

        Swal.fire({
          icon: 'error',
          title: 'Erreur de validation',
          text: 'Veuillez corriger les erreurs dans le formulaire'
        });
      } else if (error.response?.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Accès refusé',
          text: "Vous n'avez pas la permission de modifier ce rôle"
        });
      } else if (error.response?.status === 404) {
        Swal.fire({
          icon: 'error',
          title: 'Non trouvé',
          text: "Le rôle n'existe pas"
        });
        history.push('/gestion-utilisateurs/roles');
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

  /** 🔹 Affichage erreurs champ */
  const renderFieldError = (fieldName) => {
    if (!errors[fieldName]) return null;

    return (
      <div className="invalid-feedback d-block">
        <FaExclamationCircle className="mr-1" />
        {Array.isArray(errors[fieldName]) ? errors[fieldName][0] : errors[fieldName]}
      </div>
    );
  };

  /** 🔹 Grouper les permissions par catégorie */
  const groupPermissionsByCategory = () => {
    const grouped = {};
    
    permissions.forEach(perm => {
      if (!perm?.code) return;
      
      const category = perm.code.split('_')[0] || 'Autres';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(perm);
    });
    
    return grouped;
  };

  const groupedPermissions = groupPermissionsByCategory();

  if (loading) {
    return (
      <div className="role-form-page">
        <div className="text-center py-5">
          <FaSpinner className="fa-spin mb-3" size={32} />
          <p>Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-form-page">
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h3 mb-0">
              <FaUserShield className="mr-2 text-primary" />
              {id ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
            </h2>
            <p className="text-muted mb-0">
              {id
                ? 'Modifiez les informations du rôle'
                : 'Définissez un nouveau rôle avec ses permissions'}
            </p>
          </div>

          <Link to="/gestion-utilisateurs/roles" className="btn btn-outline-secondary">
            <FaArrowLeft className="mr-1" /> Retour à la liste
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <h5 className="card-title mb-3">Informations du rôle</h5>

                  <div className="form-group">
                    <label className="font-weight-bold">
                      Nom du rôle <span className="text-danger">*</span>
                    </label>

                    <input
                      type="text"
                      className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      disabled={submitting || id === '1'}
                      required
                    />

                    {renderFieldError('nom')}
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">Description</label>

                    <textarea
                      className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                      rows="3"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      disabled={submitting}
                    />

                    {renderFieldError('description')}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">
                      <FaKey className="mr-2" /> Permissions
                    </h5>
                    <span className="badge badge-primary">
                      {formData.permissions.length} sélectionnée(s)
                    </span>
                  </div>

                  {/* Barre de recherche */}
                  <form onSubmit={handleSearch} className="mb-4">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher une permission..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                      />
                      <div className="input-group-append">
                        <button
                          type="submit"
                          className="btn btn-outline-primary"
                          disabled={loading}
                        >
                          <FaSearch />
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Liste des permissions groupées */}
                  <div className="permissions-container">
                    {Object.keys(groupedPermissions).length > 0 ? (
                      Object.entries(groupedPermissions).map(([category, perms]) => (
                        <div key={category} className="permission-category mb-4">
                          <h6 className="font-weight-bold text-uppercase text-muted mb-3">
                            <FaKey className="mr-2" />
                            {category.replace(/_/g, ' ').toUpperCase()}
                          </h6>

                          <div className="row">
                            {perms.map((permission) => (
                              <div key={permission.id} className="col-md-6 mb-3">
                                <div
                                  className={`permission-item-card p-3 border rounded ${formData.permissions.includes(permission.id) ? 'border-primary bg-light' : ''
                                    }`}
                                >
                                  <div className="d-flex align-items-start">
                                    <div className="mr-3 mt-1">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={formData.permissions.includes(permission.id)}
                                        onChange={(e) => {
                                          const newPermissions = e.target.checked
                                            ? [...formData.permissions, permission.id]
                                            : formData.permissions.filter((pid) => pid !== permission.id);
                                          setFormData({ ...formData, permissions: newPermissions });
                                        }}
                                        disabled={submitting || id === '1'}
                                      />
                                    </div>

                                    <div className="flex-grow-1">
                                      <label className="font-weight-bold mb-1 d-block cursor-pointer">
                                        {permission.code}
                                      </label>
                                      <p className="text-muted small mb-0">
                                        {permission.description || 'Aucune description'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="alert alert-info">
                        <FaInfoCircle className="mr-2" /> Aucune permission trouvée.
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {pagination.last_page > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div className="text-muted">
                        Page {pagination.current_page} sur {pagination.last_page}
                        {' '}({pagination.total} permission(s) au total)
                      </div>
                      <nav>
                        <ul className="pagination mb-0">
                          <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                            <button
                            type="button" 
                              className="page-link"
                              onClick={() => handlePageChange(pagination.current_page - 1)}
                              disabled={pagination.current_page === 1}
                            >
                              <FaChevronLeft /> Précédent
                            </button>
                          </li>
                          
                          {[...Array(pagination.last_page)].map((_, i) => {
                            const pageNum = i + 1;
                            // Afficher max 5 pages autour de la page courante
                            if (
                              pageNum === 1 ||
                              pageNum === pagination.last_page ||
                              (pageNum >= pagination.current_page - 2 && 
                               pageNum <= pagination.current_page + 2)
                            ) {
                              return (
                                <li
                                  key={pageNum}
                                  className={`page-item ${pagination.current_page === pageNum ? 'active' : ''}`}
                                >
                                  <button 
                                  type="button" 
                                    className="page-link"
                                    onClick={() => handlePageChange(pageNum)}
                                  >
                                    {pageNum}
                                  </button>
                                </li>
                              );
                            } else if (
                              pageNum === pagination.current_page - 3 ||
                              pageNum === pagination.current_page + 3
                            ) {
                              return (
                                <li key={`ellipsis-${pageNum}`} className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              );
                            }
                            return null;
                          })}
                          
                          <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                            <button
                            type="button" 
                              className="page-link"
                              onClick={() => handlePageChange(pagination.current_page + 1)}
                              disabled={pagination.current_page === pagination.last_page}
                            >
                              Suivant <FaChevronRight />
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-end border-top pt-4">
                  <Link
                    to="/gestion-utilisateurs/roles"
                    className="btn btn-outline-secondary mr-3"
                  >
                    Annuler
                  </Link>

                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <FaSpinner className="fa-spin mr-2" />
                        {id ? 'Mise à jour...' : 'Création...'}
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        {id ? 'Mettre à jour le rôle' : 'Créer le rôle'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="sticky-top" style={{ top: '20px' }}>
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-light">
                <h6 className="mb-0">Récapitulatif</h6>
              </div>

              <div className="card-body">
                <div className="mb-3">
                  <h6 className="text-muted mb-2">Nom du rôle</h6>
                  <p className="font-weight-bold">
                    {formData.nom || <span className="text-muted">Non défini</span>}
                  </p>
                </div>

                <div className="mb-3">
                  <h6 className="text-muted mb-2">Permissions sélectionnées</h6>

                  {formData.permissions.length > 0 ? (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {formData.permissions.map((permId) => {
                        // Chercher dans toutes les permissions chargées
                        const perm = permissions.find((p) => p.id === permId);
                        return perm ? (
                          <div key={perm.id} className="mb-2">
                            <span className="badge badge-info">{perm.code}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">Aucune permission sélectionnée</p>
                  )}
                </div>

                <div className="alert alert-light border mt-3">
                  <small>
                    <FaInfoCircle className="mr-1" />
                    <strong>Conseil :</strong> Sélectionnez uniquement les permissions nécessaires.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleForm;