// screens/ListenoteScreen.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import Menus from "../Composant/Menus";
import Head from "../Composant/Head";
import { useLocation, useParams } from "react-router-dom/cjs/react-router-dom.min";
import ModalNote from "../Modals/ModalNote";
import LoadingSpinner from "../Loading/LoadingSpinner";
import {
  FaFileInvoice,
  FaSearch,
  FaSync,
  FaFilePdf,
  FaBuilding,
  FaUser,
  FaFolder,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaFileAlt,
  FaEllipsisV,
  FaInfoCircle
} from "react-icons/fa";

const ListenoteScreen = () => {
  const token = GetTokenOrRedirect();
  const [documents, setDocuments] = useState([]);
  const [centreInfo, setCentreInfo] = useState(null);
  const [pagination, setPagination] = useState({ 
    current_page: 1, 
    last_page: 1,
    total: 0,
    per_page: 10
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modeRecherche, setModeRecherche] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [monProjet, setMonProjet] = useState(null);
  const [idclasseur, setIdClasseur] = useState(null);

  const [documentNom] = useState("Liste des notes de perception");

  const location = useLocation();
  const state = location.state || {};
  const item = state.centre || state.item || null;
  
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur")) || {};
  const { id } = useParams();

  // Statistiques
  const [statsCards, setStatsCards] = useState([
    {
      id: 1,
      title: "Total Notes",
      value: "0",
      icon: <FaFileInvoice style={{ fontSize: '24px' }} />,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      description: "Toutes les notes"
    },
    {
      id: 2,
      title: "Centre",
      value: item?.nom || "Chargement...",
      icon: <FaBuilding style={{ fontSize: '24px' }} />,
      color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
      description: item?.description || "Centre d'ordonnancement"
    },
    {
      id: 3,
      title: "Période",
      value: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      icon: <FaCalendarAlt style={{ fontSize: '24px' }} />,
      color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
      description: "Date du jour"
    }
  ]);

  // Mettre à jour les stats quand item change
  useEffect(() => {
    if (item) {
      setCentreInfo(item);
      setStatsCards(prev => [
        prev[0],
        {
          ...prev[1],
          value: item.nom || "N/A",
          description: item.description || "Centre d'ordonnancement"
        },
        prev[2]
      ]);
    }
  }, [item]);

  // Fonction Actualiser
  const Actualiser = () => {
    setSearch("");
    setModeRecherche(false);
    setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
    fetchDocuments();
  };

  // Chargement initial et pagination
  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [pagination.current_page, modeRecherche, token]);

  // Mettre à jour le total des notes
  useEffect(() => {
    if (documents.length > 0) {
      setStatsCards(prev => [
        {
          ...prev[0],
          value: pagination.total.toString()
        },
        prev[1],
        prev[2]
      ]);
    }
  }, [documents, pagination.total]);

  // Fonction pour charger les documents
  const fetchDocuments = async () => {
    if (!token) return;

    setLoading(true);
    try {
      let res;

      if (modeRecherche && search.trim() !== "") {
        res = await axios.post(
          `${API_BASE_URL}/search-note/${id}?page=${pagination.current_page}`,
          { search },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.get(`${API_BASE_URL}/note-centre/${id}?page=${pagination.current_page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (res.data && res.data.data) {
        setDocuments(res.data.data);
        setPagination({
          current_page: res.data.current_page || 1,
          last_page: res.data.last_page || 1,
          total: res.data.total || res.data.data.length || 0,
          per_page: res.data.per_page || 10
        });

        // Si on n'a pas encore les infos du centre et que le premier document existe
        if (!centreInfo && res.data.data.length > 0 && res.data.data[0].centre) {
          const firstDoc = res.data.data[0];
          setCentreInfo(firstDoc.centre);
          setStatsCards(prev => [
            prev[0],
            {
              ...prev[1],
              value: firstDoc.centre.nom || "N/A",
              description: firstDoc.centre.description || "Centre d'ordonnancement"
            },
            prev[2]
          ]);
        }
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Erreur", "Erreur lors du chargement des documents", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fonction de recherche
  const handleSearch = () => {
    if (search.trim() === "") {
      Swal.fire("Attention", "Veuillez entrer un terme de recherche", "warning");
      return;
    }
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    setModeRecherche(true);
  };

  // Fonction de changement de page
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      setPagination((prev) => ({ ...prev, current_page: page }));
    }
  };

  // Ouvrir le modal PDF
  const ouvrirModalAvecId = (row) => {
    setSelectedId(row.id);
    setMonProjet(row.assujetti?.nom_raison_sociale || "");
    setIdClasseur(row.id_classeur);
    setIsModalOpen(true);
  };

  // Obtenir l'icône du document
  const getDocumentIcon = (document) => {
    const type = document.classeur?.nom_classeur?.toLowerCase() || "";
    if (type.includes("pdf")) return <FaFilePdf className="text-danger" size={20} />;
    if (type.includes("note")) return <FaFileInvoice className="text-primary" size={20} />;
    if (type.includes("lettre")) return <FaFileAlt className="text-warning" size={20} />;
    return <FaFolder className="text-warning" size={20} />;
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return "N/A";
    }
  };

  // Menu déroulant des actions
  const ActionDropdown = ({ row }) => (
    <div className="dropdown">
      <button 
        className="btn btn-sm btn-light border dropdown-toggle d-flex align-items-center"
        type="button" 
        data-toggle="dropdown"
        style={{ minWidth: '40px', borderRadius: '8px' }}
      >
        <FaEllipsisV />
      </button>
      <div className="dropdown-menu dropdown-menu-right shadow-lg border-0" style={{ minWidth: '200px', borderRadius: '12px' }}>
        <h6 className="dropdown-header text-uppercase text-muted font-weight-bold small">
          Actions
        </h6>
        <button 
          className="dropdown-item d-flex align-items-center"
          onClick={() => {
            Swal.fire({
              title: `Note N° ${row.numero_serie}`,
              html: `
                <div class="text-left">
                  <p><strong>N° Série:</strong> ${row.numero_serie || 'N/A'}</p>
                  <p><strong>Date Ordonnancement:</strong> ${formatDate(row.date_ordonnancement)}</p>
                  <p><strong>Centre:</strong> ${row.centre?.nom || centreInfo?.nom || 'N/A'}</p>
                  <p><strong>Assujetti:</strong> ${row.assujetti?.nom_raison_sociale || 'N/A'}</p>
                  <p><strong>Classeur:</strong> ${row.classeur?.nom_classeur || 'N/A'}</p>
                  <p><strong>Emplacement:</strong> ${row.emplacement?.nom_emplacement || 'N/A'}</p>
                </div>
              `,
              icon: 'info',
              confirmButtonColor: '#3085d6'
            });
          }}
        >
          <FaInfoCircle className="mr-3 text-info" />
          <span>Détails</span>
        </button>
        <button 
          className="dropdown-item d-flex align-items-center"
          onClick={() => ouvrirModalAvecId(row)}
        >
          <FaFilePdf className="mr-3 text-danger" />
          <span>PDF</span>
        </button>
      </div>
    </div>
  );

  // Colonnes du tableau
  const columns = [
    { 
      key: "numero_serie", 
      label: "N° Série",
      render: (row) => (
        <div className="d-flex align-items-center">
          <div className="rounded-circle bg-primary bg-opacity-10 p-2 mr-2 d-flex align-items-center justify-content-center">
            {getDocumentIcon(row)}
          </div>
          <span className="font-weight-medium">{row.numero_serie || 'N/A'}</span>
        </div>
      )
    },
    { 
      key: "date_ordonnancement", 
      label: "Date",
      render: (row) => (
        <div className="d-flex align-items-center">
          <FaCalendarAlt className="mr-2 text-muted" size={12} />
          {formatDate(row.date_ordonnancement)}
        </div>
      )
    },
    {
      key: "centre",
      label: "Centre",
      render: (row) => row.centre?.nom || centreInfo?.nom || "-",
    },
    {
      key: "assujetti",
      label: "Assujetti",
      render: (row) => row.assujetti?.nom_raison_sociale || "-",
    },
    {
      key: "classeur",
      label: "Classeur",
      render: (row) => row.classeur?.nom_classeur || "-",
    },
    {
      key: "emplacement",
      label: "Emplacement",
      render: (row) => (
        <div className="d-flex align-items-center">
          <FaMapMarkerAlt className="mr-2 text-muted" size={12} />
          {row.emplacement?.nom_emplacement || "-"}
        </div>
      ),
    },
    {
      key: "action",
      label: "Actions",
      render: (row) => <ActionDropdown row={row} />,
    },
  ];

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Menus />
      <Head />
      <div className="content-wrapper" style={{ marginLeft: "250px", paddingTop: "20px" }}>
        <div className="content-header">
          <div className="container-fluid">
            {/* Header avec bouton Actualiser */}
            <div className="dashboard-header bg-white p-4 rounded shadow-sm mb-4">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary-soft rounded-circle p-3 mr-3" style={{ background: "rgba(0,123,255,0.1)" }}>
                      <FaFileInvoice className="text-primary" size={28} />
                    </div>
                    <div>
                      <h1 className="h2 mb-1 font-weight-bold">{documentNom}</h1>
                      <div className="d-flex align-items-center flex-wrap text-muted">
                        <span className="d-flex align-items-center mr-3">
                          <FaUser className="mr-1" size={14} />
                          {utilisateur?.prenom || ''} {utilisateur?.nom || ''}
                        </span>
                        {centreInfo?.nom && (
                          <span className="d-flex align-items-center">
                            <FaBuilding className="mr-1" size={14} />
                            {centreInfo.nom}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 text-lg-right mt-3 mt-lg-0">
                  <button
                    className="btn btn-light border shadow-sm px-4"
                    onClick={Actualiser}
                    disabled={loading}
                  >
                    <FaSync className={`mr-2 ${loading ? "fa-spin" : ""}`} />
                    Actualiser
                  </button>
                </div>
              </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="row mb-4">
              {statsCards.map((card) => (
                <div key={card.id} className="col-lg-4 col-md-6 mb-4">
                  <div className="card border-0 shadow-sm overflow-hidden h-100" style={{ background: card.color }}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-white-75 small mb-1">{card.title}</div>
                          <div className="h2 font-weight-bold text-white mb-2">{card.value}</div>
                          <div className="small text-white-50">{card.description}</div>
                        </div>
                        <div className="rounded-circle bg-white bg-opacity-25 p-3 d-flex align-items-center justify-content-center">
                          {card.icon}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Barre de recherche */}
            <div className="row mb-4">
              <div className="col-md-8">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control border-right-0"
                    placeholder="Rechercher par numéro de série, assujetti..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    style={{ minWidth: '300px', height: '45px' }}
                  />
                  <div className="input-group-append">
                    <button 
                      onClick={handleSearch} 
                      className="btn btn-primary"
                      style={{ height: '45px' }}
                    >
                      <FaSearch className="mr-1" /> Rechercher
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des documents */}
            {loading ? (
              <LoadingSpinner message="Chargement des notes de perception..." />
            ) : (
              <>
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="thead-light">
                          <tr>
                            <th className="border-0 py-3">N° Série</th>
                            <th className="border-0 py-3">Date</th>
                            <th className="border-0 py-3">Centre</th>
                            <th className="border-0 py-3">Assujetti</th>
                            <th className="border-0 py-3">Classeur</th>
                            <th className="border-0 py-3">Emplacement</th>
                            <th className="border-0 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-5">
                                <div className="text-muted">
                                  <FaFileInvoice className="mb-3" style={{ fontSize: '3rem', opacity: 0.5 }} />
                                  <h5>Aucune note trouvée</h5>
                                  <p className="mb-0">
                                    {modeRecherche 
                                      ? "Aucun résultat pour votre recherche" 
                                      : "Aucune note de perception pour ce centre"}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            documents.map((doc) => (
                              <tr key={doc.id} className="border-bottom">
                                <td className="align-middle">
                                  <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-primary bg-opacity-10 p-2 mr-2 d-flex align-items-center justify-content-center">
                                      {getDocumentIcon(doc)}
                                    </div>
                                    <span className="font-weight-medium">{doc.numero_serie || 'N/A'}</span>
                                  </div>
                                </td>
                                <td className="align-middle">
                                  <div className="d-flex align-items-center">
                                    <FaCalendarAlt className="mr-2 text-muted" size={12} />
                                    {formatDate(doc.date_ordonnancement)}
                                  </div>
                                </td>
                                <td className="align-middle">{doc.centre?.nom || centreInfo?.nom || '-'}</td>
                                <td className="align-middle">
                                  <div className="d-flex align-items-center">
                                    <FaUser className="mr-2 text-muted" size={12} />
                                    {doc.assujetti?.nom_raison_sociale || '-'}
                                  </div>
                                </td>
                                <td className="align-middle">
                                  <span className="badge badge-light px-3 py-2">
                                    {doc.classeur?.nom_classeur || '-'}
                                  </span>
                                </td>
                                <td className="align-middle">
                                  <div className="d-flex align-items-center">
                                    <FaMapMarkerAlt className="mr-2 text-muted" size={12} />
                                    {doc.emplacement?.nom_emplacement || '-'}
                                  </div>
                                </td>
                                <td className="align-middle text-center">
                                  <ActionDropdown row={doc} />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                {documents.length > 0 && pagination.last_page > 1 && (
                  <div className="card border-0 shadow-sm mt-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="text-muted">
                          Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur {pagination.total} notes
                        </div>
                        <nav>
                          <ul className="pagination mb-0">
                            <li className={`page-item ${pagination.current_page === 1 ? "disabled" : ""}`}>
                              <button 
                                className="page-link border-0" 
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                              >
                                <FaChevronLeft />
                              </button>
                            </li>
                            {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                              let pageNum;
                              if (pagination.last_page <= 5) {
                                pageNum = i + 1;
                              } else if (pagination.current_page <= 3) {
                                pageNum = i + 1;
                              } else if (pagination.current_page >= pagination.last_page - 2) {
                                pageNum = pagination.last_page - 4 + i;
                              } else {
                                pageNum = pagination.current_page - 2 + i;
                              }
                              
                              return (
                                <li key={i} className={`page-item ${pagination.current_page === pageNum ? "active" : ""}`}>
                                  <button 
                                    className="page-link border-0" 
                                    onClick={() => handlePageChange(pageNum)}
                                  >
                                    {pageNum}
                                  </button>
                                </li>
                              );
                            })}
                            <li className={`page-item ${pagination.current_page === pagination.last_page ? "disabled" : ""}`}>
                              <button 
                                className="page-link border-0" 
                                onClick={() => handlePageChange(pagination.current_page + 1)}
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal pour afficher le PDF */}
      <ModalNote
        modalId="documentModal"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        monid={selectedId}
        projet={monProjet}
        idclasseur={idclasseur}
        verification={false}
      />

      {/* Styles CSS */}
      <style jsx>{`
        .bg-primary-soft { background: rgba(0, 123, 255, 0.1); }
        .bg-success-soft { background: rgba(40, 167, 69, 0.1); }
        .bg-info-soft { background: rgba(23, 162, 184, 0.1); }
        .bg-warning-soft { background: rgba(255, 193, 7, 0.1); }
        .bg-danger-soft { background: rgba(220, 53, 69, 0.1); }
        .text-purple { color: #6f42c1; }
        
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
        
        .card {
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important;
        }
        
        .table th {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6c757d;
        }
        
        .table td {
          vertical-align: middle;
          padding: 1rem 0.75rem;
        }
        
        .badge {
          font-weight: 500;
          border-radius: 8px;
        }
        
        .page-link {
          border-radius: 8px;
          margin: 0 3px;
          color: #007bff;
          background: white;
          border: 1px solid #dee2e6;
          padding: 0.5rem 0.75rem;
        }
        
        .page-item.active .page-link {
          background: #007bff;
          border-color: #007bff;
          color: white;
        }
        
        .page-item.disabled .page-link {
          color: #6c757d;
          pointer-events: none;
          background: #f8f9fa;
        }
        
        .dropdown-menu {
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .dropdown-item {
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .content-wrapper {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ListenoteScreen;