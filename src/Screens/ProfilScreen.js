// screens/ProfilScreen.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams, useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { 
  FaUserCircle, 
  FaEnvelope, 
  FaBuilding, 
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaEdit,
  FaArrowLeft,
  FaShieldAlt,
  FaIdCard,
  FaUser,
  FaSpinner,
  FaDownload,
  FaPrint,
  FaShare,
  FaFileAlt,
  FaFolderOpen,
  FaChartPie,
  FaClock,
  FaHistory,
  FaFileSignature,
  FaExclamationCircle,
  FaCamera,
  FaTimes,
  FaSave,
  FaKey,
  FaCheckDouble,
  FaLockOpen
} from "react-icons/fa";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";

const ProfilScreen = () => {
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur")) || {};
  const id = utilisateur?.id || "";
  const history = useHistory();
  const token = GetTokenOrRedirect();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 🔹 ÉTATS POUR LA MODIFICATION DIRECTE DE L'AVATAR
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // 🔹 État du formulaire pour le modal
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    current_password: "", // 🔹 NOUVEAU : ancien mot de passe
    password: "",
    password_confirmation: "",
    avatar: null
  });

  // 🔹 État des erreurs
  const [errors, setErrors] = useState({});

  // 🔹 Statistiques utilisateur
  const [userStats, setUserStats] = useState({
    total_documents: 0,
    documents_mois: 0,
    dernier_activite: null
  });

  // 🔹 ID utilisateur avec fallback 17
  const userId = id || 17;

  // 🔹 Charger les données utilisateur depuis l'API
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [userId, token]);

  // 🔹 Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  // 🔹 Mettre à jour le formulaire quand les données utilisateur sont chargées
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        current_password: "", // 🔹 NOUVEAU
        password: "",
        password_confirmation: "",
        avatar: null
      }));
    }
  }, [user]);

  // 🔹 Obtenir les en-têtes d'authentification
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  });

  // 🔹 Récupérer le profil utilisateur
  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/profil/afficher/${userId}`,
        { headers: getAuthHeaders() }
      );
      
      console.log("Profil chargé:", response.data);
      
      if (response.data && response.data.success) {
        setUser(response.data.data);
        
        setUserStats({
          total_documents: Math.floor(Math.random() * 200) + 50,
          documents_mois: Math.floor(Math.random() * 30) + 5,
          dernier_activite: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error);
      
      if (error.response?.status === 401) {
        return;
      }
      
      if (error.response?.status === 404) {
        Swal.fire({
          icon: "error",
          title: "Utilisateur non trouvé",
          text: "Ce profil n'existe pas ou a été supprimé",
          confirmButtonColor: "#3085d6"
        }).then(() => {
          history.push("/gestion-utilisateurs/utilisateurs");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Impossible de charger le profil utilisateur",
          confirmButtonColor: "#3085d6"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Rafraîchir le profil après modification
  const refreshUserProfile = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/profil/afficher/${user.id}?t=${Date.now()}`,
        { headers: getAuthHeaders() }
      );
      
      if (response.data && response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error("Erreur rafraîchissement profil:", error);
    }
  };

  // 🔹 UPLOAD DIRECT DE L'AVATAR - SANS MODAL
  const handleDirectAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      Swal.fire('Format non supporté', 'Utilisez JPG, PNG ou GIF', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire('Fichier trop volumineux', 'Maximum 2MB', 'error');
      return;
    }

    // Aperçu immédiat
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    setUploadingAvatar(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('_method', 'PUT');
      formDataToSend.append('avatar', file);

      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/profil/modifier/${user.id}`,
        data: formDataToSend,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        await refreshUserProfile();
        setAvatarPreview(null);
        
        // Notification toast
        Swal.fire({
          icon: 'success',
          title: 'Photo mise à jour',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    } catch (error) {
      console.error("Erreur upload avatar:", error);
      Swal.fire('Erreur', 'Impossible de modifier la photo', 'error');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      e.target.value = ''; // Reset input
    }
  };

  // 🔹 Gérer les changements dans le formulaire (modal)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 🔹 Gérer le changement d'avatar (modal)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          avatar: "Format d'image non supporté. Utilisez JPG, PNG ou GIF"
        }));
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          avatar: "L'image ne doit pas dépasser 2MB"
        }));
        return;
      }

      setFormData(prev => ({ ...prev, avatar: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      if (errors.avatar) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.avatar;
          return newErrors;
        });
      }
    }
  };

  // 🔹 Supprimer l'avatar sélectionné (modal)
  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatar: null }));
    setAvatarPreview(null);
    document.getElementById('avatar-input').value = '';
  };

  // 🔹 Soumettre le formulaire (modal) - AVEC ANCIEN MOT DE PASSE OBLIGATOIRE
 const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    if (!user) {
      setSubmitting(false);
      return;
    }

    // 🔹 VALIDATION SPÉCIALE POUR LE MOT DE PASSE
    if (formData.password || formData.password_confirmation) {
      // Vérifier que l'ancien mot de passe est fourni
      if (!formData.current_password) {
        setErrors(prev => ({
          ...prev,
          current_password: "L'ancien mot de passe est requis pour changer le mot de passe"
        }));
        setSubmitting(false);
        return;
      }

      // Vérifier que les mots de passe correspondent
      if (formData.password !== formData.password_confirmation) {
        setErrors(prev => ({
          ...prev,
          password_confirmation: "Les mots de passe ne correspondent pas"
        }));
        setSubmitting(false);
        return;
      }

      // Vérifier la longueur minimale
      if (formData.password.length < 6) {
        setErrors(prev => ({
          ...prev,
          password: "Le mot de passe doit contenir au moins 6 caractères"
        }));
        setSubmitting(false);
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('_method', 'PUT');
      
      // 🔹 TOUJOURS ENVOYER L'ANCIEN MOT DE PASSE SI NOUVEAU MOT DE PASSE FOURNI
      if (formData.password) {
        formDataToSend.append('current_password', formData.current_password);
        formDataToSend.append('password', formData.password);
        // 🔥 AJOUTER PASSWORD_CONFIRMATION ICI 🔥
        formDataToSend.append('password_confirmation', formData.password_confirmation);
        
        console.log('Données mot de passe envoyées:', {
          current_password: formData.current_password,
          password: formData.password,
          password_confirmation: formData.password_confirmation
        });
      }
      
      // Autres champs
      if (formData.nom !== user.nom) {
        formDataToSend.append('nom', formData.nom);
      }
      if (formData.prenom !== user.prenom) {
        formDataToSend.append('prenom', formData.prenom);
      }
      if (formData.email !== user.email) {
        formDataToSend.append('email', formData.email);
      }
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }

      // 🔍 DEBUG: Afficher toutes les données envoyées
      console.log('=== DONNÉES ENVOYÉES AU BACKEND ===');
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      console.log('====================================');

      // Vérifier s'il y a des modifications
      if (Array.from(formDataToSend.entries()).length <= 1) {
        Swal.fire({
          icon: "info",
          title: "Aucune modification",
          text: "Vous n'avez apporté aucune modification",
          confirmButtonColor: "#3085d6"
        });
        setSubmitting(false);
        return;
      }

      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/profil/modifier/${user.id}`,
        data: formDataToSend,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
          'X-HTTP-Method-Override': 'PUT'
        }
      });

      if (response.data && response.data.success) {
        await refreshUserProfile();
        setAvatarPreview(null);

        Swal.fire({
          icon: "success",
          title: "Succès!",
          text: response.data.message || "Profil mis à jour avec succès",
          confirmButtonColor: "#3085d6",
          timer: 2000
        });

        setShowModal(false);
        setFormData(prev => ({
          ...prev,
          current_password: "",
          password: "",
          password_confirmation: "",
          avatar: null
        }));
      }
    } catch (error) {
      console.error("Erreur modification profil:", error);
      
      if (error.response?.status === 422) {
        // 🔹 GÉRER L'ERREUR "ANCIEN MOT DE PASSE INCORRECT"
        const serverErrors = error.response.data.errors || {};
        
        console.log('Erreurs serveur:', serverErrors); // 🔍 DEBUG
        
        if (serverErrors.current_password) {
          setErrors(prev => ({
            ...prev,
            current_password: serverErrors.current_password[0]
          }));
        }
        
        if (serverErrors.password) {
          setErrors(prev => ({
            ...prev,
            password: serverErrors.password[0]
          }));
        }
        
        if (serverErrors.password_confirmation) {
          setErrors(prev => ({
            ...prev,
            password_confirmation: serverErrors.password_confirmation[0]
          }));
        }
        
        // Si c'est une erreur de confirmation
        if (serverErrors.password && serverErrors.password[0].includes('confirmation')) {
          Swal.fire({
            icon: "error",
            title: "Erreur de validation",
            text: "Les mots de passe ne correspondent pas",
            confirmButtonColor: "#3085d6"
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Erreur de validation",
            text: serverErrors.current_password?.[0] || "Veuillez corriger les erreurs",
            confirmButtonColor: "#3085d6"
          });
        }
      } else if (error.response?.status === 401) {
        setErrors(prev => ({
          ...prev,
          current_password: "L'ancien mot de passe est incorrect"
        }));
        Swal.fire({
          icon: "error",
          title: "Mot de passe incorrect",
          text: "L'ancien mot de passe fourni est incorrect",
          confirmButtonColor: "#3085d6"
        });
      } else if (error.response?.status === 404) {
        Swal.fire({
          icon: "error",
          title: "Utilisateur non trouvé",
          text: `Ce profil (ID: ${user.id}) n'existe plus`,
          confirmButtonColor: "#3085d6"
        }).then(() => {
          setShowModal(false);
          fetchUserProfile();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: error.response?.data?.message || "Impossible de modifier le profil",
          confirmButtonColor: "#3085d6"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 🔹 Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch {
      return "N/A";
    }
  };

  // 🔹 Formater la date courte
  const formatShortDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
    } catch {
      return "N/A";
    }
  };

  // 🔹 Temps relatif
  const timeAgo = (dateString) => {
    if (!dateString) return "Jamais";
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: fr 
      });
    } catch {
      return "N/A";
    }
  };

  // 🔹 Obtenir le badge de statut
  const getStatusBadge = (statut) => {
    const config = {
      active: { color: "success", icon: FaCheckCircle, text: "Actif" },
      inactive: { color: "warning", icon: FaTimesCircle, text: "Inactif" },
      bloqué: { color: "danger", icon: FaLock, text: "Bloqué" }
    };
    
    const { color, icon: Icon, text } = config[statut] || config.active;
    
    return (
      <span className={`badge badge-${color} badge-pill px-3 py-2 d-inline-flex align-items-center`}>
        <Icon className="mr-1" size={14} />
        {text}
      </span>
    );
  };

  // 🔹 Obtenir l'icône du département
  const getDepartmentIcon = (sigle) => {
    const icons = {
      "DF": <FaBuilding className="text-warning" />,
      "DRH": <FaBuilding className="text-success" />,
      "DANTIC": <FaBuilding className="text-primary" />,
      "DIRECOUV": <FaBuilding className="text-info" />,
      "DIRAJUP": <FaBuilding className="text-purple" />
    };
    return icons[sigle] || <FaBuilding className="text-secondary" />;
  };

  // 🔹 Obtenir la couleur du département
  const getDepartmentColor = (sigle) => {
    const colors = {
      "DF": "warning",
      "DRH": "success",
      "DANTIC": "primary",
      "DIRECOUV": "info",
      "DIRAJUP": "purple"
    };
    return colors[sigle] || "secondary";
  };

  // 🔹 Initiales de l'utilisateur
  const getUserInitials = () => {
    if (!user) return "?";
    return `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();
  };

  // 🔹 Fermer le modal
  const handleCloseModal = () => {
    setShowModal(false);
    setErrors({});
    setAvatarPreview(null);
    if (user) {
      setFormData(prev => ({
        ...prev,
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        current_password: "",
        password: "",
        password_confirmation: "",
        avatar: null
      }));
    }
  };

  // 🔹 Composant d'erreur de champ
  const FieldError = ({ error }) => {
    if (!error) return null;
    return (
      <div className="invalid-feedback d-block">
        <FaExclamationCircle className="mr-1" size={12} />
        {Array.isArray(error) ? error[0] : error}
      </div>
    );
  };

  // 🔹 Chargement
  if (loading) {
    return (
      <div style={{ backgroundColor: "whiteSmoke", minHeight: "100vh" }}>
        <Menus />
        <Head />
        <div className="content-wrapper">
          <div className="content-header">
            <div className="container-fluid">
              <div className="text-center py-5">
                <div className="spinner-wrapper mb-4">
                  <FaSpinner className="fa-spin text-primary" size={48} />
                </div>
                <h4 className="text-dark mb-2">Chargement du profil...</h4>
                <p className="text-muted mb-0">Veuillez patienter</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🔹 Utilisateur non trouvé
  if (!user) {
    return (
      <div style={{ backgroundColor: "whiteSmoke", minHeight: "100vh" }}>
        <Menus />
        <Head />
        <div className="content-wrapper">
          <div className="content-header">
            <div className="container-fluid">
              <div className="text-center py-5">
                <FaExclamationCircle className="text-danger mb-3" size={64} />
                <h4 className="text-dark mb-2">Utilisateur non trouvé</h4>
                <p className="text-muted mb-4">Ce profil n'existe pas ou a été supprimé</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => history.push("/gestion-utilisateurs/utilisateurs")}
                >
                  <FaArrowLeft className="mr-2" />
                  Retour à la liste
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "whiteSmoke", minHeight: "100vh" }}>
      <Menus />
      <Head />
      
      <div className="content-wrapper">
        <div className="content-header">
          <div className="container-fluid">
            
            {/* HEADER DU PROFIL */}
            <div className="profile-header mb-4">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <div className="d-flex align-items-center">
                    <button 
                      className="btn btn-light border rounded-circle p-3 mr-3"
                      onClick={() => history.goBack()}
                      title="Retour"
                    >
                      <FaArrowLeft className="text-primary" size={20} />
                    </button>
                    <div>
                      <h1 className="h2 mb-1 font-weight-bold">
                        Profil Utilisateur
                      </h1>
                      <p className="text-muted mb-0">
                        <FaUser className="mr-1" size={14} />
                        ID: {user.id} • Membre depuis {formatDate(user.datecreation)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 text-lg-right mt-3 mt-lg-0">
                  <button 
                    className="btn btn-primary mr-2"
                    onClick={() => setShowModal(true)}
                  >
                    <FaEdit className="mr-2" />
                    Modifier le profil
                  </button>
                  <button className="btn btn-outline-secondary">
                    <FaDownload className="mr-2" />
                    Exporter
                  </button>
                </div>
              </div>
            </div>

            {/* CARTE DE PROFIL PRINCIPALE */}
            <div className="row">
              <div className="col-lg-4 mb-4">
                <div className="profile-card card border-0 shadow-sm">
                  <div className="card-body text-center p-4">
                    
                    {/* AVATAR AVEC UPLOAD DIRECT AU CLIC */}
                    <div className="profile-avatar-wrapper mb-4">
                      <div 
                        className="avatar-upload-container"
                        onClick={() => document.getElementById('avatar-direct-upload').click()}
                        style={{ cursor: 'pointer' }}
                      >
                        {avatarPreview ? (
                          <img 
                            src={avatarPreview} 
                            alt="Aperçu"
                            className="profile-avatar rounded-circle mx-auto"
                            style={{ objectFit: 'cover', width: '120px', height: '120px' }}
                          />
                        ) : user.avatar_url ? (
                          <img 
                            src={`${user.avatar_url}?t=${Date.now()}`}
                            alt={`${user.prenom} ${user.nom}`}
                            className="profile-avatar rounded-circle mx-auto"
                            style={{ objectFit: 'cover', width: '120px', height: '120px' }}
                            onError={(e) => {
                              console.error("Erreur chargement avatar:", user.avatar_url);
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML += `
                                <div class="profile-avatar bg-gradient-${user.couleur_avatar || 'primary'} rounded-circle mx-auto d-flex align-items-center justify-content-center"
                                     style="width:120px;height:120px;font-size:48px;">
                                  ${getUserInitials()}
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className={`profile-avatar bg-gradient-${user.couleur_avatar || 'primary'} rounded-circle mx-auto d-flex align-items-center justify-content-center`}
                               style={{ width: '120px', height: '120px', fontSize: '48px' }}>
                            {getUserInitials()}
                          </div>
                        )}

                        {/* OVERLAY CAMERA AU SURVOL */}
                        <div className="avatar-overlay">
                          <FaCamera size={24} />
                          <span>Changer la photo</span>
                        </div>

                        {/* LOADER PENDANT UPLOAD */}
                        {uploadingAvatar && (
                          <div className="avatar-uploading">
                            <FaSpinner className="fa-spin" size={32} />
                          </div>
                        )}
                      </div>

                      {/* INPUT FILE CACHÉ */}
                      <input 
                        type="file"
                        id="avatar-direct-upload"
                        ref={fileInputRef}
                        accept="image/jpeg,image/png,image/jpg,image/gif"
                        onChange={handleDirectAvatarUpload}
                        style={{ display: 'none' }}
                      />

                      <div className="profile-status-badge">
                        {getStatusBadge(user.statut)}
                      </div>
                    </div>
                    
                    {/* NOM ET EMAIL */}
                    <h3 className="font-weight-bold mb-1">
                      {user.prenom} {user.nom}
                    </h3>
                    <p className="text-muted mb-3">
                      <FaEnvelope className="mr-1" size={14} />
                      {user.email}
                    </p>
                    
                    {/* STATISTIQUES RAPIDES */}
                    <div className="d-flex justify-content-center mb-4">
                      <div className="px-3 text-center">
                        <div className="h5 mb-0 font-weight-bold">{user.roles?.length || 0}</div>
                        <small className="text-muted">Rôle(s)</small>
                      </div>
                      <div className="px-3 text-center border-left">
                        <div className="h5 mb-0 font-weight-bold">{user.departements?.length || 0}</div>
                        <small className="text-muted">Direction(s)</small>
                      </div>
                      <div className="px-3 text-center border-left">
                        <div className="h5 mb-0 font-weight-bold">{userStats.total_documents}</div>
                        <small className="text-muted">Documents</small>
                      </div>
                    </div>

                    <div className="profile-actions d-flex justify-content-center">
                      <button className="btn btn-outline-primary btn-sm mx-1">
                        <FaPrint className="mr-1" size={12} />
                        Imprimer
                      </button>
                      <button className="btn btn-outline-secondary btn-sm mx-1">
                        <FaShare className="mr-1" size={12} />
                        Partager
                      </button>
                    </div>
                  </div>
                </div>

                {/* INFORMATIONS COMPLÉMENTAIRES */}
                <div className="card border-0 shadow-sm mt-4">
                  <div className="card-header bg-white border-0 py-3">
                    <h6 className="mb-0 font-weight-bold">
                      <FaClock className="mr-2 text-primary" />
                      Activité récente
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="activity-icon bg-primary-soft rounded-circle p-2 mr-3">
                        <FaFileAlt className="text-primary" size={16} />
                      </div>
                      <div>
                        <p className="mb-0 font-weight-medium">Dernier document</p>
                        <small className="text-muted">
                          {timeAgo(userStats.dernier_activite)}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="activity-icon bg-success-soft rounded-circle p-2 mr-3">
                        <FaCalendarAlt className="text-success" size={16} />
                      </div>
                      <div>
                        <p className="mb-0 font-weight-medium">Inscription</p>
                        <small className="text-muted">
                          {formatDate(user.datecreation)}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLONNE PRINCIPALE - INFORMATIONS DÉTAILLÉES */}
              <div className="col-lg-8 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 py-3">
                    <ul className="nav nav-tabs card-header-tabs">
                      <li className="nav-item">
                        <a 
                          className={`nav-link ${activeTab === "info" ? "active" : ""}`}
                          href="#"
                          onClick={(e) => { e.preventDefault(); setActiveTab("info"); }}
                        >
                          <FaIdCard className="mr-2" />
                          Informations
                        </a>
                      </li>
                      <li className="nav-item">
                        <a 
                          className={`nav-link ${activeTab === "departements" ? "active" : ""}`}
                          href="#"
                          onClick={(e) => { e.preventDefault(); setActiveTab("departements"); }}
                        >
                          <FaBuilding className="mr-2" />
                          Directions ({user.departements?.length || 0})
                        </a>
                      </li>
                      <li className="nav-item">
                        <a 
                          className={`nav-link ${activeTab === "roles" ? "active" : ""}`}
                          href="#"
                          onClick={(e) => { e.preventDefault(); setActiveTab("roles"); }}
                        >
                          <FaShieldAlt className="mr-2" />
                          Rôles ({user.roles?.length || 0})
                        </a>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="card-body p-4">
                    {/* ONGLET INFORMATIONS */}
                    {activeTab === "info" && (
                      <div className="profile-info-tab">
                        <h6 className="font-weight-bold mb-4 pb-2 border-bottom">
                          <FaUserCircle className="mr-2 text-primary" />
                          Informations personnelles
                        </h6>
                        
                        <div className="row mb-4">
                          <div className="col-md-6 mb-3">
                            <label className="text-muted small d-block mb-1">
                              <FaUser className="mr-1" size={12} />
                              Nom complet
                            </label>
                            <p className="h6 mb-0 font-weight-medium">
                              {user.prenom} {user.nom}
                            </p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="text-muted small d-block mb-1">
                              <FaEnvelope className="mr-1" size={12} />
                              Email
                            </label>
                            <p className="h6 mb-0 font-weight-medium">
                              {user.email}
                            </p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="text-muted small d-block mb-1">
                              <FaIdCard className="mr-1" size={12} />
                              ID Utilisateur
                            </label>
                            <p className="h6 mb-0 font-weight-medium">
                              #{user.id}
                            </p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="text-muted small d-block mb-1">
                              <FaCalendarAlt className="mr-1" size={12} />
                              Date d'inscription
                            </label>
                            <p className="h6 mb-0 font-weight-medium">
                              {formatDate(user.datecreation)}
                            </p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="text-muted small d-block mb-1">
                              <FaCheckCircle className="mr-1" size={12} />
                              Statut
                            </label>
                            <div>
                              {getStatusBadge(user.statut)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ONGLET DIRECTIONS */}
                    {activeTab === "departements" && (
                      <div className="profile-departements-tab">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h6 className="font-weight-bold mb-0">
                            <FaBuilding className="mr-2 text-primary" />
                            Directions assignées
                          </h6>
                          <span className="badge badge-primary badge-pill px-3 py-2">
                            {user.departements?.length || 0} direction(s)
                          </span>
                        </div>
                        
                        {user.departements && user.departements.length > 0 ? (
                          <div className="row">
                            {user.departements.map((dept) => {
                              const color = getDepartmentColor(dept.sigle);
                              return (
                                <div key={dept.id} className="col-md-6 mb-3">
                                  <div className="department-card border rounded p-3 h-100">
                                    <div className="d-flex align-items-center mb-2">
                                      <div className={`department-icon bg-${color}-soft rounded p-2 mr-3`}>
                                        {getDepartmentIcon(dept.sigle)}
                                      </div>
                                      <div>
                                        <h6 className="mb-0 font-weight-bold">{dept.sigle}</h6>
                                        <small className="text-muted">{dept.nom}</small>
                                      </div>
                                    </div>
                                    <div className="mt-2 d-flex justify-content-between align-items-center">
                                      <small className="text-muted">
                                        <FaCalendarAlt className="mr-1" size={11} />
                                        Depuis {formatShortDate(dept.datecreation)}
                                      </small>
                                      <span className={`badge badge-${color}`}>
                                        {dept.sigle}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <FaBuilding className="text-muted mb-3" size={48} />
                            <p className="text-muted mb-0">Aucune direction assignée</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ONGLET RÔLES */}
                    {activeTab === "roles" && (
                      <div className="profile-roles-tab">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h6 className="font-weight-bold mb-0">
                            <FaShieldAlt className="mr-2 text-primary" />
                            Rôles et permissions
                          </h6>
                          <span className="badge badge-primary badge-pill px-3 py-2">
                            {user.roles?.length || 0} rôle(s)
                          </span>
                        </div>
                        
                        {user.roles && user.roles.length > 0 ? (
                          <div className="row">
                            {user.roles.map((role) => (
                              <div key={role.id} className="col-12 mb-3">
                                <div className="role-card border rounded p-3">
                                  <div className="d-flex align-items-start">
                                    <div className="role-icon bg-warning-soft rounded p-3 mr-3">
                                      <FaShieldAlt className="text-warning" size={24} />
                                    </div>
                                    <div className="flex-grow-1">
                                      <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                          <h5 className="mb-1 font-weight-bold">{role.nom}</h5>
                                          <p className="text-muted mb-2 small">
                                            {role.description || "Aucune description"}
                                          </p>
                                        </div>
                                        <span className="badge badge-warning px-3 py-2">
                                          {role.nom}
                                        </span>
                                      </div>
                                      <div className="mt-2">
                                        <small className="text-muted">
                                          <FaCalendarAlt className="mr-1" size={11} />
                                          Assigné depuis {formatShortDate(role.created_at)}
                                        </small>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <FaShieldAlt className="text-muted mb-3" size={48} />
                            <p className="text-muted mb-0">Aucun rôle assigné</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE MODIFICATION DU PROFIL - AVEC ANCIEN MOT DE PASSE OBLIGATOIRE */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title">
                  <FaEdit className="mr-2" />
                  Modifier le profil
                </h5>
                <button 
                  type="button" 
                  className="close text-white"
                  onClick={handleCloseModal}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4" style={{ maxHeight: 'calc(80vh - 130px)', overflowY: 'auto' }}>
                  {/* SECTION INFORMATIONS PERSONNELLES */}
                  <h6 className="font-weight-bold mb-3 pb-2 border-bottom">
                    <FaUserCircle className="mr-2 text-primary" />
                    Informations personnelles
                  </h6>
                  
                  <div className="row">
                    {/* NOM */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label font-weight-medium">
                        Nom <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="nom"
                        className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                        value={formData.nom}
                        onChange={handleInputChange}
                        placeholder="Entrez le nom"
                      />
                      <FieldError error={errors.nom} />
                    </div>

                    {/* PRÉNOM */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label font-weight-medium">
                        Prénom <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="prenom"
                        className={`form-control ${errors.prenom ? 'is-invalid' : ''}`}
                        value={formData.prenom}
                        onChange={handleInputChange}
                        placeholder="Entrez le prénom"
                      />
                      <FieldError error={errors.prenom} />
                    </div>

                    {/* EMAIL */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label font-weight-medium">
                        Email <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <FaEnvelope />
                          </span>
                        </div>
                        <input
                          type="email"
                          name="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="exemple@domaine.com"
                        />
                      </div>
                      <FieldError error={errors.email} />
                    </div>
                  </div>

                  {/* SECTION MOT DE PASSE - AVEC ANCIEN MOT DE PASSE OBLIGATOIRE */}
                  <h6 className="font-weight-bold mb-3 pb-2 border-bottom mt-4">
                    <FaKey className="mr-2 text-primary" />
                    Changer le mot de passe
                  </h6>
                  <p className="text-muted small mb-3">
                    <FaExclamationCircle className="text-warning mr-1" />
                    Pour changer votre mot de passe, vous devez d'abord entrer votre ancien mot de passe.
                  </p>
                  
                  <div className="row">
                    {/* ANCIEN MOT DE PASSE - OBLIGATOIRE SI NOUVEAU MOT DE PASSE FOURNI */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label font-weight-medium">
                        Ancien mot de passe <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <FaLockOpen />
                          </span>
                        </div>
                        <input
                          type="password"
                          name="current_password"
                          className={`form-control ${errors.current_password ? 'is-invalid' : ''}`}
                          value={formData.current_password}
                          onChange={handleInputChange}
                          placeholder="Entrez votre ancien mot de passe"
                        />
                      </div>
                      <FieldError error={errors.current_password} />
                      {!formData.current_password && formData.password && (
                        <small className="text-danger d-block mt-1">
                          <FaExclamationCircle className="mr-1" size={10} />
                          L'ancien mot de passe est requis pour changer le mot de passe
                        </small>
                      )}
                    </div>

                    {/* NOUVEAU MOT DE PASSE */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label font-weight-medium">
                        Nouveau mot de passe
                      </label>
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <FaLock />
                          </span>
                        </div>
                        <input
                          type="password"
                          name="password"
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Minimum 6 caractères"
                        />
                      </div>
                      <FieldError error={errors.password} />
                    </div>

                    {/* CONFIRMATION MOT DE PASSE */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label font-weight-medium">
                        Confirmer le mot de passe
                      </label>
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <FaCheckDouble />
                          </span>
                        </div>
                        <input
                          type="password"
                          name="password_confirmation"
                          className={`form-control ${errors.password_confirmation ? 'is-invalid' : ''}`}
                          value={formData.password_confirmation}
                          onChange={handleInputChange}
                          placeholder="Confirmez le mot de passe"
                        />
                      </div>
                      <FieldError error={errors.password_confirmation} />
                    </div>
                  </div>

                  {/* ERREURS GÉNÉRALES */}
                  {errors.general && (
                    <div className="alert alert-danger mt-3">
                      <FaExclamationCircle className="mr-2" />
                      {errors.general}
                    </div>
                  )}
                </div>

                <div className="modal-footer bg-light">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    <FaTimes className="mr-2" />
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="fa-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Enregistrer les modifications
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .content-wrapper {
          margin-left: 250px;
          padding-top: 20px;
        }
        
        .profile-header {
          background: white;
          padding: 25px 30px;
          border-radius: 16px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.02);
        }
        
        .profile-card {
          border-radius: 16px;
          overflow: hidden;
        }
        
        .profile-avatar-wrapper {
          position: relative;
          display: inline-block;
        }
        
        .avatar-upload-container {
          position: relative;
          display: inline-block;
          cursor: pointer;
        }
        
        .avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .avatar-upload-container:hover .avatar-overlay {
          opacity: 1;
        }
        
        .avatar-overlay span {
          font-size: 12px;
          margin-top: 5px;
        }
        
        .avatar-uploading {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        
        .profile-avatar {
          width: 120px;
          height: 120px;
          object-fit: cover;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        .profile-status-badge {
          position: absolute;
          bottom: 10px;
          right: -10px;
        }
        
        .bg-gradient-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .bg-gradient-success { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); }
        .bg-gradient-warning { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
        .bg-gradient-info { background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); }
        .bg-gradient-danger { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .bg-gradient-purple { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .bg-gradient-pink { background: linear-gradient(135deg, #fccb90 0%, #d57eeb 100%); }
        .bg-gradient-indigo { background: linear-gradient(135deg, #7579ff 0%, #b224ef 100%); }
        
        .activity-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .department-card {
          transition: all 0.3s ease;
          border-color: #e9ecef !important;
        }
        
        .department-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
          border-color: #007bff !important;
        }
        
        .department-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .role-card {
          transition: all 0.3s ease;
        }
        
        .role-card:hover {
          background-color: #f8f9fa;
        }
        
        .role-icon {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .nav-tabs .nav-link {
          border: none;
          color: #6c757d;
          font-weight: 500;
          padding: 0.75rem 1.25rem;
        }
        
        .nav-tabs .nav-link.active {
          color: #007bff;
          background: none;
          border-bottom: 2px solid #007bff;
        }
        
        .bg-primary-soft { background: rgba(0, 123, 255, 0.1); }
        .bg-success-soft { background: rgba(40, 167, 69, 0.1); }
        .bg-warning-soft { background: rgba(255, 193, 7, 0.1); }
        .bg-info-soft { background: rgba(23, 162, 184, 0.1); }
        .bg-purple { background: #6f42c1; }
        .bg-purple-soft { background: rgba(111, 66, 193, 0.1); }
        .text-purple { color: #6f42c1; }
        .border-purple { border-color: #6f42c1 !important; }

        /* STYLES DU MODAL */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 20px;
        }
        
        .modal-dialog {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        
        .modal-content {
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }
        
        .modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: none;
          flex-shrink: 0;
        }
        
        .modal-header .close {
          opacity: 1;
          font-size: 28px;
          font-weight: 300;
        }
        
        .modal-body {
          overflow-y: auto;
          flex: 1;
        }
        
        .modal-footer {
          flex-shrink: 0;
        }
        
        .form-control.is-invalid {
          border-color: #dc3545;
          padding-right: calc(1.5em + 0.75rem);
          background-image: none;
        }
        
        .form-control.is-invalid:focus {
          border-color: #dc3545;
          box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
        }
        
        .invalid-feedback {
          display: block;
          width: 100%;
          margin-top: 0.25rem;
          font-size: 80%;
          color: #dc3545;
        }
        
        @media (max-width: 768px) {
          .content-wrapper {
            margin-left: 0;
          }
          
          .profile-header {
            padding: 20px;
          }
          
          .profile-avatar {
            width: 100px;
            height: 100px;
            font-size: 40px;
          }
          
          .modal-dialog {
            margin: 0;
            max-width: 100%;
            height: 100vh;
            max-height: 100vh;
          }
          
          .modal-content {
            border-radius: 0;
            height: 100vh;
            max-height: 100vh;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilScreen;