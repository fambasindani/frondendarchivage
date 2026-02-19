import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import Input from '../Composant/Input';
import { 
  FaTimes, 
  FaPlus, 
  FaArrowLeft, 
  FaSearch, 
  FaSave, 
  FaEdit, 
  FaBuilding, 
  FaPhone, 
  FaMap, 
  FaIdCard, 
  FaEnvelope,
  FaSpinner,
  FaUser,
  FaInfoCircle
} from 'react-icons/fa';

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
  const [showTable, setShowTable] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    nom_raison_sociale: false,
    telephone: false,
    email: false
  });

  useEffect(() => {
    if (isOpen) fetchAssujettis();
  }, [isOpen]);

  const fetchAssujettis = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/assujettis`);
      setAssujettis(res.data.data);
    } catch (error) {
      Swal.fire('Erreur', 'Erreur lors du chargement des assujettis', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      fetchAssujettis();
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/assujettis/search?search=${searchTerm}`);
      setAssujettis(res.data.data);
    } catch (error) {
      Swal.fire('Erreur', 'Erreur lors de la recherche', 'error');
    } finally {
      setLoading(false);
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

    setSubmitting(true);
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/assujettis/${currentId}`, formData);
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Assujetti mis à jour avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await axios.post(`${API_BASE_URL}/assujettis`, formData);
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Assujetti ajouté avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      }
      fetchAssujettis();
      resetForm();
      setShowTable(true);
    } catch (error) {
      Swal.fire('Erreur', 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSubmitting(false);
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
    setShowTable(false);
  };

  const handlePlus = (assujetti) => {
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
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          
          {/* Header avec dégradé */}
          <div className="modal-header bg-gradient-primary text-white position-relative py-3 px-4" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderBottom: 'none'
          }}>
            <h5 className="modal-title mb-0 font-weight-bold d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-2 mr-3 d-flex align-items-center justify-content-center">
                <FaBuilding className="text-white" size={18} />
              </div>
              Gestion des Assujettis
            </h5>
            <button 
              type="button" 
              className="btn btn-sm btn-light position-absolute"
              onClick={onClose}
              style={{
                top: '12px',
                right: '15px',
                border: 'none',
                fontSize: '1.2rem',
                lineHeight: 1,
                padding: '0.25rem 0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                width: '32px',
                height: '32px'
              }}
            >
              <FaTimes />
            </button>
          </div>

          <div className="modal-body p-4">
            {/* Bouton bascule stylisé */}
            <div className="mb-4">
              <button
                className={`btn d-flex align-items-center ${showTable ? 'btn-success' : 'btn-info'}`}
                onClick={() => {
                  resetForm();
                  setShowTable(!showTable);
                }}
                style={{ 
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: '500',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                {showTable ? (
                  <>
                    <FaPlus className="mr-2" />
                    Ajouter un assujetti
                  </>
                ) : (
                  <>
                    <FaArrowLeft className="mr-2" />
                    Retour à la liste
                  </>
                )}
              </button>
            </div>

            {/* Formulaire */}
            {!showTable && (
              <form onSubmit={handleSubmit} className="mb-4 border rounded p-4" style={{ 
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <h6 className="font-weight-bold mb-3 d-flex align-items-center text-primary">
                  <FaInfoCircle className="mr-2" />
                  {isEditing ? 'Modifier l\'assujetti' : 'Nouvel assujetti'}
                </h6>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Input
                      name="nom_raison_sociale"
                      placeholder="Nom Raison Sociale"
                      label="Nom Raison Sociale"
                      value={formData.nom_raison_sociale}
                      onChange={handleChange}
                      error={errors.nom_raison_sociale && "Le nom raison sociale est obligatoire."}
                      icon={<FaBuilding className="text-primary" />}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <Input
                      name="telephone"
                      placeholder="Téléphone"
                      label="Téléphone"
                      value={formData.telephone}
                      onChange={handleChange}
                      error={errors.telephone && "Le téléphone est obligatoire."}
                      icon={<FaPhone className="text-primary" />}
                      required
                    />
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Input
                      name="bp"
                      placeholder="BP"
                      label="BP"
                      value={formData.bp}
                      onChange={handleChange}
                      icon={<FaMap className="text-primary" />}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <Input
                      name="numero_nif"
                      placeholder="Numéro NIF"
                      label="Numéro NIF"
                      value={formData.numero_nif}
                      onChange={handleChange}
                      icon={<FaIdCard className="text-primary" />}
                    />
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Input
                      name="email"
                      placeholder="Email"
                      label="Email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email && "Format de l'email invalide."}
                      icon={<FaEnvelope className="text-primary" />}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-3">
                  <button 
                    type="button" 
                    className="btn btn-light mr-2" 
                    onClick={() => {
                      resetForm();
                      setShowTable(true);
                    }}
                    disabled={submitting}
                    style={{ borderRadius: '8px', padding: '10px 20px' }}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary d-flex align-items-center"
                    disabled={submitting}
                    style={{ 
                      borderRadius: '8px',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="fa-spin mr-2" />
                        {isEditing ? 'Mise à jour...' : 'Création...'}
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        {isEditing ? 'Mettre à jour' : 'Ajouter'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Tableau */}
            {showTable && (
              <div>
                {/* Barre de recherche stylisée */}
                <div className="d-flex mb-4">
                  <div className="input-group" style={{ maxWidth: '400px' }}>
                    <div className="input-group-prepend">
                      <span className="input-group-text bg-white border-right-0">
                        <FaSearch className="text-primary" />
                      </span>
                    </div>
                    <input
                      type="text"
                      className="form-control border-left-0"
                      placeholder="Rechercher par nom..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ height: '45px' }}
                    />
                  </div>
                  <button 
                    className="btn btn-primary ml-2 d-flex align-items-center" 
                    onClick={handleSearch}
                    style={{ 
                      borderRadius: '8px',
                      height: '45px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    <FaSearch className="mr-2" />
                    Rechercher
                  </button>
                  {searchTerm && (
                    <button 
                      className="btn btn-light ml-2 d-flex align-items-center" 
                      onClick={() => { setSearchTerm(''); fetchAssujettis(); }}
                      style={{ borderRadius: '8px', height: '45px' }}
                    >
                      <FaTimes className="mr-2" />
                      Effacer
                    </button>
                  )}
                </div>

                {/* Tableau stylisé */}
                <div className="table-responsive">
                  <table className="table table-hover border">
                    <thead className="thead-light">
                      <tr>
                        <th className="border-0 py-3">Nom Raison Sociale</th>
                        <th className="border-0 py-3">Téléphone</th>
                        <th className="border-0 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="3" className="text-center py-5">
                            <FaSpinner className="fa-spin text-primary" size={32} />
                            <p className="text-muted mt-2">Chargement des assujettis...</p>
                          </td>
                        </tr>
                      ) : currentItems.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-5">
                            <div className="text-muted">
                              <FaBuilding className="mb-3" style={{ fontSize: '3rem', opacity: 0.5 }} />
                              <h6>Aucun assujetti trouvé</h6>
                              <p className="mb-0 small">Aucun assujetti ne correspond à votre recherche.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((assujetti) => (
                          <tr key={assujetti.id} className="border-bottom">
                            <td className="align-middle">
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-primary bg-opacity-10 p-2 mr-3 d-flex align-items-center justify-content-center">
                                  <FaBuilding className="text-primary" size={16} />
                                </div>
                                <span className="font-weight-medium">{assujetti.nom_raison_sociale}</span>
                              </div>
                            </td>
                            <td className="align-middle">
                              <div className="d-flex align-items-center">
                                <FaPhone className="mr-2 text-muted" size={12} />
                                {assujetti.telephone}
                              </div>
                            </td>
                            <td className="align-middle text-center">
                              <button 
                                className="btn btn-sm btn-info mr-2 d-inline-flex align-items-center"
                                onClick={() => handleEdit(assujetti)}
                                style={{ borderRadius: '8px' }}
                              >
                                <FaEdit className="mr-1" size={14} />
                                Modifier
                              </button>
                              <button 
                                className="btn btn-sm btn-success d-inline-flex align-items-center"
                                onClick={() => handlePlus(assujetti)}
                                style={{ borderRadius: '8px' }}
                              >
                                <FaPlus className="mr-1" size={14} />
                                Sélectionner
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination stylisée */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted small">
                      Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, totalItems)} sur {totalItems} assujettis
                    </div>
                    <nav>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link border-0" 
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{ borderRadius: '8px', margin: '0 3px' }}
                          >
                            Précédent
                          </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, index) => {
                          const pageNum = index + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                <button 
                                  className="page-link border-0" 
                                  onClick={() => paginate(pageNum)}
                                  style={{ 
                                    borderRadius: '8px', 
                                    margin: '0 3px',
                                    background: currentPage === pageNum ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                                    borderColor: 'transparent',
                                    color: currentPage === pageNum ? 'white' : '#007bff'
                                  }}
                                >
                                  {pageNum}
                                </button>
                              </li>
                            );
                          } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                            return (
                              <li key={pageNum} className="page-item disabled">
                                <span className="page-link border-0" style={{ borderRadius: '8px', margin: '0 3px' }}>...</span>
                              </li>
                            );
                          }
                          return null;
                        })}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link border-0" 
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{ borderRadius: '8px', margin: '0 3px' }}
                          >
                            Suivant
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 bg-light py-3 px-4">
            <button 
              type="button" 
              className="btn btn-light px-4" 
              onClick={onClose}
              style={{ borderRadius: '8px', height: '45px' }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .modal-content {
          border-radius: 16px;
          animation: modalFadeIn 0.3s ease;
        }
        
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .modal-header {
          border-radius: 16px 16px 0 0;
        }
        
        .table th {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6c757d;
          background-color: #f8f9fa;
        }
        
        .table td {
          vertical-align: middle;
          padding: 1rem 0.75rem;
        }
        
        .btn {
          transition: all 0.2s ease;
        }
        
        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .bg-opacity-10 {
          opacity: 0.1;
        }
        
        .rounded-circle {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .page-item.active .page-link {
          color: white;
          box-shadow: 0 4px 10px rgba(102,126,234,0.3);
        }
        
        .page-link {
          transition: all 0.2s ease;
        }
        
        .page-link:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .input-group-text {
          border-radius: 10px 0 0 10px;
          background-color: #f8f9fa;
        }
        
        .form-control {
          border-radius: 0 10px 10px 0;
          border: 1px solid #e0e0e0;
        }
        
        .form-control:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
      `}</style>
    </div>
  );
};

export default ModalAssujetti;