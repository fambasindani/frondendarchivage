import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import ModalEmplacementScreen from "../Modals/ModalEmplacementScreen";
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaSearch, 
  FaEye, 
  FaEllipsisV,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt
} from 'react-icons/fa';
import LoadingSpinner from "../Loading/LoadingSpinner";

const EmplacementScreen = () => {
    const [emplacements, setEmplacements] = useState([]);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ 
        current_page: 1, 
        last_page: 1,
        total: 0,
        per_page: 10
    });
    const [modeRecherche, setModeRecherche] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [emplacementToEdit, setEmplacementToEdit] = useState(null);

    const [statsCards, setStatsCards] = useState([
        {
            id: 1,
            title: "Total Emplacements",
            value: "0",
            icon: <FaMapMarkerAlt style={{ fontSize: '24px' }} />,
            color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            description: "Tous les emplacements"
        },
        {
            id: 2,
            title: "Actifs",
            value: "0",
            icon: <FaCheckCircle style={{ fontSize: '24px' }} />,
            color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
            description: "Emplacements actifs"
        },
        {
            id: 3,
            title: "Inactifs",
            value: "0",
            icon: <FaTimesCircle style={{ fontSize: '24px' }} />,
            color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
            description: "Emplacements inactifs"
        }
    ]);

    const token = GetTokenOrRedirect();

    useEffect(() => {
        if (emplacements.length > 0) {
            const total = emplacements.length;
            const actifs = emplacements.filter(e => e.statut === true || e.statut === 1).length;
            const inactifs = total - actifs;
            
            setStatsCards([
                {
                    id: 1,
                    title: "Total Emplacements",
                    value: total.toString(),
                    icon: <FaMapMarkerAlt style={{ fontSize: '24px' }} />,
                    color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    description: "Tous les emplacements"
                },
                {
                    id: 2,
                    title: "Actifs",
                    value: actifs.toString(),
                    icon: <FaCheckCircle style={{ fontSize: '24px' }} />,
                    color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
                    description: `${actifs > 0 ? Math.round((actifs / total) * 100) : 0}% actifs`
                },
                {
                    id: 3,
                    title: "Inactifs",
                    value: inactifs.toString(),
                    icon: <FaTimesCircle style={{ fontSize: '24px' }} />,
                    color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
                    description: `${inactifs > 0 ? Math.round((inactifs / total) * 100) : 0}% inactifs`
                }
            ]);
        }
    }, [emplacements]);

    useEffect(() => {
        if (token) {
            fetchEmplacements();
        }
    }, [pagination.current_page, modeRecherche, token]);

    const fetchEmplacements = async () => {
        if (!token) return;
        setLoading(true);
        try {
            let res;
            if (modeRecherche && search.trim() !== "") {
                res = await axios.get(`${API_BASE_URL}/emplacements/search`, {
                    params: { search, page: pagination.current_page },
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                res = await axios.get(`${API_BASE_URL}/emplacements?page=${pagination.current_page}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            setEmplacements(res.data.data);
            setPagination({ 
                current_page: res.data.current_page, 
                last_page: res.data.last_page,
                total: res.data.total,
                per_page: res.data.per_page || 10
            });
        } catch (err) {
            console.error(err);
            Swal.fire("Erreur", "Erreur lors du chargement des emplacements", "error");
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

    const handleEdit = (emplacement) => {
        setEmplacementToEdit(emplacement);
        setShowModal(true);
    };

   const handleDelete = (id, nomEmplacement) => {
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Non authentifié',
            text: "Vous n'êtes pas authentifié. Veuillez vous reconnecter."
        });
        return;
    }

    // Vérification des permissions
    const userPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');
    
    if (!userPermissions.includes('supprimer_emplacement')) {
        Swal.fire({
            icon: 'error',
            title: 'Permission refusée',
            text: "Vous n'avez pas la permission 'supprimer emplacement' pour désactiver un emplacement"
        });
        return;
    }

    Swal.fire({
        title: "Voulez-vous désactiver cet emplacement ?",
        html: `
            <div style="text-align: left;">
                <p>Êtes-vous sûr de vouloir désactiver l'emplacement :</p>
                <p style="font-weight: bold; color: #dc3545; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                    "${nomEmplacement || 'Cet emplacement'}"
                </p>
                <p class="text-muted small">Cette action va mettre à jour son statut en "inactif".</p>
            </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Oui, désactiver",
        cancelButtonText: "Annuler",
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
          //  setDeleting(true); // Si vous avez un état pour le loading
            
            axios
                .delete(
                    `${API_BASE_URL}/emplacements/${id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                .then((response) => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Désactivé !',
                        text: response.data.message || "Emplacement désactivé avec succès.",
                        timer: 2000,
                        showConfirmButton: false
                    });
                    
                    // Rafraîchir la liste
                    if (fetchEmplacements) {
                        fetchEmplacements();
                    }
                })
                .catch((error) => {
                    console.error("Erreur lors de la désactivation:", error);
                    
                    if (error.response) {
                        const { status, data } = error.response;
                        
                        // Gestion spécifique selon le code HTTP
                        switch (status) {
                            case 403:
                                // Permission refusée (middleware)
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Action non autorisée',
                                    text: data.message || "Vous n'avez pas la permission de supprimer cet emplacement",
                                    timer: 3000
                                });
                                break;
                                
                            case 401:
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Session expirée',
                                    text: data.message || 'Votre session a expiré. Veuillez vous reconnecter.',
                                    timer: 3000
                                }).then(() => {
                                    localStorage.clear();
                                    window.location.href = '/';
                                });
                                break;
                                
                            case 404:
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Non trouvé',
                                    text: data.message || "L'emplacement n'existe pas",
                                    timer: 3000
                                }).then(() => {
                                    if (fetchEmplacements) {
                                        fetchEmplacements();
                                    }
                                });
                                break;
                                
                            case 422:
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Erreur de validation',
                                    text: data.message || "Impossible de désactiver cet emplacement",
                                    timer: 3000
                                });
                                break;
                                
                            default:
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Erreur',
                                    text: data.message || "Erreur lors de la désactivation",
                                    timer: 3000
                                });
                        }
                    } else if (error.request) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Erreur réseau',
                            text: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
                            timer: 3000
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Erreur',
                            text: error.message || "Une erreur inattendue s'est produite",
                            timer: 3000
                        });
                    }
                })
                .finally(() => {
                   
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
        fetchEmplacements();
        setEmplacementToEdit(null);
    };

    const getStatusBadge = (statut) => {
        if (statut === true || statut === 1) {
            return (
                <span className="badge badge-success d-flex align-items-center px-3 py-1">
                    <FaCheckCircle className="mr-1" style={{ fontSize: '0.75rem' }} />
                    Actif
                </span>
            );
        }
        return (
            <span className="badge badge-warning d-flex align-items-center px-3 py-1">
                <FaTimesCircle className="mr-1" style={{ fontSize: '0.75rem' }} />
                Inactif
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
                            title: row.nom_emplacement,
                            html: `
                                <div class="text-left">
                                    <p><strong>Nom:</strong> ${row.nom_emplacement}</p>
                                    <p><strong>Statut:</strong> ${row.statut === true || row.statut === 1 ? 'Actif' : 'Inactif'}</p>
                                    <p><strong>Date création:</strong> ${formatDate(row.created_at)}</p>
                                    <p><strong>Date modification:</strong> ${formatDate(row.updated_at)}</p>
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
                                    <FaMapMarkerAlt className="mr-2" style={{ fontSize: '24px' }} /> Gestion des Emplacements
                                </h1>
                                <p className="text-muted mb-0">Gérez les emplacements de votre organisation</p>
                            </div>
                            <div className="col-sm-6">
                                <ol className="breadcrumb float-sm-right">
                                    <li className="breadcrumb-item"><a href="/">Accueil</a></li>
                                    <li className="breadcrumb-item active">Emplacements</li>
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
                                            placeholder="Rechercher un emplacement..."
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
                                        setEmplacementToEdit(null);
                                        setShowModal(true);
                                    }}
                                >
                                    <FaPlus className="mr-1" /> Ajouter un Emplacement
                                </button>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-12">
                                 {loading ? (
                                    <LoadingSpinner message="Chargement des Emplacements..." />
                                ) : (
                                    <>
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-body p-0">
                                                <div className="table-responsive">
                                                    <table className="table table-hover mb-0">
                                                        <thead className="thead-light">
                                                            <tr>
                                                                <th className="border-0 py-3" style={{ width: '40px' }}>#</th>
                                                                <th className="border-0 py-3">Emplacement</th>
                                                                <th className="border-0 py-3 text-center">Statut</th>
                                                                <th className="border-0 py-3">Date de création</th>
                                                                <th className="border-0 py-3 text-center" style={{ width: '100px' }}>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {emplacements.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan="5" className="text-center py-5">
                                                                        <div className="text-muted">
                                                                            <FaMapMarkerAlt className="mb-3" style={{ fontSize: '3rem', opacity: 0.5 }} />
                                                                            <h5>Aucun emplacement trouvé</h5>
                                                                            <p className="mb-0">
                                                                                {modeRecherche 
                                                                                    ? "Aucun résultat pour votre recherche" 
                                                                                    : "Commencez par ajouter un emplacement"}
                                                                            </p>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                emplacements.map((emplacement, index) => (
                                                                    <tr key={emplacement.id} className="border-bottom">
                                                                        <td className="align-middle">
                                                                            <div className="font-weight-bold text-muted">
                                                                                {(pagination.current_page - 1) * pagination.per_page + index + 1}
                                                                            </div>
                                                                        </td>
                                                                        <td className="align-middle">
                                                                            <div className="d-flex align-items-center">
                                                                                <div className="rounded-circle bg-primary bg-opacity-10 p-3 mr-3 d-flex align-items-center justify-content-center">
                                                                                    <FaMapMarkerAlt className="text-primary" style={{ fontSize: '18px' }} />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-weight-bold">{emplacement.nom_emplacement}</div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="align-middle text-center">
                                                                            {getStatusBadge(emplacement.statut)}
                                                                        </td>
                                                                        <td className="align-middle">
                                                                            <div className="d-flex align-items-center">
                                                                                <FaCalendarAlt className="mr-2 text-muted" />
                                                                                {formatDate(emplacement.created_at)}
                                                                            </div>
                                                                        </td>
                                                                        <td className="align-middle text-center">
                                                                            <ActionDropdown row={emplacement} />
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        {emplacements.length > 0 && (
                                            <div className="card border-0 shadow-sm mt-3">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="text-muted">
                                                            Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur {pagination.total} emplacements
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

            <ModalEmplacementScreen 
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEmplacementToEdit(null);
                }}
                emplacementToEdit={emplacementToEdit}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default EmplacementScreen;