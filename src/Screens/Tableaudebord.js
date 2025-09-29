import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const DashboardScreen = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [classificateurs, setClassificateurs] = useState([]);
  const [directions, setDirections] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const history = useHistory();
  const itemsPerPage = 12;



  const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
  //const role = JSON.parse(localStorage.getItem("utilisateur"));
  const nom = utilisateur?.nom || "";
  const prenom = utilisateur?.prenom || "";
  const role = utilisateur?.role || "";
  const token = GetTokenOrRedirect();
  const id_direction = utilisateur?.id_direction || "";
  

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      fetchDirections();
     // alert(id_direction)
    }
  }, [token]);

  const fetchDashboardData = async () => {
    let res
    setLoading(true);
    try {
      
      
              res = await axios.get(`${API_BASE_URL}/declaration-dashboard`, {
              headers: { Authorization: `Bearer ${token}` },
      });
      
     
      setClassificateurs(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Erreur", "Impossible de charger les données du tableau de bord", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDirections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/direction`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDirections(response.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Erreur", "Impossible de charger les directions", "error");
    }
  };

 const handleSearch = async () => {
  // Vérifier si les champs sont vides
  if (!searchTerm && !selectedDirection) {
    Swal.fire("Info", "Veuillez remplir au moins un champ pour la recherche.", "info");
    return;
  }

  setLoading(true);
  try {
    const res = await axios.post(`${API_BASE_URL}/declaration-search`, {
      nom_classeur: searchTerm,
      id_direction: selectedDirection,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Regroupement par nom_classeur et id_classeur
    const groupedResults = res.data.declarations.reduce((acc, declaration) => {
      const { nom_classeur, id_classeur } = declaration;
      const key = `${nom_classeur}-${id_classeur}`; // Clé unique pour le regroupement
               
      if (!acc[key]) {
        acc[key] = { total: 0, nom_classeur, id_classeur }; // Initialisation
      }
      acc[key].total += 1; // Incrément du total
      return acc;
    }, {});

    // Convertir l'objet en tableau
    const resultsArray = Object.values(groupedResults);
    setClassificateurs(resultsArray); // Mettez à jour avec les résultats groupés
    setTotalResults(resultsArray.length); // Total des classes
  } catch (error) {
    console.error(error);
    Swal.fire("Erreur", "Impossible de charger les résultats de recherche", "error");
  } finally {
    setLoading(false);
  }
};

  const handleReset = () => {
    setSearchTerm("");
    setSelectedDirection("");
    setClassificateurs([]); // Réinitialiser les résultats
    setTotalResults(0); // Réinitialiser le total
    fetchDashboardData(); // Recharger les données par défaut
  };

const hundlelistedocument = (item) => {
  

 if (selectedDirection=="") {
    history.push({
        pathname: `/listedocument/${item.id_classeur}`, // chemin de la route
        state: { item, selectedDirection } // passage de l'objet item dans l'état
    });
  }
  else{
       history.push({
        pathname: `/listedocument/${item.id_classeur}`, // chemin de la route
        state: { item, selectedDirection } // passage de l'objet item dans l'état
    });

    
  } 

};



  

  const totalPages = Math.ceil(classificateurs.length / itemsPerPage);
  const paginatedClassificateurs = classificateurs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



    

  return (
    <div style={{ backgroundColor: "whiteSmoke", minHeight: "100vh" }}>
      <Menus />
      <Head />
      <div className="content-wrapper">
        <div className="content-header">
          <div className="container-fluid">
            <h5 className="p-2 mb-3 bg-dark text-white">
              <i className="ion-ios-speedometer-outline mr-2" /> Tableau de Bord Documents
            </h5>
            <div className="row mb-2">
              <div className="col-sm-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher par type de classeur"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-sm-3">
                <select
                  className="form-control"
                  value={selectedDirection}
                  onChange={(e) => setSelectedDirection(e.target.value)}
                >
                  <option value="" disabled>
                    Veuillez sélectionner la direction
                  </option>
                  {directions.map((direction) => (
                    <option key={direction.id} value={direction.id}>
                      {direction.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm-2">
                <button className="btn btn-primary" onClick={handleSearch}>
                  Chercher
                </button>
                <button className="btn btn-secondary ml-2" onClick={handleReset}>
                  Actualiser
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="content">
          <div className="container-fluid">
            {loading ? (
              <div className="text-center my-5">
                <div className="spinner-border text-primary" style={{ width: "4rem", height: "4rem" }} role="status">
                  <span className="sr-only">Chargement...</span>
                </div>
              </div>
            ) : (
              <div className="row">
                {paginatedClassificateurs.map((classifier) => (
                  <div key={classifier.nom_classeur} className="col-lg-4 col-6">
                    <div className="small-box bg-info">
                      <div className="inner">

                        <h5>{classifier.total}</h5>
                        <p>{classifier.nom_classeur}</p>
                        
                      </div>
                      <div className="icon">
                        <i className="fa fa-folder-open mr-2" />
                      </div>
                      <a
                        //onClick={() => Swal.fire("Info", `Détails pour ${classifier.nom_classeur}`, "info")}
                        //onClick={hundlelistedocument(classifier)}
                        onClick={() => hundlelistedocument(classifier)}
                        className="small-box-footer"
                        style={{ cursor: "pointer" }}
                      >
                        Plus d'informations <i className="fas fa-arrow-circle-right" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="mt-3 d-flex justify-content-center">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
                      Précédent
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>
                      Suivant
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardScreen;