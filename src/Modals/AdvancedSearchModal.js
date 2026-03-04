// src/Composant/AdvancedSearchModal.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config";
import {
  FaSearch,
  FaTimes,
  FaFilePdf,
  FaCalendarAlt,
  FaBuilding,
  FaTag,
  FaSpinner,
  FaFileAlt,
  FaEye,
  FaDownload,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle
} from "react-icons/fa";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AdvancedSearchModal = ({
  isOpen,
  onClose,
  token,
  selectedUserDirection,
  userDirection,
  allDirections = []
}) => {
  // État de recherche
  const [searchParams, setSearchParams] = useState({
    query: "",
    id_declaration: "",
    id_classeur: "",
    date_debut: "",
    date_fin: "",
    direction_ids: "",
    sort_by: "created_at",
    sort_order: "desc",
    page: 1,
    per_page: 10
  });

  // État des résultats
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  // Directions disponibles pour le filtre supplémentaire
  const [filteredDirections, setFilteredDirections] = useState([]);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [localDirections, setLocalDirections] = useState([]); // si allDirections est vide

  // Charge les directions si nécessaire
  useEffect(() => {
    if (allDirections.length > 0) {
      setLocalDirections(allDirections);
    } else if (token) {
      fetchDirections();
    }
  }, [allDirections, token]);

  const fetchDirections = async () => {
    setLoadingDirections(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/departements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocalDirections(response.data.data.data || []);
    } catch (error) {
      console.error("Erreur chargement directions:", error);
    } finally {
      setLoadingDirections(false);
    }
  };

  // Met à jour la liste des directions filtrées
  useEffect(() => {
    const directionsSource = allDirections.length > 0 ? allDirections : localDirections;
    if (directionsSource.length > 0 && selectedUserDirection) {
      const filtered = directionsSource.filter(dir => dir.id !== parseInt(selectedUserDirection));
      setFilteredDirections(filtered);
    } else {
      setFilteredDirections(directionsSource);
    }
  }, [allDirections, localDirections, selectedUserDirection]);

  // Réinitialisation à l'ouverture
  useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const handleReset = () => {
    setSearchParams({
      query: "",
      id_declaration: "",
      id_classeur: "",
      date_debut: "",
      date_fin: "",
      direction_ids: "",
      sort_by: "created_at",
      sort_order: "desc",
      page: 1,
      per_page: 10
    });
    setResults([]);
  };

  // Recherche
  const handleSearch = async (page = 1) => {
    if (!searchParams.query && !searchParams.id_declaration && !searchParams.id_classeur && 
        !searchParams.date_debut && !searchParams.date_fin) {
      Swal.fire({
        icon: "info",
        title: "Recherche vide",
        text: "Veuillez saisir au moins un critère de recherche",
        confirmButtonColor: "#3085d6"
      });
      return;
    }

    setLoading(true);
    try {
      const params = {
        ...searchParams,
        page,
        direction_ids: searchParams.direction_ids || undefined
      };

      console.log("🔍 Envoi recherche avec params:", params);
      console.log("URL:", `${API_BASE_URL}/documents-declaration/advanced-search/${selectedUserDirection}`);

      const response = await axios.post(
        `${API_BASE_URL}/documents-declaration/advanced-search/${selectedUserDirection}`,
        params,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setResults(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Erreur recherche:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.response?.data?.message || "Impossible d'effectuer la recherche"
      });
    } finally {
      setLoading(false);
    }
  };

  // Tri
  const handleSort = (field) => {
    setSearchParams(prev => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === "desc" ? "asc" : "desc",
      page: 1
    }));
    setTimeout(() => handleSearch(1), 0);
  };

  const getSortIcon = (field) => {
    if (searchParams.sort_by !== field) return <FaSort className="text-muted" />;
    return searchParams.sort_order === "asc" ? 
      <FaSortUp className="text-primary" /> : 
      <FaSortDown className="text-primary" />;
  };

  // Formatage
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        `<mark class="bg-warning text-dark p-0">${part}</mark>` : 
        part
    ).join("");
  };

  const getDirectionName = (directionId) => {
    if (!directionId) return "N/A";
    const dir = (allDirections.length > 0 ? allDirections : localDirections).find(d => d.id === parseInt(directionId));
    return dir ? `${dir.sigle || ""} ${dir.nom}`.trim() : `ID: ${directionId}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* En-tête */}
        <div className="modal-header">
          <h3 className="d-flex align-items-center">
            <FaSearch className="mr-2" />
            Recherche avancée OCR
          </h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Info direction */}
          <div className="alert alert-info d-flex align-items-center mb-3">
            <FaInfoCircle className="mr-2" />
            <div>
              <strong>Direction active :</strong>{' '}
              {userDirection ? `${userDirection.sigle} - ${userDirection.nom}` : `Direction #${selectedUserDirection}`}
              <small className="d-block text-muted">
                Tous les résultats sont filtrés par cette direction (par défaut)
              </small>
            </div>
          </div>

          {/* Formulaire */}
          <div className="search-form mb-4">
            <div className="row">
              <div className="col-md-12 mb-3">
                <label className="form-label">
                  <FaSearch className="mr-1" />
                  Rechercher dans le texte OCR
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Mots-clés dans le contenu des documents..."
                  value={searchParams.query}
                  onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value, page: 1 })}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch(1)}
                />
                <small className="text-muted">Recherche dans le texte extrait par OCR (montext)</small>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FaTag className="mr-1" />
                  ID Déclaration
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="ex: 123"
                  value={searchParams.id_declaration}
                  onChange={(e) => setSearchParams({ ...searchParams, id_declaration: e.target.value, page: 1 })}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FaTag className="mr-1" />
                  ID Classeur
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="ex: 456"
                  value={searchParams.id_classeur}
                  onChange={(e) => setSearchParams({ ...searchParams, id_classeur: e.target.value, page: 1 })}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FaCalendarAlt className="mr-1" />
                  Date début
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={searchParams.date_debut}
                  onChange={(e) => setSearchParams({ ...searchParams, date_debut: e.target.value, page: 1 })}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FaCalendarAlt className="mr-1" />
                  Date fin
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={searchParams.date_fin}
                  onChange={(e) => setSearchParams({ ...searchParams, date_fin: e.target.value, page: 1 })}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-12 mb-3">
                <label className="form-label">
                  <FaBuilding className="mr-1" />
                  Direction supplémentaire (optionnel)
                </label>
                <select
                  className="form-control"
                  value={searchParams.direction_ids}
                  onChange={(e) => setSearchParams({ ...searchParams, direction_ids: e.target.value, page: 1 })}
                  disabled={loadingDirections}
                >
                  <option value="">Aucune direction supplémentaire</option>
                  {filteredDirections.map((dir) => (
                    <option key={dir.id} value={dir.id}>
                      {dir.sigle} - {dir.nom}
                    </option>
                  ))}
                  {filteredDirections.length === 0 && (allDirections.length > 1 || localDirections.length > 1) && (
                    <option value="" disabled>Toutes les autres directions</option>
                  )}
                </select>
                <small className="text-muted">
                  {filteredDirections.length > 0 
                    ? `Sélectionnez une direction en plus de la vôtre (${filteredDirections.length} disponible(s))`
                    : "Aucune autre direction disponible"}
                </small>
              </div>
            </div>

            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-outline-secondary" onClick={handleReset} disabled={loading}>
                <FaTimes className="mr-2" />
                Effacer
              </button>
              <button className="btn btn-primary" onClick={() => handleSearch(1)} disabled={loading}>
                {loading ? (
                  <>
                    <FaSpinner className="fa-spin mr-2" />
                    Recherche...
                  </>
                ) : (
                  <>
                    <FaSearch className="mr-2" />
                    Rechercher
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Résultats */}
          {results.length > 0 && (
            <div className="results-section">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="font-weight-bold">
                  <FaFileAlt className="mr-2" />
                  Résultats ({pagination.total})
                </h6>
                <div className="d-flex align-items-center">
                  <span className="badge badge-info mr-2">
                    {pagination.current_page} / {pagination.last_page}
                  </span>
                  <span className="badge badge-primary mr-2">
                    {userDirection?.sigle || `Dir #${selectedUserDirection}`}
                  </span>
                  {searchParams.direction_ids && (
                    <span className="badge badge-secondary">
                      + {getDirectionName(searchParams.direction_ids)}
                    </span>
                  )}
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="thead-light">
                    <tr>
                      <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                        ID {getSortIcon("id")}
                      </th>
                      <th onClick={() => handleSort("nom_native")} style={{ cursor: "pointer" }}>
                        Document {getSortIcon("nom_native")}
                      </th>
                      <th>Direction</th>
                      <th onClick={() => handleSort("taille")} style={{ cursor: "pointer" }}>
                        Taille {getSortIcon("taille")}
                      </th>
                      <th onClick={() => handleSort("created_at")} style={{ cursor: "pointer" }}>
                        Date {getSortIcon("created_at")}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaFilePdf className="text-danger mr-2" />
                            <div>
                              <div className="font-weight-bold">{doc.nom_native || doc.nom_fichier}</div>
                              {doc.extrait && (
                                <small 
                                  className="text-muted d-block"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(doc.extrait, searchParams.query)
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-light">
                            {doc.direction_nom || getDirectionName(doc.direction_id) || "N/A"}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-light">
                            {formatFileSize(doc.taille)}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatDate(doc.created_at)}
                          </small>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button 
                              className="btn btn-outline-info"
                              onClick={() => window.open(`${API_BASE_URL}/documents-declaration/download/${doc.id}`, "_blank")}
                              title="Voir le PDF"
                            >
                              <FaEye />
                            </button>
                            <button 
                              className="btn btn-outline-success"
                              onClick={() => window.open(`${API_BASE_URL}/documents-declaration/download/${doc.id}`, "_blank")}
                              title="Télécharger"
                            >
                              <FaDownload />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted small">
                    Affichage {((pagination.current_page - 1) * pagination.per_page) + 1} à{" "}
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur{" "}
                    {pagination.total} documents
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${pagination.current_page === 1 ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => handleSearch(pagination.current_page - 1)}
                          disabled={pagination.current_page === 1}
                        >
                          <FaChevronLeft size={12} />
                        </button>
                      </li>
                      
                      {[...Array(Math.min(5, pagination.last_page))].map((_, i) => {
                        let pageNum = pagination.current_page;
                        if (pagination.last_page <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.current_page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.current_page >= pagination.last_page - 2) {
                          pageNum = pagination.last_page - 4 + i;
                        } else {
                          pageNum = pagination.current_page - 2 + i;
                        }
                        
                        if (pageNum > 0 && pageNum <= pagination.last_page) {
                          return (
                            <li key={pageNum} className={`page-item ${pagination.current_page === pageNum ? "active" : ""}`}>
                              <button
                                className="page-link"
                                onClick={() => handleSearch(pageNum)}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        }
                        return null;
                      })}
                      
                      <li className={`page-item ${pagination.current_page === pagination.last_page ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => handleSearch(pagination.current_page + 1)}
                          disabled={pagination.current_page === pagination.last_page}
                        >
                          <FaChevronRight size={12} />
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-5">
              <FaSearch className="text-muted mb-3" size={48} />
              <h6>Aucun résultat trouvé</h6>
              <p className="text-muted small">
                Utilisez les filtres ci-dessus pour rechercher dans les documents OCR
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Styles intégrés */}
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          animation: fadeIn 0.3s ease;
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          width: 95%;
          max-width: 1300px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s ease;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #dee2e6;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px 12px 0 0;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
          transition: opacity 0.3s;
        }

        .close-btn:hover {
          opacity: 1;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .search-form {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #495057;
          font-size: 0.9rem;
        }

        .form-control {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 6px;
          transition: all 0.3s;
        }

        .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .results-section {
          margin-top: 2rem;
        }

        .table {
          width: 100%;
          margin-bottom: 1rem;
          color: #212529;
          border-collapse: collapse;
        }

        .table th {
          padding: 0.75rem;
          vertical-align: middle;
          border-top: 1px solid #dee2e6;
          border-bottom: 2px solid #dee2e6;
          background: #f8f9fa;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .table td {
          padding: 0.75rem;
          vertical-align: middle;
          border-top: 1px solid #dee2e6;
          font-size: 0.9rem;
        }

        .table-hover tbody tr:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }

        .btn-group-sm {
          gap: 0.25rem;
        }

        .btn-outline-info, .btn-outline-success {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }

        .pagination {
          margin-bottom: 0;
        }

        .page-link {
          padding: 0.5rem 0.75rem;
          color: #007bff;
          background-color: #fff;
          border: 1px solid #dee2e6;
          cursor: pointer;
        }

        .page-item.active .page-link {
          z-index: 3;
          color: #fff;
          background-color: #007bff;
          border-color: #007bff;
        }

        .page-item.disabled .page-link {
          color: #6c757d;
          pointer-events: none;
          background-color: #fff;
          border-color: #dee2e6;
        }

        mark {
          background-color: #fff3cd;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
        }

        .badge {
          font-size: 0.85rem;
          padding: 0.35rem 0.65rem;
        }

        .alert-info {
          background-color: #d1ecf1;
          border-color: #bee5eb;
          color: #0c5460;
          padding: 1rem;
          border-radius: 8px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AdvancedSearchModal;