import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useUser } from '../Composant/UserContext';
import DirectionDetailScreen from './DirectionDetailScreen';

const DirectionViewScreen = () => {
  const { id } = useParams();
  const history = useHistory();
  const { getDirectionWithDetails } = useUser();
  const [loading, setLoading] = useState(true);
  const [directionDetails, setDirectionDetails] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    console.log('📱 DirectionViewScreen - id reçu:', id);
    console.log('📱 DirectionViewScreen - type de id:', typeof id);
    
    try {
      const details = getDirectionWithDetails(id);
      console.log('📱 DirectionViewScreen - Détails retournés:', details);
      
      if (details) {
        setDirectionDetails(details);
        setError(null);
      } else {
        setError(`Aucune direction trouvée avec l'ID: ${id}`);
      }
    } catch (err) {
      console.error('❌ Erreur dans getDirectionWithDetails:', err);
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id, getDirectionWithDetails]);

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Chargement...</span>
          </div>
          <p className="mt-3">Chargement de la direction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Erreur</h4>
          <p>{error}</p>
          <button 
            onClick={() => history.push('/gestion-utilisateurs/directions')}
            className="btn btn-secondary"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!directionDetails) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>Direction non trouvée</h4>
          <p>La direction avec l'ID "{id}" n'existe pas.</p>
          <button 
            onClick={() => history.push('/gestion-utilisateurs/directions')}
            className="btn btn-secondary"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <DirectionDetailScreen 
      direction={directionDetails} 
      onBack={() => history.push('/gestion-utilisateurs/directions')} 
    />
  );
};

export default DirectionViewScreen;