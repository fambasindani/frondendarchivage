import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import FormNote from "../Composant/FormNote"; // Changé de FormDocument à FormNote
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { FaArrowLeft, FaFileAlt, FaSpinner } from 'react-icons/fa';

const FormNoteScreen = () => {
    const history = useHistory();
    const token = GetTokenOrRedirect();

    // Extraire l'ID de l'URL
    const getCurrentId = () => {
        const path = window.location.pathname;
        const match = path.match(/\/note\/form\/(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
    };

    const id = getCurrentId();
    const isEditing = !!id;

    const [loading, setLoading] = useState(true);
    const [noteToEdit, setNoteToEdit] = useState(null);
    const [directions, setDirections] = useState([]);
    const [classeurs, setClasseurs] = useState([]);
    const [centres, setCentres] = useState([]);
    const [emplacements, setEmplacements] = useState([]);

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                // Charger les listes déroulantes
                const [directionsRes, classeursRes, centresRes, emplacementsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/articleall`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_BASE_URL}/classeur`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_BASE_URL}/centre_ordonnancements/all`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_BASE_URL}/emplacements`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                ]);

                setDirections(directionsRes.data.data || directionsRes.data);
                // setClasseurs(classeursRes.data.data || classeursRes.data);
                const classeursData = classeursRes.data.data || classeursRes.data;
                console.log(classeursData)
                const filteredClasseurs = classeursData.filter(
                    classeur => classeur.nom_classeur === "Note de Perception"
                );
                setClasseurs(filteredClasseurs);

                setCentres(centresRes.data.data || centresRes.data);
                setEmplacements(emplacementsRes.data.data || emplacementsRes.data);



                // Charger la note si en mode édition
                if (isEditing && id) {
                    const noteRes = await axios.get(
                        `${API_BASE_URL}/notes/${id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    // Transformer les données pour extraire les IDs
                    const noteData = noteRes.data;
                    const transformedData = {
                        ...noteData,
                        id_ministere: noteData.id_ministere?.id || noteData.id_ministere,
                        id_classeur: noteData.id_classeur?.id || noteData.id_classeur,
                        id_centre_ordonnancement: noteData.id_centre_ordonnancement?.id || noteData.id_centre_ordonnancement,
                        id_assujetti: noteData.id_assujetti?.id || noteData.id_assujetti,
                        id_emplacement: noteData.id_emplacement?.id || noteData.id_emplacement,
                    };

                    setNoteToEdit(transformedData);
                }
            } catch (err) {
                console.error('Erreur:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: 'Impossible de charger les données'
                }).then(() => history.push('/note-perception'));
            } finally {
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
            confirmButtonText: 'Oui',
            cancelButtonText: 'Non'
        }).then((result) => {
            if (result.isConfirmed) history.push('/note-perception');
        });
    };

    const handleSuccess = () => {
        Swal.fire({
            title: 'Succès !',
            text: isEditing ? 'Note modifiée avec succès' : 'Note ajoutée avec succès',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        }).then(() => history.push('/note-perception'));
    };

    if (loading) {
        return (
            <div>
                <Menus />
                <Head />
                <div className="content-wrapper" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", position: "relative" }}>
                    <div className="content-header">
                        <div className="container-fluid">
                            <button
                                className="btn btn-outline-secondary mb-3"
                                onClick={() => history.push('/note-perception')}
                            >
                                <FaArrowLeft className="mr-2" /> Retour
                            </button>
                        </div>
                    </div>
                    <section className="content">
                        <div className="container-fluid">
                            <div className="row" style={{ minHeight: "calc(100vh - 200px)" }}>
                                <div className="col-md-12 d-flex align-items-center justify-content-center">
                                    <div className="text-center">
                                        <FaSpinner className="fa-spin text-primary mb-3" size={50} />
                                        <h4 className="text-muted">
                                            {isEditing ? 'Chargement de la note...' : 'Préparation du formulaire...'}
                                        </h4>
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
                                    {isEditing ? "Modifier la Note" : "Nouvelle Note de Perception"}
                                </h1>
                            </div>
                            <div className="col-sm-6">
                                <div className="float-sm-right">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={handleCancel}
                                    >
                                        <FaArrowLeft className="mr-2" /> Retour
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
                                <FormNote
                                    isEditing={isEditing}
                                    noteToEdit={noteToEdit} // Changé de documentToEdit à noteToEdit
                                    onCancel={handleCancel}
                                    onSuccess={handleSuccess}
                                    directions={directions}
                                    classeurs={classeurs}
                                    centres={centres} // Ajouté centres qui était manquant
                                    emplacements={emplacements}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default FormNoteScreen;