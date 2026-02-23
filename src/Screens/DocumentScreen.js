import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import Table from "../Composant/Table";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { useHistory } from "react-router-dom";
import {
  FaPlus,
  FaSearch,
  FaSync,
  FaFileAlt,
  FaEdit,
  FaTrash,
  FaDownload,
  FaEllipsisV,
  FaEye,
  FaCopy,
  FaShare,
  FaPrint,
  FaBuilding,
  FaMapMarkerAlt,
  FaFolder
} from 'react-icons/fa';
import LoadingSpinner from "../Loading/LoadingSpinner";
import { Link } from "react-router-dom/cjs/react-router-dom.min";
import FileUploadModal from "../Modals/FileUploadModal"; // 👈 Import ajouté

const DocumentScreen = () => {
  const token = GetTokenOrRedirect();
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
  const role = JSON.parse(localStorage.getItem("role"));

  // 🔹 Récupérer les IDs des départements de l'utilisateur depuis le login
  const [userDirectionIds, setUserDirectionIds] = useState([]);
  const [userDepartements, setUserDepartements] = useState([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  useEffect(() => {
    const storedDepartements = JSON.parse(localStorage.getItem('departements') || '[]');
    setUserDepartements(storedDepartements);
    const ids = storedDepartements.map(dept => dept.id);
    setUserDirectionIds(ids);
    console.log('🏢 IDs des départements utilisateur (login):', ids);

    if (ids.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Aucune direction',
        text: "Vous n'avez accès à aucune direction. Veuillez contacter l'administrateur.",
        timer: 3000,
        timerProgressBar: true
      });
    }

    setTimeout(() => {
      setIsLoadingUserData(false);
    }, 500);
  }, []);

  const history = useHistory();

  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
  });
  const [modeRecherche, setModeRecherche] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredBy, setFilteredBy] = useState(null);

  // États pour le modal d'upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);

  const [statsCards, setStatsCards] = useState([
    {
      id: 1,
      title: "Mes Documents",
      value: "0",
      icon: <FaFileAlt style={{ fontSize: '24px' }} />,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      description: "Documents accessibles"
    },
    {
      id: 2,
      title: "Documents Actifs",
      value: "0",
      icon: <FaFileAlt style={{ fontSize: '24px' }} />,
      color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
      description: "Documents actifs"
    },
    {
      id: 3,
      title: "Documents Inactifs",
      value: "0",
      icon: <FaFileAlt style={{ fontSize: '24px' }} />,
      color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
      description: "Documents inactifs"
    }
  ]);

  const handleAddDocument = () => {
    history.push('/addform');
  };

  const handleEditDocument = (document) => {
    history.push(`/addform/${document.id}`);
  };

  const handleViewDocument = (document) => {
    history.push(`/detail-document/${document.id}`);
  };

  const handleDuplicateDocument = (document) => {
    Swal.fire({
      title: "Dupliquer le document ?",
      text: "Voulez-vous créer une copie de ce document ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, dupliquer",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Dupliqué !", "Document dupliqué avec succès.", "success");
      }
    });
  };

  const handleShareDocument = (document) => {
    Swal.fire({
      title: "Partager le document",
      html: `
        <div class="text-left">
          <p>Partager le document: <strong>${document.intitule}</strong></p>
          <div class="form-group">
            <label>Adresse email</label>
            <input type="email" class="form-control" placeholder="email@exemple.com" id="shareEmail">
          </div>
          <div class="form-group">
            <label>Message (optionnel)</label>
            <textarea class="form-control" rows="3" id="shareMessage" placeholder="Message d'accompagnement..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Partager",
      cancelButtonText: "Annuler",
      preConfirm: () => {
        const email = document.getElementById('shareEmail').value;
        if (!email) {
          Swal.showValidationMessage('Veuillez entrer une adresse email');
        }
        return { email, message: document.getElementById('shareMessage').value };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Partagé !", "Document partagé avec succès.", "success");
      }
    });
  };

  // Fonction d'ouverture du modal d'upload
  const handleUploadClick = (document) => {
    setSelectedDocumentForUpload(document);
    setShowUploadModal(true);
  };

  // 🔥 useEffect avec dépendances
  useEffect(() => {
    if (token && !isLoadingUserData) {
      fetchDocuments();
    }
  }, [pagination.current_page, modeRecherche, token, userDirectionIds, isLoadingUserData]);

  const fetchDocuments = async () => {
    if (!token) return;

    setLoading(true);
    setDocuments([]);

    try {
      let params = {
        page: pagination.current_page,
        per_page: 10
      };

      if (userDirectionIds.length > 0) {
        params.direction_ids = userDirectionIds.join(',');
        console.log('📤 Envoi des direction_ids:', params.direction_ids);
      } else {
        console.log('📤 Aucune direction - ne rien afficher');
        setDocuments([]);
        setFilteredBy('none');
        setPagination({
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: 10
        });
        setLoading(false);
        return;
      }

      let res;
      if (modeRecherche && search.trim() !== "") {
        res = await axios.post(
          `${API_BASE_URL}/declarations/search`,
          {
            search,
            page: pagination.current_page,
            direction_ids: userDirectionIds
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.get(`${API_BASE_URL}/declarations`, {
          headers: { Authorization: `Bearer ${token}` },
          params: params
        });
      }

      console.log('📥 Réponse brute:', res.data);

      const responseData = res.data.data || res.data;
      const documentsList = responseData.data || responseData || [];
      const filteredByValue = res.data.filtered_by || 'all';

      console.log('📊 Documents reçus:', documentsList.length);
      console.log('📌 IDs des directions:', [...new Set(documentsList.map(d => d.id_direction))]);

      setDocuments(documentsList);
      setFilteredBy(filteredByValue);

      setPagination({
        current_page: responseData.current_page || 1,
        last_page: responseData.last_page || 1,
        total: responseData.total || documentsList.length,
        per_page: responseData.per_page || 10
      });

      const total = documentsList.length;
      const actifs = documentsList.filter(d => d.statut === true || d.statut === 1).length;

      setStatsCards(prev => [
        { ...prev[0], value: total.toString() },
        { ...prev[1], value: actifs.toString(), description: total > 0 ? `${Math.round((actifs / total) * 100)}% actifs` : '0% actifs' },
        { ...prev[2], value: (total - actifs).toString(), description: total > 0 ? `${Math.round(((total - actifs) / total) * 100)}% inactifs` : '0% inactifs' }
      ]);

    } catch (err) {
      console.error('❌ Erreur:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || "Erreur lors du chargement"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
    setModeRecherche(true);
  };

  const actualiser = () => {
    setSearch("");
    setModeRecherche(false);
    setDocuments([]);
    setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
  };

  const handleDelete = (id, intitule) => {
    if (!token) return;

    const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
    if (!permissions.includes('supprimer_document')) {
      Swal.fire({
        icon: 'error',
        title: 'Permission refusée',
        text: "Vous n'avez pas la permission de supprimer des documents"
      });
      return;
    }

    Swal.fire({
      title: "Voulez-vous désactiver ce document ?",
      html: `Êtes-vous sûr de vouloir désactiver le document :<br><strong>"${intitule}"</strong> ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, désactiver",
      cancelButtonText: "Annuler",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${API_BASE_URL}/declarations/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(() => {
            Swal.fire("Désactivé !", "Document désactivé avec succès.", "success");
            fetchDocuments();
          })
          .catch((error) => {
            Swal.fire("Erreur", "Erreur lors de la désactivation.", "error");
            console.error(error);
          });
      }
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      setPagination(prev => ({ ...prev, current_page: page }));
    }
  };

  const columns = [
    {
      key: "nom_classeur",
      label: "Classeur",
      render: (row) => row.nom_classeur || (row.classeur && row.classeur.nom_classeur) || "N/A",
    },
    {
      key: "intitule",
      label: "Intitulé",
      render: (row) => (
        <div>
          <div className="font-weight-bold">{row.intitule}</div>
          <small className="text-muted">{row.num_reference}</small>
        </div>
      )
    },
    {
      key: "mot_cle",
      label: "Mot Clé",
      render: (row) => (
        <span className="badge badge-info">{row.mot_cle}</span>
      )
    },
    {
      key: "nom_direction",
      label: "Direction",
      render: (row) => (
        <div className="d-flex align-items-center">
          <FaBuilding className="mr-2 text-muted" />
          {row.nom_direction}
          <span className="badge badge-info ml-2">
            ID: {row.id_direction}
          </span>
        </div>
      )
    },
    {
      key: "nom_emplacement",
      label: "Emplacement",
      render: (row) => (
        <div className="d-flex align-items-center">
          <FaMapMarkerAlt className="mr-2 text-muted" />
          {row.nom_emplacement}
        </div>
      )
    },
    {
      key: "created_at",
      label: "Date Création",
      render: (row) => {
        const date = new Date(row.created_at);
        return (
          <div>
            <div>{date.toLocaleDateString('fr-FR')}</div>
            <small className="text-muted">{date.toLocaleTimeString('fr-FR')}</small>
          </div>
        );
      }
    },
    {
      key: "statut",
      label: "Statut",
      render: (row) => (
        <span className={`badge ${row.statut ? 'badge-success' : 'badge-secondary'}`}>
          {row.statut ? 'Actif' : 'Inactif'}
        </span>
      )
    }
  ];

  const ActionDropdown = ({ document }) => {
    const [isOpen, setIsOpen] = useState(false);
        
    const actions = [
      {
        label: "Voir",
        icon: <FaEye />,
        color: "primary",
        onClick: () => handleViewDocument(document)
      },
      {
        label: "Modifier",
        icon: <FaEdit />,
        color: "info",
        onClick: () => handleEditDocument(document)
      },
      {
        label: "Dupliquer",
        icon: <FaCopy />,
        color: "warning",
        onClick: () => handleDuplicateDocument(document)
      },
      {
        label: "Gérer fichiers", // Renommé pour éviter confusion avec téléchargement direct
        icon: <FaDownload />,
        color: "secondary",
        onClick: () => handleUploadClick(document) // Ouvre le modal d'upload
      },
      {
        label: "Partager",
        icon: <FaShare />,
        color: "success",
        onClick: () => handleShareDocument(document)
      },
      {
        label: "Imprimer",
        icon: <FaPrint />,
        color: "dark",
        onClick: () => window.print()
      },
      {
        label: "Supprimer",
        icon: <FaTrash />,
        color: "danger",
        onClick: () => handleDelete(document.id, document.intitule)
      }
    ];

    return (
      <div className="dropdown" style={{ position: 'relative' }}>
        <button
          className="btn btn-sm btn-outline-secondary"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FaEllipsisV />
        </button>

        {isOpen && (
          <>
            <div
              className="position-fixed"
              style={{ top: 0, left: 0, right: 0, bottom: 0, zIndex: 1040 }}
              onClick={() => setIsOpen(false)}
            />
            <div
              className="dropdown-menu show shadow"
              style={{
                position: 'absolute',
                right: 0,
                left: 'auto',
                zIndex: 1050,
                minWidth: '180px'
              }}
            >
              {actions.map((action, index) => (
                <button
                  key={index}
                  className={`dropdown-item d-flex align-items-center text-${action.color}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                    setIsOpen(false);
                  }}
                >
                  <span className="mr-2">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const customColumns = [
    ...columns,
    {
      key: "actions",
      label: "Actions",
      render: (row) => <ActionDropdown document={row} />
    }
  ];

  return (
    <div>
      <Menus />
      <Head />
      <div className="content-wrapper" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-3">
              <div className="col-sm-6">
                <h1 className="m-0 text-dark">
                  <FaFileAlt className="mr-2" style={{ fontSize: '24px' }} />
                  Mes Documents
                </h1>
                <p className="text-muted mb-0">
                  {userDirectionIds.length > 0
                    ? `Documents des directions: ${userDirectionIds.join(', ')}`
                    : "Aucune direction assignée"}
                </p>
                {filteredBy && filteredBy !== 'all' && filteredBy !== 'none' && Array.isArray(filteredBy) && (
                  <p className="text-info small">
                    <FaBuilding className="mr-1" />
                    Filtré par directions: {filteredBy.join(', ')}
                  </p>
                )}
                {filteredBy === 'none' && (
                  <p className="text-warning small">
                    <FaBuilding className="mr-1" />
                    Aucune direction accessible
                  </p>
                )}
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item">
                    <Link to="/">Accueil</Link>
                  </li>
                  <li className="breadcrumb-item active">Documents</li>
                </ol>
              </div>
            </div>

            {userDepartements.length > 0 && (
              <div className="row mb-3">
                <div className="col-12">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h6 className="mb-2">
                      <FaBuilding className="mr-2 text-primary" />
                      Mes directions accessibles
                    </h6>
                    <div className="d-flex flex-wrap">
                      {userDepartements.map(dept => (
                        <span key={dept.id} className="badge badge-info p-2 mr-2 mb-2">
                          {dept.sigle} - {dept.nom} (ID: {dept.id})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="content">
          <div className="container-fluid">
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

            {/* Barre de recherche et actions */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control border-right-0"
                        placeholder="Rechercher un document (intitulé, référence, mot-clé)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        disabled={userDirectionIds.length === 0}
                      />
                      <div className="input-group-append">
                        <button
                          onClick={handleSearch}
                          className="btn btn-primary"
                          disabled={loading || userDirectionIds.length === 0}
                        >
                          <FaSearch className="mr-1" /> Rechercher
                        </button>
                        <button
                          onClick={actualiser}
                          className="btn btn-outline-secondary ml-2"
                          disabled={loading}
                        >
                          <FaSync className="mr-1" /> Actualiser
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 d-flex justify-content-end">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleAddDocument}
                      disabled={loading || userDirectionIds.length === 0}
                    >
                      <FaPlus className="mr-2" /> Nouveau Document
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des documents */}
            <div className="row">
              <div className="col-md-12">
                {loading ? (
                  <LoadingSpinner message="Chargement des documents..." />
                ) : documents.length === 0 ? (
                  <div className="empty-state bg-white rounded shadow-sm p-5 text-center">
                    <div className="empty-icon-wrapper bg-light rounded-circle p-4 mx-auto mb-4">
                      <FaFolder className="text-muted" size={48} />
                    </div>
                    <h5 className="text-dark mb-2">Aucun document trouvé</h5>
                    <p className="text-muted mb-4">
                      {userDepartements.length === 0
                        ? "Vous n'avez accès à aucune direction. Veuillez contacter l'administrateur."
                        : userDirectionIds.length > 0
                          ? `Aucun document n'est disponible pour vos directions (IDs: ${userDirectionIds.join(', ')})`
                          : search
                            ? `Aucun résultat pour "${search}"`
                            : "Commencez par ajouter un nouveau document"}
                    </p>
                    {!search && userDirectionIds.length > 0 && (
                      <button
                        className="btn btn-primary mt-3"
                        onClick={handleAddDocument}
                      >
                        <FaPlus className="mr-2" /> Ajouter un document
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-light d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 font-weight-bold">
                          Liste des Documents
                          {filteredBy && filteredBy !== 'all' && filteredBy !== 'none' && Array.isArray(filteredBy) && (
                            <span className="ml-2 text-muted">
                              (Filtré par directions: {filteredBy.join(', ')})
                            </span>
                          )}
                        </h6>
                        <span className="badge badge-light">
                          {pagination.total} document{pagination.total > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="card-body p-0">
                        <Table
                          columns={customColumns}
                          data={documents}
                          startIndex={(pagination.current_page - 1) * pagination.per_page}
                        />
                      </div>
                    </div>

                    {documents.length > 0 && pagination.last_page > 1 && (
                      <div className="card border-0 shadow-sm mt-3">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted">
                              Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur {pagination.total} documents
                            </div>
                            <nav>
                              <ul className="pagination mb-0">
                                <li className={`page-item ${pagination.current_page === 1 ? "disabled" : ""}`}>
                                  <button
                                    className="page-link border-0"
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                  >
                                    Précédent
                                  </button>
                                </li>

                                {[...Array(pagination.last_page)].map((_, i) => (
                                  <li key={i + 1} className={`page-item ${pagination.current_page === i + 1 ? 'active' : ''}`}>
                                    <button
                                      className="page-link border-0"
                                      onClick={() => handlePageChange(i + 1)}
                                    >
                                      {i + 1}
                                    </button>
                                  </li>
                                ))}

                                <li className={`page-item ${pagination.current_page === pagination.last_page ? "disabled" : ""}`}>
                                  <button
                                    className="page-link border-0"
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                  >
                                    Suivant
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
        </section>
      </div>

      {/* Modal d'upload */}
      {showUploadModal && selectedDocumentForUpload && (
        <FileUploadModal
          documentId={selectedDocumentForUpload.id}
          id_classeur={selectedDocumentForUpload.id_classeur || selectedDocumentForUpload.classeur?.id}
          onClose={() => setShowUploadModal(false)}
          token={token}
          nom_fichier={selectedDocumentForUpload.intitule}
        />
      )}
    </div>
  );
};

export default DocumentScreen;