import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config";

const ModalNote = ({ modalId, isOpen, onClose, monid, projet, idclasseur, idcentre }) => {
  const [fichiers, setFichiers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
    const [Scanning, setScanning] = useState(false);

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
    try {
      const res = await axios.get(`${API_BASE_URL}/notes/download/${monid}`);
      setDocuments(res.data);
    } catch (error) {
      console.error("Erreur chargement documents", error);
    }
  };

  // ✅ Filtrer uniquement les fichiers PDF
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const pdfOnly = selectedFiles.every(file => file.type === "application/pdf");

    if (!pdfOnly) {
      Swal.fire("Erreur", "Seuls les fichiers PDF sont autorisés", "error");
      return;
    }

    setFichiers(selectedFiles);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (fichiers.length === 0) {
      Swal.fire("Erreur", "Veuillez sélectionner au moins un fichier PDF", "warning");
      return;
    }

    const formData = new FormData();
    
    fichiers.forEach(file => formData.append("files[]", file));
    formData.append("id_note_perception", monid);
    formData.append("id_classeur", idclasseur);
    formData.append("id_ministere", idcentre);

    try {
      setUploading(true);
      await axios.post(`${API_BASE_URL}/notes/upload`, formData);
      Swal.fire("Succès", "Documents PDF importés", "success");
      setFichiers([]);
      fetchDocuments();
    } catch (err) {
      Swal.fire("Erreur", "Échec lors de l'import", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (id) => {
    window.open(`${API_BASE_URL}/notes/downloads/${id}`, "_blank");
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Voulez-vous supprimer ce document ?",
      text: "Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/notes/delete/${id}`);
        Swal.fire("Supprimé", "Document supprimé avec succès", "success");
        fetchDocuments();
      } catch (err) {
        Swal.fire("Erreur", "Échec de la suppression", "error");
      }
    }
  };


 
  const handleScanning = async () => {
    setScanning(true);
    try {
      const response = await axios.post("http://localhost:9000/scan", {}, {
        headers: {
          'Content-Type': 'application/json', // Ou tout autre type de contenu attendu par votre API
        },
      });

      if (response.data.status === "success") {
        Swal.fire("Succès", "Document scanné et importé avec succès", "success");
        fetchDocuments(); // Actualiser la liste des documents
      } else {
        Swal.fire("Erreur", `Échec du scan : ${response.data.message}`, "error");
      }
    } catch (error) {
      Swal.fire("Erreur", "Erreur lors de la communication avec le service de scan", "error");
      console.error("Erreur lors du scan", error);
    } finally {
      setScanning(false);
    }
  };



  return (
    <div className="modal fade" id={modalId} tabIndex="-1" role="dialog" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title">Documents liés à l'assujetti {projet}</h5>
            <button type="button" className="close text-white" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleUpload} className="mb-3">
              <div className="form-group">
                <label>Importer des fichiers PDF</label>
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  className="form-control"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>
              <button className="btn btn-success btn-sm" type="submit" disabled={uploading}>
                <i className="ion-ios-cloud-upload-outline"></i>{" "}
                {uploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1"></i> Chargement...
                  </>
                ) : (
                  "Uploader"
                )}
              </button>

                   <button className="btn btn-secondary btn-sm ml-3" type="button" onClick={handleScanning} disabled={Scanning}>
                <i className="fa fa-qrcode"></i>{" "}
                {Scanning ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin mr-1"></i> Chargement...
                  </>
                ) : (
                  "Scanner"
                )}
              </button>
            </form>

            <hr />
            <table className="table table-sm table-bordered table-striped">
              <thead className="thead-dark">
                <tr>
                  <th>#</th>
                  <th>Nom</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, index) => (
                  <tr key={doc.id}>
                    <td>{index + 1}</td>
                    <td>{doc.nom_native}</td>
                    <td>
                      <button className="btn btn-primary btn-sm mr-2" onClick={() => handleDownload(doc.id)}>
                        <i className="fa fa-download"></i> Télécharger
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doc.id)}>
                        <i className="ion-ios-trash-outline"></i> Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center">Aucun document trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalNote;