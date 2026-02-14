import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  FaTachometerAlt,
  FaCogs,
  FaFolder,
  FaUsersCog,
  FaUserFriends,
  FaUserShield,
  FaKey,
  FaLayerGroup,
  FaBuilding,
  FaArchive,
  FaMapMarkerAlt,
  FaFileInvoiceDollar,
  FaUser,
  FaAngleDown,
  FaAngleUp,
  FaHome,
  FaChartBar
} from "react-icons/fa";

const Menus = () => {
  const [openConfig, setOpenConfig] = useState(false);
  const [openGestionUtilisateurs, setOpenGestionUtilisateurs] = useState(false);
  const [activeMenu, setActiveMenu] = useState("");
  const sidebarRef = useRef(null);
  const location = useLocation(); // 🔥 Ajouter useLocation

 // const role = JSON.parse(localStorage.getItem("utilisateur"))?.role;
   const role = JSON.parse(localStorage.getItem("role"));
  const entreprise = localStorage.getItem("archive_module"); // "ad" ou "np"

  // 🔥 SYNC ACTIVE MENU AVEC L'URL AU CHARGEMENT ET À CHAQUE CHANGEMENT D'URL
  useEffect(() => {
    const path = location.pathname;
    //alert(role[0].nom)
   // console.log(role[0].nom)
    // Dashboard
    if (path.includes("/tableaudebord")) {
      setActiveMenu("dashboard");
    }
    // Configuration - Sous-menus
    else if (path.includes("/direction")) {
      setActiveMenu("direction");
      setOpenConfig(true);
    }
    else if (path.includes("/classeur")) {
      setActiveMenu("classeur");
      setOpenConfig(true);
    }
    else if (path.includes("/centre-ordonnancement")) {
      setActiveMenu("centre");
      setOpenConfig(true);
    }
    else if (path.includes("/emplacement")) {
      setActiveMenu("emplacement");
      setOpenConfig(true);
    }
    else if (path.includes("/ministere")) {
      setActiveMenu("ministere");
      setOpenConfig(true);
    }
    // Documents
    else if (path.includes("/document")) {
      setActiveMenu("document");
    }
    // Note-Perception
    else if (path.includes("/note-perception")) {
      setActiveMenu("note-perception");
    }
    // Gestion Utilisateurs - Sous-menus
    else if (path.includes("/gestion-utilisateurs/dashboard")) {
      setActiveMenu("user-dashboard");
      setOpenGestionUtilisateurs(true);
    }
    else if (path.includes("/gestion-utilisateurs/utilisateurs")) {
      setActiveMenu("users");
      setOpenGestionUtilisateurs(true);
    }
    else if (path.includes("/gestion-utilisateurs/roles")) {
      setActiveMenu("roles");
      setOpenGestionUtilisateurs(true);
    }
    else if (path.includes("/gestion-utilisateurs/permissions")) {
      setActiveMenu("permissions");
      setOpenGestionUtilisateurs(true);
    }
    // Profil
    else if (path.includes("/profil")) {
      setActiveMenu("profil");
    }
    // Configuration parent
    else if (path.includes("/config")) {
      setActiveMenu("config");
      setOpenConfig(true);
    }
    // Gestion parent
    else if (path.includes("/gestion-utilisateurs")) {
      setActiveMenu("gestion");
      setOpenGestionUtilisateurs(true);
    }
  }, [location.pathname]); // 🔥 Se déclenche à chaque changement d'URL

  const toggleConfigMenu = () => {
    setOpenConfig(!openConfig);
    setOpenGestionUtilisateurs(false);
    // Ne pas changer activeMenu ici, laisser l'URL le gérer
  };

  const toggleGestionUtilisateurs = () => {
    setOpenGestionUtilisateurs(!openGestionUtilisateurs);
    setOpenConfig(false);
    // Ne pas changer activeMenu ici, laisser l'URL le gérer
  };

  const fermerSidebar = () => {
    if (window.innerWidth <= 768) {
      document.body.classList.remove("sidebar-open");
      document.body.classList.add("sidebar-closed", "sidebar-collapse");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        window.innerWidth <= 768 &&
        document.body.classList.contains("sidebar-open") &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest('[data-widget="pushmenu"]')
      ) {
        document.body.classList.remove("sidebar-open");
        document.body.classList.add("sidebar-closed", "sidebar-collapse");
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const brandText = entreprise === "np" ? "Archiv-NP" : "Archiv-Docs";
  const brandLogo = entreprise === "np" ? "#4CAF50" : "#2196F3";

  // 🔥 Fonction pour vérifier si un menu est actif
  const isActive = (menuName) => {
    return activeMenu === menuName ? "active" : "";
  };

  return (
    <aside ref={sidebarRef} className="main-sidebar sidebar-dark-primary elevation-4 custom-sidebar">
      {/* Logo */}
      {((entreprise === "ad" || entreprise === "np")) && (
        <div className="brand-wrapper">
          <Link to={entreprise === "ad" ? "/tableaudebord" : "/tableaudebordnote"} className="brand-link">
            <div className="brand-logo" style={{ backgroundColor: brandLogo }}>
              <FaArchive className="brand-icon" />
            </div>
            <div className="brand-text">
              <span className="brand-title">{brandText}</span>
              <span className="brand-subtitle">Système de Gestion</span>
            </div>
          </Link>
        </div>
      )}

      {/* Sidebar */}
      <div className="sidebar">
        <nav className="mt-2">
          <ul className="nav nav-pills nav-sidebar flex-column" role="menu" data-accordion="false">
            {/* Dashboard */}
            <li className="nav-item">
              <Link
                to={entreprise === "ad" ? "/tableaudebord" : "/tableaudebordnote"}
                className={`nav-link ${isActive("dashboard")}`}
                onClick={() => {
                  fermerSidebar();
                }}
              >
                <FaTachometerAlt className="nav-icon" />
                <p>Dashboard</p>
                <span className="nav-badge">1</span>
              </Link>
            </li>

            {/* Configuration */}
            {(role[0].nom === "Directeur" || role === "encodeur") && (
              <li className={`nav-item ${openConfig ? "menu-open" : ""}`}>
                <a
                  href="#"
                  className={`nav-link ${openConfig ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleConfigMenu();
                  }}
                >
                  <FaCogs className="nav-icon" />
                  <p>Configuration</p>
                  {openConfig ? <FaAngleUp className="nav-arrow" /> : <FaAngleDown className="nav-arrow" />}
                </a>

                <ul className="nav nav-treeview submenu" style={{ display: openConfig ? "block" : "none" }}>
                  {/* Direction - visible seulement pour "ad" (Autres Docs) */}
                  {(entreprise === "ad") && (
                    <li className="nav-item">
                      <Link 
                        to="/direction" 
                        className={`nav-link ${isActive("direction")}`}
                        onClick={() => {
                          fermerSidebar();
                        }}
                      >
                        <FaBuilding className="submenu-icon" />
                        <p>Direction</p>
                      </Link>
                    </li>
                  )}

                  {/* Classeur - visible pour tous */}
                  <li className="nav-item">
                    <Link 
                      to="/classeur" 
                      className={`nav-link ${isActive("classeur")}`}
                      onClick={() => {
                        fermerSidebar();
                      }}
                    >
                      <FaFolder className="submenu-icon" />
                      <p>Classeur</p>
                    </Link>
                  </li>

                  {/* Centre - visible seulement pour "np" */}
                  {(entreprise === "np") && (
                    <li className="nav-item">
                      <Link 
                        to="/centre-ordonnancement" 
                        className={`nav-link ${isActive("centre")}`}
                        onClick={() => {
                          fermerSidebar();
                        }}
                      >
                        <FaHome className="submenu-icon" />
                        <p>Centre</p>
                      </Link>
                    </li>
                  )}

                  {/* Emplacement - visible pour tous */}
                  <li className="nav-item">
                    <Link 
                      to="/emplacement" 
                      className={`nav-link ${isActive("emplacement")}`}
                      onClick={() => {
                        fermerSidebar();
                      }}
                    >
                      <FaMapMarkerAlt className="submenu-icon" />
                      <p>Emplacement</p>
                    </Link>
                  </li>

                  {/* Article budgétaire - visible seulement pour "np" */}
                  {(entreprise === "np") && (
                    <li className="nav-item">
                      <Link 
                        to="/ministere" 
                        className={`nav-link ${isActive("ministere")}`}
                        onClick={() => {
                          fermerSidebar();
                        }}
                      >
                        <FaFileInvoiceDollar className="submenu-icon" />
                        <p>Serv. d'assiette</p>
                      </Link>
                    </li>
                  )}
                </ul>
              </li>
            )}

            {/* Documents - visible seulement pour "ad" et rôles admin/encodeur */}
            {((role === "admin" || role === "encodeur") && entreprise === "ad") && (
              <li className="nav-item">
                <Link 
                  to="/document" 
                  className={`nav-link ${isActive("document")}`}
                  onClick={() => {
                    fermerSidebar();
                  }}
                >
                  <FaLayerGroup className="nav-icon" />
                  <p>Documents</p>
                  <span className="nav-badge new">Nouveau</span>
                </Link>
              </li>
            )}

            {/* Notes de Perception - visible seulement pour "np" et rôles admin/encodeur */}
            {((role === "admin" || role === "encodeur") && entreprise === "np") && (
              <li className="nav-item">
                <Link 
                  to="/note-perception" 
                  className={`nav-link ${isActive("note-perception")}`}
                  onClick={() => {
                    fermerSidebar();
                  }}
                >
                  <FaChartBar className="nav-icon" />
                  <p>Note-Perception</p>
                </Link>
              </li>
            )}

            {/* Gestion des Utilisateurs - visible seulement pour admin */}
            {role[0].nom === "Directeur" && (
              <li className={`nav-item ${openGestionUtilisateurs ? "menu-open" : ""}`}>
                <a
                  href="#"
                  className={`nav-link ${openGestionUtilisateurs ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleGestionUtilisateurs();
                  }}
                >
                  <FaUsersCog className="nav-icon" />
                  <p>Gestion Utilisateurs</p>
                  {openGestionUtilisateurs ? <FaAngleUp className="nav-arrow" /> : <FaAngleDown className="nav-arrow" />}
                </a>

                <ul className="nav nav-treeview submenu" style={{ display: openGestionUtilisateurs ? "block" : "none" }}>
                  <li className="nav-item">
                    <Link 
                      to="/gestion-utilisateurs/dashboard" 
                      className={`nav-link ${isActive("user-dashboard")}`}
                      onClick={() => {
                        fermerSidebar();
                      }}
                    >
                      <FaTachometerAlt className="submenu-icon" />
                      <p>Dashboard</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      to="/gestion-utilisateurs/utilisateurs" 
                      className={`nav-link ${isActive("users")}`}
                      onClick={() => {
                        fermerSidebar();
                      }}
                    >
                      <FaUserFriends className="submenu-icon" />
                      <p>Utilisateurs</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      to="/gestion-utilisateurs/roles" 
                      className={`nav-link ${isActive("roles")}`}
                      onClick={() => {
                        fermerSidebar();
                      }}
                    >
                      <FaUserShield className="submenu-icon" />
                      <p>Rôles</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      to="/gestion-utilisateurs/permissions" 
                      className={`nav-link ${isActive("permissions")}`}
                      onClick={() => {
                        fermerSidebar();
                      }}
                    >
                      <FaKey className="submenu-icon" />
                      <p>Permissions</p>
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* Séparateur */}
            <li className="nav-header mt-4">
              <span className="nav-label">Système</span>
            </li>

            {/* Mon Profil - visible pour tous */}
            <li className="nav-item">
              <Link 
                to="/profil" 
                className={`nav-link ${isActive("profil")}`}
                onClick={fermerSidebar}
              >
                <FaUser className="nav-icon" />
                <p>Mon Profil</p>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <style jsx>{`
        .custom-sidebar {
          background: linear-gradient(180deg, #2c3e50 0%, #1a252f 100%);
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        
        .brand-wrapper {
          padding: 20px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .brand-link {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: white;
          transition: all 0.3s ease;
        }
        
        .brand-link:hover {
          opacity: 0.9;
        }
        
        .brand-logo {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .brand-icon {
          font-size: 24px;
          color: white;
        }
        
        .brand-text {
          display: flex;
          flex-direction: column;
        }
        
        .brand-title {
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0.5px;
        }
        
        .brand-subtitle {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 2px;
        }
        
        .nav-item {
          margin: 2px 10px;
        }
        
        .nav-link {
          color: #b0bec5;
          border-radius: 10px !important;
          padding: 12px 15px !important;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
          margin: 4px 0;
        }
        
        .nav-link:hover {
          background: rgba(255,255,255,0.1);
          color: white;
          transform: translateX(5px);
        }
        
        .nav-link.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .nav-icon {
          margin-right: 12px;
          font-size: 18px;
          width: 24px;
        }
        
        .nav-arrow {
          margin-left: auto;
          font-size: 14px;
        }
        
        .nav-badge {
          margin-left: auto;
          background: rgba(255,255,255,0.15);
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }
        
        .nav-badge.new {
          background: linear-gradient(45deg, #FF416C, #FF4B2B);
        }
        
        .submenu {
          margin-left: 25px;
          border-left: 2px solid rgba(255,255,255,0.1);
          padding-left: 10px;
        }
        
        .submenu .nav-link {
          padding: 10px 15px !important;
          border-radius: 8px !important;
          margin: 2px 0;
        }
        
        .submenu-icon {
          margin-right: 10px;
          font-size: 14px;
          width: 20px;
        }
        
        .nav-header {
          padding: 15px 15px 5px;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.4);
          border-top: 1px solid rgba(255,255,255,0.1);
          margin-top: 10px;
        }
        
        .nav-label {
          font-weight: 600;
        }
        
        .menu-open > .nav-link {
          background: rgba(255,255,255,0.05);
        }
      `}</style>
    </aside>
  );
};

export default Menus;