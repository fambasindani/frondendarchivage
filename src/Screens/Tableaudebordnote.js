import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import {
  FaFolder,
  FaFileAlt,
  FaSearch,
  FaSync,
  FaArrowRight,
  FaBuilding,
  FaUser,
  FaCalendarAlt,
  FaEye,
  FaSpinner,
  FaClock,
  FaCheckCircle,
  FaArchive,
  FaChartLine,
  FaLayerGroup,
  FaTags,
  FaFilter,
  FaTimes,
  FaFileInvoice,
  FaChartPie,
  FaUsers,
  FaMapMarkerAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaMoneyBillWave,
  FaPercentage,
  FaBoxes,
  FaRegBuilding,
  FaRegFileAlt,
  FaRegCalendarAlt,
  FaRegClock,
  FaChevronUp,
  FaChevronDown
} from "react-icons/fa";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "../Loading/LoadingSpinner";

const Tableaudebordnote = () => {
  const history = useHistory();
  const token = GetTokenOrRedirect();

  // 🔹 État utilisateur
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur")) || {};
  const nom = utilisateur?.nom || "";
  const prenom = utilisateur?.prenom || "";
  const role = utilisateur?.role || "";

  // 🔹 États principaux
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [centres, setCentres] = useState([]);
  const [articles, setArticles] = useState([]);
  const [assujettis, setAssujettis] = useState([]);
  const [classeurs, setClasseurs] = useState([]);
  const [stats, setStats] = useState({
    total_notes: 0,
    total_centres: 0,
    total_articles: 0,
    total_assujettis: 0,
    total_emplacements: 0,
    notes_actives: 0,
    notes_archivees: 0,
    notes_aujourdhui: 0,
    notes_semaine: 0,
    notes_mois: 0,
    notes_annee: 0,
    top_centres: [],
    top_articles: [],
    top_assujettis: [],
    par_classeur: []
  });

  // 🔹 État pour cacher/afficher la section Top Rankings
  const [showTopRankings, setShowTopRankings] = useState(false);

  // 🔹 Filtres avancés
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState("");
  const [selectedAssujetti, setSelectedAssujetti] = useState("");
  const [selectedClasseur, setSelectedClasseur] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  
  // 🔹 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0
  });

  const itemsPerPage = 12;

  // 🔹 Chargement initial
  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  // 🔹 Mise à jour quand la page change
  useEffect(() => {
    if (token && !loading) {
      fetchCentres();
    }
  }, [currentPage]);

  // 🔹 Obtenir les en-têtes d'authentification
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  });

  // 🔹 Charger TOUTES les données en parallèle
  const fetchAllData = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStatistics(),
        fetchCentres(),
        fetchArticles(),
        fetchAssujettis(),
        fetchClasseurs()
      ]);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      Swal.fire("Erreur", "Impossible de charger les données", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔹 Statistiques
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboards/notes/statistics`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Erreur statistiques:", error);
    }
  };

  // 🔹 Centres avec pagination
  const fetchCentres = async () => {
    try {
      const params = {
        page: currentPage,
        per_page: itemsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedArticle) params.numero_article = selectedArticle;
      if (selectedAssujetti) params.id_assujetti = selectedAssujetti;
      if (selectedClasseur) params.id_classeur = selectedClasseur;
      if (selectedPeriode !== "all") params.periode = selectedPeriode;

      const response = await axios.get(
        `${API_BASE_URL}/dashboards/notes/centres`,
        { headers: getAuthHeaders(), params }
      );

      if (response.data.success) {
        setCentres(response.data.data.data || []);
        setPagination({
          current_page: response.data.data.current_page || 1,
          last_page: response.data.data.last_page || 1,
          per_page: response.data.data.per_page || 12,
          total: response.data.data.total || 0
        });
      }
    } catch (error) {
      console.error("Erreur centres:", error);
    }
  };

  // 🔹 Articles
  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboards/notes/articles`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setArticles(response.data.data);
      }
    } catch (error) {
      console.error("Erreur articles:", error);
    }
  };

  // 🔹 Assujettis
  const fetchAssujettis = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboards/notes/assujettis`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setAssujettis(response.data.data);
      }
    } catch (error) {
      console.error("Erreur assujettis:", error);
    }
  };

  // 🔹 Classeurs
  const fetchClasseurs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboards/notes/classeurs`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setClasseurs(response.data.data);
      }
    } catch (error) {
      console.error("Erreur classeurs:", error);
    }
  };

  // 🔹 Recherche avancée
  const handleSearch = async () => {
    if (!searchTerm && !selectedArticle && !selectedAssujetti && !selectedClasseur && selectedPeriode === "all") {
      Swal.fire({
        icon: "info",
        title: "Recherche",
        text: "Veuillez remplir au moins un critère de recherche",
        confirmButtonColor: "#3085d6"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/dashboards/notes/search`,
        {
          nom_centre: searchTerm,
          numero_article: selectedArticle,
          id_assujetti: selectedAssujetti,
          id_classeur: selectedClasseur,
          periode: selectedPeriode
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setCentres(response.data.data.centres || []);
        setPagination(response.data.data.pagination);

        Swal.fire({
          icon: "success",
          title: `${response.data.data.centres.length} centre(s) trouvé(s)`,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      console.error("Erreur recherche:", error);
      Swal.fire("Erreur", "Impossible de charger les résultats", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Réinitialisation
  const handleReset = () => {
    setSearchTerm("");
    setSelectedArticle("");
    setSelectedAssujetti("");
    setSelectedClasseur("");
    setSelectedPeriode("all");
    setCurrentPage(1);
    fetchAllData();
  };

  // 🔹 Navigation vers liste des notes
  const handleListeNotes = (centre) => {
    history.push({
      pathname: `/listenote/${centre.id}`,
      state: {
        centre,
        id_article: selectedArticle,
        id_assujetti: selectedAssujetti,
        id_classeur: selectedClasseur,
        periode: selectedPeriode,
        searchTerm
      }
    });
  };

  // 🔹 Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
    } catch {
      return "N/A";
    }
  };

  // 🔹 Temps relatif
  const timeAgo = (dateString) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr
      });
    } catch {
      return "";
    }
  };

  // 🔹 Obtenir l'icône du classeur
  const getClasseurIcon = (nom) => {
    const type = nom?.toLowerCase() || "";
    if (type.includes("note")) return <FaFileInvoice className="text-primary" size={20} />;
    if (type.includes("diplôme") || type.includes("diplome")) return <FaFileAlt className="text-success" size={20} />;
    if (type.includes("arrêté") || type.includes("arrete")) return <FaFilePdf className="text-danger" size={20} />;
    if (type.includes("lettre")) return <FaFileWord className="text-info" size={20} />;
    return <FaFolder className="text-warning" size={20} />;
  };

  // 🔹 Obtenir le code article à partir de l'ID
  const getArticleCode = (articleId) => {
    const article = articles.find(a => a.id === parseInt(articleId));
    return article ? article.code : articleId;
  };

  // 🔹 Statistiques rapides
  const QuickStats = () => (
    <div className="row mb-4">
      <div className="col-lg-3 col-md-6 mb-3">
        <div className="stat-card bg-white p-3 rounded shadow-sm">
          <div className="d-flex justify-content-between">
            <div>
              <p className="text-muted small mb-1">Total Notes</p>
              <h2 className="mb-0 font-weight-bold">{stats.total_notes}</h2>
              <small className="text-success">
                <FaCheckCircle className="mr-1" size={12} />
                {stats.notes_actives} actives
              </small>
            </div>
            <div className="stat-icon bg-primary-soft rounded-circle p-3">
              <FaFileInvoice className="text-primary" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-3 col-md-6 mb-3">
        <div className="stat-card bg-white p-3 rounded shadow-sm">
          <div className="d-flex justify-content-between">
            <div>
              <p className="text-muted small mb-1">Centres</p>
              <h2 className="mb-0 font-weight-bold">{stats.total_centres}</h2>
              <small className="text-info">
                <FaBuilding className="mr-1" size={12} />
                {centres.length} affichés
              </small>
            </div>
            <div className="stat-icon bg-info-soft rounded-circle p-3">
              <FaBuilding className="text-info" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-3 col-md-6 mb-3">
        <div className="stat-card bg-white p-3 rounded shadow-sm">
          <div className="d-flex justify-content-between">
            <div>
              <p className="text-muted small mb-1">Ce Mois</p>
              <h2 className="mb-0 font-weight-bold">{stats.notes_mois}</h2>
              <small className="text-warning">
                <FaCalendarAlt className="mr-1" size={12} />
                +{stats.notes_semaine} cette semaine
              </small>
            </div>
            <div className="stat-icon bg-warning-soft rounded-circle p-3">
              <FaCalendarAlt className="text-warning" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-3 col-md-6 mb-3">
        <div className="stat-card bg-white p-3 rounded shadow-sm">
          <div className="d-flex justify-content-between">
            <div>
              <p className="text-muted small mb-1">Articles</p>
              <h2 className="mb-0 font-weight-bold">{stats.total_articles}</h2>
              <small className="text-success">
                <FaTags className="mr-1" size={12} />
                Budgetaires
              </small>
            </div>
            <div className="stat-icon bg-success-soft rounded-circle p-3">
              <FaTags className="text-success" size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 🔹 Top centres
  const TopCentres = () => {
    if (!stats.top_centres || stats.top_centres.length === 0) return null;

    return (
      <div className="col-lg-4 mb-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-white border-0 pt-3">
            <h6 className="mb-0 font-weight-bold">
              <FaChartLine className="text-primary mr-2" />
              Top 5 Centres
            </h6>
          </div>
          <div className="card-body pt-0">
            {stats.top_centres.map((centre, index) => (
              <div key={centre.id} className="d-flex align-items-center mb-3">
                <div className={`rank-badge bg-${index === 0 ? 'warning' : index === 1 ? 'info' : 'secondary'}-soft rounded-circle d-flex align-items-center justify-content-center mr-3`} style={{ width: 32, height: 32 }}>
                  <span className="font-weight-bold">{index + 1}</span>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="font-weight-medium">{centre.nom}</span>
                    <span className="badge badge-primary">{centre.total}</span>
                  </div>
                  <small className="text-muted d-block">
                    <FaClock className="mr-1" size={10} />
                    {timeAgo(centre.dernier_ajout)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 🔹 Top articles
  const TopArticles = () => {
    if (!stats.top_articles || stats.top_articles.length === 0) return null;

    return (
      <div className="col-lg-4 mb-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-white border-0 pt-3">
            <h6 className="mb-0 font-weight-bold">
              <FaTags className="text-success mr-2" />
              Top 5 Articles
            </h6>
          </div>
          <div className="card-body pt-0">
            {stats.top_articles.map((article, index) => (
              <div key={index} className="d-flex align-items-center mb-3">
                <div className={`rank-badge bg-${index === 0 ? 'warning' : index === 1 ? 'info' : 'secondary'}-soft rounded-circle d-flex align-items-center justify-content-center mr-3`} style={{ width: 32, height: 32 }}>
                  <span className="font-weight-bold">{index + 1}</span>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="font-weight-medium">{article.code}</span>
                      <small className="d-block text-muted">{article.nom}</small>
                    </div>
                    <span className="badge badge-success">{article.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 🔹 Top assujettis
  const TopAssujettis = () => {
    if (!stats.top_assujettis || stats.top_assujettis.length === 0) return null;

    return (
      <div className="col-lg-4 mb-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-white border-0 pt-3">
            <h6 className="mb-0 font-weight-bold">
              <FaUsers className="text-info mr-2" />
              Top 5 Assujettis
            </h6>
          </div>
          <div className="card-body pt-0">
            {stats.top_assujettis.map((assujetti, index) => (
              <div key={assujetti.id} className="d-flex align-items-center mb-3">
                <div className={`rank-badge bg-${index === 0 ? 'warning' : index === 1 ? 'info' : 'secondary'}-soft rounded-circle d-flex align-items-center justify-content-center mr-3`} style={{ width: 32, height: 32 }}>
                  <span className="font-weight-bold">{index + 1}</span>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="font-weight-medium">{assujetti.nom}</span>
                      <small className="d-block text-muted">NIF: {assujetti.nif}</small>
                    </div>
                    <span className="badge badge-info">{assujetti.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 🔹 Pagination
  const renderPagination = () => {
    const totalPages = pagination.last_page;
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
      <nav>
        <ul className="pagination mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </button>
          </li>

          {startPage > 1 && (
            <>
              <li className="page-item">
                <button className="page-link" onClick={() => setCurrentPage(1)}>1</button>
              </li>
              {startPage > 2 && <li className="page-item disabled"><span className="page-link">...</span></li>}
            </>
          )}

          {pages.map(page => (
            <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
              <button className="page-link" onClick={() => setCurrentPage(page)}>
                {page}
              </button>
            </li>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <li className="page-item disabled"><span className="page-link">...</span></li>}
              <li className="page-item">
                <button className="page-link" onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </button>
              </li>
            </>
          )}

          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="dashboard-notes">
      <Menus />
      <Head />

      <div className="content-wrapper">
        <div className="content-header">
          <div className="container-fluid">
            {/* HEADER MODERNE */}
            <div className="dashboard-header mb-4">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <div className="d-flex align-items-center">
                    <div className="header-icon-wrapper bg-primary-soft rounded-circle p-3 mr-3">
                      <FaFileInvoice className="text-primary" size={28} />
                    </div>
                    <div>
                      <h1 className="h2 mb-1 font-weight-bold">
                        Notes de Perception
                      </h1>
                      <div className="d-flex align-items-center flex-wrap text-muted">
                        <span className="d-flex align-items-center mr-3">
                          <FaUser className="mr-1" size={14} />
                          {prenom} {nom}
                        </span>
                        {role && (
                          <span className="badge badge-light mr-3 px-3 py-1">
                            {role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 text-lg-right mt-3 mt-lg-0">
                  <button
                    className="btn btn-light border shadow-sm px-4"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    <FaSync className={`mr-2 ${refreshing ? "fa-spin" : ""}`} />
                    Actualiser
                  </button>
                </div>
              </div>
            </div>

            {/* STATISTIQUES RAPIDES */}
            <QuickStats />

            {/* SECTION TOP RANKINGS - ENTIÈREMENT CACHABLE */}
            <div className="mb-4">
              <div 
                className="d-flex align-items-center justify-content-between p-3 bg-white rounded shadow-sm mb-3"
                style={{ cursor: 'pointer', borderLeft: '4px solid #007bff' }}
                onClick={() => setShowTopRankings(!showTopRankings)}
              >
                <div className="d-flex align-items-center">
                  <FaChartLine className="text-primary mr-2" size={20} />
                  <h5 className="mb-0 font-weight-bold">Top Rankings</h5>
                  <span className="badge badge-primary ml-3 px-3 py-2">
                    Centres · Articles · Assujettis
                  </span>
                </div>
                <div className="d-flex align-items-center">
                  {showTopRankings ? (
                    <FaChevronUp className="text-muted" size={18} />
                  ) : (
                    <FaChevronDown className="text-muted" size={18} />
                  )}
                </div>
              </div>

              {showTopRankings && (
                <div className="row">
                  <TopCentres />
                  <TopArticles />
                  <TopAssujettis />
                </div>
              )}
            </div>

            {/* FILTRES AVANCÉS */}
            <div className="filters-section bg-white p-4 rounded shadow-sm mb-4">
              <div className="d-flex align-items-center mb-3">
                <button
                  className="btn btn-link text-primary p-0 d-flex align-items-center"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter className="mr-2" />
                  <h6 className="mb-0 font-weight-bold">
                    {showFilters ? 'Masquer les filtres' : 'Afficher les filtres avancés'}
                  </h6>
                </button>
                {(searchTerm || selectedArticle || selectedAssujetti || selectedClasseur || selectedPeriode !== "all") && (
                  <button
                    className="btn btn-sm btn-link text-danger ml-3"
                    onClick={handleReset}
                  >
                    <FaTimes className="mr-1" />
                    Effacer tous les filtres
                  </button>
                )}
              </div>

              {showFilters && (
                <div className="filters-content">
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <label className="small font-weight-bold text-muted mb-1">
                        <FaSearch className="mr-1" />
                        Centre
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nom du centre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="small font-weight-bold text-muted mb-1">
                        <FaTags className="mr-1" />
                        Article budgétaire
                      </label>
                      <select
                        className="form-control"
                        value={selectedArticle}
                        onChange={(e) => setSelectedArticle(e.target.value)}
                        disabled={loading}
                      >
                        <option value="">Tous les articles</option>
                        {articles.map((article) => (
                          <option key={article.id} value={article.code}>
                            {article.code} - {article.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="small font-weight-bold text-muted mb-1">
                        <FaUsers className="mr-1" />
                        Assujetti
                      </label>
                      <select
                        className="form-control"
                        value={selectedAssujetti}
                        onChange={(e) => setSelectedAssujetti(e.target.value)}
                        disabled={loading}
                      >
                        <option value="">Tous les assujettis</option>
                        {assujettis.map((assujetti) => (
                          <option key={assujetti.id} value={assujetti.id}>
                            {assujetti.nom} ({assujetti.numero_nif})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="small font-weight-bold text-muted mb-1">
                        <FaFolder className="mr-1" />
                        Classeur
                      </label>
                      <select
                        className="form-control"
                        value={selectedClasseur}
                        onChange={(e) => setSelectedClasseur(e.target.value)}
                        disabled={loading}
                      >
                        <option value="">Tous les classeurs</option>
                        {classeurs.map((classeur) => (
                          <option key={classeur.id} value={classeur.id}>
                            {classeur.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-2 mb-3">
                      <label className="small font-weight-bold text-muted mb-1">
                        <FaCalendarAlt className="mr-1" />
                        Période
                      </label>
                      <select
                        className="form-control"
                        value={selectedPeriode}
                        onChange={(e) => setSelectedPeriode(e.target.value)}
                        disabled={loading}
                      >
                        <option value="all">Toutes</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                        <option value="year">Cette année</option>
                      </select>
                    </div>

                    <div className="col-md-1 mb-3 d-flex align-items-end">
                      <button
                        className="btn btn-primary w-100"
                        onClick={handleSearch}
                        disabled={loading}
                      >
                        {loading ? <FaSpinner className="fa-spin" /> : <FaSearch />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LISTE DES CENTRES */}
            <div className="results-section">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <h5 className="mb-0 font-weight-bold">
                    <FaBuilding className="mr-2 text-primary" />
                    Centres d'ordonnancement
                  </h5>
                  <span className="badge badge-primary ml-3 px-3 py-2">
                    {pagination.total} résultat(s)
                  </span>
                </div>
                {!loading && pagination.total > 0 && (
                  <small className="text-muted">
                    Page {pagination.current_page} sur {pagination.last_page}
                  </small>
                )}
              </div>

              {loading ? (
                <LoadingSpinner message="Chargement des centres..." />
              ) : centres.length === 0 ? (
                <div className="empty-state bg-white rounded shadow-sm p-5 text-center">
                  <div className="empty-icon-wrapper bg-light rounded-circle p-4 mx-auto mb-4">
                    <FaBuilding className="text-muted" size={48} />
                  </div>
                  <h5 className="text-dark mb-2">Aucun centre trouvé</h5>
                  <p className="text-muted mb-4">
                    Aucun centre d'ordonnancement ne correspond à vos critères de recherche.
                  </p>
                  <button className="btn btn-primary" onClick={handleReset}>
                    <FaSync className="mr-2" />
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <>
                  <div className="row">
                    {centres.map((centre) => (
                      <div key={centre.id} className="col-xl-3 col-lg-4 col-md-6 mb-4">
                        <div className="centre-card card border-0 shadow-sm h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div className="centre-icon-wrapper bg-primary-soft rounded p-3">
                                <FaBuilding className="text-primary" size={24} />
                              </div>
                              <span className="centre-badge badge badge-primary rounded-pill px-3 py-2">
                                {centre.total || 0} note{(centre.total || 0) > 1 ? "s" : ""}
                              </span>
                            </div>

                            <h6 className="centre-title font-weight-bold mb-2">
                              {centre.nom}
                            </h6>

                            {centre.description && (
                              <p className="small text-muted mb-2">
                                {centre.description}
                              </p>
                            )}

                            <div className="centre-meta d-flex flex-wrap gap-2 mb-3">
                              <span className="badge badge-light text-muted">
                                <FaCalendarAlt className="mr-1" size={11} />
                                Créé le {formatDate(centre.created_at)}
                              </span>
                              {centre.derniere_note && (
                                <span className="badge badge-light text-muted" title={timeAgo(centre.derniere_note)}>
                                  <FaClock className="mr-1" size={11} />
                                  Dernière note {timeAgo(centre.derniere_note)}
                                </span>
                              )}
                            </div>

                            {/* Répartition par article */}
                            {centre.repartition_articles && centre.repartition_articles.length > 0 && (
                              <div className="mb-3">
                                <small className="text-muted d-block mb-1">Articles :</small>
                                <div className="d-flex flex-wrap gap-1">
                                  {centre.repartition_articles.map((item, idx) => (
                                    <span key={idx} className="badge badge-light border mr-1 mb-1">
                                      {item.code || 'N/A'} ({item.total})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Barre de progression relative */}
                            <div className="progress mb-3" style={{ height: "6px" }}>
                              <div
                                className="progress-bar bg-primary"
                                style={{
                                  width: `${((centre.total || 0) / Math.max(...centres.map(c => c.total || 0), 1)) * 100}%`
                                }}
                              />
                            </div>

                            <button
                              className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center"
                              onClick={() => handleListeNotes(centre)}
                            >
                              <FaEye className="mr-2" size={14} />
                              Voir les notes
                              <FaArrowRight className="ml-2" size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {!loading && pagination.last_page > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div className="text-muted small">
                        Affichage {((pagination.current_page - 1) * pagination.per_page) + 1} à{" "}
                        {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur{" "}
                        {pagination.total} centres
                      </div>
                      {renderPagination()}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-notes {
          background: linear-gradient(135deg, #f5f7fa 0%, #f8f9fc 100%);
          min-height: 100vh;
        }
        
        .content-wrapper {
          margin-left: 250px;
          padding-top: 20px;
        }
        
        .dashboard-header {
          background: white;
          padding: 25px 30px;
          border-radius: 16px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.02);
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .header-icon-wrapper {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-card {
          transition: all 0.3s ease;
          border: 1px solid rgba(0,0,0,0.03);
          border-radius: 12px;
        }
        
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important;
        }
        
        .stat-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .filters-section {
          border-left: 4px solid #007bff;
          transition: all 0.3s ease;
        }
        
        .centre-card {
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
        }
        
        .centre-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,123,255,0.1) !important;
        }
        
        .centre-icon-wrapper {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: all 0.3s ease;
        }
        
        .centre-card:hover .centre-icon-wrapper {
          transform: scale(1.1);
        }
        
        .centre-badge {
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .centre-title {
          font-size: 1rem;
          color: #2c3e50;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.8rem;
        }
        
        .progress {
          background-color: #eef2f7;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .empty-state {
          border-radius: 16px;
        }
        
        .empty-icon-wrapper {
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .rank-badge {
          font-weight: 600;
          font-size: 0.9rem;
        }
        
        .bg-primary-soft { background: rgba(0, 123, 255, 0.1); }
        .bg-success-soft { background: rgba(40, 167, 69, 0.1); }
        .bg-info-soft { background: rgba(23, 162, 184, 0.1); }
        .bg-warning-soft { background: rgba(255, 193, 7, 0.1); }
        .bg-danger-soft { background: rgba(220, 53, 69, 0.1); }
        
        .gap-2 { gap: 0.5rem; }
        
        @media (max-width: 768px) {
          .content-wrapper {
            margin-left: 0;
          }
          
          .dashboard-header {
            padding: 20px;
          }
          
          .stat-icon {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>
    </div>
  );
};

export default Tableaudebordnote;