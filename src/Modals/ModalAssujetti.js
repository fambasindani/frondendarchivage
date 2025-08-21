import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import Input from '../Composant/Input';


const ModalAssujetti = ({ isOpen, onClose, selectnom }) => {
  const [assujettis, setAssujettis] = useState([]);
  const [formData, setFormData] = useState({
    nom_raison_sociale: '',
    telephone: '',
    bp: '',
    numero_nif: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTable, setShowTable] = useState(true); // true = table visible
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [errors, setErrors] = useState({
    nom_raison_sociale: false,
    telephone: false,
    email: false
  });

  useEffect(() => {
    if (isOpen) fetchAssujettis();
  }, [isOpen]);

  const fetchAssujettis = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/assujettis`);
      setAssujettis(res.data.data);
    } catch (error) {
      Swal.fire('Erreur', 'Erreur lors du chargement des assujettis', 'error');
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      fetchAssujettis();
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/assujettis/search?search=${searchTerm}`);
      setAssujettis(res.data.data);
    } catch (error) {
      Swal.fire('Erreur', 'Erreur lors de la recherche', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: !value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {
      nom_raison_sociale: !formData.nom_raison_sociale.trim(),
      telephone: !formData.telephone.trim(),
      email: formData.email && !/\S+@\S+\.\S+/.test(formData.email),
    };
    setErrors(newErrors);

    if (newErrors.nom_raison_sociale || newErrors.telephone || newErrors.email) {
      return;
    }

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/assujettis/${currentId}`, formData);
        Swal.fire('Succès', 'Assujetti mis à jour avec succès', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/assujettis`, formData);
        Swal.fire('Succès', 'Assujetti ajouté avec succès', 'success');
      }
      fetchAssujettis();
      resetForm();
      setShowTable(true); // Affiche la table après ajout ou modification
    } catch (error) {
      alert(error)
      Swal.fire('Erreur', 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ nom_raison_sociale: '', telephone: '', bp: '', numero_nif: '', email: '' });
    setIsEditing(false);
    setCurrentId(null);
    setErrors({ nom_raison_sociale: false, telephone: false, email: false });
  };

  const handleEdit = (assujetti) => {
    setFormData({
      nom_raison_sociale: assujetti.nom_raison_sociale,
      telephone: assujetti.telephone,
      bp: assujetti.bp || '',
      numero_nif: assujetti.numero_nif || '',
      email: assujetti.email || '',
    });
    setIsEditing(true);
    setCurrentId(assujetti.id);
    setShowTable(false); // Affiche le formulaire
  };

  const handlePlus = (assujetti) => {
    //selectnom(assujetti.nom_raison_sociale);
    selectnom({
      nom_raison_sociale: assujetti.nom_raison_sociale,
      id: assujetti.id
    });
    onClose();
  };

  const totalItems = assujettis.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = assujettis.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title">Gestion des Assujettis</h5>
            <button type="button" className="close text-white" onClick={onClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="modal-body">
            {/* 🔁 Bouton bascule */}
            <div className="mb-3 text-right">
              <button
                className={`btn ${showTable ? 'btn-info' : 'btn-success'} btn-sm`}
                onClick={() => {
                  resetForm();
                  setShowTable(!showTable);
                }}
              >
                <i className={`fa ${showTable ? 'fa-plus-circle' : 'fa-arrow-left'} mr-1`}></i>
                {showTable ? 'Ajouter un assujetti' : 'Retour à la liste des assujetti'}
              </button>
            </div>

            {/* Formulaire */}
            {!showTable && (
              <form onSubmit={handleSubmit} className="mb-4 border rounded p-4" style={{ backgroundColor: '#f9f9f9' }}>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>
                      Nom Raison Sociale <span style={{ color: 'red' }}>*</span>
                    </label>
                    <Input
                      name="nom_raison_sociale"
                      placeholder="Nom Raison Sociale"
                      value={formData.nom_raison_sociale}
                      onChange={handleChange}
                      error={errors.nom_raison_sociale && "Le nom raison sociale est obligatoire."}
                      icon="fas fa-building" // Icône ajoutée
                    />
                  </div>
                  <div className="form-group col-md-6">
                    <label>
                      Téléphone <span style={{ color: 'red' }}>*</span>
                    </label>
                    <Input
                      name="telephone"
                      placeholder="Téléphone"
                      value={formData.telephone}
                      onChange={handleChange}
                      error={errors.telephone && "Le téléphone est obligatoire."}
                      icon="fas fa-phone" // Icône ajoutée
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>BP</label>
                    <Input
                      name="bp"
                      placeholder="BP"
                      value={formData.bp}
                      onChange={handleChange}
                      icon="fas fa-map" // Icône ajoutée
                    />
                  </div>
                  <div className="form-group col-md-6">
                    <label>Numéro NIF</label>
                    <Input
                      name="numero_nif"
                      placeholder="Numéro NIF"
                      value={formData.numero_nif}
                      onChange={handleChange}
                      icon="fas fa-id-card" // Icône ajoutée
                    />
                  </div>
                  <div className="form-group col-md-6">
                    <label>Email</label>
                    <Input
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email && "Format de l'email invalide."}
                      icon="fas fa-envelope" // Icône ajoutée
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-success btn-sm">
                  <i className="fa fa-save mr-1"></i> {isEditing ? 'Modifier' : 'Ajouter'}
                </button>
              </form>
            )}

            {/* 📋 Tableau */}
            {showTable && (
              <div>
                {/* 🔍 Barre de recherche */}
                <div className="form-inline mb-3">
                  <input
                    type="text"
                    className="form-control mr-2"
                    placeholder="Rechercher par nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-info" onClick={handleSearch}>
                    <i className="fa fa-search mr-1"></i> Rechercher
                  </button>
                  {searchTerm && (
                    <button className="btn btn-secondary ml-2" onClick={() => { setSearchTerm(''); fetchAssujettis(); }}>
                      <i className="fa fa-times"></i>
                    </button>
                  )}
                </div>

                <table className="table table-bordered table-hover">
                  <thead className="thead-dark">
                    <tr>
                      <th>Nom Raison Sociale</th>
                      <th>Téléphone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((assujetti) => (
                      <tr key={assujetti.id}>
                        <td>{assujetti.nom_raison_sociale}</td>
                        <td>{assujetti.telephone}</td>
                        <td>
                          <button onClick={() => handleEdit(assujetti)} className="btn btn-info btn-sm mr-2">
                            <i className="fa fa-edit"></i>
                          </button>
                          <button onClick={() => handlePlus(assujetti)} className="btn btn-success btn-sm">
                            <i className="fa fa-plus"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentItems.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center">Aucun assujetti trouvé</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                <nav>
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                        Précédent
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <li className={`page-item ${currentPage === index + 1 ? 'active' : ''}`} key={index}>
                        <button className="page-link" onClick={() => paginate(index + 1)}>
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                        Suivant
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAssujetti;