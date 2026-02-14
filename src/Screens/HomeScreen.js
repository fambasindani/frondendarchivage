import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import logo from '../Images/Logo.png'

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
    FaRegFileAlt
} from "react-icons/fa";
import "../style/HomeScreen.css";

const HomeScreen = () => {
    const history = useHistory();
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
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
        const interval = setInterval(updateTime, 60000); // Mettre à jour chaque minute

        return () => clearInterval(interval);
    }, []);

    const handleModuleClick = (moduleType) => {
        // Stocker le type de module dans localStorage
        localStorage.removeItem("archive_module");
        localStorage.setItem("archive_module", moduleType);
           //alert(moduleType)
        // Rediriger vers la page de connexion
           history.push("/login");
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
                {/* Message de bienvenue */}
                <section className="welcome-section">
                    <div className="welcome-card">
                        <h2>Bienvenue sur la Plateforme d'Archivage DGRAD</h2>
                        <p>
                            Cette plateforme vous permet de gérer efficacement les archives administratives et financières
                            de la Direction Générale des Recettes. Sélectionnez le module correspondant à vos besoins pour commencer.
                        </p>
                    </div>
                </section>

                {/* Modules d'archivage */}
                <section className="modules-section">
                    <div className="section-header">
                        <FaBuilding className="section-icon" />
                        <h2>Modules d'Archivage Disponibles</h2>
                        <p>Sélectionnez le module correspondant à votre type de documents</p>
                    </div>

                    <div className="modules-grid">
                        <ModuleCard
                            title="Archivage Ordinaire"
                            description="Gestion des documents administratifs courants, correspondances, rapports, circulaires et documents généraux de l'administration"
                            icon={<FaArchive />}
                            color="#2E86C1"
                            stats={{ total: 1247, monthly: 42 }}
                            moduleType="ad"
                        />

                        <ModuleCard
                            title="Archivage Note de Perception"
                            description="Gestion spécialisée des notes de perception, quittances, documents financiers et pièces comptables"
                            icon={<FaFileInvoiceDollar />}
                            color="#28B463"
                            stats={{ total: 589, monthly: 23 }}
                            moduleType="np"
                        />
                    </div>
                </section>

                {/* Statistiques générales */}
                <section className="stats-section">
                    <div className="section-header">
                        <FaChartBar className="section-icon" />
                        <h2>Statistiques du Système</h2>
                        <p>Aperçu de l'activité d'archivage</p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card stat-card-primary">
                            <div className="stat-icon">
                                <FaArchive />
                            </div>
                            <div className="stat-content">
                                <h3>1,836</h3>
                                <p>Documents archivés au total</p>
                            </div>
                        </div>

                        <div className="stat-card stat-card-success">
                            <div className="stat-icon">
                                <FaUpload />
                            </div>
                            <div className="stat-content">
                                <h3>65</h3>
                                <p>Archivages ce mois-ci</p>
                            </div>
                        </div>

                        <div className="stat-card stat-card-warning">
                            <div className="stat-icon">
                                <FaRegFileAlt />
                            </div>
                            <div className="stat-content">
                                <h3>18</h3>
                                <p>Documents en traitement</p>
                            </div>
                        </div>

                        <div className="stat-card stat-card-info">
                            <div className="stat-icon">
                                <FaFileContract />
                            </div>
                            <div className="stat-content">
                                <h3>99.8%</h3>
                                <p>Taux de disponibilité</p>
                            </div>
                        </div>
                    </div>
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
                            © {new Date().getFullYear()} DGRAD - République  Démocratique du Congo
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