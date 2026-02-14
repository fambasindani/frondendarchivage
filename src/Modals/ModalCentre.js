import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { 
  FaCloudUploadAlt, 
  FaQrcode, 
  FaEye, 
  FaTrashAlt, 
  FaFilePdf, 
  FaTimes,
  FaFileAlt,
  FaDownload,
  FaSpinner
} from "react-icons/fa";

const DocumentModal = ({ modalId, isOpen, onClose, monid, projet, idclasseur, verification }) => {
  const [fichiers, setFichiers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = GetTokenOrRedirect();

  useEffect(() => {
    const modal = window.$(`#${modalId}`);
    if (isOpen) {
      modal.modal("show");
      fetchDocuments();
    } else {
      modal.modal("hide");
    }

    modal.on("hidden.bs.modal", onClose);
    return () => modal.off("hidden.bs.modal", onClose);
  }, [isOpen]);

  const fetchDocuments = async () => {
    if (!monid) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/documents/${monid}`);
      setDocuments(res.data);
    } catch (error) {
      console.error("Erreur chargement documents", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const pdfOnly = selectedFiles.every(file => file.type === "application/pdf");

    if (!pdfOnly) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Seuls les fichiers PDF sont autorisés",
        confirmButtonColor: "#3085d6"
      });
      return;
    }

    setFichiers(selectedFiles);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (fichiers.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Attention",
        text: "Veuillez sélectionner au moins un fichier PDF",
        confirmButtonColor: "#3085d6"
      });
      return;
    }

    const formData = new FormData();
    fichiers.forEach(file => formData.append("files[]", file));
    formData.append("id_declaration", monid);
    formData.append("id_classeur", idclasseur);

    try {
      setUploading(true);
      await axios.post(`${API_BASE_URL}/documents-declaration/upload-multiple`, formData);
      Swal.fire({
        icon: "success",
        title: "Succès",
        text: "Documents PDF importés avec succès",
        timer: 2000,
        showConfirmButton: false
      });
      setFichiers([]);
      fetchDocuments();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Échec lors de l'import des documents",
        confirmButtonColor: "#3085d6"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (id) => {
    window.open(`${API_BASE_URL}/documents-declaration/download/${id}`, "_blank");
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Confirmation de suppression",
      text: "Voulez-vous vraiment supprimer ce document ? Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/delete-document/${id}`);
        Swal.fire({
          icon: "success",
          title: "Supprimé",
          text: "Document supprimé avec succès",
          timer: 2000,
          showConfirmButton: false
        });
        fetchDocuments();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Échec de la suppression du document",
          confirmButtonColor: "#3085d6"
        });
      }
    }
  };

  const handleScanning = async () => {
    setScanning(true);
    try {
      const response = await axios.post("http://localhost:9000/scan", {}, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Succès",
          text: "Document scanné et importé avec succès",
          timer: 2000,
          showConfirmButton: false
        });
        fetchDocuments();
      } else {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: `Échec du scan : ${response.data.message}`,
          confirmButtonColor: "#3085d6"
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Erreur lors de la communication avec le service de scan",
        confirmButtonColor: "#3085d6"
      });
      console.error("Erreur lors du scan", error);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="modal fade" id={modalId} tabIndex="-1" role="dialog" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          {/* Header */}
          <div className="modal-header bg-primary text-white position-relative py-3 px-4" style={{ borderRadius: '16px 16px 0 0' }}>
            <h5 className="modal-title mb-0 font-weight-bold d-flex align-items-center">
              <FaFilePdf className="mr-2" />
              Documents - {projet}
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-light position-absolute"
              onClick={onClose}
              data-dismiss="modal"
              aria-label="Close"
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
                zIndex: 1
              }}
            >
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {/* Section upload et scan */}
            {verification && (
              <form onSubmit={handleUpload} className="mb-4">
                <div className="row">
                  <div className="col-md-8">
                    <div className="form-group mb-3">
                      <label className="font-weight-bold mb-2 d-flex align-items-center">
                        <FaCloudUploadAlt className="text-primary mr-2" />
                        Importer des fichiers PDF
                      </label>
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text bg-light border-right-0">
                            <FaFileAlt className="text-primary" />
                          </span>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="application/pdf"
                          className="form-control"
                          onChange={handleFileChange}
                          disabled={uploading || scanning}
                          style={{ height: '45px' }}
                        />
                      </div>
                      {fichiers.length > 0 && (
                        <small className="text-success d-block mt-2">
                          {fichiers.length} fichier(s) sélectionné(s)
                        </small>
                      )}
                    </div>
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <div className="d-flex w-100">
                      <button 
                        className="btn btn-success flex-grow-1 mr-2 d-flex align-items-center justify-content-center" 
                        type="submit" 
                        disabled={uploading || scanning}
                        style={{ height: '45px' }}
                      >
                        {uploading ? (
                          <>
                            <FaSpinner className="fa-spin mr-2" />
                            Chargement...
                          </>
                        ) : (
                          <>
                            <FaCloudUploadAlt className="mr-2" />
                            Uploader
                          </>
                        )}
                      </button>
                      <button 
                        className="btn btn-secondary d-flex align-items-center justify-content-center" 
                        type="button" 
                        onClick={handleScanning} 
                        disabled={uploading || scanning}
                        style={{ width: '45px', height: '45px' }}
                        title="Scanner un document"
                      >
                        {scanning ? (
                          <FaSpinner className="fa-spin" />
                        ) : (
                          <FaQrcode />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Séparateur */}
            {verification && <hr className="my-4" />}

            {/* Liste des documents */}
            <div className="documents-section">
              <h6 className="font-weight-bold mb-3 d-flex align-items-center">
                <FaFilePdf className="text-danger mr-2" />
                Documents importés ({documents.length})
              </h6>

              {loading ? (
                <div className="text-center py-4">
                  <FaSpinner className="fa-spin text-primary" size={32} />
                  <p className="text-muted mt-2">Chargement des documents...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover border">
                    <thead className="thead-light">
                      <tr>
                        <th className="border-0 py-3" style={{ width: '60px' }}>#</th>
                        <th className="border-0 py-3">Nom du document</th>
                        <th className="border-0 py-3 text-center" style={{ width: '200px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-5">
                            <div className="text-muted">
                              <FaFilePdf className="mb-3" style={{ fontSize: '3rem', opacity: 0.5 }} />
                              <h6>Aucun document trouvé</h6>
                              <p className="mb-0 small">Aucun document n'est associé à cette note.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc, index) => (
                          <tr key={doc.id} className="border-bottom">
                            <td className="align-middle font-weight-bold text-muted">
                              {index + 1}
                            </td>
                            <td className="align-middle">
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-danger bg-opacity-10 p-2 mr-3 d-flex align-items-center justify-content-center">
                                  <FaFilePdf className="text-danger" size={18} />
                                </div>
                                <div>
                                  <span className="font-weight-medium">{doc.nom_native}</span>
                                  <small className="d-block text-muted">
                                    {doc.created_at && new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td className="align-middle text-center">
                              <button 
                                className="btn btn-sm btn-info mr-2 d-inline-flex align-items-center" 
                                onClick={() => handleDownload(doc.id)}
                                style={{ borderRadius: '8px' }}
                              >
                                <FaEye className="mr-1" size={14} />
                                Voir
                              </button>
                              <button 
                                className="btn btn-sm btn-danger d-inline-flex align-items-center" 
                                onClick={() => handleDelete(doc.id)}
                                style={{ borderRadius: '8px' }}
                              >
                                <FaTrashAlt className="mr-1" size={14} />
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-content {
          border-radius: 16px;
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
        }
        
        .table td {
          vertical-align: middle;
          padding: 1rem 0.75rem;
        }
        
        .btn {
          transition: all 0.2s ease;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 10px rgba(0,0,0,0.1);
        }
        
        .bg-opacity-10 {
          opacity: 0.1;
        }
        
        hr {
          border-top: 1px solid rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default DocumentModal;