import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaUsers, 
  FaUserShield, 
  FaKey, 
  FaTachometerAlt,
  FaBars,
  FaTimes,
  FaHome,
  FaBuilding  // AJOUTER CETTE LIGNE
} from 'react-icons/fa';

const UserManagementLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menuItems = [
    {
      path: '/gestion-utilisateurs/dashboard',
      label: 'Dashboard',
      icon: <FaTachometerAlt />,
    },
    {
      path: '/gestion-utilisateurs/utilisateurs',
      label: 'Utilisateurs',
      icon: <FaUsers />,
    },
    {
      path: '/gestion-utilisateurs/roles',
      label: 'Rôles',
      icon: <FaUserShield />,
    },
    {
      path: '/gestion-utilisateurs/permissions',
      label: 'Permissions',
      icon: <FaKey />,
    },
    // NOUVELLE ENTREE POUR LES DIRECTIONS
    {
      path: '/gestion-utilisateurs/directions',
      label: 'Directions',
      icon: <FaBuilding />,
    },
  ];

  return (
    <div className="user-management-layout">
      {/* Top Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-gradient-primary shadow-sm">
        <div className="container-fluid">
          <button 
            className="navbar-toggler" 
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FaBars />
          </button>
          
          <Link className="navbar-brand" to="/gestion-utilisateurs/dashboard">
            <FaUserShield className="mr-2" />
            Gestion des Utilisateurs
          </Link>
          
          <div className="d-flex align-items-center">
            <Link to="/tableaudebord" className="btn btn-light btn-sm">
              <FaHome className="mr-1" />
              Dashboard Principal
            </Link>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <div className={`col-md-3 col-lg-2 px-0 ${sidebarOpen ? 'd-block' : 'd-none d-md-block'}`}>
            <div className="sidebar bg-white shadow-sm min-vh-100">
              <div className="sidebar-header p-3 border-bottom">
                <h5 className="mb-0 text-primary">
                  <FaUserShield className="mr-2" />
                  Administration
                </h5>
                <button 
                  className="btn btn-sm btn-link d-md-none"
                  onClick={() => setSidebarOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>
              
              <nav className="nav flex-column p-3">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link d-flex align-items-center mb-2 rounded ${
                      location.pathname === item.path 
                        ? 'active bg-primary text-white' 
                        : 'text-dark'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9 col-lg-10 px-md-4">
            <div className="content-area pt-4">
              {children}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .user-management-layout {
          min-height: 100vh;
          background: #f8f9fa;
        }
        
        .sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        
        .nav-link.active {
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .content-area {
          min-height: calc(100vh - 76px);
        }
        
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            z-index: 1000;
            width: 280px;
          }
        }
      `}</style>
    </div>
  );
};

export default UserManagementLayout;