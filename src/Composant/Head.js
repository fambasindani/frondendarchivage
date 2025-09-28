import { useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const Head = () => {
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
  const nom = utilisateur?.nom || "";
  const prenom = utilisateur?.prenom || "";
  const role = utilisateur?.role || "";
  const nomcomplet = `${prenom} ${nom}`;
  const history = useHistory();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("utilisateur");
       history.push("/");
   // window.location.href = "/archive/";
   
  };

  return (
   
  <div class="wrapper">
    <nav className="main-header navbar navbar-expand navbar-white navbar-light ">
      {/* Menu Hamburger à gauche */}
      <ul className="navbar-nav">
        <li className="nav-item">
          <a
            className="nav-link"
            data-widget="pushmenu"
            href="#"
            role="button"
          >
            <i className="fas fa-bars"></i>
          </a>
        </li>
      </ul>

      {/* Liens utilisateur à droite */}
      <ul className="navbar-nav ml-auto ">
        <li className="nav-item dropdown ">
          <a className="nav-link" data-toggle="dropdown" href="#">
            {role} <i className="fa fa-user ml-2"></i>
          </a>
          <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
            <span className="dropdown-item dropdown-header">{nomcomplet}</span>
            <div className="dropdown-divider" />
            <a href="#" className="dropdown-item" onClick={logout}>
              <i className="fas fa-sign-out-alt mr-2" /> Déconnecter
            </a>
            <div className="dropdown-divider" />
            <a href="#" className="dropdown-item">
              <i className="fas fa-key mr-2" /> Changer mot de passe
            </a>
          </div>
        </li>
      </ul>
    </nav>
    </div>
   
  );
};

export default Head;
