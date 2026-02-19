import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { useHistory } from "react-router-dom"; // CORRECTION ICI
import {
  FaFolder,
  FaFileAlt,
  FaSearch,
  FaSync,
  FaArrowRight,
  FaBuilding,
  FaUser,
  FaChartPie,
  FaCalendarAlt,
  FaEye,
  FaSpinner,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaClock,
  FaCheckCircle,
  FaArchive,
  FaChartLine,
  FaLayerGroup,
  FaTags,
  FaFilter,
  FaTimes,
  FaChevronUp,
  FaChevronDown
} from "react-icons/fa";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "../Loading/LoadingSpinner";

const DashboardScreen = () => {
  const history = useHistory();
  const token = GetTokenOrRedirect();

  // 🔹 État utilisateur
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur")) || {};
  const nom = utilisateur?.nom || "";
  const prenom = utilisateur?.prenom || "";
  const role = utilisateur?.role || "";
  const id_direction = utilisateur?.id_direction || "";



  // 🔹 États principaux
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classificateurs, setClassificateurs] = useState([]);
  const [directions, setDirections] = useState([]);
  const [stats, setStats] = useState({
    total_documents: 0,
    total_classificateurs: 0,
    total_directions: 0,
    documents_actifs: 0,
    documents_archives: 0,
    documents_aujourdhui: 0,
    documents_semaine: 0,
    documents_mois: 0,
    top_classificateurs: [],
    top_directions: []
  });

  // 🔹 Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("all");
  const [selectedStatut, setSelectedStatut] = useState("tous");
  const [showFilters, setShowFilters] = useState(true);
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
  }, [token, currentPage]);

  // 🔹 Surveiller les changements de selectedDirection (DEBUG)
  useEffect(() => {
    console.log("🔄 selectedDirection a changé:", selectedDirection);
  }, [selectedDirection]);

  // 🔹 Obtenir les en-têtes d'authentification
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  });

  // 🔹 Charger TOUTES les données en parallèle
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStatistics(),
        fetchClassifiers(),
        fetchDirections()
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
        `${API_BASE_URL}/dashboard/statistics`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Erreur statistiques:", error);
    }
  };

  // 🔹 Classificateurs avec pagination
  const fetchClassifiers = async () => {
    try {
      const params = {
        page: currentPage,
        per_page: itemsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedDirection) params.id_direction = selectedDirection;
      if (selectedPeriode !== "all") params.periode = selectedPeriode;

      const response = await axios.get(
        `${API_BASE_URL}/dashboard/classifiers`,
        { headers: getAuthHeaders(), params }
      );
      

      if (response.data.success) {
        setClassificateurs(response.data.data.data || []);
        setPagination({
          current_page: response.data.data.current_page || 1,
          last_page: response.data.data.last_page || 1,
          per_page: response.data.data.per_page || 12,
          total: response.data.data.total || 0
        });
      }
    } catch (error) {
      console.error("Erreur classificateurs:", error);
    }
  
  };

  // 🔹 Directions
  const fetchDirections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/departements`, {
        headers: getAuthHeaders()
      });
      setDirections(response.data.data.data);
      console.log("📋 Directions chargées:", response.data.data.data);
    } catch (error) {
      console.error("Erreur directions:", error);
    }
  };

  // 🔹 Recherche avancée
  const handleSearch = async () => {
    if (!searchTerm && !selectedDirection && selectedPeriode === "all" && selectedStatut === "tous") {
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
        `${API_BASE_URL}/dashboard/search`,
        {
          nom_classeur: searchTerm,
          id_direction: selectedDirection,
          periode: selectedPeriode,
          statut: selectedStatut
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setClassificateurs(response.data.data.classificateurs || []);
        setPagination(response.data.data.pagination);

        Swal.fire({
          icon: "success",
          title: `${response.data.data.classificateurs.length} résultat(s) trouvé(s)`,
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
    setSelectedDirection("");
    setSelectedPeriode("all");
    setSelectedStatut("tous");
    setCurrentPage(1);
    fetchAllData();
  };

const handleListeDocument = (classifier) => {
    // 🔍 Vérifier la valeur de selectedDirection
    console.log("🔍 DONNÉES AVANT ENVOI:", {
        classifier: classifier,
        selectedDirection: selectedDirection,
        selectedPeriode: selectedPeriode,
        searchTerm: searchTerm
    });

    // Initialiser les variables
    let directionAEnvoyer = selectedDirection;
    let nomDirectionAEnvoyer = "";
    let directionInfo = null;

    if (!directionAEnvoyer) {
        // Cas 1: Utiliser les données du classificateur
        if (classifier.directions && classifier.directions.length > 0) {
            directionInfo = classifier.directions[0];
            directionAEnvoyer = directionInfo.id;
            nomDirectionAEnvoyer = directionInfo.nom || directionInfo.sigle || "";
            console.log("📌 Direction trouvée dans directions[]:", directionInfo);
        }
        // Cas 2: Utiliser les déclarations
        else if (classifier.declarations && classifier.declarations.length > 0) {
            const firstDecl = classifier.declarations[0];
            directionAEnvoyer = firstDecl.id_direction;
            nomDirectionAEnvoyer = firstDecl.nom_direction || 
                                   firstDecl.departement?.nom || 
                                   firstDecl.direction?.nom || "";
            directionInfo = firstDecl.departement || firstDecl.direction;
            console.log("📌 Direction trouvée dans declarations[]:", firstDecl);
        }
        // Cas 3: Utiliser la direction de l'utilisateur
        else {
            directionAEnvoyer = id_direction;
            directionInfo = directions.find(d => d.id === parseInt(id_direction));
            nomDirectionAEnvoyer = directionInfo?.nom || directionInfo?.sigle || "";
            console.log("📌 Direction utilisateur:", directionInfo);
        }
    } else {
        // Cas 4: Direction sélectionnée manuellement
        directionInfo = directions.find(d => d.id === parseInt(selectedDirection));
        nomDirectionAEnvoyer = directionInfo?.nom || directionInfo?.sigle || "";
    }

    // ALERTE pour voir la valeur envoyée
   // alert(`Direction envoyée: ${directionAEnvoyer} - ${nomDirectionAEnvoyer}`);

    // ✅ Envoi des données enrichies
    history.push({
        pathname: `/listedocument/${classifier.id}`,
        state: {
            classifier,
            direction: directionAEnvoyer,
            nomDirection: nomDirectionAEnvoyer,
            directionInfo: directionInfo,  // ← Toutes les infos de la direction
            periode: selectedPeriode,
            searchTerm
        }
    });
};
  // 🔹 Obtenir l'icône du fichier
  const getFileIcon = (nom) => {
    const type = nom?.toLowerCase() || "";
    if (type.includes("pdf")) return <FaFilePdf className="text-danger" size={20} />;
    if (type.includes("word") || type.includes("doc")) return <FaFileWord className="text-primary" size={20} />;
    if (type.includes("excel") || type.includes("xls")) return <FaFileExcel className="text-success" size={20} />;
    if (type.includes("image") || type.includes("jpg") || type.includes("png"))
      return <FaFileImage className="text-info" size={20} />;
    if (type.includes("lettre")) return <FaFileAlt className="text-warning" size={20} />;
    if (type.includes("arrêté") || type.includes("arrete"))
      return <FaFileAlt className="text-purple" size={20} />;
    if (type.includes("diplôme") || type.includes("diplome"))
      return <FaFileAlt className="text-success" size={20} />;
    if (type.includes("convocation")) return <FaFileAlt className="text-info" size={20} />;
    return <FaFolder className="text-primary" size={20} />;
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
    <div className="dashboard-documents">
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
                      <FaLayerGroup className="text-primary" size={28} />
                    </div>
                    <div>
                      <h1 className="h2 mb-1 font-weight-bold">
                        Gestion Documentaire
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
                        {id_direction && (
                          <span className="d-flex align-items-center">
                            <FaBuilding className="mr-1" size={14} />
                            {directions.find(d => d.id === parseInt(id_direction))?.nom || "Direction"}
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

            {/* STATISTIQUES */}
            <div className="row mb-4">
              <div className="col-lg-3 col-md-6 mb-3">
                <div className="stat-card bg-white p-3 rounded shadow-sm">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">Total Documents</p>
                      <h2 className="mb-0 font-weight-bold">{stats.total_documents}</h2>
                      <small className="text-success">
                        <FaCheckCircle className="mr-1" size={12} />
                        {stats.documents_actifs} actifs
                      </small>
                    </div>
                    <div className="stat-icon bg-primary-soft rounded-circle p-3">
                      <FaFileAlt className="text-primary" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6 mb-3">
                <div className="stat-card bg-white p-3 rounded shadow-sm">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">Classificateurs</p>
                      <h2 className="mb-0 font-weight-bold">{stats.total_classificateurs}</h2>
                      <small className="text-info">
                        <FaFolder className="mr-1" size={12} />
                        {classificateurs.length} affichés
                      </small>
                    </div>
                    <div className="stat-icon bg-info-soft rounded-circle p-3">
                      <FaFolder className="text-info" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6 mb-3">
                <div className="stat-card bg-white p-3 rounded shadow-sm">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">Ce Mois</p>
                      <h2 className="mb-0 font-weight-bold">{stats.documents_mois}</h2>
                      <small className="text-warning">
                        <FaCalendarAlt className="mr-1" size={12} />
                        +{stats.documents_semaine} cette semaine
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
                      <p className="text-muted small mb-1">Aujourd'hui</p>
                      <h2 className="mb-0 font-weight-bold">{stats.documents_aujourdhui}</h2>
                      <small className="text-success">
                        <FaClock className="mr-1" size={12} />
                        Nouveaux documents
                      </small>
                    </div>
                    <div className="stat-icon bg-success-soft rounded-circle p-3">
                      <FaClock className="text-success" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FILTRES AVANCÉS */}
            <div className="filters-section bg-white rounded shadow-sm mb-4">
              <div 
                className="filters-header p-3 d-flex align-items-center justify-content-between"
                style={{ cursor: 'pointer', borderBottom: showFilters ? '1px solid #dee2e6' : 'none' }}
                onClick={() => setShowFilters(!showFilters)}
              >
                <div className="d-flex align-items-center">
                  <FaFilter className="text-primary mr-2" />
                  <h6 className="mb-0 font-weight-bold">Filtres de recherche</h6>
                  {(searchTerm || selectedDirection || selectedPeriode !== "all" || selectedStatut !== "tous") && (
                    <span className="badge badge-primary ml-2">Filtres actifs</span>
                  )}
                </div>
                <div className="d-flex align-items-center">
                  {(searchTerm || selectedDirection || selectedPeriode !== "all" || selectedStatut !== "tous") && (
                    <button
                      className="btn btn-sm btn-link text-danger mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                    >
                      <FaTimes className="mr-1" />
                      Effacer tout
                    </button>
                  )}
                  {showFilters ? <FaChevronUp className="text-muted" /> : <FaChevronDown className="text-muted" />}
                </div>
              </div>

              {showFilters && (
                <div className="filters-content p-3">
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <label className="small font-weight-bold text-muted mb-1">
                        <FaSearch className="mr-1" />
                        Mot-clé
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nom du classeur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="small font-weight-bold text-muted mb-1">
                        <FaBuilding className="mr-1" />
                        Direction
                      </label>
                      <select
                        className="form-control"
                        value={selectedDirection}
                        onChange={(e) => {
                          console.log("📝 Changement direction:", e.target.value);
                          setSelectedDirection(e.target.value);
                        }}
                        disabled={loading}
                      >
                        <option value="">Toutes les directions</option>
                        {directions.map((direction) => (
                          <option key={direction.id} value={direction.id}>
                            {direction.sigle} - {direction.nom}
                          </option>
                        ))}
                      </select>
                      {selectedDirection && (
                        <small className="text-success d-block mt-1">
                          ✅ Direction sélectionnée: {directions.find(d => d.id === parseInt(selectedDirection))?.nom}
                        </small>
                      )}
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

                    <div className="col-md-2 mb-3">
                      <label className="small font-weight-bold text-muted mb-1">
                        <FaFileAlt className="mr-1" />
                        Statut
                      </label>
                      <select
                        className="form-control"
                        value={selectedStatut}
                        onChange={(e) => setSelectedStatut(e.target.value)}
                        disabled={loading}
                      >
                        <option value="tous">Tous</option>
                        <option value="actif">Actif</option>
                        <option value="archivé">Archivé</option>
                      </select>
                    </div>

                    <div className="col-md-2 mb-3 d-flex align-items-end">
                      <button
                        className="btn btn-primary w-100"
                        onClick={handleSearch}
                        disabled={loading}
                      >
                        {loading ? <FaSpinner className="fa-spin mr-2" /> : <FaSearch className="mr-2" />}
                        Chercher
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RÉSULTATS */}
            <div className="results-section">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <h5 className="mb-0 font-weight-bold">
                    <FaFolder className="mr-2 text-primary" />
                    Classificateurs
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
                <LoadingSpinner message="Chargement des classificateurs..." />
              ) : classificateurs.length === 0 ? (
                <div className="empty-state bg-white rounded shadow-sm p-5 text-center">
                  <div className="empty-icon-wrapper bg-light rounded-circle p-4 mx-auto mb-4">
                    <FaFolder className="text-muted" size={48} />
                  </div>
                  <h5 className="text-dark mb-2">Aucun classificateur trouvé</h5>
                  <p className="text-muted mb-4">
                    Aucun classificateur ne correspond à vos critères de recherche.
                  </p>
                  <button className="btn btn-primary" onClick={handleReset}>
                    <FaSync className="mr-2" />
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <>
                  <div className="row">
                    {classificateurs.map((classifier) => (
                      <div key={classifier.id} className="col-xl-3 col-lg-4 col-md-6 mb-4">
                        <div className="classifier-card card border-0 shadow-sm h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div className="classifier-icon-wrapper bg-primary-soft rounded p-3">
                                {getFileIcon(classifier.nom_classeur)}
                              </div>
                              <span className="classifier-badge badge badge-primary rounded-pill px-3 py-2">
                                {classifier.total || 0} doc{(classifier.total || 0) > 1 ? "s" : ""}
                              </span>
                            </div>

                            <h6 className="classifier-title font-weight-bold mb-2">
                              {classifier.nom_classeur}
                            </h6>

                            <div className="classifier-meta d-flex flex-wrap gap-2 mb-3">
                              <span className="badge badge-light text-muted">
                                <FaCalendarAlt className="mr-1" size={11} />
                                {formatDate(classifier.created_at)}
                              </span>
                              {classifier.dernier_document && (
                                <span className="badge badge-light text-muted" title={timeAgo(classifier.dernier_document)}>
                                  <FaClock className="mr-1" size={11} />
                                  {timeAgo(classifier.dernier_document)}
                                </span>
                              )}
                            </div>

                            <div className="progress mb-3" style={{ height: "6px" }}>
                              <div
                                className="progress-bar bg-primary"
                                style={{
                                  width: `${((classifier.total || 0) / Math.max(...classificateurs.map(c => c.total || 0), 1)) * 100}%`
                                }}
                              />
                            </div>

                            <button
                              className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center"
                              onClick={() => handleListeDocument(classifier)}
                            >
                              <FaEye className="mr-2" size={14} />
                              Voir les documents
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
                        {pagination.total} classeurs
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
        .dashboard-documents {
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
        
        .filters-header {
          background: white;
          border-radius: 16px 16px 0 0;
        }
        
        .filters-header:hover {
          background-color: #f8f9fa;
        }
        
        .classifier-card {
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
        }
        
        .classifier-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,123,255,0.1) !important;
        }
        
        .classifier-icon-wrapper {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: all 0.3s ease;
        }
        
        .classifier-card:hover .classifier-icon-wrapper {
          transform: scale(1.1);
        }
        
        .classifier-badge {
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .classifier-title {
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
        
        .bg-primary-soft { background: rgba(0, 123, 255, 0.1); }
        .bg-success-soft { background: rgba(40, 167, 69, 0.1); }
        .bg-info-soft { background: rgba(23, 162, 184, 0.1); }
        .bg-warning-soft { background: rgba(255, 193, 7, 0.1); }
        .bg-purple { background: #6f42c1; }
        .bg-purple-soft { background: rgba(111, 66, 193, 0.1); }
        .text-purple { color: #6f42c1; }
        
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
export default DashboardScreen;

