import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";

import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import ModalDirectionScreen from "../Modals/ModalDirectionScreen";
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaSearch, 
  FaEye, 
  FaEllipsisV,
  FaChevronLeft,
  FaChevronRight,
  FaBuilding,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt
} from 'react-icons/fa';

const DirectionScreen = () => {
    const [directions, setDirections] = useState([]);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
    const [modeRecherche, setModeRecherche] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [directionToEdit, setDirectionToEdit] = useState(null);

    const [statsCards, setStatsCards] = useState([
        {
            id: 1,
            title: "Total Directions",
            value: "0",
            icon: <FaBuilding style={{ fontSize: '24px' }} />,
            color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            description: "Toutes les directions"
        },
        {
            id: 2,
            title: "Actives",
            value: "0",
            icon: <FaCheckCircle style={{ fontSize: '24px' }} />,
            color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
            description: "Directions actives"
        },
        {
            id: 3,
            title: "Inactives",
            value: "0",
            icon: <FaTimesCircle style={{ fontSize: '24px' }} />,
            color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
            description: "Directions inactives"
        }
    ]);

    const token = GetTokenOrRedirect();

    useEffect(() => {
        if (directions.length > 0) {
            const total = directions.length;
            const actives = directions.filter(d => d.statut === 1).length;
            const inactives = total - actives;
            
            setStatsCards([
                {
                    id: 1,
                    title: "Total Directions",
                    value: total.toString(),
                    icon: <FaBuilding style={{ fontSize: '24px' }} />,
                    color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    description: "Toutes les directions"
                },
                {
                    id: 2,
                    title: "Actives",
                    value: actives.toString(),
                    icon: <FaCheckCircle style={{ fontSize: '24px' }} />,
                    color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
                    description: `${actives > 0 ? Math.round((actives / total) * 100) : 0}% actives`
                },
                {
                    id: 3,
                    title: "Inactives",
                    value: inactives.toString(),
                    icon: <FaTimesCircle style={{ fontSize: '24px' }} />,
                    color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
                    description: `${inactives > 0 ? Math.round((inactives / total) * 100) : 0}% inactives`
                }
            ]);
        }
    }, [directions]);

    useEffect(() => {
        if (token) {
            fetchDirections();
        }
    }, [pagination.current_page, modeRecherche, token]);

    const fetchDirections = async () => {
        if (!token) return;

        setLoading(true);

        try {
            let res;
            if (modeRecherche && search.trim() !== "") {
                res = await axios.post(
                    `${API_BASE_URL}/directions/search`,
                    { search, page: pagination.current_page },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                res = await axios.get(`${API_BASE_URL}/directions?page=${pagination.current_page}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            
            setDirections(res.data.data);
            setPagination({ 
                current_page: res.data.current_page, 
                last_page: res.data.last_page,
                total: res.data.total,
                per_page: res.data.per_page
            });
        } catch (err) {
            console.error(err);
            Swal.fire("Erreur", "Erreur lors du chargement des directions", "error");
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

    const handleEdit = (direction) => {
        setDirectionToEdit(direction);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (!token) return;

        Swal.fire({
            title: "Voulez-vous supprimer cette direction ?",
            text: "Cette action va désactiver la direction.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Oui, supprimer",
            cancelButtonText: "Annuler",
        }).then((result) => {
            if (result.isConfirmed) {
                axios
                    .delete(`${API_BASE_URL}/directions/${id}`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(() => {
                        Swal.fire("Supprimé !", "Direction désactivée avec succès.", "success");
                        fetchDirections();
                    })
                    .catch((error) => {
                        Swal.fire("Erreur", "Une erreur est survenue lors de la suppression.", "error");
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

    const handleModalSuccess = () => {
        fetchDirections();
        setDirectionToEdit(null);
    };

    const getStatusBadge = (statut) => {
        if (statut === 1) {
            return (
                <span className="badge badge-success d-flex align-items-center px-3 py-1">
                    <FaCheckCircle className="mr-1" style={{ fontSize: '0.75rem' }} />
                    Active
                </span>
            );
        }
        return (
            <span className="badge badge-warning d-flex align-items-center px-3 py-1">
                <FaTimesCircle className="mr-1" style={{ fontSize: '0.75rem' }} />
                Inactive
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const ActionDropdown = ({ row }) => (
        <div className="dropdown">
            <button 
                className="btn btn-sm btn-light border dropdown-toggle d-flex align-items-center"
                type="button" 
                data-toggle="dropdown"
                style={{ minWidth: '40px' }}
            >
                <FaEllipsisV />
            </button>
            <div className="dropdown-menu dropdown-menu-right shadow-lg border-0" style={{ minWidth: '200px' }}>
                <h6 className="dropdown-header text-uppercase text-muted font-weight-bold small">
                    Actions
                </h6>
                <button 
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => handleEdit(row)}
                >
                    <FaEdit className="mr-3 text-primary" />
                    <span>Modifier</span>
                </button>
                <button 
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => {
                        Swal.fire({
                            title: row.nom,
                            html: `
                                <div class="text-left">
                                    <p><strong>Nom:</strong> ${row.nom}</p>
                                    <p><strong>Statut:</strong> ${row.statut === 1 ? 'Active' : 'Inactive'}</p>
                                    <p><strong>Date création:</strong> ${formatDate(row.created_at)}</p>
                                    <p><strong>ID:</strong> ${row.id}</p>
                                </div>
                            `,
                            icon: 'info'
                        });
                    }}
                >
                    <FaEye className="mr-3 text-info" />
                    <span>Détails</span>
                </button>
                <div className="dropdown-divider"></div>
                <button 
                    className="dropdown-item d-flex align-items-center text-danger"
                    onClick={() => handleDelete(row.id)}
                >
                    <FaTrash className="mr-3" />
                    <span>Supprimer</span>
                </button>
            </div>
        </div>
    );

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
                                    <FaBuilding className="mr-2" style={{ fontSize: '24px' }} /> Gestion des Directions
                                </h1>
                                <p className="text-muted mb-0">Gérez les directions de votre organisation</p>
                            </div>
                            <div className="col-sm-6">
                                <ol className="breadcrumb float-sm-right">
                                    <li className="breadcrumb-item"><a href="/">Accueil</a></li>
                                    <li className="breadcrumb-item active">Directions</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                <section className="content">
                    <div className="container-fluid">
                        <div className="row mb-4">
                            {statsCards.map((card) => (
                                <div key={card.id} className="col-lg-3 col-md-6 mb-4">
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

                        <div className="row mb-2">
                            <div className="col-md-9">
                                <div className="form-inline">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control border-right-0"
                                            placeholder="Rechercher une direction..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                            style={{ minWidth: '300px' }}
                                        />
                                        <div className="input-group-append">
                                            <button 
                                                onClick={handleSearch} 
                                                className="btn btn-primary"
                                            >
                                                <FaSearch className="mr-1" /> Rechercher
                                            </button>
                                            <button 
                                                onClick={actualiser} 
                                                className="btn btn-secondary ml-2"
                                            >
                                                <FaSync className="mr-1" /> Actualiser
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3 d-flex justify-content-end">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setDirectionToEdit(null);
                                        setShowModal(true);
                                    }}
                                >
                                    <FaPlus className="mr-1" /> Ajouter une Direction
                                </button>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-12">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
                                            <span className="sr-only">Chargement...</span>
                                        </div>
                                        <p className="mt-3 text-muted">Chargement des directions...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-body p-0">
                                                <div className="table-responsive">
                                                    <table className="table table-hover mb-0">
                                                        <thead className="thead-light">
                                                            <tr>
                                                                <th className="border-0 py-3" style={{ width: '40px' }}>#</th>
                                                                <th className="border-0 py-3">Direction</th>
                                                                <th className="border-0 py-3 text-center">Statut</th>
                                                                <th className="border-0 py-3">Date de création</th>
                                                                <th className="border-0 py-3 text-center" style={{ width: '100px' }}>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {directions.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan="5" className="text-center py-5">
                                                                        <div className="text-muted">
                                                                            <FaBuilding className="mb-3" style={{ fontSize: '3rem', opacity: 0.5 }} />
                                                                            <h5>Aucune direction trouvée</h5>
                                                                            <p className="mb-0">
                                                                                {modeRecherche 
                                                                                    ? "Aucun résultat pour votre recherche" 
                                                                                    : "Commencez par ajouter une direction"}
                                                                            </p>
                                                                        </div>
                                                                         </td>
                                                                    </tr>
                                                                ) : (
                                                                    directions.map((direction, index) => (
                                                                        <tr key={direction.id} className="border-bottom">
                                                                            <td className="align-middle">
                                                                                <div className="font-weight-bold text-muted">
                                                                                    {(pagination.current_page - 1) * pagination.per_page + index + 1}
                                                                                </div>
                                                                            </td>
                                                                            <td className="align-middle">
                                                                                <div className="d-flex align-items-center">
                                                                                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 mr-3 d-flex align-items-center justify-content-center">
                                                                                        <FaBuilding className="text-primary" style={{ fontSize: '18px' }} />
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="font-weight-bold">{direction.nom}</div>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="align-middle text-center">
                                                                                {getStatusBadge(direction.statut)}
                                                                            </td>
                                                                            <td className="align-middle">
                                                                                <div className="d-flex align-items-center">
                                                                                    <FaCalendarAlt className="mr-2 text-muted" />
                                                                                    {formatDate(direction.created_at)}
                                                                                </div>
                                                                            </td>
                                                                            <td className="align-middle text-center">
                                                                                <ActionDropdown row={direction} />
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        {directions.length > 0 && (
                                            <div className="card border-0 shadow-sm mt-3">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="text-muted">
                                                            Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur {pagination.total} directions
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
                </section>
            </div>

            <ModalDirectionScreen 
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setDirectionToEdit(null);
                }}
                directionToEdit={directionToEdit}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default DirectionScreen;