import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const Tableaudebordnote = () => {
  const [loading, setLoading] = useState(false);
  const [centres, setCentres] = useState([]);
  const [filteredCentres, setFilteredCentres] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

   const history = useHistory();

  const token = GetTokenOrRedirect();

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      fetchArticles();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/note-perception-dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCentres(res.data);
      setFilteredCentres(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Erreur", "Impossible de charger les données du tableau de bord", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/articleall`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArticles(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Erreur", "Impossible de charger les articles budgétaires", "error");
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim() && !selectedArticle) {
      Swal.fire("Info", "Veuillez remplir au moins un champ pour la recherche.", "info");
      return;
    }

    const results = centres.filter((centre) => {
      const matchNom = centre.centre_ordonnancement.toLowerCase().includes(searchTerm.toLowerCase());
      const matchArticle = selectedArticle ? centre.nom === selectedArticle : true;
      return matchNom && matchArticle;
    });

    setFilteredCentres(results);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchTerm("");
    setSelectedArticle("");
    setFilteredCentres(centres);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredCentres.length / itemsPerPage);
  const paginatedCentres = filteredCentres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  const hundlendlistenote=(item)=>{
   //  history.push("/listenote");
   // alert("hhhhhhhhhhhhhhhhh") noteid-searchnote

   

    if (selectedArticle=="") {
    history.push({
        pathname: `/listenote/${item.id_centre}`, // chemin de la route
        state: { item, selectedArticle } // passage de l'objet item dans l'état
    });
  }
  else{
       history.push({
        pathname: `/listenote/${item.id_centre}`, // chemin de la route
        state: { item, selectedArticle } // passage de l'objet item dans l'état
    });

    
  } 
  }

  return (
    <div style={{ backgroundColor: "whiteSmoke", minHeight: "100vh" }}>
      <Menus />
      <Head />
      <div className="content-wrapper">
        <div className="content-header">
          <div className="container-fluid">
            <h5 className="p-2 mb-3 bg-dark text-white">
              <i className="ion-ios-speedometer-outline mr-2" /> Tableau de Bord pour Note de perception
            </h5>
            <div className="row mb-2">
              <div className="col-sm-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher par nom de centre"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-sm-4">
                <select
                  className="form-control"
                  value={selectedArticle}
                  onChange={(e) => setSelectedArticle(e.target.value)}
                >
                  <option value="">Sélectionner un article budgétaire</option>
                  {articles.map((article) => (
                    <option key={article.id} value={article.nom}>
                      {article.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm-4">
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
                {paginatedCentres.map((centre, index) => (
                  <div key={index} className="col-lg-4 col-6">
                    <div className="small-box bg-info">
                      <div className="inner">
                        <h5>{centre.total}</h5>
                        <p>{centre.centre_ordonnancement}</p>
                      </div>
                      <div className="icon">
                        <i className="fa fa-folder-open mr-2" />
                      </div>
                      <a
                        
                            onClick={() => hundlendlistenote(centre)}
                          
                        
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

export default Tableaudebordnote;
