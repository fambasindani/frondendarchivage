import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useUser } from '../Composant/UserContext';
import DirectionForm from './DirectionFormScreen';

const DirectionEditScreen = () => {
  const { id } = useParams();
  const history = useHistory();
  const { directions } = useUser();
  
  const direction = directions.find(dir => dir.id === id);
  
  return (
    <DirectionForm 
      direction={direction}
      onSuccess={() => history.push(`/gestion-utilisateurs/directions/${id}`)} 
    />
  );
};

export default DirectionEditScreen;