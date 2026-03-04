// src/Composant/AdvancedSearchNoteModal.js
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
  FaFilter,
  FaTrash,
  FaInfoCircle,
  FaUsers,
  FaFolder,
  FaMoneyBillWave,
  FaFileInvoice,
  FaList
} from "react-icons/fa";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AdvancedSearchNoteModal = ({ isOpen, onClose, token }) => {
  // État de recherche
  const [searchParams, setSearchParams] = useState({
    query: "",
    id_classeur: "",
    id_assujetti: "",
    numero_article: "",
    date_debut: "",
    date_fin: "",
    sort_by: "date_ordonnancement",
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

  // État des listes déroulantes
  const [classeurs, setClasseurs] = useState([]);
  const [assujettis, setAssujettis] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // Charger les listes au montage
  useEffect(() => {
    if (token) {
      fetchLists();
    }
  }, [token]);

  // Charger les listes (classeurs, assujettis, articles)
  const fetchLists = async () => {
    setLoadingLists(true);
    try {
      const [classeursRes, assujettisRes, articlesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboards/notes/classeurs`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/dashboards/notes/assujettis`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/dashboards/notes/articles`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (classeursRes.data.success) setClasseurs(classeursRes.data.data || []);
      if (assujettisRes.data.success) setAssujettis(assujettisRes.data.data || []);
      if (articlesRes.data.success) setArticles(articlesRes.data.data || []);
    } catch (error) {
      console.error("Erreur chargement listes:", error);
    } finally {
      setLoadingLists(false);
    }
  };

  // Réinitialiser la recherche
  const handleReset = () => {
    setSearchParams({
      query: "",
      id_classeur: "",
      id_assujetti: "",
      numero_article: "",
      date_debut: "",
      date_fin: "",
      sort_by: "date_ordonnancement",
      sort_order: "desc",
      page: 1,
      per_page: 10
    });
    setResults([]);
  };

  // Lancer la recherche
  const handleSearch = async (page = 1) => {
    // Validation : au moins un critère
    if (!searchParams.query && !searchParams.id_classeur && !searchParams.id_assujetti && 
        !searchParams.numero_article && !searchParams.date_debut && !searchParams.date_fin) {
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
      // Préparer les paramètres
      const params = {
        ...searchParams,
        page
      };

      console.log("📤 Envoi requête avec params:", params);

      // Appel API pour la recherche avancée des notes
      const response = await axios.post(
        `${API_BASE_URL}/notes-perception/advanced-search`,
        params,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("📥 Réponse API complète:", response.data);

      if (response.data.success) {
        const data = response.data.data || [];
        console.log("📊 Données reçues:", data);
        
        // 👇 ALERTE SUPPRIMÉE

        setResults(data);
        setPagination(response.data.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: data.length
        });
      }
    } catch (error) {
      console.error("❌ Erreur recherche:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.response?.data?.message || error.message || "Impossible d'effectuer la recherche"
      });
    } finally {
      setLoading(false);
    }
  };

  // Gérer le tri
  const handleSort = (field) => {
    setSearchParams(prev => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === "desc" ? "asc" : "desc",
      page: 1
    }));
    setTimeout(() => handleSearch(1), 0);
  };

  // Obtenir l'icône de tri
  const getSortIcon = (field) => {
    if (searchParams.sort_by !== field) return <FaSort className="text-muted" />;
    return searchParams.sort_order === "asc" ? 
      <FaSortUp className="text-primary" /> : 
      <FaSortDown className="text-primary" />;
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
    } catch {
      return dateString;
    }
  };

  // Formater le montant
  const formatMontant = (montant) => {
    if (!montant) return "N/A";
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(montant);
  };

  // Mettre en surbrillance le texte recherché
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        `<mark class="bg-warning text-dark p-0">${part}</mark>` : 
        part
    ).join("");
  };

  // Obtenir le nom du classeur
  const getClasseurNom = (classeurId) => {
    if (!classeurId) return "N/A";
    const classeur = classeurs.find(c => c.id === parseInt(classeurId));
    return classeur ? classeur.nom : `ID: ${classeurId}`;
  };

  // Obtenir le nom de l'assujetti
  const getAssujettiNom = (assujettiId) => {
    if (!assujettiId) return "N/A";
    const assujetti = assujettis.find(a => a.id === parseInt(assujettiId));
    return assujetti ? assujetti.nom : `ID: ${assujettiId}`;
  };

  // Formater la taille des fichiers
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* En-tête */}
        <div className="modal-header">
          <h3 className="d-flex align-items-center">
            <FaSearch className="mr-2" />
            Recherche avancée - Notes de Perception
          </h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Info générale */}
          <div className="alert alert-info d-flex align-items-center mb-3">
            <FaInfoCircle className="mr-2" />
            <div>
              <strong>Recherche dans les notes de perception</strong>
              <small className="d-block text-muted">
                Recherchez par numéro de série, article, assujetti, ou dans le texte OCR des documents
              </small>
            </div>
          </div>

          {/* Formulaire de recherche */}
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
                  onChange={(e) => setSearchParams({
                    ...searchParams,
                    query: e.target.value,
                    page: 1
                  })}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch(1)}
                />
                <small className="text-muted">
                  Recherche dans le texte extrait par OCR (montext)
                </small>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FaFolder className="mr-1" />
                  Classeur
                </label>
                <select
                  className="form-control"
                  value={searchParams.id_classeur}
                  onChange={(e) => setSearchParams({
                    ...searchParams,
                    id_classeur: e.target.value,
                    page: 1
                  })}
                  disabled={loadingLists}
                >
                  <option value="">Tous les classeurs</option>
                  {classeurs.map((classeur) => (
                    <option key={classeur.id} value={classeur.id}>
                      {classeur.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FaUsers className="mr-1" />
                  Assujetti
                </label>
                <select
                  className="form-control"
                  value={searchParams.id_assujetti}
                  onChange={(e) => setSearchParams({
                    ...searchParams,
                    id_assujetti: e.target.value,
                    page: 1
                  })}
                  disabled={loadingLists}
                >
                  <option value="">Tous les assujettis</option>
                  {assujettis.map((assujetti) => (
                    <option key={assujetti.id} value={assujetti.id}>
                      {assujetti.nom} {assujetti.numero_nif ? `(${assujetti.numero_nif})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FaTag className="mr-1" />
                  Article budgétaire
                </label>
                <select
                  className="form-control"
                  value={searchParams.numero_article}
                  onChange={(e) => setSearchParams({
                    ...searchParams,
                    numero_article: e.target.value,
                    page: 1
                  })}
                  disabled={loadingLists}
                >
                  <option value="">Tous les articles</option>
                  {articles.map((article) => (
                    <option key={article.id} value={article.code}>
                      {article.code} - {article.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <FaCalendarAlt className="mr-1" />
                  Période
                </label>
                <div className="d-flex">
                  <input
                    type="date"
                    className="form-control mr-2"
                    placeholder="Date début"
                    value={searchParams.date_debut}
                    onChange={(e) => setSearchParams({
                      ...searchParams,
                      date_debut: e.target.value,
                      page: 1
                    })}
                  />
                  <input
                    type="date"
                    className="form-control"
                    placeholder="Date fin"
                    value={searchParams.date_fin}
                    onChange={(e) => setSearchParams({
                      ...searchParams,
                      date_fin: e.target.value,
                      page: 1
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between mt-3">
              <button 
                className="btn btn-outline-secondary" 
                onClick={handleReset}
                disabled={loading}
              >
                <FaTimes className="mr-2" />
                Effacer
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleSearch(1)}
                disabled={loading}
              >
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
          {results.length > 0 ? (
            <div className="results-section">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="font-weight-bold">
                  <FaFileInvoice className="mr-2" />
                  Documents trouvés ({pagination.total})
                </h6>
                <div className="d-flex align-items-center">
                  <span className="badge badge-info mr-2">
                    {pagination.current_page} / {pagination.last_page}
                  </span>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="thead-light">
                    <tr>
                      <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                        ID Doc {getSortIcon("id")}
                      </th>
                      <th>Document</th>
                    
                      <th>Assujetti</th>
                      <th>Classeur</th>
                      <th>Date</th>
                      <th>OCR</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((doc, index) => (
                      <tr key={doc.id}>
                        <td>{index+1}</td>
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
                    {/*     <td>
                          <span className="badge badge-info">
                            {doc.note_info?.numero_serie || 'N/A'}
                          </span>
                          <small className="d-block text-muted">ID Note: {doc.note_id}</small>
                        </td> */}
                        <td>
                          <span className="badge badge-light">
                            {getAssujettiNom(doc.note_info?.id_assujetti)}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-light">
                            {getClasseurNom(doc.note_info?.id_classeur)}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatDate(doc.note_info?.date_ordonnancement)}
                          </small>
                        </td>
                        <td>
                          {doc.montext ? (
                            <span className="text-success" title="Texte OCR disponible">
                              <FaFileAlt className="mr-1" />
                              OK
                            </span>
                          ) : (
                            <span className="text-muted">
                              <FaTimes size={12} />
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="btn-group btn-group-sm" style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                            {/* Bouton Voir - utilise doc.id (ID du document) */}
                            <button 
                              className="btn btn-outline-info"
                              onClick={() => {
                                const url = `${API_BASE_URL}/documents-declaration/download/${doc.id}`;
                                console.log("📤 Ouverture URL:", url);
                                window.open(url, "_blank");
                              }}
                              title="Voir le PDF"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                borderRadius: '4px'
                              }}
                            >
                              <FaEye size={14} />
                            </button>
                            
                            {/* Bouton Télécharger - utilise doc.id (ID du document) */}
                            <button 
                              className="btn btn-outline-success"
                              onClick={() => {
                                const url = `${API_BASE_URL}/documents-declaration/download/${doc.id}`;
                                console.log("📥 Téléchargement URL:", url);
                                window.open(url, "_blank");
                              }}
                              title="Télécharger"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                borderRadius: '4px'
                              }}
                            >
                              <FaDownload size={14} />
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
          ) : !loading && (
            <div className="text-center py-5">
              <FaSearch className="text-muted mb-3" size={48} />
              <h6>Aucun document trouvé</h6>
              <p className="text-muted small">
                Utilisez les filtres ci-dessus pour rechercher dans les notes de perception
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
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
          max-width: 1400px;
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
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
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
          border-color: #28a745;
          box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
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
          color: #28a745;
          background-color: #fff;
          border: 1px solid #dee2e6;
          cursor: pointer;
        }

        .page-item.active .page-link {
          z-index: 3;
          color: #fff;
          background-color: #28a745;
          border-color: #28a745;
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

export default AdvancedSearchNoteModal;