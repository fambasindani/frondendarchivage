// screens/ListenoteScreen.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Table from "../Composant/Table";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import Menus from "../Composant/Menus";
import Head from "../Composant/Head";
import DocumentModal from "../Modals/DocumentModal";
import { useLocation, useParams } from "react-router-dom/cjs/react-router-dom.min";
import ModalNote from "../Modals/ModalNote";

const ListenoteScreen = () => {
  const token = GetTokenOrRedirect();
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modeRecherche, setModeRecherche] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [monProjet, setMonProjet] = useState(null);
  const [idclasseur, setIdClasseur] = useState(null);

  const [documentNom, setDocumentNom] = useState("Liste des notes de perception");

   const location = useLocation();

    const state = location.state || {};
    const item = state.item || null;
    const selectedCentre = state.selectedArticle || null;


       const { id } = useParams();

  const Actualiser = () => {
    setSearch("");
    setModeRecherche(false);
    setPagination({ current_page: 1 });
  };

  useEffect(() => {
    if (token) {
      fetchDocuments();
     // alert(token)
    }
  }, [pagination.current_page, modeRecherche, token]);

  const fetchDocuments = async () => {
    if (!token) return;

    setLoading(true);
    try {
      let res;

    
      if (modeRecherche && search.trim() !== "") {
        res = await axios.post(
          `${API_BASE_URL}/search-note/${id}?page=${pagination.current_page}`,
          { search },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      
      else {
        res = await axios.get(`${API_BASE_URL}/note-centre/${id}?page=${pagination.current_page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } 


        
      
      
     /*  if (modeRecherche && search.trim() !== "") {
              res = await axios.post(
          `${API_BASE_URL}/search-note/${id}?page=${pagination.current_page}`,
          { search },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
            if (!selectedCentre) {
              alert("je suis sans filtre")
                res = await axios.get(`${API_BASE_URL}/note-centre/${id}/?page=${pagination.current_page}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
             // alert("")
                res = await axios.post(`${API_BASE_URL}/search-note/${id}?page=${pagination.current_page}`, {
                    id_centre: selectedCentre
                }, 
                
                {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } */



      setDocuments(res.data.data);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Erreur", "Erreur lors du chargement des documents", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (search.trim() === "") {
      Swal.fire("Attention", "Veuillez entrer un terme de recherche", "warning");
      return;
    }
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    setModeRecherche(true);
    fetchDocuments();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      setPagination((prev) => ({ ...prev, current_page: page }));
    }
  };

  const ouvrirModalAvecId = (row) => {
    setSelectedId(row.id);
    setMonProjet(row.assujetti?.nom_raison_sociale || "");
    setIdClasseur(row.id_classeur);
    setIsModalOpen(true);
  };

  const columns = [
    { key: "numero_serie", label: "N° Série" },
    { key: "date_ordonnancement", label: "Date Ordonnancement" },
    {
      key: "centre",
      label: "Centre",
      render: (row) => row.centre?.nom || "-",
    },
    {
      key: "assujetti",
      label: "Assujetti",
      render: (row) => row.assujetti?.nom_raison_sociale || "-",
    },
    {
      key: "classeur",
      label: "Classeur",
      render: (row) => row.classeur?.nom_classeur || "-",
    },
    {
      key: "emplacement",
      label: "Emplacement",
      render: (row) => row.emplacement?.nom_emplacement || "-",
    },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <button className="btn btn-primary" onClick={() => ouvrirModalAvecId(row)}>
          <i className="fas fa-download"></i> Télécharger
        </button>
      ),
    },
  ];

  return (
    <div style={{ backgroundColor: "whiteSmoke", minHeight: "100vh" }}>
      <Menus />
      <Head />
      <div className="content-wrapper" style={{ backgroundColor: "whitesmoke", minHeight: "100vh" }}>
        <div className="content-header">
          <div className="container-fluid">
            <h5 className="p-2 mb-3" style={{ backgroundColor: "#343a40", color: "#fff" }}>
              <i className="ion-ios-toggle-outline mr-2" /> {documentNom}
            </h5>
          </div>
        </div>

        <section className="content">
          <div className="container-fluid">
            <div className="row mb-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <button className="btn btn-secondary" onClick={handleSearch}>
                  Rechercher
                </button>
                <button className="btn btn-info ml-2" onClick={Actualiser}>
                  Actualiser
                </button>
              </div>
            </div>

            {loading ? (
              <div
                style={{
                  minHeight: "300px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  className="spinner-border text-primary"
                  role="status"
                  style={{ width: "4rem", height: "4rem" }}
                >
                  <span className="sr-only">Chargement...</span>
                </div>
              </div>
            ) : (
              <>
                <Table columns={columns} data={documents} emptyMessage="Aucun document trouvé" />
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${pagination.current_page === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                      >
                        Précédent
                      </button>
                    </li>
                    {Array.from({ length: pagination.last_page }, (_, i) => (
                      <li
                        key={i}
                        className={`page-item ${pagination.current_page === i + 1 ? "active" : ""}`}
                      >
                        <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${
                        pagination.current_page === pagination.last_page ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                      >
                        Suivant
                      </button>
                    </li>
                  </ul>
                </nav>
              </>
            )}
          </div>
        </section>
      </div>
{/* 
      <DocumentModal
        modalId="documentModal"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        monid={selectedId}
        projet={monProjet}
        idclasseur={idclasseur}
        verification={false}
      /> */}


               <ModalNote
                modalId="documentModal"
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                monid={selectedId} // id personnel
                projet={monProjet} // id classeur
                idclasseur={idclasseur}
               // idcentre={idcentre}
                verification={false}
            />







    </div>
  );
};

export default ListenoteScreen;
