import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import {
    FaUpload,
    FaFilePdf,
    FaTrash,
    FaTimes,
    FaPlus,
    FaPrint,
    FaCalendarAlt,
    FaHashtag,
    FaKey,
    FaFileSignature,
    FaFileAlt,
    FaMapMarkerAlt,
    FaBuilding,
    FaFolder,
    FaUser,
    FaPaperclip,
    FaCloudUploadAlt,
    FaEye,
    FaSave,
    FaArrowLeft,
    FaArrowRight,
    FaCheckCircle
} from 'react-icons/fa';
import FileUploadModal from "../Modals/FileUploadModal"; // Nouveau composant modal

const FormDocument = ({
    isEditing = false,
    documentToEdit = null,
    onCancel,
    onSuccess,
    directions = [],
    emplacements = [],
    classeurs = []
}) => {
    const token = GetTokenOrRedirect();
    const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
    const id_user = utilisateur?.id || "";

    const [formData, setFormData] = useState({
        id_direction: "",
        id_emplacement: "",
        id_classeur: "",
        id_user: id_user,
        date_creation: "",
        date_enregistrement: "",
        intitule: "",
        num_reference: "",
        mot_cle: "",
        num_declaration: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);
    const [activeSection, setActiveSection] = useState(1);
    
    // Nouveaux états pour le modal
    const [showFileUploadModal, setShowFileUploadModal] = useState(false);
    const [createdDocumentId, setCreatedDocumentId] = useState(null);
    const [documentSubmitted, setDocumentSubmitted] = useState(false);

    // Initialiser les données
    useEffect(() => {
        console.log("=== INITIALISATION FORMULAIRE ===");
        console.log("Mode édition:", isEditing);
        console.log("Document à éditer:", documentToEdit);

        if (isEditing && documentToEdit) {
            const data = {
                id_direction: documentToEdit.id_direction ? documentToEdit.id_direction.toString() : "",
                id_emplacement: documentToEdit.id_emplacement ? documentToEdit.id_emplacement.toString() : "",
                id_classeur: documentToEdit.id_classeur ? documentToEdit.id_classeur.toString() : "",
                id_user: id_user,
                date_creation: documentToEdit.date_creation ?
                    (documentToEdit.date_creation.split('T')[0] || "") : "",
                date_enregistrement: documentToEdit.date_enregistrement ?
                    (documentToEdit.date_enregistrement.split('T')[0] || "") : "",
                intitule: documentToEdit.intitule || "",
                num_reference: documentToEdit.num_reference || "",
                mot_cle: documentToEdit.mot_cle || "",
                num_declaration: documentToEdit.num_declaration || "",
            };

            console.log("Données formatées:", data);
            setFormData(data);
            
            // Si édition, charger les fichiers existants
            if (documentToEdit.id) {
                fetchExistingFiles(documentToEdit.id);
            }
        } else {
            setFormData({
                id_direction: "",
                id_emplacement: "",
                id_classeur: "",
                id_user: id_user,
                date_creation: "",
                date_enregistrement: "",
                intitule: "",
                num_reference: "",
                mot_cle: "",
                num_declaration: "",
            });
        }

        setErrors({});
        setFiles([]);
        setFilePreviews([]);
        setDocumentSubmitted(false);
        setCreatedDocumentId(null);
    }, [documentToEdit, id_user, isEditing]);

    // Fonction pour récupérer les fichiers existants en mode édition
    const fetchExistingFiles = async (documentId) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/documents/${documentId}/files`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            if (response.data && response.data.files) {
                // Transformer les fichiers existants en format compatible
                const existingFilesPreviews = response.data.files.map(file => ({
                    id: file.id,
                    name: file.original_name,
                    size: formatFileSize(file.size),
                    sizeBytes: file.size,
                    preview: file.url,
                    uploadDate: new Date(file.created_at).toLocaleTimeString('fr-FR'),
                    status: 'existing',
                    fileId: file.id
                }));
                
                setFilePreviews(existingFilesPreviews);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des fichiers existants:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("=== DÉBUT SUBMIT ===");

        if (!token) {
            Swal.fire('Erreur', 'Session expirée, veuillez vous reconnecter', 'error');
            return;
        }

        // Validation
        setErrors({});
        const validationErrors = {};
        const requiredFields = [
            'id_direction', 'id_emplacement', 'id_classeur',
            'date_creation', 'date_enregistrement',
            'intitule', 'num_reference', 'mot_cle', 'num_declaration'
        ];

        requiredFields.forEach(field => {
            const value = formData[field];
            if (!value || value.toString().trim() === '') {
                validationErrors[field] = ['Ce champ est obligatoire'];
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            Swal.fire({
                icon: 'error',
                title: 'Champs obligatoires manquants',
                html: `
                <div style="text-align: left;">
                    <p>Veuillez remplir tous les champs marqués d'un astérisque (*)</p>
                </div>
            `,
                confirmButtonText: 'OK'
            });
            return;
        }

        setLoading(true);

        try {
            let response;

            if (isEditing) {
                // MODE ÉDITION : Envoyer en JSON sans fichiers
                console.log("=== MODE ÉDITION ===");

                const dataToSend = {
                    ...formData,
                    id_direction: parseInt(formData.id_direction),
                    id_emplacement: parseInt(formData.id_emplacement),
                    id_classeur: parseInt(formData.id_classeur),
                    id_user: parseInt(formData.id_user),
                    date_creation: formData.date_creation,
                    date_enregistrement: formData.date_enregistrement
                };

                console.log("Données envoyées (JSON):", dataToSend);

                response = await axios.put(
                    `${API_BASE_URL}/declarations/${documentToEdit.id}`,
                    dataToSend,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                // Après modification réussie, ouvrir le modal pour les fichiers
                setCreatedDocumentId(documentToEdit.id);
                setDocumentSubmitted(true);
                setShowFileUploadModal(true);
                
            } else {
                // MODE CRÉATION : Envoyer seulement les données du formulaire
                console.log("=== MODE CRÉATION ===");

                const dataToSend = {
                    ...formData,
                    id_direction: parseInt(formData.id_direction),
                    id_emplacement: parseInt(formData.id_emplacement),
                    id_classeur: parseInt(formData.id_classeur),
                    id_user: parseInt(formData.id_user),
                    date_creation: formData.date_creation,
                    date_enregistrement: formData.date_enregistrement
                };

                response = await axios.post(
                    `${API_BASE_URL}/declarations`,
                    dataToSend,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                // Récupérer l'ID du document créé
                const newDocumentId = response.data.id;
                setCreatedDocumentId(newDocumentId);
                setDocumentSubmitted(true);
                
                // Ouvrir le modal pour l'upload des fichiers
                setShowFileUploadModal(true);
                
                // Ne pas appeler onSuccess ici, on attendra la fermeture du modal
            }

            console.log("Réponse API:", response.data);

            // Ne pas fermer le formulaire, on attend le modal de fichiers
            Swal.fire({
                icon: 'success',
                title: isEditing ? 'Document modifié !' : 'Document créé !',
                text: isEditing 
                    ? 'Le document a été modifié avec succès. Vous pouvez maintenant ajouter des fichiers.'
                    : 'Le document a été créé avec succès. Vous pouvez maintenant ajouter des fichiers.',
                timer: 3000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error('❌ Erreur détaillée:', error);

            if (error.response?.data?.errors) {
                const apiErrors = error.response.data.errors;
                const formattedErrors = {};

                Object.keys(apiErrors).forEach(key => {
                    formattedErrors[key] = Array.isArray(apiErrors[key])
                        ? apiErrors[key]
                        : [apiErrors[key]];
                });

                setErrors(formattedErrors);

                let errorMessage = 'Veuillez corriger les erreurs suivantes :<br><ul>';
                Object.keys(formattedErrors).forEach(field => {
                    errorMessage += `<li><strong>${getFieldLabel(field)}</strong>: ${formattedErrors[field].join(', ')}</li>`;
                });
                errorMessage += '</ul>';

                Swal.fire({
                    icon: 'error',
                    title: 'Erreur de validation',
                    html: errorMessage,
                    confirmButtonText: 'OK'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: error.response?.data?.message || error.message || 'Une erreur est survenue',
                    confirmButtonText: 'OK'
                });
            }
        } finally {
            setLoading(false);
            console.log("=== FIN SUBMIT ===");
        }
    };

    // Fonction appelée quand l'upload des fichiers est terminé
    const handleFilesUploadComplete = (uploadedFiles) => {
        // Ajouter les fichiers uploadés à la liste
        const newFilePreviews = uploadedFiles.map(file => ({
            id: file.id || Date.now() + Math.random(),
            name: file.name,
            size: formatFileSize(file.size),
            sizeBytes: file.size,
            preview: file.url,
            uploadDate: new Date().toLocaleTimeString('fr-FR'),
            status: 'uploaded',
            fileId: file.id
        }));
        
        setFilePreviews(prev => [...prev, ...newFilePreviews]);
        
        // Message de succès
        Swal.fire({
            icon: 'success',
            title: 'Fichiers ajoutés',
            text: `${uploadedFiles.length} fichier(s) ajouté(s) avec succès`,
            timer: 2000,
            showConfirmButton: false
        });
        
        // Fermer le modal
        setShowFileUploadModal(false);
        
        // Si c'est un nouveau document, appeler onSuccess
        if (!isEditing && onSuccess) {
            setTimeout(() => {
                onSuccess();
            }, 500);
        }
    };

    // Fonction appelée quand on annule l'upload des fichiers
    const handleFilesUploadCancel = () => {
        setShowFileUploadModal(false);
        
        // Si c'est un nouveau document et on annule l'upload, on revient à la liste
        if (!isEditing) {
            Swal.fire({
                title: 'Document créé sans fichiers',
                text: 'Le document a été créé mais aucun fichier n\'a été ajouté.',
                icon: 'info',
                confirmButtonText: 'OK'
            }).then(() => {
                if (onSuccess) onSuccess();
            });
        }
    };

    const handleRemoveFile = async (index) => {
        const fileToRemove = filePreviews[index];
        
        Swal.fire({
            title: 'Supprimer ce fichier ?',
            text: `Êtes-vous sûr de vouloir supprimer "${fileToRemove.name}" ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Si c'est un fichier existant, appeler l'API pour le supprimer
                if (fileToRemove.fileId && createdDocumentId) {
                    try {
                        await axios.delete(
                            `${API_BASE_URL}/documents/${createdDocumentId}/files/${fileToRemove.fileId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        );
                    } catch (error) {
                        console.error("Erreur lors de la suppression du fichier:", error);
                    }
                }
                
                // Retirer le fichier de l'interface
                setFilePreviews(prev => prev.filter((_, i) => i !== index));
                setFiles(prev => prev.filter((_, i) => i !== index));
            }
        });
    };

    const handlePreviewFile = (file) => {
        if (file.preview) {
            window.open(file.preview, '_blank');
        } else if (file.fileObject) {
            const blobURL = URL.createObjectURL(file.fileObject);
            window.open(blobURL, '_blank');
            setTimeout(() => URL.revokeObjectURL(blobURL), 1000);
        }
    };

    const getFieldLabel = (field) => {
        const labels = {
            id_direction: 'Direction',
            id_emplacement: 'Emplacement',
            id_classeur: 'Classeur',
            date_creation: 'Date de création',
            date_enregistrement: 'Date d\'enregistrement',
            intitule: 'Intitulé',
            num_reference: 'Numéro de référence',
            mot_cle: 'Mot clé',
            num_declaration: 'Numéro de déclaration'
        };
        return labels[field] || field;
    };

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const setToday = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: getTodayDate()
        }));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Sections du formulaire
    const sections = [
        { id: 1, title: "Informations principales", icon: <FaBuilding /> },
        { id: 2, title: "Dates et intitulé", icon: <FaCalendarAlt /> },
        { id: 3, title: "Références", icon: <FaHashtag /> }
    ];

    return (
        <div className="container-fluid px-0">
            {/* Modal d'upload de fichiers */}
        
{showFileUploadModal && createdDocumentId && (
    <FileUploadModal
        documentId={createdDocumentId}
        id_classeur={formData.id_classeur} // ← Ajoutez cette ligne
        onClose={handleFilesUploadCancel}
        onUploadComplete={handleFilesUploadComplete}
        token={token}
        existingFiles={filePreviews}
    />
)}

            {/* En-tête fixe */}
            <div className="sticky-top bg-white shadow-sm border-bottom">
                <div className="container-fluid py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-0 font-weight-bold text-primary">
                                <FaFileAlt className="mr-2" />
                                {isEditing ? "Modifier le Document" : "Nouveau Document"}
                            </h4>
                            <small className="text-muted">
                                {isEditing 
                                    ? "Modifiez les informations du document" 
                                    : "Remplissez le formulaire pour ajouter un nouveau document"}
                            </small>
                        </div>
                        <div className="d-flex align-items-center">
                            {!documentSubmitted && (
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={onCancel}
                                    disabled={loading}
                                >
                                    <FaTimes className="mr-2" /> Annuler
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Navigation entre sections */}
                    <div className="mt-3 d-none d-md-block">
                        <div className="d-flex justify-content-center">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    type="button"
                                    className={`btn mx-2 ${activeSection === section.id ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setActiveSection(section.id)}
                                    disabled={loading || documentSubmitted}
                                >
                                    <span className="d-flex align-items-center">
                                        {section.icon}
                                        <span className="ml-2">{section.title}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Indicateur de progression */}
                    <div className="mt-3">
                        <div className="progress" style={{ height: '6px' }}>
                            <div
                                className="progress-bar bg-success"
                                style={{ width: `${(activeSection / sections.length) * 100}%` }}
                                role="progressbar"
                            ></div>
                        </div>
                        <div className="text-center small text-muted mt-1">
                            Étape {activeSection} sur {sections.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu du formulaire */}
            <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 150px)' }}>
                <div className="row">
                    <div className="col-12">
                        <form id="documentForm" onSubmit={handleSubmit}>
                            {/* Section 1: Informations principales */}
                            {activeSection === 1 && (
                                <div className="animate-section">
                                    <div className="card border-0 shadow">
                                        <div className="card-body p-4">
                                            <h5 className="text-primary mb-4">
                                                <FaBuilding className="mr-2" /> Informations principales
                                            </h5>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <div className="form-group">
                                                        <label className="font-weight-bold">
                                                            Direction <span className="text-danger">*</span>
                                                        </label>
                                                        <select
                                                            name="id_direction"
                                                            value={formData.id_direction}
                                                            onChange={handleChange}
                                                            className={`form-control ${errors.id_direction ? 'is-invalid' : ''}`}
                                                            disabled={loading || documentSubmitted}
                                                        >
                                                            <option value="">Sélectionnez une direction</option>
                                                            {directions.map(dir => (
                                                                <option key={dir.id} value={dir.id}>{dir.nom}</option>
                                                            ))}
                                                        </select>
                                                        {errors.id_direction && (
                                                            <div className="invalid-feedback">{errors.id_direction[0]}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="col-md-6 mb-3">
                                                    <div className="form-group">
                                                        <label className="font-weight-bold">
                                                            Emplacement <span className="text-danger">*</span>
                                                        </label>
                                                        <select
                                                            name="id_emplacement"
                                                            value={formData.id_emplacement}
                                                            onChange={handleChange}
                                                            className={`form-control ${errors.id_emplacement ? 'is-invalid' : ''}`}
                                                            disabled={loading || documentSubmitted}
                                                        >
                                                            <option value="">Sélectionnez un emplacement</option>
                                                            {emplacements.map(emp => (
                                                                <option key={emp.id} value={emp.id}>{emp.nom_emplacement}</option>
                                                            ))}
                                                        </select>
                                                        {errors.id_emplacement && (
                                                            <div className="invalid-feedback">{errors.id_emplacement[0]}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="col-md-6 mb-3">
                                                    <div className="form-group">
                                                        <label className="font-weight-bold">
                                                            Classeur <span className="text-danger">*</span>
                                                        </label>
                                                        <select
                                                            name="id_classeur"
                                                            value={formData.id_classeur}
                                                            onChange={handleChange}
                                                            className={`form-control ${errors.id_classeur ? 'is-invalid' : ''}`}
                                                            disabled={loading || documentSubmitted}
                                                        >
                                                            <option value="">Sélectionnez un classeur</option>
                                                            {classeurs.map(cl => (
                                                                <option key={cl.id} value={cl.id}>{cl.nom_classeur}</option>
                                                            ))}
                                                        </select>
                                                        {errors.id_classeur && (
                                                            <div className="invalid-feedback">{errors.id_classeur[0]}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="col-md-6 mb-3">
                                                    <div className="form-group">
                                                        <label className="font-weight-bold">
                                                            <FaUser className="mr-2" /> Utilisateur
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={utilisateur?.nom || "Non connecté"}
                                                            readOnly
                                                            disabled
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section 2: Dates et intitulé */}
                            {activeSection === 2 && (
                                <div className="animate-section">
                                    <div className="card border-0 shadow">
                                        <div className="card-body p-4">
                                            <h5 className="text-primary mb-4">
                                                <FaCalendarAlt className="mr-2" /> Dates et intitulé
                                            </h5>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <div className="form-group">
                                                        <label className="font-weight-bold">
                                                            Date de création <span className="text-danger">*</span>
                                                        </label>
                                                        <div className="input-group">
                                                            <input
                                                                type="date"
                                                                name="date_creation"
                                                                value={formData.date_creation}
                                                                onChange={handleChange}
                                                                className={`form-control ${errors.date_creation ? 'is-invalid' : ''}`}
                                                                max={getTodayDate()}
                                                                disabled={loading || documentSubmitted}
                                                            />
                                                            <div className="input-group-append">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-secondary"
                                                                    onClick={() => setToday('date_creation')}
                                                                    disabled={loading || documentSubmitted}
                                                                >
                                                                    Aujourd'hui
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {errors.date_creation && (
                                                            <div className="invalid-feedback">{errors.date_creation[0]}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="col-md-6 mb-3">
                                                    <div className="form-group">
                                                        <label className="font-weight-bold">
                                                            Date d'enregistrement <span className="text-danger">*</span>
                                                        </label>
                                                        <div className="input-group">
                                                            <input
                                                                type="date"
                                                                name="date_enregistrement"
                                                                value={formData.date_enregistrement}
                                                                onChange={handleChange}
                                                                className={`form-control ${errors.date_enregistrement ? 'is-invalid' : ''}`}
                                                                max={getTodayDate()}
                                                                disabled={loading || documentSubmitted}
                                                            />
                                                            <div className="input-group-append">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-secondary"
                                                                    onClick={() => setToday('date_enregistrement')}
                                                                    disabled={loading || documentSubmitted}
                                                                >
                                                                    Aujourd'hui
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {errors.date_enregistrement && (
                                                            <div className="invalid-feedback">{errors.date_enregistrement[0]}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="col-md-12 mb-3">
                                                    <div className="form-group">
                                                        <label className="font-weight-bold">
                                                            <FaFileAlt className="mr-2" /> Intitulé <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            name="intitule"
                                                            placeholder="Ex: Contrat de travail, Facture n°123..."
                                                            value={formData.intitule}
                                                            onChange={handleChange}
                                                            className={`form-control ${errors.intitule ? 'is-invalid' : ''}`}
                                                            disabled={loading || documentSubmitted}
                                                        />
                                                        {errors.intitule && (
                                                            <div className="invalid-feedback">{errors.intitule[0]}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section 3: Références */}
                            {activeSection === 3 && (
                                <div className="animate-section">
                                    <div className="card border-0 shadow">
                                        <div className="card-body p-4">
                                            <h5 className="text-primary mb-4">
                                                <FaHashtag className="mr-2" /> Références
                                            </h5>
                                            <div className="row">
                                                <div className="col-md-4 mb-3">
                                                    <div className="form-group">
                                                        <label className="font-weight-bold">
                                                            Numéro Référence <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            name="num_reference"
                                                            placeholder="REF-0001"
                                                            value={formData.num_reference}
                                                            onChange={handleChange}
                                                            className={`form-control ${errors.num_reference ? 'is-invalid' : ''}`}
                                                            disabled={loading || documentSubmitted}
                                                        />
                                                        {errors.num_reference && (
                                                            <div className="invalid-feedback">{errors.num_reference[0]}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="col-md-4 mb-3">
                                                    <div className="form-group">
                                                        <label className="font-weight-bold">
                                                            Mot Clé <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            name="mot_cle"
                                                            placeholder="Ex: Contrat, Facture..."
                                                            value={formData.mot_cle}
                                                            onChange={handleChange}
                                                            className={`form-control ${errors.mot_cle ? 'is-invalid' : ''}`}
                                                            disabled={loading || documentSubmitted}
                                                        />
                                                        {errors.mot_cle && (
                                                            <div className="invalid-feedback">{errors.mot_cle[0]}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="col-md-4 mb-3">
                                                    <div className="form-group">
                                                        <label className="font-weight-bold">
                                                            Numéro Déclaration <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            name="num_declaration"
                                                            placeholder="DEC-2023-001"
                                                            value={formData.num_declaration}
                                                            onChange={handleChange}
                                                            className={`form-control ${errors.num_declaration ? 'is-invalid' : ''}`}
                                                            disabled={loading || documentSubmitted}
                                                        />
                                                        {errors.num_declaration && (
                                                            <div className="invalid-feedback">{errors.num_declaration[0]}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section fichiers (affichage seulement) */}
                            {documentSubmitted && filePreviews.length > 0 && (
                                <div className="animate-section mt-4">
                                    <div className="card border-0 shadow">
                                        <div className="card-body p-4">
                                            <h5 className="text-primary mb-4">
                                                <FaPaperclip className="mr-2" /> Fichiers attachés
                                            </h5>
                                            <div className="row">
                                                {filePreviews.map((file, index) => (
                                                    <div key={file.id} className="col-md-6 mb-3">
                                                        <div className="card file-card border-left-4 border-left-success">
                                                            <div className="card-body p-3">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <div className="d-flex align-items-center">
                                                                        <FaFilePdf className="text-danger mr-3" style={{ fontSize: '1.5rem' }} />
                                                                        <div>
                                                                            <div className="font-weight-bold text-truncate" style={{ maxWidth: '200px' }}>
                                                                                {file.name}
                                                                            </div>
                                                                            <div className="text-muted small">
                                                                                {file.size} • Ajouté à {file.uploadDate}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="btn-group">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-outline-info mr-2"
                                                                            onClick={() => handlePreviewFile(file)}
                                                                            title="Prévisualiser"
                                                                        >
                                                                            <FaEye />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-outline-danger"
                                                                            onClick={() => handleRemoveFile(index)}
                                                                            title="Supprimer"
                                                                        >
                                                                            <FaTrash />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {/* Barre d'actions fixe en bas */}
            <div className="fixed-bottom bg-white border-top shadow-lg py-3">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            {activeSection > 1 && !documentSubmitted && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-lg"
                                    onClick={() => setActiveSection(activeSection - 1)}
                                    disabled={loading || documentSubmitted}
                                >
                                    <FaArrowLeft className="mr-2" /> Précédent
                                </button>
                            )}
                        </div>

                        <div className="d-flex align-items-center">
                            <div className="mr-4">
                                <small className="text-muted">
                                    <span className="text-danger font-weight-bold">*</span> Champs obligatoires
                                </small>
                            </div>

                            {!documentSubmitted ? (
                                activeSection < sections.length ? (
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-lg"
                                        onClick={() => setActiveSection(activeSection + 1)}
                                        disabled={loading || documentSubmitted}
                                    >
                                        Suivant <FaArrowRight className="ml-2" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn btn-success btn-lg px-5"
                                        disabled={loading || documentSubmitted}
                                        onClick={() => {
                                            document.getElementById('documentForm')?.requestSubmit();
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm mr-2" />
                                                Enregistrement...
                                            </>
                                        ) : isEditing ? (
                                            <>
                                                <FaSave className="mr-2" /> Enregistrer les modifications
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle className="mr-2" /> Créer le document
                                            </>
                                        )}
                                    </button>
                                )
                            ) : (
                                <div className="d-flex align-items-center">
                                    <span className="badge badge-success badge-pill mr-3 p-2">
                                        <FaCheckCircle className="mr-1" /> Document enregistré
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={() => setShowFileUploadModal(true)}
                                    >
                                        <FaPaperclip className="mr-2" /> Ajouter d'autres fichiers
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Style CSS */}
            <style jsx>{`
                .animate-section {
                    animation: fadeIn 0.3s ease-in-out;
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .file-card {
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }
                
                .file-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
                
                .border-left-4 {
                    border-left-width: 4px !important;
                }
                
                .sticky-top {
                    z-index: 1020;
                }
                
                .fixed-bottom {
                    z-index: 1030;
                }
            `}</style>
        </div>
    );
};

export default FormDocument;