import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import {
    FaSave,
    FaTimes,
    FaArrowLeft,
    FaArrowRight,
    FaCheckCircle,
    FaPaperclip,
    FaFileAlt,
    FaCalendarAlt,
    FaHashtag,
    FaBuilding,
    FaUser,
    FaMapMarkerAlt,
    FaFolder,
    FaEye,
    FaFilePdf,
    FaTrash
} from 'react-icons/fa';
import FileUploadModal from "../Modals/FileUploadModal";
import Droplist from "../Composant/DropList ";
import Input from "../Composant/Input";

const FormNote = ({
    isEditing = false,
    noteToEdit = null,
    onCancel,
    onSuccess,
    directions = [],
    classeurs = [],
    centres = [],
    emplacements = []
}) => {
    const token = GetTokenOrRedirect();
    const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
    const id_user = utilisateur?.id || "";

    const [formData, setFormData] = useState({
        id_ministere: "",
        numero_serie: "",
        date_ordonnancement: "",
        date_enregistrement: "",
        id_classeur: "",
        id_user: id_user,
        id_centre_ordonnancement: "",
        id_assujetti: "",
        id_emplacement: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [filePreviews, setFilePreviews] = useState([]);
    const [activeSection, setActiveSection] = useState(1);
    
    // États pour le modal d'upload
    const [showFileUploadModal, setShowFileUploadModal] = useState(false);
    const [createdNoteId, setCreatedNoteId] = useState(null);
    const [noteSubmitted, setNoteSubmitted] = useState(false);
    const [selectedNom, setSelectedNom] = useState(null);
    
    // Modal pour sélectionner l'assujetti
    const [showAssujettiModal, setShowAssujettiModal] = useState(false);

    // Initialiser les données
    useEffect(() => {
        if (isEditing && noteToEdit) {
            const data = {
                id_ministere: noteToEdit.id_ministere ? noteToEdit.id_ministere.toString() : "",
                numero_serie: noteToEdit.numero_serie || "",
                date_ordonnancement: noteToEdit.date_ordonnancement ?
                    (noteToEdit.date_ordonnancement.split('T')[0] || "") : "",
                date_enregistrement: noteToEdit.date_enregistrement ?
                    (noteToEdit.date_enregistrement.split('T')[0] || "") : "",
                id_classeur: noteToEdit.id_classeur ? noteToEdit.id_classeur.toString() : "",
                id_user: id_user,
                id_centre_ordonnancement: noteToEdit.id_centre_ordonnancement ? 
                    noteToEdit.id_centre_ordonnancement.toString() : "",
                id_assujetti: noteToEdit.id_assujetti ? noteToEdit.id_assujetti.toString() : "",
                id_emplacement: noteToEdit.id_emplacement ? noteToEdit.id_emplacement.toString() : "",
            };
            
            setFormData(data);
            
            // Récupérer le nom de l'assujetti
            if (noteToEdit.assujetti) {
                setSelectedNom({
                    id: noteToEdit.id_assujetti,
                    nom_raison_sociale: noteToEdit.assujetti.nom_raison_sociale
                });
            }
            
            // Charger les fichiers existants
            if (noteToEdit.id) {
                fetchExistingFiles(noteToEdit.id);
            }
        } else {
            setFormData({
                id_ministere: "",
                numero_serie: "",
                date_ordonnancement: "",
                date_enregistrement: "",
                id_classeur: "",
                id_user: id_user,
                id_centre_ordonnancement: "",
                id_assujetti: "",
                id_emplacement: "",
            });
            setSelectedNom(null);
        }

        setErrors({});
        setFilePreviews([]);
        setNoteSubmitted(false);
        setCreatedNoteId(null);
    }, [noteToEdit, id_user, isEditing]);

    // Récupérer les fichiers existants
    const fetchExistingFiles = async (noteId) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/documents/${noteId}/files`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data && response.data.files) {
                const existingFilesPreviews = response.data.files.map(file => ({
                    id: file.id,
                    name: file.original_name,
                    size: formatFileSize(file.size),
                    preview: file.url,
                    uploadDate: new Date(file.created_at).toLocaleTimeString('fr-FR'),
                    status: 'existing',
                    fileId: file.id
                }));
                setFilePreviews(existingFilesPreviews);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des fichiers:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const selectAssujetti = (assujetti) => {
        setSelectedNom(assujetti);
        setFormData(prev => ({ ...prev, id_assujetti: assujetti.id }));
        setShowAssujettiModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            Swal.fire('Erreur', 'Session expirée', 'error');
            return;
        }

        // Vérification de l'assujetti
        if (!selectedNom) {
            Swal.fire({
                icon: 'error',
                title: 'Assujetti manquant',
                text: 'Veuillez sélectionner un assujetti'
            });
            return;
        }

        // Validation des champs obligatoires
        const validationErrors = {};
        const requiredFields = [
            'id_ministere', 'numero_serie', 'date_ordonnancement',
            'date_enregistrement', 'id_classeur', 'id_centre_ordonnancement',
            'id_emplacement'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                validationErrors[field] = ['Ce champ est obligatoire'];
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            Swal.fire({
                icon: 'error',
                title: 'Champs obligatoires',
                text: 'Veuillez remplir tous les champs obligatoires'
            });
            return;
        }

        setLoading(true);

        try {
            let response;
            const dataToSend = {
                ...formData,
                id_ministere: parseInt(formData.id_ministere),
                id_classeur: parseInt(formData.id_classeur),
                id_centre_ordonnancement: parseInt(formData.id_centre_ordonnancement),
                id_assujetti: parseInt(selectedNom.id),
                id_emplacement: parseInt(formData.id_emplacement),
                id_user: parseInt(id_user)
            };

            if (isEditing) {
                response = await axios.put(
                    `${API_BASE_URL}/notes/${noteToEdit.id}`,
                    dataToSend,
                    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                );
                setCreatedNoteId(noteToEdit.id);
            } else {
                response = await axios.post(
                    `${API_BASE_URL}/notes`,
                    dataToSend,
                    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                );
                setCreatedNoteId(response.data.id);
            }

            setNoteSubmitted(true);
            setShowFileUploadModal(true);

            Swal.fire({
                icon: 'success',
                title: isEditing ? 'Note modifiée !' : 'Note créée !',
                text: 'Vous pouvez maintenant ajouter des fichiers',
                timer: 3000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error('Erreur:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                
                let errorMessage = 'Veuillez corriger les erreurs :<br><ul>';
                Object.keys(error.response.data.errors).forEach(field => {
                    errorMessage += `<li><strong>${getFieldLabel(field)}</strong>: ${error.response.data.errors[field].join(', ')}</li>`;
                });
                errorMessage += '</ul>';
                
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur de validation',
                    html: errorMessage
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: error.response?.data?.message || 'Une erreur est survenue'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFilesUploadComplete = (uploadedFiles) => {
        const newFilePreviews = uploadedFiles.map(file => ({
            id: file.id || Date.now(),
            name: file.name,
            size: formatFileSize(file.size),
            preview: file.url,
            uploadDate: new Date().toLocaleTimeString('fr-FR'),
            status: 'uploaded',
            fileId: file.id
        }));
        
        setFilePreviews(prev => [...prev, ...newFilePreviews]);
        
        Swal.fire({
            icon: 'success',
            title: 'Fichiers ajoutés',
            text: `${uploadedFiles.length} fichier(s) ajouté(s)`,
            timer: 2000,
            showConfirmButton: false
        });
        
        setShowFileUploadModal(false);
        
        if (!isEditing && onSuccess) {
            setTimeout(() => onSuccess(), 500);
        }
    };

    const handleFilesUploadCancel = () => {
        setShowFileUploadModal(false);
        if (!isEditing) {
            Swal.fire({
                title: 'Note créée sans fichiers',
                text: 'La note a été créée mais aucun fichier n\'a été ajouté',
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
                if (fileToRemove.fileId && createdNoteId) {
                    try {
                        await axios.delete(
                            `${API_BASE_URL}/documents/${createdNoteId}/files/${fileToRemove.fileId}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                    } catch (error) {
                        console.error("Erreur lors de la suppression:", error);
                    }
                }
                setFilePreviews(prev => prev.filter((_, i) => i !== index));
            }
        });
    };

    const handlePreviewFile = (file) => {
        if (file.preview) {
            window.open(file.preview, '_blank');
        }
    };

    const getFieldLabel = (field) => {
        const labels = {
            id_ministere: 'Service d\'Assiette',
            numero_serie: 'Numéro de série',
            date_ordonnancement: "Date d'ordonnancement",
            date_enregistrement: "Date d'enregistrement",
            id_classeur: 'Classeur',
            id_centre_ordonnancement: 'Centre d\'ordonnancement',
            id_assujetti: 'Assujetti',
            id_emplacement: 'Emplacement'
        };
        return labels[field] || field;
    };

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const setToday = (field) => {
        setFormData(prev => ({ ...prev, [field]: getTodayDate() }));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const sections = [
        { id: 1, title: "Informations principales", icon: <FaBuilding /> },
        { id: 2, title: "Dates et références", icon: <FaCalendarAlt /> }
    ];

    return (
        <div className="container-fluid px-0">
            {/* Modal d'upload */}
            {showFileUploadModal && createdNoteId && (
                <FileUploadModal
                    documentId={createdNoteId}
                    id_classeur={formData.id_classeur}
                    onClose={handleFilesUploadCancel}
                    onUploadComplete={handleFilesUploadComplete}
                    token={token}
                    existingFiles={filePreviews}
                />
            )}

            {/* Modal Assujetti (à créer si nécessaire) */}
            {/* <ModalAssujetti 
                isOpen={showAssujettiModal} 
                selectnom={selectAssujetti} 
                onClose={() => setShowAssujettiModal(false)} 
            /> */}

            {/* En-tête fixe */}
            <div className="sticky-top bg-white shadow-sm border-bottom">
                <div className="container-fluid py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-0 font-weight-bold text-primary">
                                <FaFileAlt className="mr-2" />
                                {isEditing ? "Modifier la Note" : "Nouvelle Note de Perception"}
                            </h4>
                            <small className="text-muted">
                                {isEditing 
                                    ? "Modifiez les informations de la note" 
                                    : "Remplissez le formulaire pour ajouter une nouvelle note"}
                            </small>
                        </div>
                        <div>
                            {!noteSubmitted && (
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

                    {/* Navigation */}
                    <div className="mt-3">
                        <div className="d-flex justify-content-center">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    type="button"
                                    className={`btn mx-2 ${activeSection === section.id ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setActiveSection(section.id)}
                                    disabled={loading || noteSubmitted}
                                >
                                    <span className="d-flex align-items-center">
                                        {section.icon}
                                        <span className="ml-2">{section.title}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Progression */}
                    <div className="mt-3">
                        <div className="progress" style={{ height: '6px' }}>
                            <div
                                className="progress-bar bg-success"
                                style={{ width: `${(activeSection / sections.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu du formulaire */}
            <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 150px)' }}>
                <form id="noteForm" onSubmit={handleSubmit}>
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
                                                    Service d'Assiette <span className="text-danger">*</span>
                                                </label>
                                                <Droplist
                                                    name="id_ministere"
                                                    value={formData.id_ministere}
                                                    onChange={handleChange}
                                                    options={directions}
                                                    placeholder="-- Sélectionnez un service d'assiette --"
                                                    error={errors.id_ministere && errors.id_ministere[0]}
                                                    disabled={loading || noteSubmitted}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label className="font-weight-bold">
                                                    Numéro Série <span className="text-danger">*</span>
                                                </label>
                                                <Input
                                                    name="numero_serie"
                                                    placeholder="Ex: NS-2024-001"
                                                    value={formData.numero_serie}
                                                    onChange={handleChange}
                                                    icon="fas fa-hashtag"
                                                    error={errors.numero_serie && errors.numero_serie[0]}
                                                    disabled={loading || noteSubmitted}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label className="font-weight-bold">
                                                    Classeur <span className="text-danger">*</span>
                                                </label>
                                                <Droplist
                                                    name="id_classeur"
                                                    value={formData.id_classeur}
                                                    onChange={handleChange}
                                                    options={classeurs}
                                                    placeholder="-- Sélectionnez un classeur --"
                                                    error={errors.id_classeur && errors.id_classeur[0]}
                                                    disabled={loading || noteSubmitted}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label className="font-weight-bold">
                                                    Centre d'Ordonnancement <span className="text-danger">*</span>
                                                </label>
                                                <Droplist
                                                    name="id_centre_ordonnancement"
                                                    value={formData.id_centre_ordonnancement}
                                                    onChange={handleChange}
                                                    options={centres}
                                                    placeholder="-- Sélectionnez un centre d'ordonnancement --"
                                                    error={errors.id_centre_ordonnancement && errors.id_centre_ordonnancement[0]}
                                                    disabled={loading || noteSubmitted}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label className="font-weight-bold">
                                                    Assujetti <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={selectedNom ? selectedNom.nom_raison_sociale : ''}
                                                        placeholder="Sélectionnez un assujetti"
                                                        disabled
                                                    />
                                                    <div className="input-group-append">
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-primary"
                                                            onClick={() => setShowAssujettiModal(true)}
                                                            disabled={loading || noteSubmitted}
                                                        >
                                                            Choisir
                                                        </button>
                                                    </div>
                                                </div>
                                                {errors.id_assujetti && (
                                                    <div className="text-danger small mt-1">{errors.id_assujetti[0]}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label className="font-weight-bold">
                                                    Emplacement <span className="text-danger">*</span>
                                                </label>
                                                <Droplist
                                                    name="id_emplacement"
                                                    value={formData.id_emplacement}
                                                    onChange={handleChange}
                                                    options={emplacements}
                                                    placeholder="-- Sélectionnez un emplacement --"
                                                    error={errors.id_emplacement && errors.id_emplacement[0]}
                                                    disabled={loading || noteSubmitted}
                                                />
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

                    {/* Section 2: Dates */}
                    {activeSection === 2 && (
                        <div className="animate-section">
                            <div className="card border-0 shadow">
                                <div className="card-body p-4">
                                    <h5 className="text-primary mb-4">
                                        <FaCalendarAlt className="mr-2" /> Dates
                                    </h5>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <div className="form-group">
                                                <label className="font-weight-bold">
                                                    Date d'ordonnancement <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <input
                                                        type="date"
                                                        name="date_ordonnancement"
                                                        value={formData.date_ordonnancement}
                                                        onChange={handleChange}
                                                        className={`form-control ${errors.date_ordonnancement ? 'is-invalid' : ''}`}
                                                        // SUPPRIMÉ: max={getTodayDate()}
                                                        disabled={loading || noteSubmitted}
                                                    />
                                                    <div className="input-group-append">
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => setToday('date_ordonnancement')}
                                                            disabled={loading || noteSubmitted}
                                                        >
                                                            Aujourd'hui
                                                        </button>
                                                    </div>
                                                </div>
                                                {errors.date_ordonnancement && (
                                                    <div className="invalid-feedback">{errors.date_ordonnancement[0]}</div>
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
                                                        // SUPPRIMÉ: max={getTodayDate()}
                                                        disabled={loading || noteSubmitted}
                                                    />
                                                    <div className="input-group-append">
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => setToday('date_enregistrement')}
                                                            disabled={loading || noteSubmitted}
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
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fichiers attachés */}
                    {noteSubmitted && filePreviews.length > 0 && (
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
                                                                        {file.size} • {file.uploadDate}
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

            {/* Barre d'actions fixe */}
            <div className="fixed-bottom bg-white border-top shadow-lg py-3">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            {activeSection > 1 && !noteSubmitted && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-lg"
                                    onClick={() => setActiveSection(activeSection - 1)}
                                    disabled={loading || noteSubmitted}
                                >
                                    <FaArrowLeft className="mr-2" /> Précédent
                                </button>
                            )}
                        </div>

                        <div className="d-flex align-items-center">
                            {!noteSubmitted ? (
                                activeSection < sections.length ? (
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-lg"
                                        onClick={() => setActiveSection(activeSection + 1)}
                                        disabled={loading || noteSubmitted}
                                    >
                                        Suivant <FaArrowRight className="ml-2" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn btn-success btn-lg px-5"
                                        disabled={loading || noteSubmitted}
                                        onClick={() => document.getElementById('noteForm')?.requestSubmit()}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm mr-2" />
                                                Enregistrement...
                                            </>
                                        ) : isEditing ? (
                                            <>
                                                <FaSave className="mr-2" /> Enregistrer
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle className="mr-2" /> Créer la note
                                            </>
                                        )}
                                    </button>
                                )
                            ) : (
                                <div className="d-flex align-items-center">
                                    <span className="badge badge-success badge-pill mr-3 p-2">
                                        <FaCheckCircle className="mr-1" /> Note enregistrée
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={() => setShowFileUploadModal(true)}
                                    >
                                        <FaPaperclip className="mr-2" /> Ajouter des fichiers
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-section {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
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
                .sticky-top { z-index: 1020; }
                .fixed-bottom { z-index: 1030; }
            `}</style>
        </div>
    );
};

export default FormNote;