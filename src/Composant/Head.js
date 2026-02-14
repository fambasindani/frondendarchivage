import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  FaUser,
  FaSignOutAlt,
  FaKey,
  FaUserCircle,
  FaBars,
  FaCog,
  FaChevronDown,
  FaBell,
  FaEnvelope
} from "react-icons/fa";
import { Link } from "react-router-dom/cjs/react-router-dom.min";

const Head = () => {
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
  const nom = utilisateur?.nom || "";
  const prenom = utilisateur?.prenom || "";
  const role = utilisateur?.role || "";
  const email = utilisateur?.email || "";
  const nomcomplet = `${prenom} ${nom}`;
  const history = useHistory();
  const [showDropdown, setShowDropdown] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("utilisateur");
    history.push("/");
  };


    // useEffect(() => {
      
    // alert(utilisateur)
      
    // }, []); // Dépendances vides = s'exécute une seule fois au montage
  

  return (
    <nav className="main-header navbar navbar-expand navbar-dark navbar-primary bg-gradient-primary shadow-sm">
      {/* Menu Hamburger à gauche */}
      <ul className="navbar-nav">
        <li className="nav-item">
          <button
            className="nav-link btn btn-link"
            data-widget="pushmenu"
            onClick={() => {
              const body = document.body;
              if (body.classList.contains("sidebar-open")) {
                body.classList.remove("sidebar-open");
                body.classList.add("sidebar-closed", "sidebar-collapse");
              } else {
                body.classList.remove("sidebar-closed", "sidebar-collapse");
                body.classList.add("sidebar-open");
              }
            }}
          >
            <FaBars className="text-white" />
          </button>
        </li>
      </ul>

      {/* Notifications et Messages (optionnel) */}
      <ul className="navbar-nav ml-auto d-none d-md-flex">
        <li className="nav-item dropdown mx-2">
          <a className="nav-link position-relative" href="#" onClick={(e) => e.preventDefault()}>
            <FaBell className="text-white opacity-75" />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              3
            </span>
          </a>
        </li>
        <li className="nav-item dropdown mx-2">
          <a className="nav-link position-relative" href="#" onClick={(e) => e.preventDefault()}>
            <FaEnvelope className="text-white opacity-75" />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">
              5
            </span>
          </a>
        </li>
      </ul>

      {/* Liens utilisateur à droite */}
      <ul className="navbar-nav ml-3">
        <li className="nav-item dropdown">
          <button
            className="nav-link btn btn-link d-flex align-items-center p-0"
            onClick={() => setShowDropdown(!showDropdown)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          >
            <div className="d-flex align-items-center">
              <div className="avatar-circle-sm mr-2">
                {prenom?.[0]}{nom?.[0]}
              </div>
              <div className="d-flex flex-column text-left">
                <span className="text-white font-weight-bold">{nomcomplet}</span>
                <small className="text-white-50">{role}</small>
              </div>
              <FaChevronDown className="text-white ml-2" />
            </div>
          </button>

          {showDropdown && (
            <div className="dropdown-menu dropdown-menu-right show shadow-lg border-0 animated fadeIn">
              <div className="dropdown-header bg-gradient-info text-white rounded-top">
                <div className="d-flex align-items-center">
                  <div className="avatar-circle mr-3">
                    {prenom?.[0]}{nom?.[0]}
                  </div>
                  <div>
                    <h6 className="mb-0">{nomcomplet}</h6>
                    <small className="opacity-75">{email}</small>
                  </div>
                </div>
              </div>

              <div className="dropdown-divider m-0"></div>

              <a className="dropdown-item d-flex align-items-center py-3" onClick={(e) => e.preventDefault()}>
                <FaUserCircle className="mr-3 text-primary" />
                <div>
                  <div className="font-weight-bold"> 
                    <Link to="/profil" style={{ color: "inherit", textDecoration: "none" }}>
                    Mon Profil
                  </Link>
                  </div>
                  <small className="text-muted">Gérer vos informations personnelles</small>
                </div>
              </a>

              <a href="#" className="dropdown-item d-flex align-items-center py-3" onClick={(e) => e.preventDefault()}>
                <FaKey className="mr-3 text-warning" />
                <div>
                  <div className="font-weight-bold">Changer mot de passe</div>
                  <small className="text-muted">Mettre à jour votre mot de passe</small>
                </div>
              </a>

              <a href="#" className="dropdown-item d-flex align-items-center py-3" onClick={(e) => e.preventDefault()}>
                <FaCog className="mr-3 text-info" />
                <div>
                  <div className="font-weight-bold">Paramètres</div>
                  <small className="text-muted">Préférences du compte</small>
                </div>
              </a>

              <div className="dropdown-divider"></div>

              <button className="dropdown-item d-flex align-items-center py-3 text-danger" onClick={logout}>
                <FaSignOutAlt className="mr-3" />
                <div>
                  <div className="font-weight-bold" onClick={logout}>Déconnecter</div>
                  <small className="text-muted">Quitter la session</small>
                </div>
              </button>
            </div>
          )}
        </li>
      </ul>

      <style jsx>{`
        .navbar-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .avatar-circle {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
        }
        
        .avatar-circle-sm {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }
        
        .dropdown-menu {
          min-width: 300px;
          border-radius: 10px;
          margin-top: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          animation: slideDown 0.3s ease;
        }
        
        .dropdown-header {
          padding: 20px;
          border-radius: 10px 10px 0 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .dropdown-item {
          transition: all 0.2s ease;
          border-radius: 5px;
          margin: 2px 10px;
          width: auto;
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
          transform: translateX(5px);
        }
        
        .dropdown-divider {
          border-top: 1px solid #e9ecef;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animated {
          animation-duration: 0.3s;
          animation-fill-mode: both;
        }
        
        .fadeIn {
          animation-name: fadeIn;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .badge {
          font-size: 10px;
          padding: 3px 6px;
        }
        
        .opacity-75 {
          opacity: 0.75;
        }
        
        .opacity-50 {
          opacity: 0.5;
        }
        
        .text-white-50 {
          color: rgba(255,255,255,0.5);
        }
      `}</style>
    </nav>
  );
};

export default Head;