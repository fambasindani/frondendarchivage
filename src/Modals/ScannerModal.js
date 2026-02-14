import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { 
    FaPrint, 
    FaSpinner, 
    FaCheckCircle, 
    FaExclamationTriangle,
    FaTimes,
    FaFilePdf,
    FaEye,
    FaSync,
    FaSearch,
    FaPlug,
    FaCheck,
    FaExclamationCircle,
    FaTrash,
    FaDownload
} from 'react-icons/fa';

const ScannerModal = ({ onClose, onScanComplete }) => {
    const [scanning, setScanning] = useState(false);
    const [scannerStatus, setScannerStatus] = useState({
        serverConnected: false,
        scannerDetected: false,
        lastError: null
    });
    const [scanProgress, setScanProgress] = useState({
        percent: 0,
        message: "Initialisation..."
    });
    const [scannedPDFs, setScannedPDFs] = useState([]);
    const [selectedPDF, setSelectedPDF] = useState(null);
    const [loadingPDFs, setLoadingPDFs] = useState(false);

    // Constante pour le port
    const API_PORT = 5000;
    const BASE_URL = `http://localhost:${API_PORT}`;

    useEffect(() => {
        checkScannerStatus();
        fetchAvailableFiles(); // NOUVEAU: Charger les fichiers disponibles
        
        const interval = setInterval(() => {
            checkScannerStatus();
            fetchAvailableFiles(); // Rafraîchir périodiquement
        }, 10000);
        
        return () => {
            clearInterval(interval);
        };
    }, []);

    const checkScannerStatus = async () => {
        try {
            const healthResponse = await axios.get(`${BASE_URL}/health`, {
                timeout: 3000
            });
            
            let scannerDetected = false;
            try {
                const deviceResponse = await axios.get(`${BASE_URL}/scanner-device`, {
                    timeout: 3000
                });
                scannerDetected = deviceResponse.data.data?.hasScanner || false;
            } catch (deviceError) {
                console.log("Scanner device check failed:", deviceError.message);
            }
            
            setScannerStatus({
                serverConnected: true,
                scannerDetected: scannerDetected,
                lastError: null
            });
            
        } catch (error) {
            console.error(`❌ Scanner non accessible sur le port ${API_PORT}:`, error);
            setScannerStatus({
                serverConnected: false,
                scannerDetected: false,
                lastError: `Serveur non accessible sur le port ${API_PORT}`
            });
            setScannedPDFs([]);
            setSelectedPDF(null);
        }
    };

    // NOUVELLE FONCTION : Récupérer les fichiers disponibles
    const fetchAvailableFiles = async () => {
        try {
            setLoadingPDFs(true);
            
            // Endpoint pour les fichiers disponibles dans bin/ScannedPDFs/
            const response = await axios.get(`${BASE_URL}/available-files`, {
                timeout: 5000
            });
            
            console.log("📁 Fichiers disponibles:", response.data);
            
            if (response.data.status === 'success') {
                const files = response.data.data.files.map(file => ({
                    id: file.id || `file_${Date.now()}_${Math.random()}`,
                    name: file.name,
                    size: file.size || 1024,
                    date: file.created || new Date().toISOString(),
                    url: file.fullUrl || `${BASE_URL}/scanned-files/${file.name}`,
                    downloadUrl: file.fullUrl || `${BASE_URL}/scanned-files/${file.name}`,
                    sessionId: file.id, // Utilise l'ID comme sessionId
                    fileId: file.id, // ID unique du fichier
                    status: file.status || "available",
                    ageMinutes: 0,
                    fromScanner: true // Marque comme provenant du scanner
                })).sort((a, b) => new Date(b.date) - new Date(a.date)); // Tri par date décroissante
                
                console.log("📄 Fichiers formatés:", files);
                setScannedPDFs(files);
                
                if (files.length > 0) {
                    setSelectedPDF(files[0]);
                } else {
                    setSelectedPDF(null);
                }
            } else {
                console.warn("Statut non-success:", response.data);
                setScannedPDFs([]);
            }
        } catch (error) {
            console.error("❌ Erreur récupération fichiers:", error);
            Swal.fire({
                icon: 'error',
                title: 'Erreur de connexion',
                text: `Impossible de récupérer la liste des documents scannés.`,
                timer: 2000
            });
            setScannedPDFs([]);
            setSelectedPDF(null);
        } finally {
            setLoadingPDFs(false);
        }
    };

    const formatDateForFilename = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toISOString().slice(0, 19).replace(/[:]/g, '-');
        } catch {
            return new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
        }
    };

    const handleScan = async () => {
        if (!scannerStatus.serverConnected) {
            Swal.fire({
                icon: 'error',
                title: 'Serveur non connecté',
                html: `
                    <div style="text-align: left;">
                        <p><strong>L'application Windows Scanner n'est pas démarrée</strong></p>
                        <ol>
                            <li>Ouvrez l'application "WindowScan.exe"</li>
                            <li>Attendez le message "API disponible sur: http://localhost:${API_PORT}/"</li>
                            <li>Cliquez sur "Vérifier le statut"</li>
                        </ol>
                    </div>
                `,
                confirmButtonText: 'Compris'
            });
            return;
        }

        if (!scannerStatus.scannerDetected) {
            Swal.fire({
                icon: 'error',
                title: 'Scanner non détecté',
                html: `
                    <div style="text-align: left;">
                        <p><strong>Aucun scanner n'est détecté par Windows</strong></p>
                        <ol>
                            <li>Branchez votre scanner USB</li>
                            <li>Allumez le scanner</li>
                            <li>Attendez que Windows installe les pilotes</li>
                            <li>Cliquez sur "Vérifier le statut"</li>
                        </ol>
                    </div>
                `,
                confirmButtonText: 'Compris'
            });
            return;
        }

        try {
            setScanning(true);
            setScanProgress({ percent: 0, message: "Démarrage du scan..." });

            const startResponse = await axios.post(`${BASE_URL}/start-scan`, {}, {
                timeout: 5000
            });
            
            console.log("Démarrage scan:", startResponse.data);
            
            if (startResponse.data.status === 'success') {
                await monitorScanProgress();
            } else {
                throw new Error(startResponse.data.message || "Erreur inconnue");
            }
            
        } catch (error) {
            console.error("Erreur scan:", error);
            handleScanError(error);
        } finally {
            setScanning(false);
            setScanProgress({ percent: 0, message: "Initialisation..." });
        }
    };

    const monitorScanProgress = async () => {
        let attempts = 0;
        const maxAttempts = 90; // 3 minutes maximum
        
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(async () => {
                attempts++;
                const percent = Math.min(attempts * 1.1, 95);
                setScanProgress({ 
                    percent, 
                    message: `Scan en cours... (${attempts}s)` 
                });
                
                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error("Timeout : Le scan prend trop de temps"));
                    return;
                }

                try {
                    const statusResponse = await axios.get(`${BASE_URL}/status`, {
                        timeout: 3000
                    });
                    
                    console.log("Statut scan:", statusResponse.data);
                    
                    if (!statusResponse.data.data?.isScanning) {
                        clearInterval(checkInterval);
                        
                        if (statusResponse.data.data?.lastError) {
                            reject(new Error(statusResponse.data.data.lastError));
                        } else {
                            setScanProgress({ percent: 100, message: "Scan terminé !" });
                            
                            // Attendre un peu pour la création du PDF
                            setTimeout(async () => {
                                await fetchAvailableFiles(); // Recharger la liste
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Scan réussi !',
                                    text: 'Le document a été scanné et est maintenant disponible.',
                                    timer: 2000,
                                    showConfirmButton: false
                                });
                                resolve();
                            }, 2000);
                        }
                    }
                } catch (error) {
                    console.log("Erreur vérification statut:", error.message);
                }
            }, 2000);
        });
    };

    const handleScanError = (error) => {
        console.error("Erreur scan:", error);
        
        let title = "Erreur de scan";
        let message = error.message || "Impossible de scanner le document";
        
        if (message.includes("Aucun scanner WIA détecté")) {
            title = "Scanner non branché";
            message = "Branchez votre scanner USB et redémarrez l'application.";
        } else if (message.includes("timeout") || message.includes("Timeout")) {
            title = "Temps d'attente dépassé";
            message = "Le scanner met trop de temps à répondre. Vérifiez le document et réessayez.";
        } else if (message.includes("network") || message.includes("Network")) {
            title = "Problème de connexion";
            message = `Impossible de communiquer avec le serveur scanner sur le port ${API_PORT}.`;
        }
        
        Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            confirmButtonText: 'Compris'
        });
        
        setTimeout(checkScannerStatus, 1000);
    };

    const handlePreviewPDF = async (pdf) => {
        try {
            console.log(`📥 Prévisualisation de: ${pdf.name}`);
            
            // Ouvrir directement l'URL du fichier
            if (pdf.url) {
                window.open(pdf.url, '_blank');
                return;
            }
            
            // Fallback: télécharger via l'API
            const response = await axios.get(`${BASE_URL}/get-pdf?sessionId=${pdf.sessionId}`, {
                timeout: 10000
            });
            
            if (response.data.status === 'success' && response.data.data?.pdfBase64) {
                const base64Data = response.data.data.pdfBase64;
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                
                const newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write(`
                        <html>
                            <head>
                                <title>Prévisualisation PDF: ${pdf.name}</title>
                                <style>
                                    body { margin: 0; padding: 20px; background: #f0f0f0; }
                                    embed { width: 100%; height: calc(100vh - 40px); border: 1px solid #ccc; }
                                </style>
                            </head>
                            <body>
                                <embed src="${url}" type="application/pdf" />
                            </body>
                        </html>
                    `);
                    newWindow.document.close();
                }
            }
            
        } catch (error) {
            console.error(`❌ Erreur prévisualisation PDF:`, error);
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: `Impossible de prévisualiser le PDF: ${error.message}`
            });
        }
    };

    const handleDeletePDF = async (pdf) => {
        try {
            const result = await Swal.fire({
                title: 'Supprimer ce fichier ?',
                text: `Êtes-vous sûr de vouloir supprimer "${pdf.name}" du serveur ?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Oui, supprimer',
                cancelButtonText: 'Annuler'
            });
            
            if (result.isConfirmed) {
                const response = await axios.delete(`${BASE_URL}/delete-pdf`, {
                    params: { 
                        fileName: pdf.name,
                        id: pdf.fileId 
                    }
                });
                
                if (response.data.status === 'success') {
                    await fetchAvailableFiles(); // Recharger la liste
                    Swal.fire('Supprimé !', 'Le fichier a été supprimé du serveur.', 'success');
                }
            }
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            Swal.fire('Erreur', 'Impossible de supprimer le fichier.', 'error');
        }
    };

    // MODIFICATION CRITIQUE : Nouvelle version de handleUsePDF
    const handleUsePDF = async () => {
        if (selectedPDF && onScanComplete) {
            try {
                console.log("📦 Utilisation du PDF:", selectedPDF);
                
                // 1. Télécharger le fichier depuis l'URL directe
                const response = await fetch(selectedPDF.downloadUrl || selectedPDF.url);
                
                if (!response.ok) {
                    throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
                }
                
                const blob = await response.blob();
                
                // 2. Créer l'objet File avec les métadonnées
                const file = new File([blob], selectedPDF.name, { 
                    type: 'application/pdf',
                    lastModified: new Date().getTime()
                });
                
                // 3. Vérifier la taille
                if (file.size < 100) {
                    throw new Error("Fichier PDF vide ou corrompu");
                }
                
                // 4. Marquer le fichier comme "utilisé" sur le serveur
                try {
                    await axios.post(`${BASE_URL}/mark-file-used`, null, {
                        params: { 
                            id: selectedPDF.fileId,
                            fileName: selectedPDF.name 
                        }
                    });
                    console.log("✅ Fichier marqué comme utilisé");
                } catch (markError) {
                    console.warn("⚠️ Impossible de marquer le fichier:", markError.message);
                }
                
                // 5. Créer l'objet enrichi avec toutes les informations
                const enrichedFile = {
                    fileObject: file,
                    fileInfo: {
                        ...selectedPDF,
                        fileId: selectedPDF.fileId || selectedPDF.sessionId,
                        fromScanner: true,
                        originalPath: selectedPDF.downloadUrl || selectedPDF.url
                    },
                    id: selectedPDF.fileId || `scan_${Date.now()}`,
                    fromScanner: true
                };
                
                console.log("📄 Fichier enrichi prêt:", enrichedFile);
                
                // 6. Passer le fichier enrichi au parent
                onScanComplete(enrichedFile);
                
                // 7. Fermer la modal
                onClose();
                
                // 8. Afficher le succès
                Swal.fire({
                    icon: 'success',
                    title: 'Document sélectionné',
                    html: `
                        <div style="text-align: left;">
                            <p>Le document est prêt à être ajouté au formulaire.</p>
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px;">
                                <p><strong>Fichier :</strong> ${file.name}</p>
                                <p><strong>Taille :</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                                <p><strong>ID :</strong> ${selectedPDF.fileId || selectedPDF.sessionId}</p>
                                <p class="text-success small mt-2">
                                    ✅ Le fichier sera automatiquement supprimé après insertion en base de données
                                </p>
                            </div>
                        </div>
                    `,
                    timer: 4000,
                    showConfirmButton: false
                });
                
            } catch (error) {
                console.error("❌ Erreur utilisation PDF:", error);
                
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    html: `
                        <div style="text-align: left;">
                            <p>Impossible d'utiliser le document.</p>
                            <p><strong>Erreur :</strong> ${error.message}</p>
                            <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                                <p>Essayez de :</p>
                                <ol>
                                    <li>Redémarrer l'application Windows Scanner</li>
                                    <li>Scanner à nouveau le document</li>
                                    <li>Vérifier la connexion réseau</li>
                                </ol>
                            </div>
                        </div>
                    `
                });
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Aucun document sélectionné',
                text: 'Veuillez sélectionner un document ou scanner un nouveau document.'
            });
        }
    };

    const handleSelectPDF = (pdf) => {
        console.log("PDF sélectionné:", pdf);
        setSelectedPDF(pdf);
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const formatSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="modal fade show d-block" style={{ 
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050
        }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
                <div className="modal-content border-0 shadow-lg" style={{ maxHeight: '90vh' }}>
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title d-flex align-items-center">
                            <FaPrint className="mr-2" /> Scanner un document
                        </h5>
                        <button 
                            type="button" 
                            className="close text-white"
                            onClick={onClose}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                fontSize: '1.5rem',
                                opacity: 0.8 
                            }}
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    
                    <div className="modal-body p-4" style={{ 
                        overflowY: 'auto',
                        maxHeight: 'calc(90vh - 140px)'
                    }}>
                        {/* Statut du scanner */}
                        <div className={`alert ${scannerStatus.scannerDetected ? 'alert-success' : scannerStatus.serverConnected ? 'alert-warning' : 'alert-danger'} mb-4`}>
                            <div className="d-flex align-items-center">
                                {scannerStatus.scannerDetected ? (
                                    <FaCheck className="mr-3 flex-shrink-0" size={24} />
                                ) : scannerStatus.serverConnected ? (
                                    <FaExclamationCircle className="mr-3 flex-shrink-0" size={24} />
                                ) : (
                                    <FaExclamationTriangle className="mr-3 flex-shrink-0" size={24} />
                                )}
                                <div className="flex-grow-1">
                                    <strong>Statut du scanner : </strong>
                                    {scannerStatus.serverConnected ? (
                                        scannerStatus.scannerDetected ? (
                                            <span className="text-success">Connecté et prêt à scanner</span>
                                        ) : (
                                            <span className="text-warning">Serveur connecté, scanner non détecté</span>
                                        )
                                    ) : (
                                        <span className="text-danger">
                                            Serveur non connecté - Démarrez l'application Windows Scanner
                                            <div className="small mt-1">
                                                Port utilisé : {API_PORT}
                                            </div>
                                        </span>
                                    )}
                                    {scannerStatus.lastError && (
                                        <div className="small mt-1 text-muted">
                                            Détail : {scannerStatus.lastError}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    className="btn btn-sm btn-outline-secondary flex-shrink-0"
                                    onClick={() => {
                                        checkScannerStatus();
                                        fetchAvailableFiles();
                                    }}
                                    disabled={loadingPDFs || scanning}
                                >
                                    <FaSync className={`mr-1 ${loadingPDFs ? 'fa-spin' : ''}`} /> 
                                    Actualiser
                                </button>
                            </div>
                        </div>

                        {/* Scanner un nouveau document */}
                        <div className="card mb-4 border-primary">
                            <div className="card-header bg-light d-flex align-items-center">
                                <FaPrint className="mr-2 text-primary" />
                                <h6 className="mb-0">Scanner un nouveau document</h6>
                            </div>
                            <div className="card-body text-center">
                                {scanning ? (
                                    <div className="py-4">
                                        <div className="mb-3">
                                            <FaSpinner className="fa-spin text-primary" size={48} />
                                        </div>
                                        <div className="progress mb-3" style={{ height: '24px' }}>
                                            <div 
                                                className="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                                                style={{ width: `${scanProgress.percent}%` }}
                                                role="progressbar"
                                                aria-valuenow={scanProgress.percent}
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            >
                                                {scanProgress.percent}%
                                            </div>
                                        </div>
                                        <p className="text-primary mb-2">{scanProgress.message}</p>
                                        <small className="text-muted">
                                            Placez vos documents dans le scanner...
                                        </small>
                                    </div>
                                ) : (
                                    <div className="py-4">
                                        <button
                                            className="btn btn-primary btn-lg px-5 py-3 mb-3"
                                            onClick={handleScan}
                                            disabled={!scannerStatus.scannerDetected || scanning}
                                        >
                                            <FaPrint className="mr-2" /> 
                                            {scannerStatus.scannerDetected ? 
                                                "Scanner un document" : 
                                                "Scanner non disponible"}
                                        </button>
                                        <p className="text-muted mb-0">
                                            <FaSearch className="mr-2" />
                                            Placez vos documents dans le scanner et cliquez sur le bouton
                                        </p>
                                        {!scannerStatus.serverConnected && (
                                            <div className="alert alert-danger mt-3 small">
                                                <strong>Action requise :</strong> 
                                                Ouvrez l'application "WindowScan.exe" et assurez-vous qu'elle utilise le port {API_PORT}
                                            </div>
                                        )}
                                        {scannerStatus.serverConnected && !scannerStatus.scannerDetected && (
                                            <div className="alert alert-warning mt-3 small">
                                                <FaPlug className="mr-2" />
                                                <strong>Scanner non détecté :</strong> Branchez votre scanner USB et vérifiez qu'il est allumé
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Liste des PDFs disponibles */}
                        <div className="card border-success">
                            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <FaFilePdf className="mr-2 text-success" />
                                    <h6 className="mb-0">Documents scannés disponibles</h6>
                                </div>
                                <div>
                                    <span className="badge badge-secondary mr-2">
                                        {scannedPDFs.length} document(s)
                                    </span>
                                    <button 
                                        className="btn btn-sm btn-outline-success"
                                        onClick={fetchAvailableFiles}
                                        disabled={loadingPDFs || scanning}
                                    >
                                        {loadingPDFs ? (
                                            <>
                                                <FaSpinner className="fa-spin mr-1" />
                                                Chargement...
                                            </>
                                        ) : (
                                            <>
                                                <FaSync className="mr-1" /> 
                                                Rafraîchir
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="card-body p-0">
                                {loadingPDFs ? (
                                    <div className="text-center py-4">
                                        <FaSpinner className="fa-spin text-primary mb-3" size={32} />
                                        <p className="text-muted">Chargement des documents...</p>
                                    </div>
                                ) : scannedPDFs.length === 0 ? (
                                    <div className="text-center py-4 text-muted">
                                        <FaFilePdf size={48} className="mb-3 text-muted opacity-50" />
                                        <p>Aucun document scanné disponible</p>
                                        <p className="small mb-0">Scannez un document pour le voir apparaître ici</p>
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                        {scannedPDFs.map((pdf, index) => (
                                            <div 
                                                key={pdf.id}
                                                className={`list-group-item list-group-item-action ${selectedPDF?.sessionId === pdf.sessionId ? 'active bg-primary text-white' : ''}`}
                                                onClick={() => handleSelectPDF(pdf)}
                                                style={{ 
                                                    cursor: 'pointer',
                                                    borderLeft: selectedPDF?.sessionId === pdf.sessionId ? '4px solid #0056b3' : 'none'
                                                }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center" style={{ minWidth: 0, flex: 1 }}>
                                                        <FaFilePdf className={`mr-3 flex-shrink-0 ${selectedPDF?.sessionId === pdf.sessionId ? 'text-white' : 'text-danger'}`} size={20} />
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="font-weight-bold text-truncate" style={{ maxWidth: '280px' }}>
                                                                {pdf.name}
                                                                {pdf.status === "used" && (
                                                                    <span className="badge badge-warning ml-2">Utilisé</span>
                                                                )}
                                                            </div>
                                                            <small className={`d-block ${selectedPDF?.sessionId === pdf.sessionId ? 'text-white-50' : 'text-muted'}`}>
                                                                {formatDate(pdf.date)} • {formatSize(pdf.size)}
                                                                <br />
                                                                <span className="badge badge-info">ID: {pdf.fileId?.substring(0, 8) || 'N/A'}</span>
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className={`btn ${selectedPDF?.sessionId === pdf.sessionId ? 'btn-light' : 'btn-outline-info'} mr-1`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePreviewPDF(pdf);
                                                            }}
                                                            title="Prévisualiser"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        <button
                                                            className={`btn ${selectedPDF?.sessionId === pdf.sessionId ? 'btn-light' : 'btn-outline-danger'}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeletePDF(pdf);
                                                            }}
                                                            title="Supprimer du serveur"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {scannedPDFs.length > 0 && (
                                <div className="card-footer bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <small className="text-muted">
                                                {selectedPDF ? (
                                                    <>
                                                        <strong>Document sélectionné :</strong> {selectedPDF.name}
                                                        <br />
                                                        <small className="text-success">
                                                            ✅ Sélectionnez "Utiliser le document" pour l'ajouter au formulaire
                                                        </small>
                                                    </>
                                                ) : (
                                                    "Cliquez sur un document pour le sélectionner"
                                                )}
                                            </small>
                                        </div>
                                        {selectedPDF && (
                                            <small className="text-success font-weight-bold d-flex align-items-center">
                                                <FaCheck className="mr-1" /> Prêt à être utilisé
                                            </small>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="modal-footer bg-light">
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            <FaTimes className="mr-2" /> Annuler
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-success"
                            onClick={handleUsePDF}
                            disabled={!selectedPDF}
                        >
                            <FaCheckCircle className="mr-2" /> 
                            {selectedPDF ? `Utiliser le document` : "Sélectionnez un document"}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fa-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .fa-spin {
                    animation: fa-spin 1s linear infinite;
                }
                .modal-body::-webkit-scrollbar {
                    width: 8px;
                }
                .modal-body::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                .modal-body::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 4px;
                }
                .modal-body::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
                .list-group-item.active {
                    z-index: 2;
                    transform: scale(1.01);
                    transition: transform 0.2s;
                }
                .list-group-item:hover:not(.active) {
                    background-color: #f8f9fa;
                }
            `}</style>
        </div>
    );
};

export default ScannerModal;