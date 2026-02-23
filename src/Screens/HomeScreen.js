import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import logo from '../Images/Logo.png';
import axios from "axios";

import {
    FaArchive,
    FaFileInvoiceDollar,
    FaChartBar,
    FaDatabase,
    FaLock,
    FaSearch,
    FaUpload,
    FaBoxOpen,
    FaBuilding,
    FaRegGem,
    FaUserLock,
    FaCalendarAlt,
    FaShieldAlt,
    FaFileContract,
    FaRegFileAlt,
    FaSpinner,
    FaTimes,
    FaChevronUp,
    FaChevronDown
} from "react-icons/fa";
import "../style/HomeScreen.css";
import { API_BASE_URL } from "../config";

const HomeScreen = () => {
    const history = useHistory();
    const [currentTime, setCurrentTime] = useState("");
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(true); // État pour afficher/masquer la carte de bienvenue
    const [stats, setStats] = useState({
        total_archives: 0,
        archivages_mois: 0,
        documents_traitement: 0,
        taux_disponibilite: 99.8,
        modules: {
            ad: { total: 0, monthly: 0, label: "Archivage Ordinaire" },
            np: { total: 0, monthly: 0, label: "Notes de Perception" }
        }
    });

    useEffect(() => {
        // Vérifier si l'utilisateur a déjà masqué la carte de bienvenue
        const welcomeHidden = localStorage.getItem("hide_welcome_card");
        if (welcomeHidden === "true") {
            setShowWelcome(false);
        }

        // Mettre à jour l'heure actuelle
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const dateString = now.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            setCurrentTime(`${dateString} - ${timeString}`);
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);

        // Charger les statistiques
        fetchStats();

        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            
            // Appel à l'API publique pour les statistiques globales
            const response = await axios.get(`${API_BASE_URL}/public/stats`);
            
            if (response.data.success) {
                setStats(response.data.data);
            }
            
            // Optionnel : charger aussi les détails des modules
            const modulesResponse = await axios.get(`${API_BASE_URL}/public/modules`);
            if (modulesResponse.data.success) {
                console.log("Modules:", modulesResponse.data.data);
            }
            
        } catch (error) {
            console.error("Erreur chargement statistiques:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleModuleClick = (moduleType) => {
        // Stocker le type de module dans localStorage
        localStorage.removeItem("archive_module");
        localStorage.setItem("archive_module", moduleType);
        // Rediriger vers la page de connexion
        history.push("/login");
    };

    const toggleWelcomeCard = () => {
        const newState = !showWelcome;
        setShowWelcome(newState);
        // Sauvegarder la préférence de l'utilisateur
        localStorage.setItem("hide_welcome_card", (!newState).toString());
    };

    const ModuleCard = ({ title, description, icon, color, stats, moduleType }) => (
        <div
            className="module-card"
            style={{ borderTop: `5px solid ${color}` }}
            onClick={() => handleModuleClick(moduleType)}
        >
            <div className="module-icon" style={{ backgroundColor: `${color}20`, color: color }}>
                {icon}
            </div>
            <div className="module-content">
                <h3>{title}</h3>
                <p>{description}</p>
                <div className="module-stats">
                    <span className="stat-item">
                        <FaDatabase /> {stats.total} archives
                    </span>
                    <span className="stat-item">
                        <FaChartBar /> {stats.monthly} ce mois
                    </span>
                </div>
                <button className="module-btn" style={{ backgroundColor: color }}>
                    Accéder au module <FaBoxOpen className="ml-2" />
                </button>
            </div>
        </div>
    );

    // Formatage des nombres
    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    return (
        <div className="home-screen">
            {/* Header avec logo et informations */}
            <header className="home-header">
                <div className="header-top">
                    <div className="logo-section">
                        <img
                            src={logo}
                            alt="DGRAD Logo"
                            className="dgrad-logo"
                        />
                        <div className="logo-text">
                            <h1>DGRAD</h1>
                            <p>Direction Générale des Recettes Administratives, Judiciaires, Domaniales et de Participations</p>
                            <p className="logo-subtitle">Système d'Archivage Numérique Intégré</p>
                        </div>
                    </div>
                    <div className="header-info">
                        <div className="time-display">
                            <FaCalendarAlt className="mr-2" />
                            {currentTime}
                        </div>
                        <div className="system-status">
                            <FaShieldAlt className="mr-2" />
                            <span>Système Opérationnel</span>
                        </div>
                    </div>
                </div>

                <div className="header-banner">
                    <div className="banner-content">
                        <h2>Plateforme d'Archivage Numérique DGRAD</h2>
                        <p>Une solution complète pour la gestion et la préservation de vos documents administratifs et financiers</p>
                    </div>
                    <div className="security-badge">
                        <FaUserLock className="mr-2" />
                        <span>Environnement Sécurisé Certifié</span>
                    </div>
                </div>
            </header>

            {/* Contenu principal */}
            <main className="home-main">
                {/* Message de bienvenue avec toggle */}
                {showWelcome ? (
                    <section className="welcome-section">
                        <div className="welcome-card" style={{ position: 'relative' }}>
                            <button 
                                onClick={toggleWelcomeCard}
                                style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '15px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#999',
                                    fontSize: '18px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    transition: 'all 0.3s ease',
                                    zIndex: 10
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f0f0f0';
                                    e.target.style.color = '#666';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = '#999';
                                }}
                                title="Masquer ce message"
                            >
                                <FaTimes />
                            </button>
                            <h2>Bienvenue sur la Plateforme d'Archivage DGRAD</h2>
                            <p>
                                Cette plateforme vous permet de gérer efficacement les archives administratives et financières
                                de la Direction Générale des Recettes. Sélectionnez le module correspondant à vos besoins pour commencer.
                            </p>
                            <div style={{ 
                                marginTop: '15px', 
                                display: 'flex', 
                                justifyContent: 'flex-end',
                                borderTop: '1px solid #eee',
                                paddingTop: '15px'
                            }}>
                                <small style={{ color: '#999' }}>
                                    Vous pouvez masquer ce message définitivement en cliquant sur la croix
                                </small>
                            </div>
                        </div>
                    </section>
                ) : (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        marginBottom: '15px',
                        padding: '0 15px'
                    }}>
                        <button
                            onClick={toggleWelcomeCard}
                            style={{
                                background: 'transparent',
                                border: '1px dashed #ccc',
                                borderRadius: '20px',
                                padding: '5px 15px',
                                color: '#666',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f8f9fa';
                                e.target.style.borderColor = '#999';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.borderColor = '#ccc';
                            }}
                        >
                            <FaChevronDown size={12} />
                            Afficher le message de bienvenue
                        </button>
                    </div>
                )}

                {/* Modules d'archivage */}
                <section className="modules-section">
                    <div className="section-header">
                        <FaBuilding className="section-icon" />
                        <h2>Modules d'Archivage Disponibles</h2>
                        <p>Sélectionnez le module correspondant à votre type de documents</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <FaSpinner className="fa-spin text-primary" size={50} />
                            <p className="mt-3">Chargement des modules...</p>
                        </div>
                    ) : (
                        <div className="modules-grid">
                            <ModuleCard
                                title="Archivage Ordinaire"
                                description="Gestion des documents administratifs courants, correspondances, rapports, circulaires et documents généraux de l'administration"
                                icon={<FaArchive />}
                                color="#2E86C1"
                                stats={{ 
                                    total: stats.modules.ad.total, 
                                    monthly: stats.modules.ad.monthly 
                                }}
                                moduleType="ad"
                            />

                            <ModuleCard
                                title="Archivage Note de Perception"
                                description="Gestion spécialisée des notes de perception, quittances, documents financiers et pièces comptables"
                                icon={<FaFileInvoiceDollar />}
                                color="#28B463"
                                stats={{ 
                                    total: stats.modules.np.total, 
                                    monthly: stats.modules.np.monthly 
                                }}
                                moduleType="np"
                            />
                        </div>
                    )}
                </section>

                {/* Statistiques générales */}
                <section className="stats-section">
                    <div className="section-header">
                        <FaChartBar className="section-icon" />
                        <h2>Statistiques du Système</h2>
                        <p>Aperçu de l'activité d'archivage</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-4">
                            <FaSpinner className="fa-spin text-primary" size={40} />
                        </div>
                    ) : (
                        <div className="stats-grid">
                            <div className="stat-card stat-card-primary">
                                <div className="stat-icon">
                                    <FaArchive />
                                </div>
                                <div className="stat-content">
                                    <h3>{formatNumber(stats.total_archives)}</h3>
                                    <p>Documents archivés au total</p>
                                </div>
                            </div>

                            <div className="stat-card stat-card-success">
                                <div className="stat-icon">
                                    <FaUpload />
                                </div>
                                <div className="stat-content">
                                    <h3>{formatNumber(stats.archivages_mois)}</h3>
                                    <p>Archivages ce mois-ci</p>
                                </div>
                            </div>

                            <div className="stat-card stat-card-warning">
                                <div className="stat-icon">
                                    <FaRegFileAlt />
                                </div>
                                <div className="stat-content">
                                    <h3>{formatNumber(stats.documents_traitement)}</h3>
                                    <p>Documents en traitement</p>
                                </div>
                            </div>

                            <div className="stat-card stat-card-info">
                                <div className="stat-icon">
                                    <FaFileContract />
                                </div>
                                <div className="stat-content">
                                    <h3>{stats.taux_disponibilite}%</h3>
                                    <p>Taux de disponibilité</p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Fonctionnalités */}
                <section className="features-section">
                    <div className="section-header">
                        <FaRegGem className="section-icon" />
                        <h2>Fonctionnalités de la Plateforme</h2>
                        <p>Découvrez les capacités de notre système d'archivage</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaUpload />
                            </div>
                            <h4>Dépôt Numérique Sécurisé</h4>
                            <p>Transfert sécurisé de documents avec validation automatique et chiffrement</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaSearch />
                            </div>
                            <h4>Recherche Intelligente</h4>
                            <p>Recherche multicritère avec indexation avancée et suggestions</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaLock />
                            </div>
                            <h4>Sécurité Renforcée</h4>
                            <p>Authentification à deux facteurs et contrôle d'accès granulaire</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaChartBar />
                            </div>
                            <h4>Analytics et Rapports</h4>
                            <p>Tableaux de bord personnalisables et génération de rapports</p>
                        </div>
                    </div>
                </section>

                {/* Instructions */}
                <section className="instructions-section">
                    <div className="instructions-card">
                        <h3>Guide de Démarrage Rapide</h3>
                        <ol className="instructions-list">
                            <li>
                                <span className="step-number">1</span>
                                <div>
                                    <strong>Sélectionnez votre module</strong>
                                    <p>Choisissez entre "Archivage Ordinaire" pour les documents administratifs généraux ou "Archivage Note de Perception" pour les documents financiers</p>
                                </div>
                            </li>
                            <li>
                                <span className="step-number">2</span>
                                <div>
                                    <strong>Authentification</strong>
                                    <p>Connectez-vous avec vos identifiants DGRAD sur la page suivante</p>
                                </div>
                            </li>
                            <li>
                                <span className="step-number">3</span>
                                <div>
                                    <strong>Accédez aux fonctionnalités</strong>
                                    <p>Utilisez les outils de dépôt, recherche, consultation et gestion des archives</p>
                                </div>
                            </li>
                            <li>
                                <span className="step-number">4</span>
                                <div>
                                    <strong>Assistance technique</strong>
                                    <p>En cas de difficulté, contactez le support technique aux coordonnées indiquées ci-dessous</p>
                                </div>
                            </li>
                        </ol>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                         <img
                            src={logo}
                            alt="DGRAD Logo"
                            className="dgrad-logo"
                        />
                        <div>
                            <h4>DGRAD</h4>
                            <p>Direction Générale des Recettes</p>
                            <p className="footer-subtitle">Administratives, Judiciaires, Domaniales et de Participations</p>
                        </div>
                    </div>

                    <div className="footer-info">
                        <p className="footer-copyright">
                            © {new Date().getFullYear()} DGRAD - République Démocratique du Congo
                        </p>
                        <p className="footer-version">
                            <FaShieldAlt className="mr-2" />
                            Version 3.0.1 • Plateforme d'Archivage Numérique
                        </p>
                        <p className="footer-compliance">
                            Conforme aux normes d'archivage électronique ISO 14641
                        </p>
                    </div>

                    <div className="footer-contact">
                        <p>
                            <strong>Support technique:</strong> support.archivage@dgrad.gov.cm
                        </p>
                        <p>
                            <strong>Assistance téléphonique:</strong> +237 XXX XX XX XX
                        </p>
                        <p>
                            <strong>Horaires de support:</strong> Lundi - Vendredi, 8h - 17h
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomeScreen;