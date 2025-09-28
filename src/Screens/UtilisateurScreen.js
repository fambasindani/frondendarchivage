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


const UtilisateurScreen = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [directions, setDirections] = useState([]);
  const [notes, setNotes] = useState([]);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  // initialiser à null pour afficher l'option placeholder par défaut
  const [entreprise, setEntreprise] = useState(null);
  const [entrepriseSelectionnee, setEntrepriseSelectionnee] = useState(null);

  const [idDirection, setIdDirection] = useState(null);
  const [idNote, setIdNote] = useState(null);

  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [utilisateurEnEdition, setUtilisateurEnEdition] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = GetTokenOrRedirect();

  useEffect(() => {
    if (token) {
      fetchUtilisateurs();
      fetchRoles();
      fetchDirections();
      fetchNotes();
    }
  }, [pagination.current_page, token]);

  const fetchUtilisateurs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/utilisateurs?page=${pagination.current_page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUtilisateurs(res.data.data || []);
      setPagination({ current_page: res.data.current_page, last_page: res.data.last_page });
    } catch (err) {
      console.error(err);
      Swal.fire("Erreur", "Erreur lors du chargement des utilisateurs", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setRoles(["admin", "utilisateur", "encodeur"]);
  };

  const fetchDirections = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/direction`, { headers: { Authorization: `Bearer ${token}` } });
      setDirections(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Erreur", "Erreur lors du chargement des directions", "error");
    }
  };

  const fetchNotes = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/centre`, { headers: { Authorization: `Bearer ${token}` } });
      setNotes(res.data.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Erreur", "Erreur lors du chargement des notes", "error");
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = {};
    if (!nom) validationErrors.nom = ["Le nom est obligatoire."];
    if (!prenom) validationErrors.prenom = ["Le prénom est obligatoire."];
    if (!email) validationErrors.email = ["L'email est obligatoire."];
    if (!password) validationErrors.password = ["Le mot de passe est obligatoire."];
    if (!role) validationErrors.role = ["Le rôle est obligatoire."];
    if (entreprise === null) validationErrors.entreprise = ["Le type d'entreprise est obligatoire."];
    if (entrepriseSelectionnee === 1 && !idNote) validationErrors.id_note = ["La note est obligatoire."];
    if (entrepriseSelectionnee === 0 && !idDirection) validationErrors.id_direction = ["La direction est obligatoire."];

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const payload = {
        nom,
        prenom,
        email,
        password,
        role,
        entreprise,
        id_direction: idDirection,
        id_note: idNote,
      };

     // alert(idNote)

      if (utilisateurEnEdition) {
        await axios.put(`${API_BASE_URL}/utilisateurs/${utilisateurEnEdition}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Succès", "Utilisateur mis à jour avec succès", "success");
      } else {
        await axios.post(`${API_BASE_URL}/utilisateurs`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Succès", "Utilisateur ajouté avec succès", "success");
      }

      resetForm();
      fetchUtilisateurs();
      setIsFormVisible(false);
    } catch (error) {
      if (error.response?.data?.errors) setErrors(error.response.data.errors);
      else Swal.fire("Erreur", error.response?.data?.message || "Une erreur est survenue", "error");
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/utilisateurs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNom(res.data.nom || "");
      setPrenom(res.data.prenom || "");
      setEmail(res.data.email || "");
      setRole(res.data.role || "");
      setEntreprise(res.data.entreprise ?? null);
      setEntrepriseSelectionnee(res.data.entreprise ?? null); // <-- important pour afficher le bon sous-select
      setIdDirection(res.data.id_direction ?? null);
      setIdNote(res.data.id_note ?? null);
      setUtilisateurEnEdition(id);
      setIsFormVisible(true);
    } catch (err) {
      console.error(err);
      Swal.fire("Erreur", "Erreur lors du chargement de l'utilisateur", "error");
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Voulez-vous désactiver cet utilisateur ?",
      text: "Cette action désactivera l'utilisateur.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, désactiver",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${API_BASE_URL}/utilisateurs/${id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(() => {
            Swal.fire("Désactivé", "L'utilisateur a été désactivé", "success");
            fetchUtilisateurs();
          })
          .catch((error) => {
            console.error(error);
            Swal.fire("Erreur", "Erreur lors de la désactivation", "error");
          });
      }
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.last_page) setPagination((prev) => ({ ...prev, current_page: page }));
  };

  const resetForm = () => {
    setNom("");
    setPrenom("");
    setEmail("");
    setPassword("");
    setRole("");
    setEntreprise(null);               // <-- mettre null (et non 0)
    setEntrepriseSelectionnee(null);   // <-- réinitialiser aussi la sélection d'entité
    setIdDirection(null);
    setIdNote(null);
    setUtilisateurEnEdition(null);
    setErrors({});
  };

  const columns = [
    { key: "nom", label: "Nom" },
    { key: "prenom", label: "Prénom" },
    { key: "email", label: "Email" },
    { key: "role", label: "Rôle" },
    { key: "entreprise", label: "Type", render: (row) => (row.entreprise ? "note de perception" : "Direction") },
  ];

  const actions = [
    { icon: "far fa-edit", color: "info", onClick: (row) => handleEdit(row.id) },
    { icon: "far fa-trash-alt", color: "secondary", onClick: (row) => handleDelete(row.id) },
  ];

  return (
    <div>
      <Menus />
      <Head />
      <div className="content-wrapper" style={{ backgroundColor: "whitesmoke", minHeight: "100vh" }}>
        <div className="content-header">
          <div className="container-fluid">
            <h5 className="p-2 mb-3" style={{ backgroundColor: "#343a40", color: "#fff" }}>
              <i className="ion-ios-toggle-outline mr-2" /> Gestion des Utilisateurs
            </h5>
          </div>
        </div>

        <section className="content">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-9"></div>
              <div className="col-3 d-flex justify-content-end">
                <Button
                  className="btn-success"
                  onClick={() => {
                    if (isFormVisible) {
                      setIsFormVisible(false);
                      resetForm();
                    } else {
                      resetForm();
                      setIsFormVisible(true);
                    }
                  }}
                  icon={isFormVisible ? "ion-arrow-left-b" : "ion-plus-circled"}
                >
                  {isFormVisible ? "Retour à la liste" : "Ajouter un utilisateur"}
                </Button>
              </div>
            </div>

            <div className="row">
              {isFormVisible ? (
                <div className="col-md-6 offset-md-3">
                  <form onSubmit={handleSubmit} className="bg-white p-3 shadow rounded">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="mt-3">Nom <span style={{ color: "red" }}>*</span></label>
                        <Input name="nom" placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} error={errors.nom && errors.nom[0]} />

                        <label className="mt-3">Email <span style={{ color: "red" }}>*</span></label>
                        <Input name="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email && errors.email[0]} />

                        <label className="mt-3">Rôle <span style={{ color: "red" }}>*</span></label>
                        <Droplist
                          name="role"
                          value={role || ""}
                          onChange={(e) => setRole(e.target.value)}
                          options={roles.map((r) => ({ id: r, nom: r }))}
                          placeholder="-- Sélectionnez un rôle --"
                          error={errors.role && errors.role[0]}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="mt-3">Prénom <span style={{ color: "red" }}>*</span></label>
                        <Input name="prenom" placeholder="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} error={errors.prenom && errors.prenom[0]} />

                        <label className="mt-3">Mot de passe <span style={{ color: "red" }}>*</span></label>
                        <Input type="password" name="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password && errors.password[0]} />

                        <label className="mt-3">Type d'entreprise <span style={{ color: "red" }}>*</span></label>
                        <Droplist
                          name="entreprise"
                          value={entreprise === null ? "" : String(entreprise)}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value);
                            setEntreprise(value);
                            setEntrepriseSelectionnee(value);
                          }}
                          options={[
                            { id: 0, nom: "Direction" },
                            { id: 1, nom: "Note de perception" },
                          ]}
                          placeholder="-- Sélectionnez un type --"
                          error={errors.entreprise && errors.entreprise[0]}
                        />

                        {entrepriseSelectionnee !== null && (
                          <>
                            <label className="mt-3">Entité <span style={{ color: "red" }}>*</span></label>
                            {entrepriseSelectionnee === 1 ? (
                              <Droplist
                                name="id_note"
                                value={idNote === null ? "" : String(idNote)}
                                onChange={(e) => setIdNote(Number(e.target.value))}
                                options={notes.map((n) => ({ id: n.id, nom: n.nom }))}
                                placeholder="-- Sélectionnez une note --"
                                error={errors.id_note && errors.id_note[0]}
                              />
                            ) : (
                              <Droplist
                                name="id_direction"
                                value={idDirection === null ? "" : String(idDirection)}
                                onChange={(e) => setIdDirection(Number(e.target.value))}
                                options={directions.map((d) => ({ id: d.id, nom: d.nom }))}
                                placeholder="-- Sélectionnez une direction --"
                                error={errors.id_direction && errors.id_direction[0]}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="row mt-3">
                      {utilisateurEnEdition ? (
                        <>
                          <div className="col-6 px-1">
                            <Button type="submit" className="btn-warning w-100 py-2" icon="fas fa-edit">Modifier</Button>
                          </div>
                          <div className="col-6 px-1">
                            <Button type="button" className="btn-secondary w-100 py-2" onClick={() => { resetForm(); setIsFormVisible(false); }} icon="fas fa-reply">Annuler</Button>
                          </div>
                        </>
                      ) : (
                        <div className="col-12 px-1">
                          <Button type="submit" className="btn-primary w-100 py-2" icon="ion-plus">Ajouter</Button>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                <div className="col-md-12">
                  <div className="form-inline mb-2">
                    <div className="input-group w-50">
                      <input type="text" className="form-control" placeholder="Rechercher un utilisateur" value={search} onChange={(e) => setSearch(e.target.value)} />
                      <div className="input-group-append">
                        <Button onClick={handleSearch} className="btn-secondary" icon="fa fa-search" block={false} />
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div style={{ minHeight: "200px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
                        <span className="sr-only">Chargement...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Table columns={columns} data={utilisateurs} actions={actions} emptyMessage="Aucun utilisateur trouvé" />
                      <nav>
                        <ul className="pagination">
                          <li className={`page-item ${pagination.current_page === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => handlePageChange(pagination.current_page - 1)}>Précédent</button>
                          </li>
                          {Array.from({ length: pagination.last_page }, (_, i) => (
                            <li key={i} className={`page-item ${pagination.current_page === i + 1 ? "active" : ""}`}>
                              <button className="page-link" onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
                            </li>
                          ))}
                          <li className={`page-item ${pagination.current_page === pagination.last_page ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => handlePageChange(pagination.current_page + 1)}>Suivant</button>
                          </li>
                        </ul>
                      </nav>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UtilisateurScreen;
