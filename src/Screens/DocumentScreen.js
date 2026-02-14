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

const DocumentScreen = () => {
  const token = GetTokenOrRedirect();
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
  const role = utilisateur?.role || "";
  const id_direction = utilisateur?.id_direction || "";
  
  const history = useHistory();

  // Documents + pagination + recherche
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

  // Statistiques
  const [statsCards, setStatsCards] = useState([
    {
      id: 1,
      title: "Total Documents",
      value: "0",
      icon: <FaFileAlt style={{ fontSize: '24px' }} />,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      description: "Tous les documents"
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

  // Navigation vers les formulaires
  const handleAddDocument = () => {
    history.push('/addform');
  };

  const handleEditDocument = (document) => {
   // alert(document.id)
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
        // Logique de duplication
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

  // Chargement des documents
  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [pagination.current_page, modeRecherche, token]);

  const fetchDocuments = async () => {
    if (!token) return;

    setLoading(true);
    try {
      let res;
      if (modeRecherche && search.trim() !== "") {
        res = await axios.post(
          `${API_BASE_URL}/declarations/search`,
          { search, page: pagination.current_page },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.get(`${API_BASE_URL}/declarations?page=${pagination.current_page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setDocuments(res.data.data);
      setPagination({ 
        current_page: res.data.current_page, 
        last_page: res.data.last_page,
        total: res.data.total,
        per_page: res.data.per_page || 10
      });

      // Mettre à jour les statistiques
      const total = res.data.total || res.data.data.length;
      const actifs = res.data.data.filter(d => d.statut === true || d.statut === 1).length;
      const inactifs = total - actifs;

      setStatsCards([
        {
          id: 1,
          title: "Total Documents",
          value: total.toString(),
          icon: <FaFileAlt style={{ fontSize: '24px' }} />,
          color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          description: "Tous les documents"
        },
        {
          id: 2,
          title: "Documents Actifs",
          value: actifs.toString(),
          icon: <FaFileAlt style={{ fontSize: '24px' }} />,
          color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
          description: `${actifs > 0 ? Math.round((actifs / total) * 100) : 0}% actifs`
        },
        {
          id: 3,
          title: "Documents Inactifs",
          value: inactifs.toString(),
          icon: <FaFileAlt style={{ fontSize: '24px' }} />,
          color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
          description: `${inactifs > 0 ? Math.round((inactifs / total) * 100) : 0}% inactifs`
        }
      ]);
    } catch (err) {
      console.error(err);
      Swal.fire("Erreur", "Erreur lors du chargement des documents", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    setModeRecherche(true);
  };

  const actualiser = () => {
    setSearch("");
    setModeRecherche(false);
    setPagination({ current_page: 1, last_page: 1 });
  };

  const handleDelete = (id, intitule) => {
    if (!token) return;

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
      setPagination((prev) => ({ ...prev, current_page: page }));
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

  // Composant Dropdown d'actions
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
        label: "Télécharger",
        icon: <FaDownload />,
        color: "secondary",
        onClick: () => {
          // Logique de téléchargement
          window.open(`${API_BASE_URL}/declarations/${document.id}/download`, '_blank');
        }
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
          style={{
            border: 'none',
            background: 'transparent'
          }}
        >
          <FaEllipsisV />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="position-fixed" 
              style={{ 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: 1040 
              }} 
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
                  <FaFileAlt className="mr-2" style={{ fontSize: '24px' }} /> Gestion des Documents
                </h1>
                <p className="text-muted mb-0">Gérez les documents de votre organisation</p>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item"><a href="/">Accueil</a></li>
                  <li className="breadcrumb-item active">Documents</li>
                </ol>
              </div>
            </div>
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
                      />
                      <div className="input-group-append">
                        <button 
                          onClick={handleSearch} 
                          className="btn btn-primary"
                          disabled={loading}
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
                      disabled={loading}
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
                  {/* ... reste du code ... */}
                </div>
              ) : (
                  <>
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-light d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 font-weight-bold">Liste des Documents</h6>
                        <span className="badge badge-light">
                          {pagination.total} document{pagination.total > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="card-body p-0">
                        <Table
                          columns={customColumns}
                          data={
                            role === "admin"
                              ? documents
                              : documents.filter(
                                  (doc) => doc.id_direction === id_direction
                                )
                          }
                          startIndex={(pagination.current_page - 1) * pagination.per_page}
                          emptyMessage={
                            <div className="text-center py-5">
                              <FaFileAlt className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                              <h5 className="text-muted">Aucun document trouvé</h5>
                              <p className="text-muted mb-0">
                                {search ? `Aucun résultat pour "${search}"` : "Commencez par ajouter un nouveau document"}
                              </p>
                              {!search && (
                                <button
                                  className="btn btn-primary mt-3"
                                  onClick={handleAddDocument}
                                >
                                  <FaPlus className="mr-2" /> Ajouter un document
                                </button>
                              )}
                            </div>
                          }
                        />
                      </div>
                    </div>

                    {documents.length > 0 && (
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
                                
                                {(() => {
                                  const pages = [];
                                  const totalPages = pagination.last_page;
                                  const current = pagination.current_page;
                                  
                                  // Toujours afficher la première page
                                  pages.push(
                                    <li key={1} className={`page-item ${current === 1 ? "active" : ""}`}>
                                      <button className="page-link border-0" onClick={() => handlePageChange(1)}>
                                        1
                                      </button>
                                    </li>
                                  );
                                  
                                  // Ajouter des points de suspension si nécessaire
                                  if (current > 3) {
                                    pages.push(
                                      <li key="ellipsis1" className="page-item disabled">
                                        <span className="page-link border-0">...</span>
                                      </li>
                                    );
                                  }
                                  
                                  // Pages autour de la page courante
                                  for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
                                    pages.push(
                                      <li key={i} className={`page-item ${current === i ? "active" : ""}`}>
                                        <button className="page-link border-0" onClick={() => handlePageChange(i)}>
                                          {i}
                                        </button>
                                      </li>
                                    );
                                  }
                                  
                                  // Ajouter des points de suspension si nécessaire
                                  if (current < totalPages - 2) {
                                    pages.push(
                                      <li key="ellipsis2" className="page-item disabled">
                                        <span className="page-link border-0">...</span>
                                      </li>
                                    );
                                  }
                                  
                                  // Toujours afficher la dernière page
                                  if (totalPages > 1) {
                                    pages.push(
                                      <li key={totalPages} className={`page-item ${current === totalPages ? "active" : ""}`}>
                                        <button className="page-link border-0" onClick={() => handlePageChange(totalPages)}>
                                          {totalPages}
                                        </button>
                                      </li>
                                    );
                                  }
                                  
                                  return pages;
                                })()}
                                
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
    </div>
  );
};

export default DocumentScreen;