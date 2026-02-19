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
  FaBuilding,
  FaMapMarkerAlt,
  FaFolder
} from 'react-icons/fa';
import LoadingSpinner from "../Loading/LoadingSpinner";

const NoteperceptionScreen = () => {
  const token = GetTokenOrRedirect();
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
  //const role = utilisateur?.role || "";
  const role = JSON.parse(localStorage.getItem("role"));
  const id_centre = utilisateur?.id_centre || "";

  const history = useHistory();

  // Notes + pagination + recherche
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20
  });
  const [modeRecherche, setModeRecherche] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Statistiques
  const [statsCards, setStatsCards] = useState([
    {
      id: 1,
      title: "Total Notes",
      value: "0",
      icon: <FaFileAlt style={{ fontSize: '24px' }} />,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      description: "Toutes les notes"
    },
    {
      id: 2,
      title: "Notes Actives",
      value: "0",
      icon: <FaFileAlt style={{ fontSize: '24px' }} />,
      color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
      description: "Notes actives"
    },
    {
      id: 3,
      title: "Notes Inactives",
      value: "0",
      icon: <FaFileAlt style={{ fontSize: '24px' }} />,
      color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
      description: "Notes inactives"
    }
  ]);

  // Navigation
  const handleAddNote = () => {
    history.push('/note/form');
  };

  const handleEditNote = (note) => {
    history.push(`/note/form/${note.id}`);
  };

  const handleViewNote = (note) => {
    history.push(`/note/detail/${note.id}`);
  };

  // Chargement des notes
  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [pagination.current_page, modeRecherche, token]);

  const fetchNotes = async () => {
    if (!token) return;

    setLoading(true);
    try {
      let res;
      if (modeRecherche && search.trim() !== "") {
        res = await axios.post(
          `${API_BASE_URL}/notes/search`,
          { search, page: pagination.current_page },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.get(`${API_BASE_URL}/notes?page=${pagination.current_page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      console.log("Données reçues:", res.data);

      setNotes(res.data.data);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
        per_page: res.data.per_page || 20
      });

      // Mettre à jour les statistiques
      const total = res.data.total || res.data.data.length;
      const actifs = res.data.data.filter(n => n.statut === true || n.statut === 1).length;
      const inactifs = total - actifs;

      setStatsCards([
        {
          id: 1,
          title: "Total Notes",
          value: total.toString(),
          icon: <FaFileAlt style={{ fontSize: '24px' }} />,
          color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          description: "Toutes les notes"
        },
        {
          id: 2,
          title: "Notes Actives",
          value: actifs.toString(),
          icon: <FaFileAlt style={{ fontSize: '24px' }} />,
          color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
          description: `${actifs > 0 ? Math.round((actifs / total) * 100) : 0}% actives`
        },
        {
          id: 3,
          title: "Notes Inactives",
          value: inactifs.toString(),
          icon: <FaFileAlt style={{ fontSize: '24px' }} />,
          color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
          description: `${inactifs > 0 ? Math.round((inactifs / total) * 100) : 0}% inactives`
        }
      ]);
    } catch (err) {
      console.error(err);
      Swal.fire("Erreur", "Erreur lors du chargement des notes", "error");
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

  const handleDelete = (id, numero_serie) => {
    if (!token) return;

    Swal.fire({
      title: "Voulez-vous désactiver cette note ?",
      html: `Êtes-vous sûr de vouloir désactiver la note :<br><strong>"${numero_serie}"</strong> ?`,
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
          .delete(`${API_BASE_URL}/notes/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(() => {
            Swal.fire("Désactivé !", "Note désactivée avec succès.", "success");
            fetchNotes();
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

  // Formatage sécurisé des dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (e) {
      return dateString;
    }
  };

  // Colonnes du tableau SANS centre et classeur
  const columns = [
    {
      key: "numero_serie",
      label: "Num. Série",
      render: (row) => (
        <div>
          <div className="font-weight-bold">{row.numero_serie || "N/A"}</div>
        </div>
      )
    },
    {
      key: "date_ordonnancement",
      label: "Date Ord.",
      render: (row) => formatDate(row.date_ordonnancement)
    },
    {
      key: "date_enregistrement",
      label: "Date Enr.",
      render: (row) => formatDate(row.date_enregistrement)
    },
    {
      key: "assujetti",
      label: "Assujetti",
      render: (row) => {
        return row.assujetti?.nom_raison_sociale || row.nom_assujetti || "N/A";
      }
    },
    {
      key: "emplacement",
      label: "Emplacement",
      render: (row) => {
        const nomEmplacement = row.emplacement?.nom_emplacement || row.nom_emplacement || "N/A";
        return (
          <div className="d-flex align-items-center">
            <FaMapMarkerAlt className="mr-2 text-muted" />
            {nomEmplacement}
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
  const ActionDropdown = ({ note }) => {
    const [isOpen, setIsOpen] = useState(false);

    const actions = [
      {
        label: "Voir",
        icon: <FaEye />,
        color: "primary",
        onClick: () => handleViewNote(note)
      },
      {
        label: "Modifier",
        icon: <FaEdit />,
        color: "info",
        onClick: () => handleEditNote(note)
      },
      {
        label: "Télécharger",
        icon: <FaDownload />,
        color: "secondary",
        onClick: () => {
          //.open(`${API_BASE_URL}/notes/${note.id}/download`, '_blank');
        }
      },
      {
        label: "Supprimer",
        icon: <FaTrash />,
        color: "danger",
        onClick: () => handleDelete(note.id, note.numero_serie)
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
      render: (row) => <ActionDropdown note={row} />
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
                  <FaFileAlt className="mr-2" style={{ fontSize: '24px' }} /> Gestion des Notes de Perception
                </h1>
                <p className="text-muted mb-0">Gérez les notes de perception</p>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item"><a href="/">Accueil</a></li>
                  <li className="breadcrumb-item active">Notes</li>
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
                        placeholder="Rechercher une note (numéro série, assujetti)..."
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
                      onClick={handleAddNote}
                      disabled={loading}
                    >
                      <FaPlus className="mr-2" /> Nouvelle Note
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des notes */}
            <div className="row">
              <div className="col-md-12">
                {loading ? (
                  <LoadingSpinner message="Chargement des notes..." />
                ) : notes.length === 0 ? (
                  <div className="empty-state bg-white rounded shadow-sm p-5 text-center">
                    <div className="empty-icon-wrapper bg-light rounded-circle p-4 mx-auto mb-4">
                      <FaFolder className="text-muted" size={48} />
                    </div>
                    <h5 className="text-muted">Aucune note trouvée</h5>
                    <p className="text-muted mb-0">
                      {search ? `Aucun résultat pour "${search}"` : "Commencez par ajouter une nouvelle note"}
                    </p>
                    {!search && (
                      <button
                        className="btn btn-primary mt-3"
                        onClick={handleAddNote}
                      >
                        <FaPlus className="mr-2" /> Ajouter une note
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-light d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 font-weight-bold">Liste des Notes de Perception</h6>
                        <span className="badge badge-light">
                          {pagination.total} note{pagination.total > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="card-body p-0">
                        <Table
                          columns={customColumns}
                          data={notes}
                          startIndex={(pagination.current_page - 1) * pagination.per_page}
                        />
                      </div>
                    </div>

                    {notes.length > 0 && (
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
                                    disabled={pagination.current_page === 1}
                                  >
                                    Précédent
                                  </button>
                                </li>

                                {(() => {
                                  const pages = [];
                                  const totalPages = pagination.last_page;
                                  const current = pagination.current_page;

                                  pages.push(
                                    <li key={1} className={`page-item ${current === 1 ? "active" : ""}`}>
                                      <button className="page-link border-0" onClick={() => handlePageChange(1)}>
                                        1
                                      </button>
                                    </li>
                                  );

                                  if (current > 3) {
                                    pages.push(
                                      <li key="ellipsis1" className="page-item disabled">
                                        <span className="page-link border-0">...</span>
                                      </li>
                                    );
                                  }

                                  for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
                                    pages.push(
                                      <li key={i} className={`page-item ${current === i ? "active" : ""}`}>
                                        <button className="page-link border-0" onClick={() => handlePageChange(i)}>
                                          {i}
                                        </button>
                                      </li>
                                    );
                                  }

                                  if (current < totalPages - 2) {
                                    pages.push(
                                      <li key="ellipsis2" className="page-item disabled">
                                        <span className="page-link border-0">...</span>
                                      </li>
                                    );
                                  }

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

export default NoteperceptionScreen;