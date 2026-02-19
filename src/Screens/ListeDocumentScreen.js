import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import Menus from "../Composant/Menus";
import Head from "../Composant/Head";
import DocumentModal from "../Modals/DocumentModal";
import { useParams, useLocation } from "react-router-dom";
import LoadingSpinner from "../Loading/LoadingSpinner";
import {
  FaFolder,
  FaFileAlt,
  FaSearch,
  FaSync,
  FaBuilding,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaMapMarkerAlt,
  FaEllipsisV,
  FaInfoCircle,
  FaEye,
  FaLayerGroup
} from "react-icons/fa";

const ListeDocumentScreen = () => {
    const token = GetTokenOrRedirect();
    const { id } = useParams();
    const location = useLocation();
    
    // Récupération des données du state
    const { classifier, direction, nomDirection, periode, searchTerm } = location.state || {};
    
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
        
        // Si l'utilisateur n'a aucune direction, afficher un message
        if (ids.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Aucune direction',
                text: "Vous n'avez accès à aucune direction. Veuillez contacter l'administrateur.",
                timer: 3000,
                timerProgressBar: true
            });
        }
        
        // Marquer comme chargé
        setTimeout(() => {
            setIsLoadingUserData(false);
        }, 500);
    }, []);
    
    const [documents, setDocuments] = useState([]);
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
    const [monprojet, setMonProjet] = useState(null);
    const [idclasseur, setIdClasseur] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [filteredBy, setFilteredBy] = useState(null);

    const utilisateur = JSON.parse(localStorage.getItem("utilisateur")) || {};
    const role = JSON.parse(localStorage.getItem("role"));

    // Cartes de statistiques
    const [statsCards, setStatsCards] = useState([
        {
            id: 1,
            title: "Mes Documents",
            value: "0",
            icon: <FaFolder style={{ fontSize: '24px' }} />,
            color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            description: "Documents accessibles"
        },
        {
            id: 2,
            title: "Classificateur",
            value: classifier?.nom_classeur || "Chargement...",
            icon: <FaLayerGroup style={{ fontSize: '24px' }} />,
            color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
            description: classifier?.nom_classeur || "Classificateur"
        }
    ]);

    // Fermer le dropdown quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = () => {
            setOpenDropdownId(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        console.log("📍 Données reçues:", {
            id_classeur: id,
            direction,
            nomDirection,
            periode,
            searchTerm,
            classifier
        });
    }, []);

    // 🔥 useEffect avec dépendances pour le chargement des documents
    useEffect(() => {
        // Attendre que les données utilisateur soient chargées
        if (token && !isLoadingUserData) {
            fetchDocuments();
        }
    }, [pagination.current_page, modeRecherche, token, userDirectionIds, isLoadingUserData, id]);

    const fetchDocuments = async () => {
        if (!token) return;

        setLoading(true);
        setDocuments([]); // Vider les anciens documents
        
        try {
            // 🔥 N'envoyer les direction_ids QUE s'ils existent
            if (userDirectionIds.length === 0) {
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

            // Construire les paramètres de requête
            const params = {
                page: pagination.current_page,
                direction_ids: userDirectionIds.join(',') // Envoyer les IDs des directions
            };

            // Ajouter les paramètres de recherche si nécessaire
            if (modeRecherche && search.trim() !== "") {
                params.search = search;
            }

            console.log("📦 Envoi requête GET:", {
                url: `${API_BASE_URL}/listedeclaration/${id}`,
                params: params
            });

            // Utiliser GET avec paramètres
            const response = await axios.get(
                `${API_BASE_URL}/listedeclaration/${id}`,
                { 
                    params: params,
                    headers: { Authorization: `Bearer ${token}` } 
                }
            );

            console.log("✅ Réponse API:", response.data);

            if (response.data) {
                const documentsData = response.data.data || [];
                
                console.log('📊 Documents reçus:', documentsData.length);
                
                setDocuments(documentsData);
                setFilteredBy('directions');
                
                setPagination({
                    current_page: response.data.current_page || 1,
                    last_page: response.data.last_page || 1,
                    total: response.data.total || documentsData.length || 0,
                    per_page: response.data.per_page || 10
                });

                // Mettre à jour les stats
                const total = response.data.total || documentsData.length;
                const actifs = documentsData.filter(d => d.statut === true || d.statut === 1).length;

                setStatsCards(prev => [
                    { 
                        ...prev[0], 
                        value: total.toString(),
                        description: total > 0 ? `${Math.round((actifs / total) * 100)}% actifs` : '0% actifs'
                    },
                    {
                        ...prev[1],
                        value: classifier?.nom_classeur || "Documents"
                    }
                ]);
            }
        } catch (err) {
            console.error("❌ Erreur:", err);
            Swal.fire({
                icon: "error",
                title: "Erreur",
                text: err.response?.data?.message || "Erreur lors du chargement"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (search.trim() === "") {
            Swal.fire("Attention", "Veuillez entrer un terme de recherche", "warning");
            return;
        }
        setPagination(prev => ({ ...prev, current_page: 1 }));
        setModeRecherche(true);
        fetchDocuments();
    };

    const handleReset = () => {
        setSearch("");
        setModeRecherche(false);
        setPagination(prev => ({ ...prev, current_page: 1 }));
        fetchDocuments();
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.last_page) {
            setPagination(prev => ({ ...prev, current_page: page }));
        }
    };

    const ouvrirModalAvecId = (row) => {
        setSelectedId(row.id);
        setMonProjet(row.nom_direction || row.departement?.nom);
        setIdClasseur(row.id_classeur);
        setIsModalOpen(true);
    };

    const getFileIcon = (nom) => {
        const type = nom?.toLowerCase() || "";
        if (type.includes("pdf")) return <FaFilePdf className="text-danger" size={20} />;
        if (type.includes("word") || type.includes("doc")) return <FaFileWord className="text-primary" size={20} />;
        if (type.includes("excel") || type.includes("xls")) return <FaFileExcel className="text-success" size={20} />;
        if (type.includes("image") || type.includes("jpg") || type.includes("png"))
            return <FaFileImage className="text-info" size={20} />;
        return <FaFileAlt className="text-warning" size={20} />;
    };

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

    // Fonction pour gérer l'ouverture/fermeture du dropdown
    const toggleDropdown = (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    // Composant ActionDropdown avec gestion d'état
    const ActionDropdown = ({ row }) => (
        <div className="dropdown" style={{ position: 'relative' }}>
            <button 
                className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                type="button"
                onClick={(e) => toggleDropdown(row.id, e)}
                style={{ 
                    width: '40px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: openDropdownId === row.id ? '#e9ecef' : 'white',
                    border: '1px solid #dee2e6',
                    outline: 'none'
                }}
            >
                <FaEllipsisV />
            </button>
            
            {openDropdownId === row.id && (
                <div 
                    className="dropdown-menu show" 
                    style={{ 
                        position: 'absolute', 
                        right: 0,
                        top: '100%',
                        zIndex: 9999,
                        minWidth: '200px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        border: 'none',
                        marginTop: '5px',
                        padding: '8px 0',
                        backgroundColor: 'white'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h6 className="dropdown-header text-uppercase text-muted font-weight-bold small px-3 py-2">
                        Actions
                    </h6>
                    <button 
                        className="dropdown-item d-flex align-items-center px-3 py-2"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenDropdownId(null);
                            Swal.fire({
                                title: `Document: ${row.intitule || 'Sans titre'}`,
                                html: `
                                    <div class="text-left" style="max-height: 400px; overflow-y: auto;">
                                        <p><strong>Intitulé:</strong> ${row.intitule || 'N/A'}</p>
                                        <p><strong>N° Référence:</strong> ${row.num_reference || 'N/A'}</p>
                                        <p><strong>Mot Clé:</strong> ${row.mot_cle || 'N/A'}</p>
                                        <p><strong>Direction:</strong> ${row.nom_direction || row.departement?.nom || 'N/A'}</p>
                                        <p><strong>Emplacement:</strong> ${row.nom_emplacement || row.emplacement?.nom_emplacement || 'N/A'}</p>
                                        <p><strong>Date création:</strong> ${formatDate(row.date_creation)}</p>
                                        <p><strong>Date enregistrement:</strong> ${formatDate(row.date_enregistrement)}</p>
                                    </div>
                                `,
                                icon: 'info',
                                confirmButtonText: 'Fermer',
                                confirmButtonColor: '#3085d6'
                            });
                        }}
                    >
                        <FaInfoCircle className="mr-3 text-info" size={16} />
                        <span>Détails</span>
                    </button>
                    
                    <button 
                        className="dropdown-item d-flex align-items-center px-3 py-2"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenDropdownId(null);
                            ouvrirModalAvecId(row);
                        }}
                    >
                        <FaFilePdf className="mr-3 text-danger" size={16} />
                        <span>PDF</span>
                    </button>
                    
                    <button 
                        className="dropdown-item d-flex align-items-center px-3 py-2"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenDropdownId(null);
                            // Ouvrir le document dans un nouvel onglet
                           // window.open(`${API_BASE_URL}/documents/${row.id}/view`, '_blank');
                        }}
                    >
                        <FaEye className="mr-3 text-primary" size={16} />
                        <span>Visualiser</span>
                    </button>
                </div>
            )}
        </div>
    );

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
                                            <FaFolder className="text-primary" size={28} />
                                        </div>
                                        <div>
                                            <h1 className="h2 mb-1 font-weight-bold">
                                                {classifier?.nom_classeur || "Documents"}
                                            </h1>
                                            <div className="d-flex align-items-center flex-wrap text-muted">
                                                <span className="d-flex align-items-center mr-3">
                                                    <FaUser className="mr-1" size={14} />
                                                    {utilisateur?.prenom || ''} {utilisateur?.nom || ''}
                                                </span>
                                                {/* Afficher les directions de l'utilisateur */}
                                                {userDepartements.length > 0 && (
                                                    <span className="d-flex align-items-center flex-wrap">
                                                        <FaBuilding className="mr-1" size={14} />
                                                        {userDepartements.map(dept => dept.sigle || dept.nom).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                            {filteredBy && (
                                                <p className="text-info small mt-2">
                                                    <FaBuilding className="mr-1" /> 
                                                    Filtré par vos directions accessibles
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 text-lg-right mt-3 mt-lg-0">
                                    <button
                                        className="btn btn-light border shadow-sm px-4"
                                        onClick={handleReset}
                                        disabled={loading || userDirectionIds.length === 0}
                                    >
                                        <FaSync className={`mr-2 ${loading ? "fa-spin" : ""}`} />
                                        Actualiser
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Afficher les directions de l'utilisateur */}
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

                        {/* Cartes de statistiques */}
                        <div className="row mb-4">
                            {statsCards.map((card) => (
                                <div key={card.id} className="col-lg-6 col-md-6 mb-4">
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
                                        placeholder="Rechercher par intitulé, référence, mot clé..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        style={{ minWidth: '300px', height: '45px' }}
                                        disabled={userDirectionIds.length === 0}
                                    />
                                    <div className="input-group-append">
                                        <button 
                                            onClick={handleSearch} 
                                            className="btn btn-primary"
                                            style={{ height: '45px' }}
                                            disabled={!search.trim() || userDirectionIds.length === 0}
                                        >
                                            <FaSearch className="mr-1" /> Rechercher
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4 text-right">
                                <span className="badge badge-light p-2 shadow-sm">
                                    <FaFolder className="mr-1" /> 
                                    Total: {documents.length} document(s)
                                </span>
                            </div>
                        </div>

                        {/* Tableau des documents */}
                        {loading ? (
                            <LoadingSpinner message="Chargement des documents..." />
                        ) : (
                            <>
                                <div className="card border-0 shadow-sm">
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="thead-light">
                                                    <tr>
                                                        <th className="border-0 py-3">Intitulé</th>
                                                        <th className="border-0 py-3">N° Référence</th>
                                                        <th className="border-0 py-3">Mot Clé</th>
                                                        <th className="border-0 py-3">Direction</th>
                                                        <th className="border-0 py-3">Emplacement</th>
                                                        <th className="border-0 py-3 text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {documents.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6" className="text-center py-5">
                                                                <div className="text-muted">
                                                                    <FaFolder className="mb-3" style={{ fontSize: '3rem', opacity: 0.5 }} />
                                                                    <h5>Aucun document trouvé</h5>
                                                                    <p className="mb-0">
                                                                        {userDirectionIds.length === 0
                                                                            ? "Vous n'avez accès à aucune direction. Veuillez contacter l'administrateur."
                                                                            : modeRecherche 
                                                                                ? "Aucun résultat pour votre recherche" 
                                                                                : "Aucun document dans ce classificateur pour vos directions"}
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
                                                                            {getFileIcon(doc.classeur?.nom_classeur)}
                                                                        </div>
                                                                        <span className="font-weight-medium">{doc.intitule || 'N/A'}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="align-middle">
                                                                    <span className="badge badge-light px-3 py-2">
                                                                        {doc.num_reference || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td className="align-middle">{doc.mot_cle || '-'}</td>
                                                                <td className="align-middle">
                                                                    <div className="d-flex align-items-center">
                                                                        <FaBuilding className="mr-2 text-muted" size={12} />
                                                                        {doc.nom_direction || doc.departement?.nom || '-'}
                                                                        <span className="badge badge-light ml-2">
                                                                            ID: {doc.id_direction}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="align-middle">
                                                                    <div className="d-flex align-items-center">
                                                                        <FaMapMarkerAlt className="mr-2 text-muted" size={12} />
                                                                        {doc.nom_emplacement || doc.emplacement?.nom_emplacement || '-'}
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
                                                    Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur {pagination.total} documents
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

            <DocumentModal
                modalId="documentModal"
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                monid={selectedId}
                projet={monprojet}
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
                    background-color: #f8f9fa;
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
                    animation: fadeIn 0.2s ease-in-out;
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .dropdown-item {
                    padding: 0.75rem 1.5rem;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
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

export default ListeDocumentScreen;