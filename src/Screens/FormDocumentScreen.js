import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import FormDocument from "../Composant/FormDocument";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { FaArrowLeft, FaFileAlt, FaSpinner } from 'react-icons/fa';

const FormDocumentScreen = () => {
  const history = useHistory();
  const token = GetTokenOrRedirect();
  
  // Fonction améliorée pour extraire l'ID
  const getCurrentId = () => {
    const path = window.location.pathname;
    console.log("Path actuel:", path);
    
    // Extraire l'ID de /archive/addform/10
    const match = path.match(/\/archive\/addform\/(\d+)$/);
    
    if (match && match[1]) {
      const id = parseInt(match[1], 10);
      console.log("ID extrait:", id);
      return id;
    }
    
    console.log("Aucun ID trouvé - mode création");
    return null;
  };
  
  const id = getCurrentId();
  const isEditing = !!id;
  
  console.log("=== DEBUG ===");
  console.log("URL complète:", window.location.href);
  console.log("ID détecté:", id);
  console.log("isEditing:", isEditing);
  console.log("=== FIN DEBUG ===");

  const [loading, setLoading] = useState(true);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [directions, setDirections] = useState([]);
  const [emplacements, setEmplacements] = useState([]);
  const [classeurs, setClasseurs] = useState([]);

  useEffect(() => {
    if (!token) {
      console.log("Pas de token, retour");
      return;
    }

    console.log("Début du chargement - ID:", id, "Mode édition:", isEditing);

    const fetchData = async () => {
      try {
        // 1. Charger les listes dropdown
        console.log("Chargement des listes dropdown...");
        const [directionsRes, emplacementsRes, classeursRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/direction`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_BASE_URL}/emplacement`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_BASE_URL}/classeur`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
        ]);

        setDirections(directionsRes.data);
        setEmplacements(emplacementsRes.data);
        setClasseurs(classeursRes.data);
        
        console.log("Listes chargées:");
        console.log("- Directions:", directionsRes.data.length);
        console.log("- Emplacements:", emplacementsRes.data.length);
        console.log("- Classeurs:", classeursRes.data.length);

        // 2. Charger le document à éditer si mode édition
        if (isEditing && id) {
          try {
            console.log(`Tentative de chargement du document ID ${id}...`);
            console.log(`URL API: ${API_BASE_URL}/editdeclaration/${id}`);
            
            const documentRes = await axios.get(
              `${API_BASE_URL}/editdeclaration/${id}`, 
              {
                headers: { 
                  Authorization: `Bearer ${token}` 
                }
              }
            );
            
            console.log("✅ Document chargé avec succès:", documentRes.data);
            
            // NOUVEAU : Transformer les données pour extraire seulement les IDs
            const documentData = documentRes.data;
            
            // Si les champs relationnels sont des objets, extraire seulement les IDs
            const transformedData = {
              ...documentData,
              id_direction: documentData.id_direction 
                ? (typeof documentData.id_direction === 'object' 
                    ? documentData.id_direction.id 
                    : documentData.id_direction)
                : "",
              id_emplacement: documentData.id_emplacement 
                ? (typeof documentData.id_emplacement === 'object' 
                    ? documentData.id_emplacement.id 
                    : documentData.id_emplacement)
                : "",
              id_classeur: documentData.id_classeur 
                ? (typeof documentData.id_classeur === 'object' 
                    ? documentData.id_classeur.id 
                    : documentData.id_classeur)
                : "",
              id_user: documentData.id_user 
                ? (typeof documentData.id_user === 'object' 
                    ? documentData.id_user.id 
                    : documentData.id_user)
                : "",
            };
            
            console.log("Données transformées:", transformedData);
            setDocumentToEdit(transformedData);
            
          } catch (error) {
            console.error("❌ Erreur lors du chargement du document:", error);
            
            if (error.response) {
              console.error("Status:", error.response.status);
              console.error("Data:", error.response.data);
              console.error("Headers:", error.response.headers);
            }
            
            Swal.fire({
              icon: 'error',
              title: 'Document introuvable',
              html: `
                <div style="text-align: left;">
                  <p>Impossible de charger le document ID: <strong>${id}</strong></p>
                  <p><strong>Erreur:</strong> ${error.response?.data?.message || error.message}</p>
                  <p><strong>URL:</strong> ${API_BASE_URL}/editdeclaration/${id}</p>
                </div>
              `,
              confirmButtonText: 'Retour à la liste'
            }).then(() => {
              history.push('/document');
            });
          }
        } else {
          console.log("Mode création - Pas de chargement de document");
        }
      } catch (err) {
        console.error('❌ Erreur générale de chargement:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur de chargement',
          text: 'Impossible de charger les données nécessaires',
          confirmButtonText: 'OK'
        }).then(() => {
          history.push('/document');
        });
      } finally {
        console.log("Chargement terminé");
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id, isEditing, history]);

  const handleCancel = () => {
    Swal.fire({
      title: 'Annuler ?',
      text: 'Voulez-vous vraiment quitter sans enregistrer ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, quitter',
      cancelButtonText: 'Rester'
    }).then((result) => {
      if (result.isConfirmed) {
        history.push('/document');
      }
    });
  };

  const handleSuccess = () => {
    const message = isEditing 
      ? 'Document modifié avec succès'
      : 'Document ajouté avec succès';
    
    Swal.fire({
      title: 'Succès !',
      text: message,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    }).then(() => {
      history.push('/document');
    });
  };

  if (loading) {
    return (
      <div>
        <Menus />
        <Head />
        <div className="content-wrapper" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
          <div className="content-header">
            <div className="container-fluid">
              <div className="row mb-3">
                <div className="col-sm-12">
                  <button
                    className="btn btn-outline-secondary mb-3"
                    onClick={() => history.push('/document')}
                  >
                    <FaArrowLeft className="mr-2" /> Retour
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <section className="content">
            <div className="container-fluid">
              <div className="row">
                <div className="col-md-12">
                  <div className="card border-0 shadow">
                    <div className="card-body text-center py-5">
                      <FaSpinner className="fa-spin text-primary mb-3" style={{ fontSize: '3rem' }} />
                      <h4 className="text-muted mb-2">
                        {isEditing ? 'Chargement du document...' : 'Préparation du formulaire...'}
                      </h4>
                      <p className="text-muted">
                        {isEditing 
                          ? `Chargement du document ID: ${id}` 
                          : 'Initialisation en cours...'}
                      </p>
                      <div className="mt-3">
                        <small className="text-muted">
                          {isEditing 
                            ? `URL: ${API_BASE_URL}/editdeclaration/${id}`
                            : 'Mode création'}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Menus />
      <Head />
      <div className="content-wrapper" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-3">
              <div className="col-sm-6">
                <h1 className="m-0 text-dark">
                  <FaFileAlt className="mr-2" />
                  {isEditing ? "Modifier le Document" : "Nouveau Document"}
                </h1>
                <p className="text-muted mb-0">
                  {isEditing 
                    ? `Modification du document ID: ${id}` 
                    : "Remplissez le formulaire pour ajouter un document"}
                </p>
              </div>
              <div className="col-sm-6">
                <div className="float-sm-right">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleCancel}
                  >
                    <FaArrowLeft className="mr-2" /> Retour à la liste 
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-12">
                <FormDocument
                  isEditing={isEditing}
                  documentToEdit={documentToEdit}
                  onCancel={handleCancel}
                  onSuccess={handleSuccess}
                  directions={directions}
                  emplacements={emplacements}
                  classeurs={classeurs}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FormDocumentScreen;