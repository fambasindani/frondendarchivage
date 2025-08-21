import React from "react";
import { useLocation } from "react-router-dom";
import Menus from "../Composant/Menus";
import Head from "../Composant/Head";

const NotePlusScreen = () => {
  const location = useLocation();
  const { note } = location.state;

  const InfoRow = ({ label, value, icon }) => (
    <div className="d-flex align-items-start mb-3">
      <i className={`fas ${icon} text-primary mr-3`} style={{ fontSize: 18, minWidth: 24 }}></i>
      <div>
        <div className="text-muted small">{label}</div>
        <div className="font-weight-bold text-dark">{value || "—"}</div>
      </div>
    </div>
  );

  const Section = ({ title, icon, children }) => (
    <div className="mb-4">
      <h5 className="border-bottom pb-2 mb-3 d-flex align-items-center text-dark">
        <i className={`fas ${icon} text-primary mr-2`}></i>
        {title}
      </h5>
      {children}
    </div>
  );

  return (
    <div className="wrapper">
      <Menus />
      <Head />
      <div className="content-wrapper">
        <section className="content">
          <div className="container-fluid">
            {/* Header */}
            <div className="d-flex align-items-center mb-4">
              <img
                src="/assets/doc-icon.png"
                alt="Note"
                className="rounded-circle mr-3 border"
                style={{ width: 60, height: 60 }}
              />
              <div>
                <h4 className="m-0 font-weight-bold">Détails de la Note</h4>
                <small className="text-muted">
                  Dernière mise à jour : {new Date(note.date_enregistrement).toLocaleDateString()}
                </small>
              </div>
            </div>

            {/* Layout en deux colonnes égales */}
            <div className="row">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm p-4">
                  <Section title="Assujetti" icon="fa-user">
                    <InfoRow label="Nom" value={note.assujetti.nom_raison_sociale} icon="fa-id-card" />
                    <InfoRow label="NIF" value={note.assujetti.numero_nif} icon="fa-barcode" />
                    <InfoRow label="BP" value={note.assujetti.bp} icon="fa-envelope" />
                    <InfoRow label="Téléphone" value={note.assujetti.telephone} icon="fa-phone" />
                    <InfoRow label="Email" value={note.assujetti.email} icon="fa-at" />
                  </Section>

                  <Section title="Classeur" icon="fa-folder-open">
                    <InfoRow label="Nom" value={note.classeur.nom_classeur} icon="fa-archive" />
                  </Section>

                  <Section title="Centre d'ordonnancement" icon="fa-building">
                    <InfoRow label="Nom" value={note.centre.nom} icon="fa-map" />
                    <InfoRow label="Description" value={note.centre.description} icon="fa-align-left" />
                  </Section>

                  <Section title="Emplacement" icon="fa-map-marker-alt">
                    <InfoRow label="Nom" value={note.emplacement.nom_emplacement} icon="fa-location-dot" />
                  </Section>
                </div>
              </div>

              {/* Colonne droite : détails additionnels */}
              <div className="col-md-6">
                <div className="card border-0 shadow-sm p-4 h-100">
                  <Section title="Détails Additionnels" icon="fa-list-alt">
                    <InfoRow label="Numéro de Série" value={note.numero_serie} icon="fa-hashtag" />
                    <InfoRow
                      label="Date d'Ordonnancement"
                      value={new Date(note.date_ordonnancement).toLocaleDateString()}
                      icon="fa-calendar-check"
                    />
                    <InfoRow
                      label="Date d'Enregistrement"
                      value={new Date(note.date_enregistrement).toLocaleDateString()}
                      icon="fa-calendar-plus"
                    />
                    <InfoRow
                      label="Numéro d'Article"
                      value={note.numero_article || "N/A"}
                      icon="fa-list-ol"
                    />
                    <InfoRow
                      label="Utilisateur"
                      value={note.utilisateur ? note.utilisateur.nom : "Non spécifié"}
                      icon="fa-user-circle"
                    />
                  </Section>

                  <div className="text-right mt-4">
                    <button className="btn btn-outline-primary" onClick={() => window.history.back()}>
                      <i className="fas fa-arrow-left mr-2"></i>Retour
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
};

export default NotePlusScreen;