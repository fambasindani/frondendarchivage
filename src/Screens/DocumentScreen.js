import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import Button from "../Composant/Button";
import Input from "../Composant/Input";
import Table from "../Composant/Table";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import Droplist from "../Composant/DropList ";
import DocumentModal from "../Modals/DocumentModal";

const DocumentScreen = () => {
    const token = GetTokenOrRedirect();

    const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
    //const role = JSON.parse(localStorage.getItem("utilisateur"));

    const role = utilisateur?.role || "";
    const id_direction = utilisateur?.id_direction || "";

    // Modal documents
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [monprojet, setmonprojet] = useState(null);
    const [idclasseur, setidclasseur] = useState(null);
    const id_user = JSON.parse(localStorage.getItem("utilisateur"))?.id;

    const ouvrirModalAvecId = (item) => {
        setSelectedId(item.id);
        setmonprojet(item.nom_direction);
        setidclasseur(item.id_classeur)
        setIsModalOpen(true);
    };

    // Listes dropdown
    const [directions, setDirections] = useState([]);
    const [emplacements, setEmplacements] = useState([]);
    const [classeurs, setClasseurs] = useState([]);

    // Documents + pagination + recherche
    const [documents, setDocuments] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
    const [modeRecherche, setModeRecherche] = useState(false);
    const [search, setSearch] = useState("");

    // Formulaire
    const [formData, setFormData] = useState({
        id_direction: "",
        id_emplacement: "",
        id_classeur: "",
        id_user: id_user, // fixe à 1
        date_creation: "",
        date_enregistrement: "",
        intitule: "",
        num_reference: "",
        mot_cle: "",
        num_declaration: "",
    });

    const [errors, setErrors] = useState({});
    const [documentEnEdition, setDocumentEnEdition] = useState(null);
    const [valeurtable, setValeurtable] = useState(true);
    const [loading, setLoading] = useState(false);

    // Chargement des dropdowns au montage
    useEffect(() => {
        if (!token) return;

        const fetchDropdowns = async () => {
            try {
                const [resDirections, resEmplacements, resClasseurs] = await Promise.all([
                    axios.get(`${API_BASE_URL}/direction`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_BASE_URL}/emplacement`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_BASE_URL}/classeur`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                setDirections(resDirections.data);
                setEmplacements(resEmplacements.data);
                setClasseurs(resClasseurs.data);
            } catch (err) {
                console.error(err);
                Swal.fire("Erreur", "Erreur lors du chargement des listes", "error");
            }
        };

        fetchDropdowns();
    }, [token]);

    // Chargement des documents (liste ou recherche)
    useEffect(() => {
        if (token) {
            fetchDocuments();
        }
    }, [pagination.current_page, modeRecherche, token]);

    const fetchDocuments = async () => {
        if (!token) return;

        setLoading(true);
        try {


            let res;
            if (modeRecherche && search.trim() !== "") {
                res = await axios.post(
                    `${API_BASE_URL}/declarations/search`,
                    { search, page: pagination.current_page },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
            } else {
                res = await axios.get(`${API_BASE_URL}/declarations?page=${pagination.current_page}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            setDocuments(res.data.data);
            console.log(res.data.data);
            setPagination({ current_page: res.data.current_page, last_page: res.data.last_page });
        } catch (err) {
            console.error(err);
            Swal.fire("Erreur", "Erreur lors du chargement des documents", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, current_page: 1 }));
        setModeRecherche(true);
    };

    const actualiser = () => {
        setSearch("");
        setModeRecherche(false);
        setPagination({ current_page: 1, last_page: 1 });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (!token) return;

        try {
            if (documentEnEdition) {
                await axios.put(
                    `${API_BASE_URL}/declarations/${documentEnEdition}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire("Succès", "Document modifié avec succès", "success");
            } else {
                await axios.post(
                    `${API_BASE_URL}/declarations`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire("Succès", "Document ajouté avec succès", "success");
            }

            setFormData({
                id_direction: "",
                id_emplacement: "",
                id_classeur: "",
                id_user: id_user,
                date_creation: "",
                date_enregistrement: "",
                intitule: "",
                num_reference: "",
                mot_cle: "",
                num_declaration: "",
            });
            setDocumentEnEdition(null);
            setValeurtable(true);
            setErrors({});
            fetchDocuments();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                Swal.fire("Erreur", "Erreur lors de l'enregistrement", "error");
            }
        }
    };

    const handleEdit = async (id) => {
        if (!token) return;

        try {
            const res = await axios.get(`${API_BASE_URL}/editdeclaration/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFormData({
                id_direction: res.data.id_direction || "",
                id_emplacement: res.data.id_emplacement || "",
                id_classeur: res.data.id_classeur || "",
                id_user: id_user,
                date_creation: res.data.date_creation || "",
                date_enregistrement: res.data.date_enregistrement || "",
                intitule: res.data.intitule || "",
                num_reference: res.data.num_reference || "",
                mot_cle: res.data.mot_cle || "",
                num_declaration: res.data.num_declaration || "",
            });
            setDocumentEnEdition(id);
            setValeurtable(false);
        } catch (err) {
            console.error(err);
            Swal.fire("Erreur", "Erreur lors du chargement du document", "error");
        }
    };

    const handleDelete = (id) => {
        if (!token) return;

        Swal.fire({
            title: "Voulez-vous désactiver ce document ?",
            text: "Cette action va mettre à jour son statut.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Oui, désactiver",
            cancelButtonText: "Annuler",
        }).then((result) => {
            if (result.isConfirmed) {
                axios
                    .delete(`${API_BASE_URL}/declarations/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    .then(() => {
                        Swal.fire("Désactivé !", "Document désactivé avec succès.", "success");
                        setFormData({
                            id_direction: "",
                            id_emplacement: "",
                            id_classeur: "",
                            id_user: id_user,
                            date_creation: "",
                            date_enregistrement: "",
                            intitule: "",
                            num_reference: "",
                            mot_cle: "",
                            num_declaration: "",
                        });
                        setDocumentEnEdition(null);
                        setValeurtable(true);
                        setModeRecherche(false);
                        setSearch("");
                        setPagination({ current_page: 1, last_page: 1 });
                        fetchDocuments();
                    })
                    .catch((error) => {
                        Swal.fire("Erreur", "Erreur lors de la désactivation.", "error");
                        console.error(error);
                    });
            }
        });
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.last_page) {
            setPagination((prev) => ({ ...prev, current_page: page }));
        }
    };

    const handleCancelEdit = () => {
        setFormData({
            id_direction: "",
            id_emplacement: "",
            id_classeur: "",
            id_user: id_user,
            date_creation: "",
            date_enregistrement: "",
            intitule: "",
            num_reference: "",
            mot_cle: "",
            num_declaration: "",
        });
        setDocumentEnEdition(null);
        setErrors({});
    };

    // Colonnes du tableau (exemple simplifié)
    const columns = [
        {
            key: "nom_classeur",
            label: "Classeur",
            render: (row) => row.nom_classeur || (row.classeur && row.classeur.nom_classeur) || "N/A",
        },

        { key: "intitule", label: "Intitulé" },
        { key: "num_reference", label: "Numéro Référence" },
        { key: "mot_cle", label: "Mot Clé" },
        //  { key: "num_declaration", label: "Numéro Déclaration" },
        { key: "nom_direction", label: "Direction" },
        { key: "nom_emplacement", label: "Emplacement" },



    ];

    const actions = [
        {
            icon: "far fa-edit",
            color: "info",
            onClick: (row) => handleEdit(row.id),
        },
        {
            icon: "far fa-trash-alt",
            color: "secondary",
            onClick: (row) => handleDelete(row.id),
        },
        {
            icon: "fas fa-download",
            color: "primary",
            onClick: (row) => ouvrirModalAvecId(row),
        },
    ];

    return (
        <div>
            <Menus />
            <Head />
            <div
                className="content-wrapper"
                style={{ backgroundColor: "whitesmoke", minHeight: "100vh" }}
            >
                <div className="content-header">
                    <div className="container-fluid">
                        <h5 className="p-2 mb-3" style={{ backgroundColor: "#343a40", color: "#fff" }}>
                            <i className="ion-ios-toggle-outline mr-2" /> Gestion des Documents
                        </h5>
                    </div>
                </div>

                <section className="content">
                    <div className="container-fluid">
                        <div className="row mb-2">
                            <div className="col-9"></div>
                            <div className="col-3 d-flex justify-content-end">
                                <Button
                                    className={valeurtable ? "btn-info" : "btn-success"}
                                    onClick={() => {
                                        handleCancelEdit();
                                        setValeurtable(!valeurtable);
                                    }}
                                    icon={valeurtable ? "ion-plus-circled" : "ion-arrow-left-b"}
                                >
                                    {valeurtable ? "Ajouter un Document" : "Retour à la liste des documents"}
                                </Button>
                            </div>
                        </div>

                        <div className="row">
                            {valeurtable ? (
                                <div className="col-md-12">
                                    <div className="form-inline mb-2">
                                        <div className="input-group w-50">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Rechercher un document"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                            <div className="input-group-append">
                                                <Button
                                                    onClick={handleSearch}
                                                    className="btn-secondary"
                                                    icon="fa fa-search"
                                                    block={false}
                                                />
                                            </div>
                                            <div className="input-group-append ml-2">
                                                <Button
                                                    onClick={actualiser}
                                                    className="btn-success"
                                                    icon="fa fa-sync"
                                                    block={false}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div
                                            style={{
                                                minHeight: "200px",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div
                                                className="spinner-border text-primary"
                                                style={{ width: "3rem", height: "3rem" }}
                                                role="status"
                                            >
                                                <span className="sr-only">Chargement...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/*  <Table
                                                columns={columns}
                                                data={documents}
                                                actions={actions}
                                                startIndex={(pagination.current_page - 1) * 20}
                                                emptyMessage="Aucun document trouvé"
                                            /> */}

                                            <Table
                                                columns={columns}
                                                data={
                                                    utilisateur.role === "admin"
                                                        ? documents
                                                        : documents.filter(
                                                            (doc) => doc.id_direction === utilisateur.id_direction
                                                        )
                                                }
                                                actions={actions}
                                                startIndex={(pagination.current_page - 1) * 20}
                                                emptyMessage="Aucun document trouvé"
                                            />



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
                                                        className={`page-item ${pagination.current_page === pagination.last_page ? "disabled" : ""}`}
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
                            ) : (

                                <div className="col-md-10 offset-md-1">
                                    <form onSubmit={handleSubmit} className="bg-white p-4 shadow rounded">

                                        <div className="row">
                                            {/* Direction */}
                                            <div className="form-group col-md-6 mb-3">
                                                <label>
                                                    Direction <span style={{ color: "red" }}>*</span>
                                                </label>
                                                <Droplist
                                                    name="id_direction"
                                                    value={formData.id_direction}
                                                    onChange={handleChange}
                                                    options={directions}
                                                    placeholder="-- Sélectionnez une direction --"
                                                    error={errors.id_direction && errors.id_direction[0]}
                                                />
                                            </div>

                                            {/* Emplacement */}
                                            <div className="form-group col-md-6 mb-3">
                                                <label>
                                                    Emplacement <span style={{ color: "red" }}>*</span>
                                                </label>
                                                <Droplist
                                                    name="id_emplacement"
                                                    value={formData.id_emplacement}
                                                    onChange={handleChange}
                                                    options={emplacements}
                                                    placeholder="-- Sélectionnez un emplacement --"
                                                    error={errors.id_emplacement && errors.id_emplacement[0]}
                                                />
                                            </div>

                                            {/* Classeur */}
                                            <div className="form-group col-md-6 mb-3">
                                                <label>
                                                    Classeur <span style={{ color: "red" }}>*</span>
                                                </label>
                                                <Droplist
                                                    name="id_classeur"
                                                    value={formData.id_classeur}
                                                    onChange={handleChange}
                                                    options={classeurs}
                                                    placeholder="-- Sélectionnez un classeur --"
                                                    error={errors.id_classeur && errors.id_classeur[0]}
                                                />
                                            </div>

                                            {/* Date création */}
                                            <div className="form-group col-md-6 mb-3">
                                                <label>
                                                    Date de création <span style={{ color: "red" }}>*</span>
                                                </label>
                                                <Input
                                                    type="date"
                                                    name="date_creation"
                                                    value={formData.date_creation}
                                                    onChange={handleChange}
                                                    error={errors.date_creation && errors.date_creation[0]}
                                                />
                                            </div>

                                            {/* Date enregistrement */}
                                            <div className="form-group col-md-6 mb-3">
                                                <label>
                                                    Date d'enregistrement <span style={{ color: "red" }}>*</span>
                                                </label>
                                                <Input
                                                    type="date"
                                                    name="date_enregistrement"
                                                    value={formData.date_enregistrement}
                                                    onChange={handleChange}
                                                    error={errors.date_enregistrement && errors.date_enregistrement[0]}
                                                />
                                            </div>

                                            {/* Intitulé */}
                                            <div className="form-group col-md-6 mb-3">
                                                <label>
                                                    Intitulé <span style={{ color: "red" }}>*</span>
                                                </label>
                                                <Input
                                                    name="intitule"
                                                    placeholder="Intitulé"
                                                    value={formData.intitule}
                                                    onChange={handleChange}
                                                    icon="fas fa-file-alt"
                                                    error={errors.intitule && errors.intitule[0]}
                                                />
                                            </div>

                                            {/* Numéro Référence */}
                                            <div className="form-group col-md-6 mb-3">
                                                <label>
                                                    Numéro Référence <span style={{ color: "red" }}>*</span>
                                                </label>
                                                <Input
                                                    name="num_reference"
                                                    placeholder="Numéro Référence"
                                                    value={formData.num_reference}
                                                    onChange={handleChange}
                                                    icon="fas fa-hashtag"
                                                    error={errors.num_reference && errors.num_reference[0]}
                                                />
                                            </div>

                                            {/* Mot Clé */}
                                            <div className="form-group col-md-6 mb-3">
                                                <label>
                                                    Mot Clé <span style={{ color: "red" }}>*</span>
                                                </label>
                                                <Input
                                                    name="mot_cle"
                                                    placeholder="Mot Clé"
                                                    value={formData.mot_cle}
                                                    onChange={handleChange}
                                                    icon="fas fa-key"
                                                    error={errors.mot_cle && errors.mot_cle[0]}
                                                />
                                            </div>

                                            {/* Numéro Déclaration */}
                                            <div className="form-group col-md-6 mb-3">
                                                <label>
                                                    Numéro Déclaration <span style={{ color: "red" }}>*</span>
                                                </label>
                                                <Input
                                                    name="num_declaration"
                                                    placeholder="Numéro Déclaration"
                                                    value={formData.num_declaration}
                                                    onChange={handleChange}
                                                    icon="fas fa-file-signature"
                                                    error={errors.num_declaration && errors.num_declaration[0]}
                                                />
                                            </div>

                                            {/* id_user caché */}
                                            <input type="hidden" name="id_user" value="1" />
                                        </div>

                                        {/* Boutons */}
                                        <div className="row mt-4 justify-content-start">
                                            {documentEnEdition ? (
                                                <>
                                                    <div className="col-3 px-1">
                                                        <Button type="submit" className="btn-warning py-2 px-4" icon="fas fa-edit">
                                                            Modifier
                                                        </Button>
                                                    </div>
                                                    <div className="col-3 px-1">
                                                        <Button
                                                            type="button"
                                                            className="btn-secondary py-2 px-4"
                                                            onClick={() => {
                                                                handleCancelEdit();
                                                                setValeurtable(true);
                                                            }}
                                                            icon="fas fa-reply"
                                                        >
                                                            Annuler
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="col-6 px-1">
                                                    <Button type="submit" className="btn-primary py-2 px-4" icon="ion-plus">
                                                        Ajouter
                                                    </Button>
                                                </div>
                                            )}
                                        </div>


                                    </form>
                                </div>



                            )}
                        </div>
                    </div>
                </section>
            </div>
            <DocumentModal
                modalId="documentModal"
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                monid={selectedId} // id personnel
                projet={monprojet} // id classeur
                idclasseur={idclasseur}
                verification={true}
            />
        </div>
    );
};

export default DocumentScreen;
