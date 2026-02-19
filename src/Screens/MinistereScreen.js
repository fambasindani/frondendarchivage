import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import ModalMinistere from "../Modals/ModalMinistere";
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaSearch,
    FaEye,
    FaEllipsisV,
    FaChevronLeft,
    FaChevronRight,
    FaFileInvoice,
    FaSync,
    FaCheckCircle,
    FaTimesCircle,
    FaCalendarAlt,
    FaHashtag
} from 'react-icons/fa';
import LoadingSpinner from "../Loading/LoadingSpinner";

const MinistereScreen = () => {
    const [articles, setArticles] = useState([]);
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
    const [articleToEdit, setArticleToEdit] = useState(null);

    const [statsCards, setStatsCards] = useState([
        {
            id: 1,
            title: "Total Services",
            value: "0",
            icon: <FaFileInvoice style={{ fontSize: '24px' }} />,
            color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            description: "Tous les services d'assiette"
        },
        {
            id: 2,
            title: "Actifs",
            value: "0",
            icon: <FaCheckCircle style={{ fontSize: '24px' }} />,
            color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
            description: "Services actifs"
        },
        {
            id: 3,
            title: "Inactifs",
            value: "0",
            icon: <FaTimesCircle style={{ fontSize: '24px' }} />,
            color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
            description: "Services inactifs"
        }
    ]);

    const token = GetTokenOrRedirect();

    useEffect(() => {
        if (articles.length > 0) {
            const total = articles.length;
            const actifs = articles.filter(a => a.statut === 1 || a.statut === true).length;
            const inactifs = total - actifs;

            setStatsCards([
                {
                    id: 1,
                    title: "Total Services",
                    value: total.toString(),
                    icon: <FaFileInvoice style={{ fontSize: '24px' }} />,
                    color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    description: "Tous les services d'assiette"
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
    }, [articles]);

    useEffect(() => {
        if (token) {
            fetchArticles();
        }
    }, [pagination.current_page, modeRecherche, token]);

    const fetchArticles = async () => {
        if (!token) return;

        setLoading(true);
        try {
            let res;
            if (modeRecherche && search.trim() !== "") {
                res = await axios.post(`${API_BASE_URL}/search-article`,
                    { search, page: pagination.current_page },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                res = await axios.get(`${API_BASE_URL}/article?page=${pagination.current_page}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            
            setArticles(res.data.data || []);
            setPagination({
                current_page: res.data.current_page || 1,
                last_page: res.data.last_page || 1,
                total: res.data.total || 0,
                per_page: res.data.per_page || 10
            });
        } catch (err) {
            console.error("Erreur lors du chargement :", err);
            Swal.fire("Erreur", "Erreur lors du chargement des services d'assiette", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, current_page: 1 }));
        setModeRecherche(true);
        fetchArticles();
    };

    const actualiser = () => {
        setSearch("");
        setModeRecherche(false);
        setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
        fetchArticles();
    };

    const handleEdit = (article) => {
        setArticleToEdit(article);
        setShowModal(true);
    };

const handleDelete = (id, nom, article_budgetaire) => {
    // Vérification du token
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
    
    if (!userPermissions.includes('supprimer_service_assiette')) {
        Swal.fire({
            icon: 'error',
            title: 'Permission refusée',
            text: "Vous n'avez pas la permission 'supprimer service assiette' pour désactiver un service"
        });
        return;
    }

    Swal.fire({
        title: "Voulez-vous désactiver ce service ?",
        html: `
            <div style="text-align: left;">
                <p>Êtes-vous sûr de vouloir désactiver le service :</p>
                <p style="font-weight: bold; color: #dc3545; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                    "${nom || 'Ce service'}" (${article_budgetaire || ''})
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
            axios
                .delete(
                    `${API_BASE_URL}/delete-article/${id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                .then(() => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Désactivé !',
                        text: "Service désactivé avec succès.",
                        timer: 2000,
                        showConfirmButton: false
                    });
                    
                    // Rafraîchir la liste
                    if (fetchArticles) {
                        fetchArticles();
                    }
                })
                .catch((error) => {
                    console.error("Erreur lors de la désactivation:", error);
                    
                    // Gestion des erreurs
                    if (error.response) {
                        const { status, data } = error.response;
                        
                        switch (status) {
                            case 403:
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Action non autorisée',
                                    text: data.message || "Vous n'avez pas la permission de supprimer ce service",
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
                                    text: data.message || "Le service n'existe pas",
                                    timer: 3000
                                }).then(() => {
                                    if (fetchArticles) {
                                        fetchArticles();
                                    }
                                });
                                break;
                                
                            case 422:
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Erreur de validation',
                                    text: data.message || "Impossible de désactiver ce service",
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
        fetchArticles();
        setArticleToEdit(null);
    };

    const getStatusBadge = (statut) => {
        if (statut === 1 || statut === true) {
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
        if (!dateString) return 'N/A';
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
                                    <p><strong>Service:</strong> ${row.nom}</p>
                                    <p><strong>Article budgétaire:</strong> ${row.article_budgetaire}</p>
                                    <p><strong>Statut:</strong> ${row.statut === 1 ? 'Actif' : 'Inactif'}</p>
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
                                    <FaFileInvoice className="mr-2" style={{ fontSize: '24px' }} /> Gestion des Services d'Assiette
                                </h1>
                                <p className="text-muted mb-0">Gérez les services d'assiette et articles budgétaires</p>
                            </div>
                            <div className="col-sm-6">
                                <ol className="breadcrumb float-sm-right">
                                    <li className="breadcrumb-item"><a href="/">Accueil</a></li>
                                    <li className="breadcrumb-item active">Services d'assiette</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                <section className="content">
                    <div className="container-fluid">
                        {/* Cartes statistiques */}
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

                        {/* Barre de recherche et bouton d'ajout */}
                        <div className="row mb-2">
                            <div className="col-md-9">
                                <div className="form-inline">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control border-right-0"
                                            placeholder="Rechercher un service d'assiette..."
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
                                        setArticleToEdit(null);
                                        setShowModal(true);
                                    }}
                                >
                                    <FaPlus className="mr-1" /> Ajouter un Service
                                </button>
                            </div>
                        </div>

                        {/* Tableau des services */}
                        <div className="row">
                            <div className="col-md-12">
                                {loading ? (
                                    <LoadingSpinner message="Chargement des services d'assiette..." />
                                ) : (
                                    <>
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-body p-0">
                                                <div className="table-responsive">
                                                    <table className="table table-hover mb-0">
                                                        <thead className="thead-light">
                                                            <tr>
                                                                <th className="border-0 py-3" style={{ width: '40px' }}>#</th>
                                                                <th className="border-0 py-3">Service d'assiette</th>
                                                                <th className="border-0 py-3">Article budgétaire</th>
                                                                <th className="border-0 py-3 text-center">Statut</th>
                                                                <th className="border-0 py-3">Date de création</th>
                                                                <th className="border-0 py-3 text-center" style={{ width: '100px' }}>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {articles.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan="6" className="text-center py-5">
                                                                        <div className="text-muted">
                                                                            <FaFileInvoice className="mb-3" style={{ fontSize: '3rem', opacity: 0.5 }} />
                                                                            <h5>Aucun service trouvé</h5>
                                                                            <p className="mb-0">
                                                                                {modeRecherche
                                                                                    ? "Aucun résultat pour votre recherche"
                                                                                    : "Commencez par ajouter un service d'assiette"}
                                                                            </p>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                articles.map((article, index) => (
                                                                    <tr key={article.id} className="border-bottom">
                                                                        <td className="align-middle">
                                                                            <div className="font-weight-bold text-muted">
                                                                                {(pagination.current_page - 1) * pagination.per_page + index + 1}
                                                                            </div>
                                                                        </td>
                                                                        <td className="align-middle">
                                                                            <div className="d-flex align-items-center">
                                                                                <div className="rounded-circle bg-primary bg-opacity-10 p-3 mr-3 d-flex align-items-center justify-content-center">
                                                                                    <FaFileInvoice className="text-primary" style={{ fontSize: '18px' }} />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-weight-bold">{article.nom}</div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="align-middle">
                                                                            <div className="d-flex align-items-center">
                                                                                <FaHashtag className="mr-2 text-muted" />
                                                                                <span className="font-weight-bold">{article.article_budgetaire}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="align-middle text-center">
                                                                            {getStatusBadge(article.statut)}
                                                                        </td>
                                                                        <td className="align-middle">
                                                                            <div className="d-flex align-items-center">
                                                                                <FaCalendarAlt className="mr-2 text-muted" />
                                                                                {formatDate(article.created_at)}
                                                                            </div>
                                                                        </td>
                                                                        <td className="align-middle text-center">
                                                                            <ActionDropdown row={article} />
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
                                        {articles.length > 0 && (
                                            <div className="card border-0 shadow-sm mt-3">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="text-muted">
                                                            Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur {pagination.total} services
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

            {/* Modal d'ajout/modification */}
            <ModalMinistere
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setArticleToEdit(null);
                }}
                articleToEdit={articleToEdit}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default MinistereScreen;