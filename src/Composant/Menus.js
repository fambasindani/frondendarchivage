import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const Menus = () => {
  const [openConfig, setOpenConfig] = useState(false);
  const [openConfigs, setOpenConfigs] = useState(false);
  const sidebarRef = useRef(null);

  const role = JSON.parse(localStorage.getItem("utilisateur"))?.role;

  const toggleConfigMenu = () => {
    setOpenConfig(!openConfig);
  };

  const toggleConfigMenus = () => {
    setOpenConfigs(!openConfigs);
  };

  // Fermer la sidebar sur petit écran
  const fermerSidebar = () => {
    if (window.innerWidth <= 768) {
      document.body.classList.remove("sidebar-open");
      document.body.classList.add("sidebar-closed", "sidebar-collapse");
    }
  };

  // Fermer la sidebar si on clique en dehors
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

  return (
    <aside ref={sidebarRef} className="main-sidebar sidebar-dark-primary elevation-4">
      {/* Logo */}
      <a href="#" className="brand-link" style={{ backgroundColor: "gray" }}>
        <img
          src={`${process.env.PUBLIC_URL}/dist/img/AdminLTELogo.png`}
          alt="AdminLTE Logo"
          className="brand-image img-circle elevation-3"
          style={{ opacity: ".8" }}
        />


        <span className="brand-text font-weight-light">AIDES-Projet</span>
      </a>

      {/* Sidebar */}
      <div className="sidebar">
        <nav className="mt-2">
          <ul
            className="nav nav-pills nav-sidebar flex-column"
            data-widget="treeview"
            role="menu"
            data-accordion="false"
          >
            <li className="nav-item">
              <Link to="/tableaudebord" className="nav-link active" onClick={fermerSidebar}>
                <i className="ion ion-speedometer" /> <p>Dashboard</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/direction" className="nav-link" onClick={fermerSidebar}>
                <i className="fa fa-folder-open mr-2" />
                <p>Direction</p>
              </Link>
            </li>



            <li className={`nav-item ${openConfigs ? "menu-open" : ""}`}>
              <a
                href="#"
                className={`nav-link ${openConfigs ? "active" : ""}`}
                onClick={toggleConfigMenus}
              >
                <i className="ion-podium mr-2" />
                <p>
                  Configuration
                  <i className="fas fa-angle-left right" />
                </p>
              </a>

              <ul className="nav nav-treeview" style={{ display: openConfigs ? "block" : "none" }}>
                <li className="nav-item">
                  <Link to="/direction" className="nav-link" onClick={fermerSidebar}>
                    <i className="far fa-circle nav-icon" />
                    <p>Direction</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/classeur" className="nav-link" onClick={fermerSidebar}>
                    <i className="far fa-circle nav-icon" />
                    <p>Classeur</p>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link to="/centre-ordonnancement" className="nav-link" onClick={fermerSidebar}>
                    <i className="far fa-circle nav-icon" />
                    <p>Centre</p>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link to="/ministere" className="nav-link" onClick={fermerSidebar}>
                    <i className="far fa-circle nav-icon" />
                    <p>Ministere</p>
                  </Link>
                </li>


              </ul>
            </li>

            {role === "admin" && (
              <li className="nav-item">
                <Link to="/personnel" className="nav-link" onClick={fermerSidebar}>
                  <i className="fa fa-users mr-2" />
                  <p>Personnels</p>
                </Link>
              </li>
            )}


            <li className="nav-item">
              <Link to="/emplacement" className="nav-link" onClick={fermerSidebar}>
                <i className="ion-ios-toggle-outline mr-2" />
                <p>Emplacement</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/document" className="nav-link" onClick={fermerSidebar}>
                <i className="fa fa-layer-group mr-2" />
                <p>Document</p>
              </Link>
            </li>


            <li className="nav-item">
              <Link to="/note-perception" className="nav-link" onClick={fermerSidebar}>
                <i className="fa fa-layer-group mr-2" />
                <p>Note-Perception</p>
              </Link>
            </li>

            {role === "admin" && (
              <li className={`nav-item ${openConfig ? "menu-open" : ""}`}>
                <a
                  href="#"
                  className={`nav-link ${openConfig ? "active" : ""}`}
                  onClick={toggleConfigMenu}
                >
                  <i className="ion ion-gear-a mr-2" />
                  <p>
                    Configuration
                    <i className="fas fa-angle-left right" />
                  </p>
                </a>

                <ul className="nav nav-treeview" style={{ display: openConfig ? "block" : "none" }}>
                  <li className="nav-item">
                    <Link to="/province" className="nav-link" onClick={fermerSidebar}>
                      <i className="far fa-circle nav-icon" />
                      <p>Province</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/district" className="nav-link" onClick={fermerSidebar}>
                      <i className="far fa-circle nav-icon" />
                      <p>Territoire</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/note-perception" className="nav-link" onClick={fermerSidebar}>
                      <i className="far fa-circle nav-icon" />
                      <p>Note-Perception</p>
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link to="/partenaire" className="nav-link" onClick={fermerSidebar}>
                      <i className="far fa-circle nav-icon" />
                      <p>Ministere</p>
                    </Link>
                  </li>


                </ul>
              </li>
            )}

            {role === "admin" && (
              <li className="nav-item">
                <Link to="/utilisateur" className="nav-link" onClick={fermerSidebar}>
                  <i className="fa fa-lock mr-2" />
                  <p>Sécurité</p>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Menus;
