import React, { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { 
  FaArrowLeft, 
  FaFilePdf, 
  FaCalendarAlt, 
  FaHashtag, 
  FaKey, 
  FaFileSignature, 
  FaFileAlt, 
  FaMapMarkerAlt, 
  FaBuilding, 
  FaFolder, 
  FaUser, 
  FaPaperclip,
  FaCheckCircle,
  FaClock,
  FaTag,
  FaDatabase
} from 'react-icons/fa';

const DetailScreen = () => {
  const { id } = useParams();
  const history = useHistory();
  const token = GetTokenOrRedirect();
  
  const [loading, setLoading] = useState(true);
  const [declaration, setDeclaration] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!token || !id) return;

    const fetchDeclarationDetails = async () => {
      try {
        setLoading(true);
        
        // Charger les détails de la déclaration uniquement
        const response = await axios.get(`${API_BASE_URL}/details/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setDeclaration(response.data);
        
      } catch (error) {
        console.error('Erreur chargement détails:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          html: `
            <div style="text-align: left;">
              <p>Impossible de charger les détails du document ID: <strong>${id}</strong></p>
              <p><strong>Erreur:</strong> ${error.response?.data?.message || error.message}</p>
            </div>
          `,
          confirmButtonText: 'OK'
        }).then(() => {
          history.push('/document');
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeclarationDetails();
  }, [id, token, history]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (statut) => {
    switch(statut) {
      case 1:
        return (
          <span className="badge badge-success p-2">
            <FaCheckCircle className="mr-1" /> Actif
          </span>
        );
      default:
        return (
          <span className="badge badge-secondary p-2">
            <FaClock className="mr-1" /> Inactif
          </span>
        );
    }
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
                      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="sr-only">Chargement...</span>
                      </div>
                      <h4 className="mt-3 text-muted">Chargement des détails du document...</h4>
                      <p className="text-muted">ID: {id}</p>
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

  if (!declaration) {
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
                      <FaFilePdf className="text-danger mb-3" style={{ fontSize: '4rem' }} />
                      <h3 className="text-muted">Document non trouvé</h3>
                      <p className="text-muted">L'ID {id} n'existe pas ou a été supprimé.</p>
                      <button 
                        className="btn btn-primary mt-3"
                        onClick={() => history.push('/document')}
                      >
                        <FaArrowLeft className="mr-2" /> Retour à la liste
                      </button>
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
                  Détails du Document
                </h1>
                <p className="text-muted mb-0">
                  Référence: <strong>{declaration.num_reference}</strong> • ID: <strong>{declaration.id}</strong>
                </p>
              </div>
              <div className="col-sm-6">
                <div className="float-sm-right">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => history.push('/document')}
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
                {/* Carte principale */}
                <div className="card card-primary card-outline">
                  <div className="card-header">
                    <h3 className="card-title">
                      {declaration.intitule}
                    </h3>
                    <div className="card-tools">
                      {getStatusBadge(declaration.statut)}
                    </div>
                  </div>
                  <div className="card-body">
                    {/* Onglets */}
                    <ul className="nav nav-tabs mb-4">
                      <li className="nav-item">
                        <button
                          className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                          onClick={() => setActiveTab('details')}
                        >
                          <FaFileAlt className="mr-2" /> Informations principales
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${activeTab === 'references' ? 'active' : ''}`}
                          onClick={() => setActiveTab('references')}
                        >
                          <FaHashtag className="mr-2" /> Références
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${activeTab === 'dates' ? 'active' : ''}`}
                          onClick={() => setActiveTab('dates')}
                        >
                          <FaCalendarAlt className="mr-2" /> Dates
                        </button>
                      </li>
                    </ul>

                    {/* Contenu des onglets */}
                    {activeTab === 'details' && (
                      <div className="row">
                        {/* Informations organisation */}
                        <div className="col-md-12 mb-4">
                          <div className="card card-secondary">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaBuilding className="mr-2" /> Organisation
                              </h4>
                            </div>
                            <div className="card-body">
                              <div className="row">
                                <div className="col-md-4">
                                  <div className="info-box bg-light">
                                    <span className="info-box-icon bg-primary">
                                      <FaBuilding />
                                    </span>
                                    <div className="info-box-content">
                                      <span className="info-box-text">Direction</span>
                                      <span className="info-box-number">{declaration.direction?.nom || 'N/A'}</span>
                                      <small className="text-muted">ID: {declaration.id_direction}</small>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="col-md-4">
                                  <div className="info-box bg-light">
                                    <span className="info-box-icon bg-info">
                                      <FaMapMarkerAlt />
                                    </span>
                                    <div className="info-box-content">
                                      <span className="info-box-text">Emplacement</span>
                                      <span className="info-box-number">{declaration.emplacement?.nom_emplacement || 'N/A'}</span>
                                      <small className="text-muted">ID: {declaration.id_emplacement}</small>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="col-md-4">
                                  <div className="info-box bg-light">
                                    <span className="info-box-icon bg-warning">
                                      <FaFolder />
                                    </span>
                                    <div className="info-box-content">
                                      <span className="info-box-text">Classeur</span>
                                      <span className="info-box-number">Classeur #{declaration.id_classeur}</span>
                                      <small className="text-muted">ID: {declaration.id_classeur}</small>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="col-md-12">
                          <div className="card card-info">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaFileAlt className="mr-2" /> Description
                              </h4>
                            </div>
                            <div className="card-body">
                              <h5 className="text-primary">{declaration.intitule}</h5>
                              <div className="callout callout-info">
                                <p className="mb-0">
                                  <strong>Mot-clé:</strong> {declaration.mot_cle}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'references' && (
                      <div className="row">
                        <div className="col-md-6">
                          <div className="card card-success">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaHashtag className="mr-2" /> Codes et références
                              </h4>
                            </div>
                            <div className="card-body">
                              <div className="form-group">
                                <label>Numéro de référence</label>
                                <div className="input-group mb-3">
                                  <div className="input-group-prepend">
                                    <span className="input-group-text bg-success">
                                      <FaHashtag />
                                    </span>
                                  </div>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    value={declaration.num_reference}
                                    readOnly
                                  />
                                </div>
                              </div>
                              
                              <div className="form-group">
                                <label>Numéro de déclaration</label>
                                <div className="input-group mb-3">
                                  <div className="input-group-prepend">
                                    <span className="input-group-text bg-warning">
                                      <FaKey />
                                    </span>
                                  </div>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    value={declaration.num_declaration}
                                    readOnly
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="card card-secondary">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaUser className="mr-2" /> Responsable
                              </h4>
                            </div>
                            <div className="card-body">
                              <div className="text-center">
                                <div className="user-panel mt-3 pb-3 mb-3 d-flex">
                                  <div className="image">
                                    <div className="img-circle elevation-2 bg-secondary d-flex align-items-center justify-content-center" 
                                      style={{ width: '60px', height: '60px' }}>
                                      <FaUser style={{ fontSize: '1.5rem', color: 'white' }} />
                                    </div>
                                  </div>
                                  <div className="info ml-3 text-left">
                                    <a href="#" className="d-block">Utilisateur #{declaration.id_user}</a>
                                    <small className="text-muted">Responsable de l'enregistrement</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-12">
                          <div className="card card-default">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaFileSignature className="mr-2" /> Informations techniques
                              </h4>
                            </div>
                            <div className="card-body">
                              <div className="row">
                                <div className="col-md-4">
                                  <div className="small-box bg-primary">
                                    <div className="inner">
                                      <h3>{declaration.id}</h3>
                                      <p>ID Document</p>
                                    </div>
                                    <div className="icon">
                                      <FaHashtag />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="col-md-4">
                                  <div className="small-box bg-success">
                                    <div className="inner">
                                      <h3>
                                        {getStatusBadge(declaration.statut)}
                                      </h3>
                                      <p>Statut du document</p>
                                    </div>
                                    <div className="icon">
                                      <FaCheckCircle />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="col-md-4">
                                  <div className="small-box bg-info">
                                    <div className="inner">
                                      <h5>{formatDateTime(declaration.updated_at)}</h5>
                                      <p>Dernière modification</p>
                                    </div>
                                    <div className="icon">
                                      <FaClock />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'dates' && (
                      <div className="row">
                        <div className="col-md-12">
                          <div className="card card-warning">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaCalendarAlt className="mr-2" /> Chronologie
                              </h4>
                            </div>
                            <div className="card-body">
                              <div className="timeline">
                                {/* Item 1 */}
                                <div className="time-label">
                                  <span className="bg-primary">
                                    Création document
                                  </span>
                                </div>
                                <div>
                                  <i className="fas fa-file-alt bg-blue"></i>
                                  <div className="timeline-item">
                                    <span className="time">
                                      <FaCalendarAlt className="mr-1" /> 
                                      {formatDate(declaration.date_creation)}
                                    </span>
                                    <h3 className="timeline-header">Date de création du document</h3>
                                    <div className="timeline-body">
                                      Date originale de création du document physique ou numérique.
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Item 2 */}
                                <div className="time-label">
                                  <span className="bg-success">
                                    Enregistrement
                                  </span>
                                </div>
                                <div>
                                  <i className="fas fa-database bg-green"></i>
                                  <div className="timeline-item">
                                    <span className="time">
                                      <FaCalendarAlt className="mr-1" /> 
                                      {formatDate(declaration.date_enregistrement)}
                                    </span>
                                    <h3 className="timeline-header">Date d'enregistrement</h3>
                                    <div className="timeline-body">
                                      Date d'enregistrement dans le système d'archivage.
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Item 3 */}
                                <div className="time-label">
                                  <span className="bg-info">
                                    Système
                                  </span>
                                </div>
                                <div>
                                  <i className="fas fa-server bg-info"></i>
                                  <div className="timeline-item">
                                    <span className="time">
                                      <FaDatabase className="mr-1" /> 
                                      {formatDateTime(declaration.created_at)}
                                    </span>
                                    <h3 className="timeline-header">Création dans le système</h3>
                                    <div className="timeline-body">
                                      Date et heure d'insertion dans la base de données.
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Item 4 */}
                                {declaration.updated_at !== declaration.created_at && (
                                  <div className="time-label">
                                    <span className="bg-warning">
                                      Modification
                                    </span>
                                  </div>
                                )}
                                {declaration.updated_at !== declaration.created_at && (
                                  <div>
                                    <i className="fas fa-edit bg-orange"></i>
                                    <div className="timeline-item">
                                      <span className="time">
                                        <FaClock className="mr-1" /> 
                                        {formatDateTime(declaration.updated_at)}
                                      </span>
                                      <h3 className="timeline-header">Dernière modification</h3>
                                      <div className="timeline-body">
                                        Dernière mise à jour des informations du document.
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* End timeline */}
                                <div>
                                  <i className="far fa-clock bg-gray"></i>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Styles additionnels */}
      <style jsx>{`
        .timeline {
          position: relative;
          margin: 0 0 30px 0;
          padding: 0;
          list-style: none;
        }
        
        .timeline:before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #ddd;
          left: 31px;
          margin: 0;
          border-radius: 2px;
        }
        
        .timeline > li {
          position: relative;
          margin-right: 10px;
          margin-bottom: 15px;
        }
        
        .timeline > li:before,
        .timeline > li:after {
          content: " ";
          display: table;
        }
        
        .timeline > li:after {
          clear: both;
        }
        
        .timeline > li > .timeline-item {
          margin-top: 0;
          background: #fff;
          color: #444;
          margin-left: 60px;
          margin-right: 15px;
          padding: 0;
          position: relative;
          border-radius: 0.25rem;
          border: 1px solid #e3e6f0;
        }
        
        .timeline > li.time-label > span {
          font-weight: 600;
          padding: 5px 10px;
          display: inline-block;
          background-color: #e9ecef;
          border-radius: 15px;
          color: #495057;
        }
        
        .timeline > li > .fa,
        .timeline > li > .fas,
        .timeline > li > .far,
        .timeline > li > .fab,
        .timeline > li > .glyphicon {
          width: 30px;
          height: 30px;
          font-size: 15px;
          line-height: 30px;
          position: absolute;
          color: #666;
          background: #e3e6f0;
          border-radius: 50%;
          text-align: center;
          left: 18px;
          top: 0;
        }
        
        .timeline-body,
        .timeline-footer {
          padding: 10px 15px;
        }
        
        .timeline-header {
          margin: 0;
          color: #495057;
          border-bottom: 1px solid #e3e6f0;
          padding: 10px 15px;
          font-size: 16px;
          line-height: 1.1;
        }
        
        .timeline-item .time {
          float: right;
          color: #999;
          padding: 10px;
          font-size: 12px;
        }
        
        .small-box {
          border-radius: 0.25rem;
          position: relative;
          display: block;
          margin-bottom: 20px;
          box-shadow: 0 1px 1px rgba(0,0,0,0.1);
        }
        
        .small-box > .inner {
          padding: 10px;
        }
        
        .small-box .icon {
          position: absolute;
          top: -10px;
          right: 10px;
          z-index: 0;
          font-size: 90px;
          color: rgba(0,0,0,0.15);
        }
        
        .info-box {
          box-shadow: 0 0 1px rgba(0,0,0,0.125), 0 1px 3px rgba(0,0,0,0.2);
          border-radius: 0.25rem;
          background: #fff;
          display: flex;
          margin-bottom: 1rem;
          min-height: 80px;
          padding: 0.5rem;
          position: relative;
        }
        
        .info-box .info-box-icon {
          border-radius: 0.25rem;
          align-items: center;
          display: flex;
          font-size: 1.875rem;
          justify-content: center;
          text-align: center;
          width: 70px;
        }
        
        .info-box .info-box-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
          line-height: 1.8;
          flex: 1;
          padding: 0 10px;
        }
        
        .info-box .info-box-text {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-transform: uppercase;
          font-weight: 700;
          font-size: 14px;
        }
        
        .info-box .info-box-number {
          display: block;
          font-weight: 700;
          font-size: 18px;
        }
        
        .callout {
          border-radius: 0.25rem;
          margin: 0 0 1rem 0;
          padding: 1rem;
          border-left: 5px solid #e9ecef;
        }
        
        .callout.callout-info {
          background-color: #d1ecf1;
          border-color: #bee5eb;
          color: #0c5460;
        }
        
        .img-circle {
          border-radius: 50%;
        }
        
        .user-panel {
          border-bottom: 1px solid #dee2e6;
        }
        
        .nav-tabs .nav-link {
          border-radius: 0;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 0.5rem 1rem;
        }
        
        .nav-tabs .nav-link.active {
          border-bottom-color: #007bff;
          color: #007bff;
          background: transparent;
        }
        
        .card-primary.card-outline {
          border-top: 3px solid #007bff;
        }
        
        .card-success {
          border-color: #28a745;
        }
        
        .card-success > .card-header {
          background-color: #28a745;
          color: white;
        }
        
        .card-info {
          border-color: #17a2b8;
        }
        
        .card-info > .card-header {
          background-color: #17a2b8;
          color: white;
        }
        
        .card-warning {
          border-color: #ffc107;
        }
        
        .card-warning > .card-header {
          background-color: #ffc107;
          color: #212529;
        }
        
        .card-secondary {
          border-color: #6c757d;
        }
        
        .card-secondary > .card-header {
          background-color: #6c757d;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default DetailScreen;