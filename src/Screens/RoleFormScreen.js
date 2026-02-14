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
  FaUserShield
} from 'react-icons/fa';
import { Link, useParams, useHistory } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';

const RoleForm = () => {
  const { id } = useParams();
  //const { id } = props.match.params;


  const history = useHistory();

  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const token = GetTokenOrRedirect();

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    permissions: []
  });

  /**
   * 🔹 Chargement initial propre (permissions + rôle si édition)
   */
  useEffect(() => {
    
    
    if (!token) return;
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const initializeData = async () => {
    try {
      setLoading(true);

      // 🔹 Charger toutes les permissions
      const permsResponse = await axios.get(`${API_BASE_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { all: true }
      });
      const perms = permsResponse?.data?.data?.data || [];
      setPermissions(perms);

      // 🔹 Charger rôle en mode édition
      if (id) {
        try {
          const roleResponse = await axios.get(`${API_BASE_URL}/roles/${id}/with-details`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const role = roleResponse?.data?.data;

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
      }
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les données initiales'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔹 Soumission formulaire (create / update)
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

  /** 🔹 Catégories permissions */
  const getCategories = () => {
    const categories = new Set();
    permissions.forEach((perm) => {
      if (perm?.code) categories.add(perm.code.split('_')[0]);
    });
    return Array.from(categories);
  };

  const PermissionCategory = ({ category }) => {
    const categoryPermissions = permissions.filter(
      (perm) => perm?.code?.toLowerCase().startsWith(category.toLowerCase())
    );

    if (categoryPermissions.length === 0) return null;

    return (
      <div className="permission-category mb-4">
        <h6 className="font-weight-bold text-uppercase text-muted mb-3">
          <FaKey className="mr-2" />
          {category.replace('_', ' ').toUpperCase()}
        </h6>

        <div className="row">
          {categoryPermissions.map((permission) => (
            <div key={permission.id} className="col-md-6 mb-3">
              <div
                className={`permission-item-card ${formData.permissions.includes(permission.id) ? 'selected' : ''
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
    );
  };

  if (loading) {
    return (
      <div className="role-form-page">
        <div className="text-center py-5">
          <FaSpinner className="fa-spin mb-3" size={32} />
          <p>Chargement du rôle...</p>
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

                  <div className="permissions-container">
                    {permissions.length > 0 ? (
                      getCategories().map((category) => (
                        <PermissionCategory key={category} category={category} />
                      ))
                    ) : (
                      <div className="alert alert-info">
                        <FaInfoCircle className="mr-2" /> Aucune permission disponible.
                      </div>
                    )}
                  </div>
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
                    formData.permissions.slice(0, 5).map((permId) => {
                      const perm = permissions.find((p) => p.id === permId);
                      return perm ? (
                        <div key={perm.id} className="mb-2">
                          <span className="badge badge-info">{perm.code}</span>
                        </div>
                      ) : null;
                    })
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
