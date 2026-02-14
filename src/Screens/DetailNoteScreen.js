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
  FaDatabase,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaMapPin,
  FaEdit
} from 'react-icons/fa';

const DetailNoteScreen = () => {
  const { id } = useParams();
  const history = useHistory();
  const token = GetTokenOrRedirect();
  
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!token || !id) return;

    const fetchNoteDetails = async () => {
      try {
        setLoading(true);
        
        // Charger les détails de la note
        const response = await axios.get(`${API_BASE_URL}/notes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Détails de la note:", response.data);
        setNote(response.data);
        
      } catch (error) {
        console.error('Erreur chargement détails:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          html: `
            <div style="text-align: left;">
              <p>Impossible de charger les détails de la note</p>
              <p><strong>Erreur:</strong> ${error.response?.data?.message || error.message}</p>
            </div>
          `,
          confirmButtonText: 'OK'
        }).then(() => {
          history.push('/note-perception');
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNoteDetails();
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
                    onClick={() => history.push('/note-perception')}
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
                      <h4 className="mt-3 text-muted">Chargement des détails de la note...</h4>
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

  if (!note) {
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
                    onClick={() => history.push('/note-perception')}
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
                      <h3 className="text-muted">Note non trouvée</h3>
                      <p className="text-muted">Cette note n'existe pas ou a été supprimée.</p>
                      <button 
                        className="btn btn-primary mt-3"
                        onClick={() => history.push('/note-perception')}
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
                  Détails de la Note de Perception
                </h1>
                <p className="text-muted mb-0">
                  Numéro série: <strong>{note.numero_serie}</strong>
                </p>
              </div>
              <div className="col-sm-6">
                <div className="float-sm-right">
                  <button
                    className="btn btn-outline-secondary mr-2"
                    onClick={() => history.push(`/note/form/${note.id}`)}
                  >
                    <FaEdit className="mr-2" /> Modifier
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => history.push('/note-perception')}
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
                {/* Carte principale */}
                <div className="card card-primary card-outline">
                  <div className="card-header">
                    <h3 className="card-title">
                      Note de perception {note.numero_serie}
                    </h3>
                    <div className="card-tools">
                      {getStatusBadge(note.statut)}
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
                          className={`nav-link ${activeTab === 'assujetti' ? 'active' : ''}`}
                          onClick={() => setActiveTab('assujetti')}
                        >
                          <FaUser className="mr-2" /> Assujetti
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${activeTab === 'organisation' ? 'active' : ''}`}
                          onClick={() => setActiveTab('organisation')}
                        >
                          <FaBuilding className="mr-2" /> Organisation
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

                    {/* Onglet Détails */}
                    {activeTab === 'details' && (
                      <div className="row">
                        <div className="col-md-6">
                          <div className="card card-success">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaHashtag className="mr-2" /> Informations générales
                              </h4>
                            </div>
                            <div className="card-body">
                              <table className="table table-bordered table-striped">
                                <tbody>
                                  <tr>
                                    <th style={{ width: '40%' }}>Numéro série</th>
                                    <td>
                                      <span className="badge badge-primary p-2">
                                        {note.numero_serie || 'N/A'}
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Numéro article</th>
                                    <td>
                                      <span className="badge badge-info p-2">
                                        {note.numero_article || 'N/A'}
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Date ordonnancement</th>
                                    <td>
                                      <FaCalendarAlt className="mr-2 text-muted" />
                                      {formatDate(note.date_ordonnancement)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Date enregistrement</th>
                                    <td>
                                      <FaCalendarAlt className="mr-2 text-muted" />
                                      {formatDate(note.date_enregistrement)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Créé le</th>
                                    <td>{formatDateTime(note.created_at)}</td>
                                  </tr>
                                  <tr>
                                    <th>Modifié le</th>
                                    <td>{formatDateTime(note.updated_at)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-12">
                          <div className="card card-info">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaFileAlt className="mr-2" /> Article budgétaire
                              </h4>
                            </div>
                            <div className="card-body">
                              {note.article_budgetaire ? (
                                <div className="callout callout-info">
                                  <p className="mb-0">
                                    <strong>Article:</strong> {note.article_budgetaire.article_budgetaire} - {note.article_budgetaire.nom}
                                  </p>
                                </div>
                              ) : (
                                <div className="callout callout-secondary">
                                  <p className="mb-0">Aucun article budgétaire associé</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Onglet Assujetti */}
                    {activeTab === 'assujetti' && (
                      <div className="row">
                        <div className="col-md-12">
                          <div className="card card-secondary">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaUser className="mr-2" /> Détails de l'assujetti
                              </h4>
                            </div>
                            <div className="card-body">
                              {note.assujetti ? (
                                <div className="row">
                                  <div className="col-md-6">
                                    <div className="info-box bg-light">
                                      <span className="info-box-icon bg-primary">
                                        <FaIdCard />
                                      </span>
                                      <div className="info-box-content">
                                        <span className="info-box-text">NIF</span>
                                        <span className="info-box-number">{note.assujetti.numero_nif || 'N/A'}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="info-box bg-light">
                                      <span className="info-box-icon bg-success">
                                        <FaUser />
                                      </span>
                                      <div className="info-box-content">
                                        <span className="info-box-text">Raison sociale</span>
                                        <span className="info-box-number">{note.assujetti.nom_raison_sociale}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="info-box bg-light">
                                      <span className="info-box-icon bg-info">
                                        <FaMapPin />
                                      </span>
                                      <div className="info-box-content">
                                        <span className="info-box-text">BP</span>
                                        <span className="info-box-number">{note.assujetti.bp || 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="col-md-6">
                                    <div className="info-box bg-light">
                                      <span className="info-box-icon bg-warning">
                                        <FaPhone />
                                      </span>
                                      <div className="info-box-content">
                                        <span className="info-box-text">Téléphone</span>
                                        <span className="info-box-number">{note.assujetti.telephone || 'N/A'}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="info-box bg-light">
                                      <span className="info-box-icon bg-danger">
                                        <FaEnvelope />
                                      </span>
                                      <div className="info-box-content">
                                        <span className="info-box-text">Email</span>
                                        <span className="info-box-number">{note.assujetti.email || 'N/A'}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="info-box bg-light">
                                      <span className="info-box-icon bg-secondary">
                                        <FaCheckCircle />
                                      </span>
                                      <div className="info-box-content">
                                        <span className="info-box-text">Statut assujetti</span>
                                        <span className="info-box-number">
                                          {note.assujetti.statut ? 
                                            <span className="badge badge-success">Actif</span> : 
                                            <span className="badge badge-secondary">Inactif</span>
                                          }
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="alert alert-warning">
                                  <FaUser className="mr-2" /> Aucun assujetti associé à cette note.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Onglet Organisation */}
                    {activeTab === 'organisation' && (
                      <div className="row">
                        <div className="col-md-6">
                          <div className="card card-info">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaFolder className="mr-2" /> Classeur
                              </h4>
                            </div>
                            <div className="card-body">
                              {note.classeur ? (
                                <table className="table table-bordered">
                                  <tbody>
                                    <tr>
                                      <th style={{ width: '40%' }}>Nom</th>
                                      <td>
                                        <span className="badge badge-info p-2">
                                          {note.classeur.nom_classeur}
                                        </span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <th>Statut</th>
                                      <td>
                                        {note.classeur.statut ? 
                                          <span className="badge badge-success">Actif</span> : 
                                          <span className="badge badge-secondary">Inactif</span>
                                        }
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-muted">Aucun classeur associé</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="card card-success">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaBuilding className="mr-2" /> Centre d'ordonnancement
                              </h4>
                            </div>
                            <div className="card-body">
                              {note.centre ? (
                                <table className="table table-bordered">
                                  <tbody>
                                    <tr>
                                      <th style={{ width: '40%' }}>Nom</th>
                                      <td>
                                        <span className="badge badge-success p-2">
                                          {note.centre.nom}
                                        </span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <th>Description</th>
                                      <td>{note.centre.description || 'N/A'}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-muted">Aucun centre associé</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6 mt-3">
                          <div className="card card-warning">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaMapMarkerAlt className="mr-2" /> Emplacement
                              </h4>
                            </div>
                            <div className="card-body">
                              {note.emplacement ? (
                                <table className="table table-bordered">
                                  <tbody>
                                    <tr>
                                      <th style={{ width: '40%' }}>Nom</th>
                                      <td>
                                        <span className="badge badge-warning p-2">
                                          {note.emplacement.nom_emplacement}
                                        </span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <th>Statut</th>
                                      <td>
                                        {note.emplacement.statut ? 
                                          <span className="badge badge-success">Actif</span> : 
                                          <span className="badge badge-secondary">Inactif</span>
                                        }
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-muted">Aucun emplacement associé</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6 mt-3">
                          <div className="card card-primary">
                            <div className="card-header">
                              <h4 className="card-title">
                                <FaDatabase className="mr-2" /> Article budgétaire
                              </h4>
                            </div>
                            <div className="card-body">
                              {note.article_budgetaire ? (
                                <table className="table table-bordered">
                                  <tbody>
                                    <tr>
                                      <th style={{ width: '40%' }}>Article</th>
                                      <td>
                                        <span className="badge badge-primary p-2">
                                          {note.article_budgetaire.article_budgetaire}
                                        </span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <th>Nom</th>
                                      <td>{note.article_budgetaire.nom}</td>
                                    </tr>
                                    <tr>
                                      <th>Statut</th>
                                      <td>
                                        {note.article_budgetaire.statut ? 
                                          <span className="badge badge-success">Actif</span> : 
                                          <span className="badge badge-secondary">Inactif</span>
                                        }
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              ) : (
                                <div className="callout callout-secondary">
                                  <p className="mb-0">Aucun article budgétaire associé</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Onglet Dates */}
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
                                {/* Date ordonnancement */}
                                <div className="time-label">
                                  <span className="bg-primary">
                                    Ordonnancement
                                  </span>
                                </div>
                                <div>
                                  <i className="fas fa-gavel bg-blue"></i>
                                  <div className="timeline-item">
                                    <span className="time">
                                      <FaCalendarAlt className="mr-1" /> 
                                      {formatDate(note.date_ordonnancement)}
                                    </span>
                                    <h3 className="timeline-header">Date d'ordonnancement</h3>
                                    <div className="timeline-body">
                                      Date à laquelle la note a été ordonnancée.
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Date enregistrement */}
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
                                      {formatDate(note.date_enregistrement)}
                                    </span>
                                    <h3 className="timeline-header">Date d'enregistrement</h3>
                                    <div className="timeline-body">
                                      Date d'enregistrement dans le système.
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Création système */}
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
                                      {formatDateTime(note.created_at)}
                                    </span>
                                    <h3 className="timeline-header">Création dans le système</h3>
                                    <div className="timeline-body">
                                      Date et heure d'insertion dans la base de données.
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Dernière modification */}
                                {note.updated_at !== note.created_at && (
                                  <div className="time-label">
                                    <span className="bg-warning">
                                      Modification
                                    </span>
                                  </div>
                                )}
                                {note.updated_at !== note.created_at && (
                                  <div>
                                    <i className="fas fa-edit bg-orange"></i>
                                    <div className="timeline-item">
                                      <span className="time">
                                        <FaClock className="mr-1" /> 
                                        {formatDateTime(note.updated_at)}
                                      </span>
                                      <h3 className="timeline-header">Dernière modification</h3>
                                      <div className="timeline-body">
                                        Dernière mise à jour des informations.
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Fin timeline */}
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
        
        .callout.callout-secondary {
          background-color: #e2e3e5;
          border-color: #d6d8db;
          color: #383d41;
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
        
        .badge {
          font-size: 0.9rem;
        }
        
        .table th {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default DetailNoteScreen;