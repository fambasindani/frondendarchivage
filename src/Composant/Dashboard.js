import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { 
  FaSpinner,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaUserLock,
  FaBuilding,
  FaUserTag,
  FaCalendarAlt,
  FaEnvelope,
  FaChevronRight,
  FaSync,
  FaExclamationCircle,
  FaChartPie,
  FaChartBar,
  FaClock,
  FaShieldAlt,
  FaUserCog,
  FaDoorOpen,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaUserPlus,
  FaUserGraduate
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';

const Dashboard = () => {
  const token = GetTokenOrRedirect();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    users: {
      total: 0,
      active: 0,
      inactive: 0,
      blocked: 0
    },
    roles: [],
    directions: [],
    recent_users: [],
    total_roles: 0,
    total_directions: 0,
    directions_with_users: 0
  });

  // 🔹 Charger les données au montage
  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // 🔹 Obtenir les en-têtes d'authentification
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  };

  // 🔹 Charger toutes les données du dashboard
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 🔹 Récupérer les statistiques complètes
      const response = await axios.get(`${API_BASE_URL}/dashboard/statistique`, {
        headers: getAuthHeaders()
      });
      
      console.log('API Response Dashboard:', response.data);
      
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      
      if (error.response?.status === 401) {
        // GetTokenOrRedirect gère déjà la redirection
        return;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les données du tableau de bord'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔹 Rafraîchir les données
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // 🔹 Obtenir le badge de statut
  const getStatusBadge = (statut) => {
    const config = {
      active: { 
        color: 'success', 
        icon: FaUserCheck, 
        text: 'Actif', 
        bg: 'bg-success-soft',
        border: 'border-success'
      },
      inactive: { 
        color: 'warning', 
        icon: FaUserTimes, 
        text: 'Inactif', 
        bg: 'bg-warning-soft',
        border: 'border-warning'
      },
      bloqué: { 
        color: 'danger', 
        icon: FaUserLock, 
        text: 'Bloqué', 
        bg: 'bg-danger-soft',
        border: 'border-danger'
      }
    };
    
    const { color, icon: Icon, text, bg, border } = config[statut] || config.active;
    
    return (
      <span className={`badge badge-${color} badge-pill px-3 py-2 d-flex align-items-center`}>
        <Icon className="mr-1" size={12} />
        {text}
      </span>
    );
  };

  // 🔹 Carte de statistique améliorée
  const StatCard = ({ title, value, icon, color, subtitle, trend, trendValue, onClick }) => {
    const getTrendIcon = () => {
      if (!trend) return null;
      if (trend === 'up') return <FaArrowUp className="text-success" size={12} />;
      if (trend === 'down') return <FaArrowDown className="text-danger" size={12} />;
      return <FaMinus className="text-warning" size={12} />;
    };

    return (
      <div className="col-xl-3 col-lg-6 col-md-6 mb-4">
        <div 
          className="stat-card card border-0 shadow-sm h-100"
          onClick={onClick}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="stat-card-label text-muted mb-1">{title}</p>
                <h2 className="stat-card-value mb-0">{value}</h2>
                {subtitle && (
                  <p className="stat-card-subtitle text-muted mt-2 mb-0 small">
                    {subtitle}
                  </p>
                )}
                {trend && (
                  <div className="stat-card-trend mt-2 d-flex align-items-center">
                    {getTrendIcon()}
                    <span className={`ml-1 small text-${trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'warning'}`}>
                      {trendValue} vs mois dernier
                    </span>
                  </div>
                )}
              </div>
              <div className={`stat-card-icon-wrapper bg-${color}-soft rounded-circle p-3`}>
                {icon}
              </div>
            </div>
          </div>
          <div className={`card-footer bg-${color} border-0 py-2`}>
            <small className="text-white d-flex align-items-center justify-content-between">
              <span>Voir les détails</span>
              <FaChevronRight size={12} />
            </small>
          </div>
        </div>
      </div>
    );
  };

  // 🔹 Fonction de chargement IDENTIQUE à Directions.js
  const renderLoading = () => (
    <div className="text-center py-5">
      <div className="spinner-wrapper mb-4">
        <FaSpinner className="fa-spin text-primary" size={48} />
      </div>
      <h4 className="text-dark mb-2">Chargement du tableau de bord...</h4>
      <p className="text-muted mb-0">Veuillez patienter pendant le chargement des données</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Header avec gradient */}
      <div className="dashboard-header mb-4">
        <div className="row align-items-center">
          <div className="col-lg-8">
            <div className="d-flex align-items-center">
              <div className="header-icon-wrapper bg-primary-soft rounded-circle p-3 mr-3">
                <FaChartPie className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="h2 mb-1 font-weight-bold">Tableau de Bord</h1>
                <p className="text-muted mb-0">
                  <FaClock className="mr-1" size={14} />
                  Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="d-flex justify-content-lg-end mt-3 mt-lg-0">
              <button 
                className="btn btn-light border shadow-sm px-4"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <FaSync className={`mr-2 ${refreshing ? 'fa-spin' : ''}`} />
                {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques Utilisateurs - Toujours affichées même pendant le chargement */}
      <div className="row mb-4">
        <StatCard
          title="Utilisateurs Totaux"
          value={stats.users?.total || 0}
          icon={<FaUsers size={24} />}
          color="primary"
          subtitle="Tous les utilisateurs enregistrés"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Actifs"
          value={stats.users?.active || 0}
          icon={<FaUserCheck size={24} />}
          color="success"
          subtitle={`${stats.users?.total > 0 ? ((stats.users.active / stats.users.total) * 100).toFixed(1) : 0}% du total`}
          trend={stats.users?.active > 0 ? 'up' : 'down'}
          trendValue={`${((stats.users?.active / (stats.users?.total || 1)) * 100).toFixed(0)}%`}
        />
        <StatCard
          title="Inactifs"
          value={stats.users?.inactive || 0}
          icon={<FaUserTimes size={24} />}
          color="warning"
          subtitle={`${stats.users?.total > 0 ? ((stats.users.inactive / stats.users.total) * 100).toFixed(1) : 0}% du total`}
          trend="down"
          trendValue="-5%"
        />
        <StatCard
          title="Bloqués"
          value={stats.users?.blocked || 0}
          icon={<FaUserLock size={24} />}
          color="danger"
          subtitle={`${stats.users?.total > 0 ? ((stats.users.blocked / stats.users.total) * 100).toFixed(1) : 0}% du total`}
          trend="down"
          trendValue="-2%"
        />
      </div>

      <div className="row">
        {/* Utilisateurs récents */}
        <div className="col-xl-5 col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3">
              <div className="d-flex align-items-center">
                <div className="header-icon-wrapper bg-info-soft rounded-circle p-2 mr-2">
                  <FaUserPlus className="text-info" size={16} />
                </div>
                <h5 className="card-title mb-0 font-weight-bold">Utilisateurs Récents</h5>
              </div>
              <Link to="/gestion-utilisateurs/utilisateurs" className="btn btn-sm btn-outline-primary rounded-pill px-3">
                Voir tous <FaChevronRight className="ml-1" size={12} />
              </Link>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4">
                  {renderLoading()}
                </div>
              ) : stats.recent_users && stats.recent_users.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.recent_users.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="list-group-item border-0 py-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar-circle mr-3">
                          {user.prenom?.[0]}{user.nom?.[0]}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex flex-wrap justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1 font-weight-bold">
                                {user.prenom} {user.nom}
                              </h6>
                              <div className="d-flex align-items-center mb-1">
                                <FaEnvelope className="text-muted mr-1" size={12} />
                                <small className="text-muted">{user.email}</small>
                              </div>
                              <div className="d-flex flex-wrap gap-1 mt-1">
                                {user.roles && user.roles.length > 0 ? (
                                  user.roles.slice(0, 2).map((role, i) => (
                                    <span key={role.id} className="badge badge-light text-primary border mr-1 px-2 py-1">
                                      <FaShieldAlt className="mr-1" size={10} />
                                      {role.nom}
                                    </span>
                                  ))
                                ) : (
                                  <span className="badge badge-light text-muted border px-2 py-1">
                                    <FaUserCog className="mr-1" size={10} />
                                    Aucun rôle
                                  </span>
                                )}
                                {user.roles?.length > 2 && (
                                  <span className="badge badge-light border px-2 py-1">
                                    +{user.roles.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              {getStatusBadge(user.statut)}
                              <div className="mt-2">
                                <small className="text-muted d-flex align-items-center">
                                  <FaCalendarAlt className="mr-1" size={12} />
                                  {format(new Date(user.datecreation), 'dd/MM/yyyy', { locale: fr })}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < stats.recent_users.slice(0, 5).length - 1 && (
                        <hr className="my-0 mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="empty-state-icon-wrapper bg-light rounded-circle p-4 mx-auto mb-3">
                    <FaUsers className="text-muted" size={32} />
                  </div>
                  <h6 className="text-muted mb-2">Aucun utilisateur récent</h6>
                  <p className="text-muted small">Les nouveaux utilisateurs apparaîtront ici</p>
                </div>
              )}
            </div>
            {!loading && stats.recent_users?.length > 0 && (
              <div className="card-footer bg-white border-0 py-3">
                <small className="text-muted">
                  <FaClock className="mr-1" size={12} />
                  Derniers {Math.min(stats.recent_users.length, 5)} utilisateurs inscrits
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Distribution des rôles */}
        <div className="col-xl-3 col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 d-flex align-items-center py-3">
              <div className="header-icon-wrapper bg-warning-soft rounded-circle p-2 mr-2">
                <FaUserTag className="text-warning" size={16} />
              </div>
              <h5 className="card-title mb-0 font-weight-bold flex-grow-1">Rôles</h5>
              <span className="badge badge-primary rounded-pill px-3 py-2">
                {stats.total_roles || 0} total
              </span>
            </div>
            <div className="card-body">
              {loading ? (
                renderLoading()
              ) : stats.roles && stats.roles.length > 0 ? (
                <>
                  <div className="role-distribution">
                    {stats.roles.map((role, index) => (
                      <div key={role.id} className={`mb-3 ${index < stats.roles.length - 1 ? 'border-bottom pb-3' : ''}`}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center">
                            <div className={`role-color-dot bg-${index % 4 === 0 ? 'primary' : index % 4 === 1 ? 'success' : index % 4 === 2 ? 'info' : 'warning'} rounded-circle mr-2`}></div>
                            <span className="font-weight-medium">{role.nom}</span>
                          </div>
                          <span className="badge badge-primary badge-pill px-3 py-1">{role.users_count || 0}</span>
                        </div>
                        <div className="progress" style={{ height: '8px', backgroundColor: '#f0f0f0' }}>
                          <div 
                            className={`progress-bar bg-${index % 4 === 0 ? 'primary' : index % 4 === 1 ? 'success' : index % 4 === 2 ? 'info' : 'warning'}`}
                            role="progressbar" 
                            style={{ 
                              width: `${stats.users?.total > 0 ? ((role.users_count || 0) / stats.users.total * 100) : 0}%` 
                            }}
                            aria-valuenow={role.users_count || 0} 
                            aria-valuemin="0" 
                            aria-valuemax={stats.users?.total}
                          ></div>
                        </div>
                        <small className="text-muted d-flex justify-content-end mt-1">
                          {stats.users?.total > 0 ? ((role.users_count || 0) / stats.users.total * 100).toFixed(1) : 0}% des utilisateurs
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link to="/gestion-utilisateurs/roles" className="btn btn-outline-warning btn-sm btn-block rounded-pill">
                      Gérer les rôles <FaChevronRight className="ml-1" size={12} />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="empty-state-icon-wrapper bg-light rounded-circle p-4 mx-auto mb-3">
                    <FaUserTag className="text-muted" size={32} />
                  </div>
                  <p className="text-muted mb-3">Aucun rôle disponible</p>
                  <Link to="/gestion-utilisateurs/roles" className="btn btn-outline-primary btn-sm">
                    Créer un rôle
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Distribution des directions */}
        <div className="col-xl-4 col-lg-12 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3">
              <div className="d-flex align-items-center">
                <div className="header-icon-wrapper bg-success-soft rounded-circle p-2 mr-2">
                  <FaBuilding className="text-success" size={16} />
                </div>
                <h5 className="card-title mb-0 font-weight-bold">Directions</h5>
              </div>
              <div className="d-flex align-items-center">
                <span className="badge badge-success rounded-pill px-3 py-2 mr-2">
                  {stats.directions_with_users || 0} actives
                </span>
                <span className="badge badge-light rounded-pill px-3 py-2">
                  {stats.total_directions || 0} total
                </span>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                renderLoading()
              ) : stats.directions && stats.directions.length > 0 ? (
                <>
                  <div className="direction-distribution">
                    {stats.directions.slice(0, 6).map((direction, index) => (
                      <div key={direction.id} className="d-flex align-items-center mb-3">
                        <div className={`direction-icon-wrapper bg-${index % 3 === 0 ? 'primary' : index % 3 === 1 ? 'info' : 'success'}-soft rounded p-2 mr-3`}>
                          <FaBuilding className={`text-${index % 3 === 0 ? 'primary' : index % 3 === 1 ? 'info' : 'success'}`} size={16} />
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="font-weight-medium">{direction.sigle}</span>
                            <span className="badge badge-light border px-3 py-1">
                              <FaUsers className="mr-1" size={12} />
                              {direction.users_count || 0}
                            </span>
                          </div>
                          <small className="text-muted d-block text-truncate" style={{ maxWidth: '200px' }}>
                            {direction.nom}
                          </small>
                          <div className="progress mt-2" style={{ height: '4px', backgroundColor: '#f0f0f0' }}>
                            <div 
                              className={`progress-bar bg-${index % 3 === 0 ? 'primary' : index % 3 === 1 ? 'info' : 'success'}`}
                              style={{ 
                                width: `${stats.users?.total > 0 ? ((direction.users_count || 0) / stats.users.total * 100) : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {stats.directions.length > 6 && (
                    <div className="text-center mt-3">
                      <small className="text-muted">
                        +{stats.directions.length - 6} autres directions
                      </small>
                    </div>
                  )}
                  <div className="mt-4">
                    <Link to="/gestion-utilisateurs/directions" className="btn btn-outline-success btn-sm btn-block rounded-pill">
                      Gérer les directions <FaChevronRight className="ml-1" size={12} />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="empty-state-icon-wrapper bg-light rounded-circle p-4 mx-auto mb-3">
                    <FaBuilding className="text-muted" size={32} />
                  </div>
                  <p className="text-muted mb-3">Aucune direction disponible</p>
                  <Link to="/gestion-utilisateurs/directions" className="btn btn-outline-primary btn-sm">
                    Créer une direction
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques globales améliorées */}
      <div className="row mt-2">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <div className="d-flex align-items-center">
                <div className="header-icon-wrapper bg-secondary-soft rounded-circle p-2 mr-2">
                  <FaChartBar className="text-secondary" size={16} />
                </div>
                <h5 className="card-title mb-0 font-weight-bold">Statistiques Globales</h5>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 col-6 mb-3">
                  <div className="stat-card-mini border rounded p-3 text-center bg-light h-100">
                    <div className="stat-mini-icon-wrapper bg-primary-soft rounded-circle p-2 mx-auto mb-2">
                      <FaUsers className="text-primary" size={20} />
                    </div>
                    <h3 className="mb-1 font-weight-bold">{stats.users?.total || 0}</h3>
                    <small className="text-muted">Utilisateurs</small>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <div className="stat-card-mini border rounded p-3 text-center bg-light h-100">
                    <div className="stat-mini-icon-wrapper bg-info-soft rounded-circle p-2 mx-auto mb-2">
                      <FaUserTag className="text-info" size={20} />
                    </div>
                    <h3 className="mb-1 font-weight-bold">{stats.total_roles || 0}</h3>
                    <small className="text-muted">Rôles</small>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <div className="stat-card-mini border rounded p-3 text-center bg-light h-100">
                    <div className="stat-mini-icon-wrapper bg-success-soft rounded-circle p-2 mx-auto mb-2">
                      <FaBuilding className="text-success" size={20} />
                    </div>
                    <h3 className="mb-1 font-weight-bold">{stats.total_directions || 0}</h3>
                    <small className="text-muted">Directions</small>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <div className="stat-card-mini border rounded p-3 text-center bg-light h-100">
                    <div className="stat-mini-icon-wrapper bg-warning-soft rounded-circle p-2 mx-auto mb-2">
                      <FaDoorOpen className="text-warning" size={20} />
                    </div>
                    <h3 className="mb-1 font-weight-bold">{stats.directions_with_users || 0}</h3>
                    <small className="text-muted">Directions actives</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 30px;
          background: linear-gradient(135deg, #f5f7fa 0%, #f8f9fc 100%);
          min-height: calc(100vh - 76px);
        }
        
        .dashboard-header {
          background: white;
          padding: 25px 30px;
          border-radius: 20px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.02);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
        }
        
        .header-icon-wrapper {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .stat-card {
          transition: all 0.3s ease;
          border-radius: 16px;
          overflow: hidden;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
        }
        
        .stat-card-label {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        
        .stat-card-value {
          font-size: 2.2rem;
          font-weight: 700;
          line-height: 1.2;
        }
        
        .stat-card-icon-wrapper {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover .stat-card-icon-wrapper {
          transform: scale(1.1);
        }
        
        .stat-card .card-footer {
          transition: all 0.3s ease;
        }
        
        .stat-card:hover .card-footer {
          opacity: 0.9;
        }
        
        .stat-card-mini {
          transition: all 0.3s ease;
          border-radius: 12px;
        }
        
        .stat-card-mini:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
          background: white !important;
        }
        
        .stat-mini-icon-wrapper {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .avatar-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.25);
        }
        
        .list-group-item {
          transition: all 0.2s ease;
          border-left: none;
          border-right: none;
        }
        
        .list-group-item:hover {
          background-color: #f8faff;
        }
        
        .badge {
          padding: 0.5em 1em;
          font-weight: 500;
          border-radius: 30px;
        }
        
        .badge.bg-success-soft {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
        }
        
        .progress {
          background-color: #eef2f7;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .progress-bar {
          border-radius: 10px;
          transition: width 0.6s ease;
        }
        
        .card {
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        
        .card:hover {
          box-shadow: 0 10px 30px rgba(0,0,0,0.05) !important;
        }
        
        .card-header {
          border-top-left-radius: 16px !important;
          border-top-right-radius: 16px !important;
        }
        
        .role-distribution, .direction-distribution {
          max-height: 350px;
          overflow-y: auto;
          padding-right: 10px;
        }
        
        .role-distribution::-webkit-scrollbar,
        .direction-distribution::-webkit-scrollbar {
          width: 5px;
        }
        
        .role-distribution::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .role-distribution::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        
        .role-distribution::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        
        .role-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        
        .direction-icon-wrapper {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .empty-state-icon-wrapper {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .spinner-wrapper {
          animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Background soft colors */
        .bg-primary-soft { background: rgba(0, 123, 255, 0.1); }
        .bg-success-soft { background: rgba(40, 167, 69, 0.1); }
        .bg-warning-soft { background: rgba(255, 193, 7, 0.1); }
        .bg-danger-soft { background: rgba(220, 53, 69, 0.1); }
        .bg-info-soft { background: rgba(23, 162, 184, 0.1); }
        .bg-secondary-soft { background: rgba(108, 117, 125, 0.1); }
        
        /* Text colors */
        .text-primary-soft { color: #007bff; }
        .text-success-soft { color: #28a745; }
        .text-warning-soft { color: #ffc107; }
        
        /* Gap utility */
        .gap-1 { gap: 0.25rem; }
        .gap-2 { gap: 0.5rem; }
        
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 20px;
          }
          
          .dashboard-header {
            padding: 20px;
          }
          
          .stat-card-value {
            font-size: 1.8rem;
          }
          
          .avatar-circle {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
        }
        
        @media (max-width: 576px) {
          .dashboard-container {
            padding: 15px;
          }
          
          .stat-card {
            margin-bottom: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;