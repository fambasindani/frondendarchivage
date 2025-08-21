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

const MinistereScreen = () => {
    const [articles, setArticles] = useState([]);
    const [nom, setNom] = useState("");
    const [article_budgetaire, setArticleBudgetaire] = useState("");
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
    const [articleEnEdition, setArticleEnEdition] = useState(null);
    const [modeRecherche, setModeRecherche] = useState(false);
    const [valeurtable, setValeurtable] = useState(true);
    const [loading, setLoading] = useState(false);

    const token = GetTokenOrRedirect();

    useEffect(() => {
        if (token) {
            fetchArticles();
        }
    }, [pagination.current_page, modeRecherche, token]);

    const fetchArticles = async () => {
        if (!token) return;

        setLoading(true);

        try {
            let res;
            if (modeRecherche && search.trim() !== "") {
                res = await axios.post(
                    `${API_BASE_URL}/search-article`,
                    { search, page: pagination.current_page },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                res = await axios.get(`${API_BASE_URL}/article?page=${pagination.current_page}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            setArticles(res.data.data);
            setPagination({ current_page: res.data.current_page, last_page: res.data.last_page });
        } catch (err) {
            console.error(err);
            Swal.fire("Erreur", "Erreur lors du chargement des articles budgétaires", "error");
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (!token) return;

        try {
            if (articleEnEdition) {
                await axios.put(
                    `${API_BASE_URL}/update-article/${articleEnEdition}`,
                    { nom, article_budgetaire },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire("Succès", "Article budgétaire modifié avec succès", "success");
            } else {
                await axios.post(
                    `${API_BASE_URL}/create-article`,
                    { nom, article_budgetaire },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire("Succès", "Article budgétaire ajouté avec succès", "success");
            }

            // Réinitialisation après soumission
            setNom("");
            setArticleBudgetaire("");
            setArticleEnEdition(null);
            setValeurtable(true);
            setModeRecherche(false);
            setSearch("");
            setPagination({ current_page: 1, last_page: 1 });
            fetchArticles();
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
            const res = await axios.get(`${API_BASE_URL}/edit-article/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNom(res.data.nom);
            setArticleBudgetaire(res.data.article_budgetaire);
            setArticleEnEdition(id);
            setValeurtable(false);
        } catch (err) {
            console.error(err);
            Swal.fire("Erreur", "Erreur lors du chargement de l'article budgétaire", "error");
        }
    };

    const handleDelete = (id) => {
        if (!token) return;

        Swal.fire({
            title: "Voulez-vous supprimer cet article budgétaire ?",
            text: "Cette action va désactiver l'article budgétaire.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Oui, supprimer",
            cancelButtonText: "Annuler",
        }).then((result) => {
            if (result.isConfirmed) {
                axios
                    .delete(`${API_BASE_URL}/delete-article/${id}`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(() => {
                        Swal.fire("Supprimé !", "Article budgétaire désactivé avec succès.", "success");
                        setNom("");
                        setArticleBudgetaire("");
                        setArticleEnEdition(null);
                        setValeurtable(true);
                        setModeRecherche(false);
                        setSearch("");
                        setPagination({ current_page: 1, last_page: 1 });
                        fetchArticles();
                    })
                    .catch((error) => {
                        Swal.fire("Erreur", "Une erreur est survenue lors de la suppression.", "error");
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

    // IMPORTANT : ne PAS toucher à valeurtable ici pour ne pas casser la bascule
    const handleCancelEdit = () => {
        setNom("");
        setArticleBudgetaire("");
        setArticleEnEdition(null);
        setErrors({});
    };

    const columns = [
        { key: "nom", label: "Ministere" },
        { key: "article_budgetaire", label: "Article budgétaire" }
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
    ];

    return (
        <div>
            <Menus />
            <Head />
            <div className="content-wrapper" style={{ backgroundColor: "whitesmoke", minHeight: "100vh" }}>
                <div className="content-header">
                    <div className="container-fluid">
                        <h5 className="p-2 mb-3" style={{ backgroundColor: "#343a40", color: "#fff" }}>
                            <i className="ion-ios-toggle-outline mr-2" /> Gestion des Articles Budgétaires
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
                                        handleCancelEdit(); // réinitialise les champs
                                        setValeurtable(!valeurtable); // puis bascule entre table et formulaire
                                    }}
                                    icon={valeurtable ? "ion-plus-circled" : "ion-arrow-left-b"}
                                >
                                    {valeurtable ? "Ajouter un ministere" : "Retour à la liste des ministeres"}
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
                                                placeholder="Rechercher un article budgétaire"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                            <div className="input-group-append">
                                                <Button onClick={handleSearch} className="btn-secondary" icon="fa fa-search" block={false} />
                                            </div>
                                            <div className="input-group-append ml-2">
                                                <Button onClick={actualiser} className="btn-success" icon="fa fa-sync" block={false} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Zone de chargement */}
                                    {loading ? (
                                        <div style={{ minHeight: "200px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
                                                <span className="sr-only">Chargement...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Table
                                                columns={columns}
                                                data={articles}
                                                actions={actions}
                                                startIndex={(pagination.current_page - 1) * 10}
                                                emptyMessage="Aucun article budgétaire trouvé"
                                            />

                                            <nav>
                                                <ul className="pagination">
                                                    <li className={`page-item ${pagination.current_page === 1 ? "disabled" : ""}`}>
                                                        <button className="page-link" onClick={() => handlePageChange(pagination.current_page - 1)}>
                                                            Précédent
                                                        </button>
                                                    </li>
                                                    {Array.from({ length: pagination.last_page }, (_, i) => (
                                                        <li key={i} className={`page-item ${pagination.current_page === i + 1 ? "active" : ""}`}>
                                                            <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                                                                {i + 1}
                                                            </button>
                                                        </li>
                                                    ))}
                                                    <li className={`page-item ${pagination.current_page === pagination.last_page ? "disabled" : ""}`}>
                                                        <button className="page-link" onClick={() => handlePageChange(pagination.current_page + 1)}>
                                                            Suivant
                                                        </button>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="col-md-6 offset-md-3">
                                    <form onSubmit={handleSubmit} className="bg-white p-3 shadow rounded">
                                        <label>
                                            Ministere <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <Input
                                            name="nom"
                                            placeholder="Nom Ministere"
                                            value={nom}
                                            onChange={(e) => setNom(e.target.value)}
                                            icon="fas fa-file-invoice"
                                            error={errors.nom && errors.nom[0]}
                                        />
                                         <label>
                                            Article budgétaire <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <Input
                                            name="article_budgetaire"
                                            placeholder="Article budgétaire"
                                            value={article_budgetaire}
                                            onChange={(e) => setArticleBudgetaire(e.target.value)}
                                            icon="fas fa-hashtag"
                                            error={errors.article_budgetaire && errors.article_budgetaire[0]}
                                        />

                                        <div className="row mt-3">
                                            {articleEnEdition ? (
                                                <>
                                                    <div className="col-6 px-1">
                                                        <Button type="submit" className="btn-warning w-100 py-2" icon="fas fa-edit">
                                                            Modifier
                                                        </Button>
                                                    </div>
                                                    <div className="col-6 px-1">
                                                        <Button
                                                            type="button"
                                                            className="btn-secondary w-100 py-2"
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
                                                <div className="col-12 px-1">
                                                    <Button type="submit" className="btn-primary w-100 py-2" icon="ion-plus">
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
        </div>
    );
};

export default MinistereScreen;