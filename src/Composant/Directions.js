import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaSearch,
  FaBuilding,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaTimes,
  FaEye,
  FaSpinner,
  FaUsers,
  FaExclamationCircle,
  FaSync,
  FaFilter,
  FaCircle,
  FaTag
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from './getTokenOrRedirect';

const Directions = () => {
  const [directions, setDirections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDirection, setEditingDirection] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    directions_avec_utilisateurs: 0,
    total_affectations: 0
  });
  const [perPage, setPerPage] = useState(10);
  
  const token = GetTokenOrRedirect();

  const [formData, setFormData] = useState({
    sigle: '',
    nom: ''
  });

  // 🔹 Charger les données au montage et quand la page change
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, currentPage, perPage]);

  // 🔹 Obtenir les en-têtes d'authentification
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDirections(),
        loadDirectionStats()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      if (error.response?.status === 401) {
        return; // GetTokenOrRedirect gère déjà la redirection
      }
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les données'
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Charger les directions avec pagination API
  const fetchDirections = async () => {
    try {
      const params = {
        page: currentPage,
        per_page: perPage
      };

      if (search) {
        params.search = search;
      }

      const response = await axios.get(`${API_BASE_URL}/departements`, {
        headers: getAuthHeaders(),
        params: params
      });
      
      console.log('API Response Directions:', response.data);
      
      if (response.data && response.data.success) {
        const apiData = response.data.data;
        setDirections(apiData.data || []);
        setPagination({
          current_page: apiData.current_page || 1,
          last_page: apiData.last_page || 1,
          per_page: apiData.per_page || 10,
          total: apiData.total || 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement directions:', error);
      throw error;
    }
  };

  // 🔹 Charger les statistiques
  const loadDirectionStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/departements/stats/departement`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erreur stats directions:', error);
    }
  };

  // 🔹 Ajouter une direction
  const addDirection = async (directionData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/departements`, directionData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Erreur ajout direction:', error);
      throw error;
    }
  };

  // 🔹 Modifier une direction
  const updateDirection = async (id, directionData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/departements/${id}`, directionData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Erreur modification direction:', error);
      throw error;
    }
  };

  // 🔹 Supprimer une direction
  const deleteDirection = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/departements/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        return true;
      }
    } catch (error) {
      console.error('Erreur suppression direction:', error);
      throw error;
    }
  };

  // 🔹 Gérer la suppression avec confirmation API
  const handleDelete = async (direction) => {
    try {
      // Vérifier d'abord si la direction a des utilisateurs
      const response = await axios.get(
        `${API_BASE_URL}/departements/${direction.id}/with-details`,
        { headers: getAuthHeaders() }
      );
      
      const usersCount = response.data.data?.monutilisateurs?.length || 0;
      
      const result = await Swal.fire({
        title: 'Êtes-vous sûr ?',
        html: `
          <div>
            <p>Vous êtes sur le point de supprimer la direction :</p>
            <p><strong>${direction.sigle} - ${direction.nom}</strong></p>
            ${usersCount > 0 ? 
              `<p class="text-danger">⚠️ Cette direction est assignée à ${usersCount} utilisateur(s)</p>
               <p class="text-muted">Toutes les assignations seront également supprimées.</p>` 
              : ''}
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: usersCount > 0 ? 'Oui, tout supprimer' : 'Oui, supprimer',
        cancelButtonText: 'Annuler',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            await deleteDirection(direction.id);
            return true;
          } catch (error) {
            Swal.showValidationMessage(
              `Erreur: ${error.response?.data?.message || error.message}`
            );
            return false;
          }
        }
      });

      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Supprimé !',
          text: 'La direction a été supprimée.',
          timer: 2000,
          showConfirmButton: false
        });
        await fetchDirections();
      }
    } catch (error) {
      console.error('Erreur vérification utilisateurs:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de vérifier les utilisateurs'
      });
    }
  };

  // 🔹 Gérer l'ajout/modification
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    
    try {
      const dataToSend = {
        sigle: formData.sigle.trim().toUpperCase(),
        nom: formData.nom.trim()
      };

      if (editingDirection) {
        await updateDirection(editingDirection.id, dataToSend);
        Swal.fire({
          icon: 'success',
          title: 'Succès !',
          text: 'Direction mise à jour avec succès',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await addDirection(dataToSend);
        Swal.fire({
          icon: 'success',
          title: 'Succès !',
          text: 'Direction créée avec succès',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      setShowModal(false);
      resetForm();
      await fetchDirections(); // Recharger les directions après modification
    } catch (error) {
      console.error('Erreur soumission:', error);
      
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

  // 🔹 Remplir le formulaire d'édition
  const handleEdit = (direction) => {
    setEditingDirection(direction);
    setFormData({
      sigle: direction.sigle,
      nom: direction.nom
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      sigle: '',
      nom: ''
    });
    setEditingDirection(null);
    setErrors({});
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

  // 🔹 Gérer la recherche avec debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setCurrentPage(1); // Reset à la première page
  };

  // 🔹 Fonction de chargement IDENTIQUE à UserScreen
  const renderLoading = () => (
    <div className="text-center py-5">
      <FaSpinner className="fa-spin mb-3" size={32} />
      <p>Chargement des directions...</p>
    </div>
  );

  // 🔹 Pagination intelligente (comme UserScreen)
  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.last_page, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <nav className="d-flex justify-content-end">
        <ul className="pagination mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <FaChevronLeft />
            </button>
          </li>
          
          {startPage > 1 && (
            <>
              <li className="page-item">
                <button 
                  className="page-link"
                  onClick={() => setCurrentPage(1)}
                  disabled={loading}
                >
                  1
                </button>
              </li>
              {startPage > 2 && <li className="page-item disabled"><span className="page-link">...</span></li>}
            </>
          )}
          
          {pages.map(page => (
            <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
              <button 
                className="page-link"
                onClick={() => setCurrentPage(page)}
                disabled={loading}
              >
                {page}
              </button>
            </li>
          ))}
          
          {endPage < pagination.last_page && (
            <>
              {endPage < pagination.last_page - 1 && <li className="page-item disabled"><span className="page-link">...</span></li>}
              <li className="page-item">
                <button 
                  className="page-link"
                  onClick={() => setCurrentPage(pagination.last_page)}
                  disabled={loading}
                >
                  {pagination.last_page}
                </button>
              </li>
            </>
          )}
          
          <li className={`page-item ${currentPage === pagination.last_page ? 'disabled' : ''}`}>
            <button 
              className="page-link"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.last_page || loading}
            >
              <FaChevronRight />
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  // 🔹 Gérer le changement d'éléments par page
  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value);
    setPerPage(newPerPage);
    setCurrentPage(1); // Retour à la première page
  };

  return (
    <div className="directions-container">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h3 mb-0">
                <FaBuilding className="mr-2 text-primary" />
                Gestion des Directions
              </h2>
              <p className="text-muted mb-0">
                Gérez les directions et leurs assignations
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
                disabled={loading || submitting}
              >
                <FaPlus className="mr-1" />
                Nouvelle Direction
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-4 mb-3 mb-md-0">
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text bg-white border-right-0">
                    <FaSearch className="text-muted" />
                  </span>
                </div>
                <input
                  type="text"
                  className="form-control border-left-0"
                  placeholder="Rechercher par sigle ou nom..."
                  value={search}
                  onChange={handleSearch}
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
                  value={perPage}
                  onChange={handlePerPageChange}
                  disabled={loading}
                >
                  <option value="5">5 par page</option>
                  <option value="10">10 par page</option>
                  <option value="20">20 par page</option>
                  <option value="50">50 par page</option>
                </select>
              </div>
            </div>
            
            <div className="col-md-4 text-right">
              <div className="d-flex align-items-center justify-content-end">
                <button 
                  className="btn btn-outline-secondary btn-sm mr-2"
                  onClick={() => {
                    setLoading(true);
                    fetchDirections().finally(() => setLoading(false));
                  }}
                  disabled={loading}
                  title="Rafraîchir"
                >
                  <FaSync className={loading ? 'fa-spin' : ''} />
                </button>
                <span className="badge badge-light p-2">
                  {pagination.total} direction(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="row mb-4">
        <div className="col-md-4 col-6 mb-3">
          <div className="card border-0 bg-light shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaBuilding className="text-primary" size={24} />
              </div>
              <h3 className="mb-0">{stats.total || pagination.total}</h3>
              <p className="text-muted mb-0">Directions</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 col-6 mb-3">
          <div className="card border-0 bg-success-light shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaUsers className="text-success" size={24} />
              </div>
              <h3 className="mb-0">
                {stats.directions_avec_utilisateurs || 0}
              </h3>
              <p className="text-muted mb-0">Directions assignées</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 col-12 mb-3">
          <div className="card border-0 bg-info-light shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaUsers className="text-info" size={24} />
              </div>
              <h3 className="mb-0">
                {stats.total_affectations || 0}
              </h3>
              <p className="text-muted mb-0">Assignations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des directions - Loading IDENTIQUE à UserScreen */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="thead-light">
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Sigle</th>
                  <th>Nom de la direction</th>
                  <th>Utilisateurs</th>
                  <th>Date de création</th>
                  <th style={{ width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      {renderLoading()}
                    </td>
                  </tr>
                ) : directions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="py-4">
                        <FaBuilding className="text-muted mb-3" size={48} />
                        <h4 className="text-muted mb-2">Aucune direction trouvée</h4>
                        <p className="text-muted">
                          {search ? 'Essayez avec d\'autres termes de recherche' : 'Commencez par créer votre première direction'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  directions.map((direction, index) => (
                    <tr key={direction.id} className="hover-lift">
                      <td className="text-muted">
                        {(currentPage - 1) * pagination.per_page + index + 1}
                      </td>
                      <td>
                        <span className="badge badge-primary badge-pill px-3 py-2">
                          <strong>{direction.sigle}</strong>
                        </span>
                      </td>
                      <td>
                        <div>
                          <div className="font-weight-bold">{direction.nom}</div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaUsers className="mr-2 text-muted" />
                          <span className="badge badge-info">
                            {direction.monutilisateurs_count || 0} utilisateur(s)
                          </span>
                        </div>
                      </td>
                      <td className="text-muted">
                        {direction.datecreation ? 
                          format(new Date(direction.datecreation), 'dd/MM/yyyy', { locale: fr }) 
                          : 'N/A'}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link 
                            to={`/gestion-utilisateurs/directions/${direction.id}`}
                            className="btn btn-outline-info"
                            title="Voir détails"
                          >
                            <FaEye />
                          </Link>
                          <button 
                            className="btn btn-outline-warning"
                            onClick={() => handleEdit(direction)}
                            title="Modifier"
                            disabled={loading}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(direction)}
                            title="Supprimer"
                            disabled={loading}
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
        </div>
        
        {/* Pagination */}
        {!loading && pagination.last_page > 1 && (
          <div className="card-footer border-top">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="text-muted">
                  Affichage de {((currentPage - 1) * pagination.per_page) + 1} à{' '}
                  {Math.min(currentPage * pagination.per_page, pagination.total)} sur{' '}
                  {pagination.total} directions
                </div>
              </div>
              <div className="col-md-6">
                {renderPagination()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal pour ajouter/modifier une direction */}
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
    onClick={(e) => {
      if (e.target.classList.contains('modal')) {
        setShowModal(false);
      }
    }}
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
              {editingDirection ? <FaEdit className="text-white" size={18} /> : <FaPlus className="text-white" size={18} />}
            </div>
            {editingDirection ? 'Modifier la direction' : 'Nouvelle Direction'}
          </h5>
          <button 
            type="button" 
            className="btn btn-sm btn-light position-absolute"
            onClick={() => setShowModal(false)}
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
          <div className="modal-body p-4">
            
            {/* Informations de la direction */}
            <div className="mb-4">
              <h6 className="font-weight-bold mb-3 d-flex align-items-center text-primary">
                <FaBuilding className="mr-2" />
                Informations de la direction
              </h6>
              
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="form-group">
                    <label className="font-weight-bold mb-2 d-flex align-items-center">
                      <FaTag className="text-primary mr-2" size={14} />
                      Sigle <span className="text-danger ml-1">*</span>
                    </label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text bg-light border-right-0">
                          <FaTag className="text-primary" />
                        </span>
                      </div>
                      <input
                        type="text"
                        className={`form-control border-left-0 ${errors.sigle ? 'is-invalid' : ''}`}
                        value={formData.sigle}
                        onChange={(e) => {
                          setFormData({...formData, sigle: e.target.value.toUpperCase()});
                          if (errors.sigle) setErrors({...errors, sigle: undefined});
                        }}
                        placeholder="Ex: DRH"
                        maxLength="10"
                        disabled={submitting}
                        style={{ height: '45px' }}
                      />
                    </div>
                    {renderFieldError('sigle')}
                    <small className="text-muted d-block mt-2">
                      <FaCircle className="text-info mr-1" size={8} />
                      Maximum 10 caractères
                    </small>
                  </div>
                </div>

                <div className="col-md-8 mb-3">
                  <div className="form-group">
                    <label className="font-weight-bold mb-2 d-flex align-items-center">
                      <FaBuilding className="text-primary mr-2" size={14} />
                      Nom complet <span className="text-danger ml-1">*</span>
                    </label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text bg-light border-right-0">
                          <FaBuilding className="text-primary" />
                        </span>
                      </div>
                      <input
                        type="text"
                        className={`form-control border-left-0 ${errors.nom ? 'is-invalid' : ''}`}
                        value={formData.nom}
                        onChange={(e) => {
                          setFormData({...formData, nom: e.target.value});
                          if (errors.nom) setErrors({...errors, nom: undefined});
                        }}
                       
                        placeholder="Ex: Direction des Ressources Humaines"
                        maxLength="100"
                        disabled={submitting}
                        style={{ height: '45px' }}
                      />
                    </div>
                    {renderFieldError('nom')}
                  </div>
                </div>
              </div>
            </div>

            {/* Informations supplémentaires pour l'édition */}
            {editingDirection && (
              <div className="mb-4">
                <div className="alert alert-info border-0 bg-info-light d-flex align-items-center p-3" style={{ borderRadius: '12px' }}>
                  <div className="rounded-circle bg-info bg-opacity-25 p-3 mr-3 d-flex align-items-center justify-content-center">
                    <FaUsers className="text-info" size={20} />
                  </div>
                  <div>
                    <strong className="d-block">Informations sur les utilisateurs</strong>
                    <span>
                      Cette direction a <strong className="text-info">{editingDirection.monutilisateurs_count || 0}</strong> utilisateur(s) assigné(s)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Aperçu en temps réel */}
            <div className="mb-4">
              <h6 className="font-weight-bold mb-3 d-flex align-items-center text-primary">
                <FaEye className="mr-2" />
                Aperçu
              </h6>
              <div className="p-3 border rounded bg-light" style={{ borderRadius: '12px' }}>
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center mr-3" 
                    style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <FaBuilding className="text-white" size={20} />
                  </div>
                  <div>
                    <h5 className="mb-1 font-weight-bold">
                      {formData.nom || 'Nom de la direction'}
                    </h5>
                    <span className="badge badge-primary p-2">
                      {formData.sigle || 'SIGLE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 bg-light py-3 px-4">
            <button 
              type="button" 
              className="btn btn-light px-4" 
              onClick={() => setShowModal(false)}
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
                  {editingDirection ? 'Mise à jour...' : 'Création...'}
                </>
              ) : (
                editingDirection ? 'Mettre à jour' : 'Créer la direction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>

    <style jsx>{`
      .modal-content {
        border-radius: 16px;
        animation: modalFadeIn 0.3s ease;
      }
      
      @keyframes modalFadeIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .modal-header {
        border-radius: 16px 16px 0 0;
      }
      
      .input-group-text {
        border-radius: 10px 0 0 10px;
        background-color: #f8f9fa;
      }
      
      .form-control {
        border-radius: 0 10px 10px 0;
        border: 1px solid #e0e0e0;
      }
      
      .form-control:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
      }
      
      .btn {
        transition: all 0.2s ease;
      }
      
      .btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      }
      
      .bg-opacity-25 {
        opacity: 0.25;
      }
      
      .bg-gradient-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      .bg-info-light {
        background-color: rgba(23, 162, 184, 0.1);
      }
      
      .alert-info {
        border-left: 4px solid #17a2b8;
      }
      
      .badge {
        font-size: 0.9rem;
        padding: 0.5rem 1rem;
      }
      
      @media (max-width: 768px) {
        .modal-dialog {
          margin: 20px auto;
          width: 95%;
        }

      }

        .directions-container {
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
        
        .bg-success-light {
          background-color: rgba(40, 167, 69, 0.1) !important;
        }
        
        .bg-info-light {
          background-color: rgba(23, 162, 184, 0.1) !important;
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }
        
        @media (max-width: 768px) {
          .directions-container {
            padding: 15px;
          }
          
          .table-responsive {
            font-size: 14px;
          }
          
          .btn-group-sm .btn {
            padding: 0.25rem 0.5rem;
          }
          
          .modal-dialog {
            margin: 10px;
            width: calc(100% - 20px);
          }
        }
    `}</style>
  </div>
)}

      
    </div>
  );
};

export default Directions;