// src/services/scannerService.js

class ScannerService {
    constructor() {
        this.baseUrl = 'http://localhost:8081';
        this.isConnected = false;
    }

    // Vérifier si le scanner est disponible
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/api/ping`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 3000
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isConnected = data.ready || false;
                return {
                    connected: this.isConnected,
                    message: this.isConnected ? 'Scanner détecté' : 'Scanner non prêt',
                    data: data
                };
            }
        } catch (error) {
            console.log('Scanner non disponible:', error.message);
        }
        
        this.isConnected = false;
        return {
            connected: false,
            message: 'Scanner Windows non détecté',
            error: 'CONNECTION_FAILED'
        };
    }

    // Définir les informations du document
    async setDocumentInfo(documentId, classeurId, token) {
        try {
            const response = await fetch(`${this.baseUrl}/api/setinfo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    documentId: parseInt(documentId),
                    classeurId: parseInt(classeurId),
                    token: token
                })
            });
            
            return await response.json();
        } catch (error) {
            return {
                success: false,
                message: `Erreur communication: ${error.message}`
            };
        }
    }

    // Définir l'URL de l'API Laravel
    async setApiUrl(apiUrl) {
        try {
            const response = await fetch(`${this.baseUrl}/api/seturl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    url: apiUrl
                })
            });
            
            return await response.json();
        } catch (error) {
            return {
                success: false,
                message: `Erreur communication: ${error.message}`
            };
        }
    }

    // Démarrer le scan
    async startScan() {
        try {
            const response = await fetch(`${this.baseUrl}/api/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            return await response.json();
        } catch (error) {
            return {
                success: false,
                message: `Impossible de démarrer le scan: ${error.message}`
            };
        }
    }

    // Vérifier l'état du scan
    async getScanStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/status`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            // Ignorer les erreurs de connexion
        }
        
        return { success: false, scanning: false };
    }

    // Tester la connexion avec instructions
    async testConnectionWithInstructions() {
        const result = await this.checkConnection();
        
        if (!result.connected) {
            return {
                connected: false,
                title: 'Scanner non disponible',
                instructions: `
                    <div style="text-align: left;">
                        <p>L'application scanner Windows n'est pas détectée.</p>
                        <p><strong>Pour utiliser le scanner :</strong></p>
                        <ol style="margin-left: 20px;">
                            <li>Assurez-vous que l'application <strong>WindowScan.exe</strong> est ouverte</li>
                            <li>Vérifiez que l'application tourne en arrière-plan</li>
                            <li>Rechargez cette page</li>
                            <li>Cliquez sur "Vérifier la connexion"</li>
                        </ol>
                        <hr>
                        <p style="color: #666; font-size: 0.9em;">
                            <strong>URL du scanner :</strong> ${this.baseUrl}<br>
                            <strong>Dernière vérification :</strong> ${new Date().toLocaleTimeString()}
                        </p>
                    </div>
                `
            };
        }
        
        return result;
    }
}

// Export une instance unique
const scannerService = new ScannerService();
export default scannerService;