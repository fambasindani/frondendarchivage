import React, { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import scannerService from "../Composant/ScannerService ";
import {
    FaFilePdf,
    FaTrash,
    FaTimes,
    FaPrint,
    FaCloudUploadAlt,
    FaEye,
    FaSpinner,
    FaHistory,
    FaDownload,
    FaCog,
    FaBell,
    FaCheckCircle,
    FaExclamationTriangle,
    FaStopCircle
} from 'react-icons/fa';
import { API_BASE_URL } from "../config";

const FileUploadModal = ({
    documentId,
    onClose,
    token,
    id_classeur,
    nom_fichier
}) => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loadingExistingFiles, setLoadingExistingFiles] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showScannerConfig, setShowScannerConfig] = useState(false);
    const [scanInProgress, setScanInProgress] = useState(false);
    const [lastScanTime, setLastScanTime] = useState(null);
    const [scanTimeoutId, setScanTimeoutId] = useState(null);
    
    const scannerConfig = {
        apiUrl: API_BASE_URL,
        token: token,
        idDeclaration: documentId,
        idClasseur: id_classeur,
        nom_fichier: nom_fichier
    };

    const pollingIntervalRef = useRef(null);
    const scanSwalRef = useRef(null);
    const lastFileCountRef = useRef(0);
    const scanStartTimeRef = useRef(null);
    const scanSafetyTimeoutRef = useRef(null);

    // 🔹 DEBUG: Vérifier les props reçues
    useEffect(() => {
        console.log("=== FILE UPLOAD MODAL PROPS ===");
        console.log("documentId:", documentId);
        console.log("id_classeur:", id_classeur);
        console.log("token présent:", !!token);
    }, [documentId, id_classeur, token]);

    // 🔹 Charger les fichiers existants au démarrage
    useEffect(() => {
        if (documentId && token) {
            fetchExistingFiles();
            startPolling();
        }

        // Nettoyage à la fermeture
        return () => {
            stopPolling();
            clearAllTimeouts();
        };
    }, [documentId, token]);

    // 🔹 Nettoyer tous les timeouts
    const clearAllTimeouts = () => {
        if (scanSafetyTimeoutRef.current) {
            clearTimeout(scanSafetyTimeoutRef.current);
            scanSafetyTimeoutRef.current = null;
        }
    };

    // 🔹 Démarrer le polling pour vérifier les nouveaux fichiers
    const startPolling = () => {
        stopPolling(); // S'assurer qu'il n'y a pas de doublon
        
        pollingIntervalRef.current = setInterval(() => {
            fetchExistingFiles();
        }, 3000); // Vérifier toutes les 3 secondes
        
        console.log("🔁 Polling démarré");
    };

    // 🔹 Arrêter le polling
    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            console.log("🛑 Polling arrêté");
        }
    };

    // 🔹 Charger les fichiers existants depuis l'API
    const fetchExistingFiles = async () => {
        try {
            const res = await axios.get(
                `${API_BASE_URL}/documents/${documentId}`,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    } 
                }
            );
            
            if (res.data && Array.isArray(res.data)) {
                const newFiles = res.data.map(f => ({
                    id: f.id,
                    nom: f.nom_native || f.nom_fichier || f.nom || 'Sans nom',
                    url: `${API_BASE_URL}/documents-declaration/download/${f.id}`,
                    created_at: f.created_at || f.upload_date || new Date().toISOString(),
                    size: f.taille || f.size || 0,
                    type: f.type || 'application/pdf'
                }));

                // Trier par date de création (plus récent en premier)
                newFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                // Vérifier si des nouveaux fichiers sont arrivés
                const currentCount = uploadedFiles.length;
                const newCount = newFiles.length;
                
                if (newCount > currentCount) {
                    const addedFiles = newFiles.slice(0, newCount - currentCount);
                    console.log(`🎉 ${addedFiles.length} nouveau(x) fichier(s) détecté(s) !`);
                    
                    // Si un scan était en cours, le terminer
                    if (scanInProgress) {
                        completeScan(addedFiles.length);
                    }
                }

                // Mettre à jour la liste des fichiers
                setUploadedFiles(newFiles);
                lastFileCountRef.current = newCount;
                
                // Marquer le chargement comme terminé
                if (loadingExistingFiles) {
                    setLoadingExistingFiles(false);
                }
            }
        } catch (err) {
            console.error("❌ Erreur chargement fichiers:", err);
            
            if (loadingExistingFiles) {
                setLoadingExistingFiles(false);
            }
        }
    };

    // 🔹 Terminer un scan avec succès
    const completeScan = (filesCount) => {
        console.log(`✅ Scan terminé avec ${filesCount} fichier(s)`);
        
        setScanInProgress(false);
        setLastScanTime(new Date());
        
        // Fermer la notification de scan si elle existe
        if (scanSwalRef.current) {
            scanSwalRef.current.close();
            scanSwalRef.current = null;
        }
        
        // Nettoyer le timeout de sécurité
        clearAllTimeouts();
        
        // Revenir au polling normal
        stopPolling();
        startPolling();
        
        // Afficher une notification de succès (optionnel, on peut laisser)
        Swal.fire({
            icon: 'success',
            title: 'Scan terminé !',
            text: `${filesCount} fichier(s) ajouté(s) avec succès`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
        });
    };

    // 🔹 Fonction pour uploader plusieurs fichiers
    const uploadMultipleFiles = async (files) => {
        if (!files.length || !documentId) return;
        
        const pdfFiles = files.filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Format invalide',
                text: 'Aucun fichier PDF dans la sélection',
            });
            return;
        }

        const formData = new FormData();
        pdfFiles.forEach(file => formData.append("files[]", file));
        formData.append("id_declaration", documentId);
        if (id_classeur) formData.append("id_classeur", id_classeur);

        try {
            setUploading(true);
            
            const swalInstance = Swal.fire({
                title: 'Upload en cours...',
                html: `
                    <div class="text-center">
                        <div class="spinner-border text-primary mb-2"></div>
                        <p class="mb-1">Upload de <strong>${pdfFiles.length} fichier(s)</strong></p>
                        <div class="small text-muted text-left mt-2">
                            ${pdfFiles.slice(0, 3).map(f => `<div>• ${f.name}</div>`).join('')}
                            ${pdfFiles.length > 3 ? `<div>... et ${pdfFiles.length - 3} autres</div>` : ''}
                        </div>
                    </div>
                `,
                allowOutsideClick: false,
                showConfirmButton: false,
                showCloseButton: false
            });

            const response = await axios.post(
                `${API_BASE_URL}/documents-declaration/upload-multiple`,
                formData,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            await swalInstance.close();

            if (response.data.success || response.data.documents) {
                const uploadedDocuments = response.data.documents || response.data.files || [];
                
                const newFiles = uploadedDocuments.map((doc, index) => ({
                    id: doc.id,
                    nom: doc.nom_native || doc.nom || pdfFiles[index]?.name || 'Sans nom',
                    url: `${API_BASE_URL}/documents-declaration/download/${doc.id}`,
                    created_at: doc.created_at || new Date().toISOString(),
                    size: doc.size || pdfFiles[index]?.size || 0,
                    type: doc.type || 'application/pdf'
                }));

                // Ajouter les nouveaux fichiers au début de la liste
                setUploadedFiles(prev => [...newFiles, ...prev]);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Succès!',
                    text: `${uploadedDocuments.length} fichier(s) uploadé(s) avec succès`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }

        } catch (err) {
            console.error("Erreur upload multiple:", err);
            
            let errorMessage = 'Échec lors de l\'upload des fichiers';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: errorMessage,
            });
        } finally {
            setUploading(false);
        }
    };

    // 🔹 Annuler un scan en cours
    const cancelScan = () => {
        Swal.fire({
            title: 'Annuler le scan ?',
            text: 'Êtes-vous sûr de vouloir annuler le scan en cours ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, annuler',
            cancelButtonText: 'Non, continuer',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                setScanInProgress(false);
                
                // Nettoyer le timeout de sécurité
                clearAllTimeouts();
                
                // Fermer la notification de scan
                if (scanSwalRef.current) {
                    scanSwalRef.current.close();
                    scanSwalRef.current = null;
                }
                
                // Revenir au polling normal
                stopPolling();
                startPolling();
                
                Swal.fire({
                    icon: 'info',
                    title: 'Scan annulé',
                    text: 'Le scan a été annulé',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    };

    // 🔹 Démarrer le scan avec le scanner Windows
    const handleStartScan = async () => {
        // Vérifier d'abord la connexion
        const connectionResult = await scannerService.testConnectionWithInstructions();
        
        if (!connectionResult.connected) {
            Swal.fire({
                icon: 'warning',
                title: connectionResult.title,
                html: connectionResult.instructions,
                confirmButtonText: 'Réessayer',
                showCancelButton: true,
                cancelButtonText: 'Configurer',
                showCloseButton: true
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await scannerService.checkConnection();
                    handleStartScan();
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    setShowScannerConfig(true);
                }
            });
            return;
        }

        // Vérifier les informations requises
        if (!scannerConfig.token || !scannerConfig.idDeclaration || !scannerConfig.idClasseur) {
            Swal.fire({
                icon: 'error',
                title: 'Configuration manquante',
                text: 'Veuillez remplir tous les champs requis',
            });
            return;
        }

        // Configurer le scanner
        const configSwal = Swal.fire({
            title: 'Configuration du scanner...',
            text: 'Envoi des paramètres au scanner',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => Swal.showLoading()
        });

        try {
            // 1. Envoyer l'URL de l'API
            const urlResult = await scannerService.setApiUrl(scannerConfig.apiUrl);
            if (!urlResult.success) {
                await configSwal.close();
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur configuration',
                    text: urlResult.message
                });
                return;
            }

            // 2. Envoyer les infos du document
            const infoResult = await scannerService.setDocumentInfo(
                scannerConfig.idDeclaration,
                scannerConfig.idClasseur,
                scannerConfig.token,
                scannerConfig.nom_fichier
            );
            
            if (!infoResult.success) {
                await configSwal.close();
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur configuration',
                    text: infoResult.message
                });
                return;
            }

            await configSwal.close();

            // 3. Demander confirmation
            const confirmResult = await Swal.fire({
                icon: 'question',
                title: 'Démarrer le scan ?',
                html: `
                    <div style="text-align: center;">
                        <p><strong>Document #${scannerConfig.idDeclaration}</strong></p>
                        <p><strong>Classeur #${scannerConfig.idClasseur}</strong></p>
                        <div class="alert alert-info mt-3">
                            <small>
                                <strong>⚠️ IMPORTANT :</strong><br>
                                • Laissez cette fenêtre ouverte<br>
                                • Les fichiers apparaîtront automatiquement<br>
                                • Pas besoin d'actualiser
                            </small>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Démarrer le scan',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33'
            });

            if (confirmResult.isConfirmed) {
                // 4. Démarrer le scan
                setScanInProgress(true);
                scanStartTimeRef.current = new Date();
                
                // Timeout de sécurité (3 minutes)
                scanSafetyTimeoutRef.current = setTimeout(() => {
                    if (scanInProgress) {
                        console.log("⚠️ Timeout de sécurité atteint");
                        setScanInProgress(false);
                        
                        // Fermer la notification de scan
                        if (scanSwalRef.current) {
                            scanSwalRef.current.close();
                            scanSwalRef.current = null;
                        }
                        
                        // Revenir au polling normal
                        stopPolling();
                        startPolling();
                        
                        Swal.fire({
                            icon: 'warning',
                            title: 'Scan interrompu',
                            text: 'Le scan a pris trop de temps. Vérifiez l\'application scanner.',
                            timer: 4000
                        });
                    }
                }, 180000); // 3 minutes

                // Augmenter la fréquence de vérification pendant le scan
                stopPolling();
                pollingIntervalRef.current = setInterval(() => {
                    fetchExistingFiles();
                }, 1500); // Vérifier toutes les 1.5 secondes pendant le scan

                const scanResult = await scannerService.startScan();
                
                if (scanResult.success) {
                    // Afficher la notification de scan
                    scanSwalRef.current = Swal.fire({
                        icon: 'info',
                        title: 'Scan démarré',
                        html: `
                            <div style="text-align: center;">
                                <div class="spinner-border text-primary mb-3"></div>
                                <p><strong>L'application scanner est ouverte.</strong></p>
                                <p class="text-muted small">Les fichiers apparaîtront automatiquement ici.</p>
                                <div class="mt-3">
                                    <button class="btn btn-sm btn-outline-danger" onclick="window.cancelCurrentScan()">
                                        <FaStopCircle class="mr-1" /> Annuler le scan
                                    </button>
                                </div>
                            </div>
                        `,
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        timer: 15000, // Fermer après 15 secondes
                        timerProgressBar: true,
                        willClose: () => {
                            scanSwalRef.current = null;
                        }
                    });
                } else {
                    // En cas d'erreur
                    clearAllTimeouts();
                    setScanInProgress(false);
                    stopPolling();
                    startPolling();
                    
                    Swal.fire({
                        icon: 'error',
                        title: 'Erreur',
                        text: scanResult.message || 'Impossible de démarrer le scan'
                    });
                }
            }

        } catch (error) {
            await Swal.close();
            clearAllTimeouts();
            setScanInProgress(false);
            stopPolling();
            startPolling();
            
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de communiquer avec le scanner'
            });
        }
    };

    // 🔹 Tester la connexion au scanner
    const testScannerConnection = async () => {
        const result = await scannerService.testConnectionWithInstructions();
        
        if (result.connected) {
            Swal.fire({
                icon: 'success',
                title: 'Scanner connecté !',
                html: `
                    <div style="text-align: center;">
                        <div class="alert alert-success">
                            <strong>Statut :</strong> Connecté<br>
                            <strong>Serveur :</strong> localhost:8081<br>
                            <strong>Surveillance active :</strong> Oui
                        </div>
                    </div>
                `,
                timer: 3000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'warning',
                title: result.title,
                html: result.instructions,
                confirmButtonText: 'Compris'
            });
        }
    };

    // 🔹 Supprimer un fichier
    const handleRemoveFile = async (fileId) => {
        const file = uploadedFiles.find(f => f.id === fileId);
        if (!file) return;

        const confirmed = await Swal.fire({
            title: `Supprimer le fichier ?`,
            html: `
                <div class="text-center">
                    <FaFilePdf className="text-danger mb-3" style="font-size: 3rem;" />
                    <p><strong>"${file.nom}"</strong></p>
                    <p class="small text-muted">Cette action est irréversible</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            reverseButtons: true
        });

        if (confirmed.isConfirmed) {
            try {
                await axios.delete(
                    `${API_BASE_URL}/delete-document/${fileId}`,
                    { 
                        headers: { 
                            'Authorization': `Bearer ${token}` 
                        } 
                    }
                );
                
                setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
                
                Swal.fire({
                    icon: 'success',
                    title: 'Supprimé!',
                    text: `"${file.nom}" a été supprimé avec succès`,
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err) {
                console.error("❌ Erreur suppression:", err);
                
                let errorMessage = 'Impossible de supprimer le fichier';
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: errorMessage,
                });
            }
        }
    };

    // 🔹 Drag & Drop
    const handleDragEnter = useCallback(e => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        if (!uploading) setIsDragging(true); 
    }, [uploading]);
    
    const handleDragLeave = useCallback(e => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        setIsDragging(false); 
    }, []);
    
    const handleDragOver = useCallback(e => { 
        e.preventDefault(); 
        e.stopPropagation(); 
    }, []);
    
    const handleDrop = useCallback(e => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const files = Array.from(e.dataTransfer.files);
        uploadMultipleFiles(files);
    }, [documentId, id_classeur, token]);

    // 🔹 Formatage de la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Date inconnue';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    // 🔹 Formatage de la taille
    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!documentId) {
        return (
            <div className="modal-backdrop fade show">
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">Erreur</h5>
                                <button type="button" className="close text-white" onClick={onClose}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body text-center py-5">
                                <FaTimes className="text-danger mb-3" style={{ fontSize: '3rem' }} />
                                <h5>Document non trouvé</h5>
                                <p className="text-muted">L'ID du document est manquant</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow-lg" style={{ maxHeight: '90vh' }}>
                        
                        <div className="modal-header bg-primary text-white sticky-top">
                            <div className="d-flex align-items-center">
                                <FaFilePdf className="mr-2" style={{ fontSize: '1.5rem' }} />
                                <div>
                                    <h5 className="modal-title mb-0">Fichiers PDF</h5>
                                    <small className="d-block">
                                        Document #{documentId} • Classeur: {id_classeur || 'N/A'}
                                        {scanInProgress && (
                                            <span className="ml-2 badge badge-warning">
                                                <FaSpinner className="fa-spin mr-1" /> Scan en cours...
                                            </span>
                                        )}
                                    </small>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                className="close text-white" 
                                onClick={onClose} 
                                disabled={uploading || scanInProgress}
                                style={{ opacity: (uploading || scanInProgress) ? 0.5 : 1 }}
                            >
                                <span>&times;</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Indicateur de scan en cours */}
                            {scanInProgress && (
                                <div className="alert alert-info d-flex align-items-center mb-3">
                                    <FaSpinner className="fa-spin mr-2" />
                                    <div className="flex-grow-1">
                                        <strong>Scan en cours...</strong>
                                        <small className="d-block text-muted">
                                            Les fichiers scannés apparaîtront automatiquement ici
                                        </small>
                                    </div>
                                    <button 
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={cancelScan}
                                    >
                                        <FaStopCircle className="mr-1" /> Annuler
                                    </button>
                                </div>
                            )}

                            {/* Section fichiers existants */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="font-weight-bold text-primary mb-0">
                                        <FaHistory className="mr-2" /> 
                                        Fichiers attachés ({uploadedFiles.length})
                                    </h6>
                                    <div>
                                        <button 
                                            className="btn btn-sm btn-outline-primary mr-2"
                                            onClick={fetchExistingFiles}
                                            disabled={loadingExistingFiles || uploading}
                                            title="Rafraîchir manuellement"
                                        >
                                            <FaSpinner className={loadingExistingFiles ? 'fa-spin mr-1' : ''} />
                                            Actualiser
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-info"
                                            onClick={testScannerConnection}
                                            title="Vérifier la connexion au scanner"
                                        >
                                            Tester connexion
                                        </button>
                                    </div>
                                </div>
                                
                                {loadingExistingFiles ? (
                                    <div className="text-center py-5">
                                        <FaSpinner className="fa-spin mr-2" style={{ fontSize: '2rem' }} />
                                        <p className="mt-2">Chargement des fichiers...</p>
                                    </div>
                                ) : uploadedFiles.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="thead-light">
                                                <tr>
                                                    <th style={{ width: '40%' }}>Nom du fichier</th>
                                                    <th>Taille</th>
                                                    <th>Date d'ajout</th>
                                                    <th style={{ width: '20%' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {uploadedFiles.map(file => (
                                                    <tr key={file.id}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <FaFilePdf className="text-danger mr-2" />
                                                                <span className="font-weight-bold text-truncate" style={{ maxWidth: '300px' }}>
                                                                    {file.nom}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge badge-light">
                                                                {formatFileSize(file.size)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <small className="text-muted">
                                                                {formatDate(file.created_at)}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <div className="btn-group btn-group-sm">
                                                                <button 
                                                                    className="btn btn-outline-info"
                                                                    onClick={() => window.open(file.url, '_blank')}
                                                                    title="Prévisualiser"
                                                                    disabled={uploading}
                                                                >
                                                                    <FaEye />
                                                                </button>
                                                                <button 
                                                                    className="btn btn-outline-success"
                                                                    onClick={() => window.open(file.url, '_blank')}
                                                                    title="Télécharger"
                                                                    disabled={uploading}
                                                                >
                                                                    <FaDownload />
                                                                </button>
                                                                <button 
                                                                    className="btn btn-outline-danger"
                                                                    onClick={() => handleRemoveFile(file.id)}
                                                                    title="Supprimer"
                                                                    disabled={uploading}
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        <div className="d-flex align-items-center">
                                            <FaFilePdf className="mr-3" style={{ fontSize: '1.5rem' }} />
                                            <div>
                                                <p className="mb-0">Aucun fichier PDF n'est attaché à ce document</p>
                                                <small className="text-muted">
                                                    Utilisez le formulaire ci-dessous pour ajouter des fichiers
                                                    {scanInProgress && " (scan en cours...)"}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section upload et scan */}
                            <div className="mb-4">
                                <h6 className="font-weight-bold mb-3 text-primary">
                                    <FaCloudUploadAlt className="mr-2" />
                                    Ajouter de nouveaux fichiers
                                </h6>
                                
                                <div
                                    className={`drop-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'disabled' : ''}`}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    style={{
                                        border: `3px dashed ${isDragging ? '#28a745' : uploading ? '#adb5bd' : '#007bff'}`,
                                        borderRadius: '12px',
                                        padding: '2rem',
                                        textAlign: 'center',
                                        backgroundColor: isDragging ? '#e8f5e9' : uploading ? '#f8f9fa' : '#f0f8ff',
                                        transition: 'all 0.3s ease',
                                        cursor: uploading ? 'not-allowed' : 'pointer',
                                        opacity: uploading ? 0.7 : 1
                                    }}
                                >
                                    <FaCloudUploadAlt 
                                        className="mb-3" 
                                        style={{ 
                                            fontSize: '3rem', 
                                            color: isDragging ? '#28a745' : uploading ? '#adb5bd' : '#007bff' 
                                        }} 
                                    />
                                    <h5 className="mb-2">
                                        {isDragging ? 'Lâchez les fichiers ici' : 'Glissez-déposez vos fichiers PDF'}
                                    </h5>
                                    <p className="text-muted mb-3">Taille maximale: 50MB par fichier • Formats acceptés: PDF uniquement</p>

                                    <div className="d-flex justify-content-center flex-wrap">
                                        <label className={`btn btn-primary btn-lg mr-3 mb-2 ${uploading ? 'disabled' : ''}`}>
                                            {uploading ? (
                                                <>
                                                    <FaSpinner className="fa-spin mr-2" />
                                                    Upload en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <FaFilePdf className="mr-2" />
                                                    Choisir des fichiers
                                                    <input 
                                                        type="file" 
                                                        multiple 
                                                        accept=".pdf,application/pdf" 
                                                        onChange={e => {
                                                            const files = Array.from(e.target.files);
                                                            if (files.length > 0) {
                                                                uploadMultipleFiles(files);
                                                            }
                                                            e.target.value = '';
                                                        }} 
                                                        style={{ display: 'none' }} 
                                                        disabled={uploading || scanInProgress}
                                                    />
                                                </>
                                            )}
                                        </label>

                                        <button 
                                            className="btn btn-warning btn-lg mb-2"
                                            onClick={handleStartScan}
                                            disabled={uploading || scanInProgress}
                                        >
                                            {scanInProgress ? (
                                                <>
                                                    <FaSpinner className="fa-spin mr-2" />
                                                    Scan en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <FaPrint className="mr-2" /> 
                                                    Scanner un document
                                                </>
                                            )}
                                        </button>

                                        <button 
                                            className="btn btn-outline-secondary btn-lg mb-2 ml-2"
                                            onClick={() => setShowScannerConfig(!showScannerConfig)}
                                            disabled={uploading || scanInProgress}
                                        >
                                            <FaCog className="mr-2" />
                                            Configurer
                                        </button>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <small className="text-muted">
                                            <FaBell className="mr-1" />
                                            <strong>Surveillance active :</strong> Les fichiers scannés apparaîtront automatiquement
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={uploading || scanInProgress}
                            >
                                Fermer
                            </button>
                            <button 
                                className="btn btn-success"
                                onClick={() => {
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Terminé!',
                                        text: `${uploadedFiles.length} fichier(s) attaché(s) au document`,
                                        timer: 1500
                                    }).then(() => onClose());
                                }}
                                disabled={uploading || scanInProgress}
                            >
                                Terminer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .modal-backdrop {
                    opacity: 0.5;
                }
                
                .drop-zone.dragging {
                    transform: scale(1.02);
                    box-shadow: 0 0 20px rgba(40, 167, 69, 0.2);
                }
                
                .drop-zone.disabled {
                    pointer-events: none;
                }
                
                .btn:disabled {
                    cursor: not-allowed;
                }
                
                .table td, .table th {
                    vertical-align: middle;
                }
                
                .modal-dialog-scrollable .modal-body {
                    max-height: calc(90vh - 200px);
                    overflow-y: auto;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .alert-success {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default FileUploadModal;