import React from 'react';
import { useHistory } from 'react-router-dom';
import DirectionForm from './DirectionFormScreen';

const DirectionCreateScreen = () => {
  const history = useHistory();
  
  return (
    <DirectionForm 
      onSuccess={() => history.push('/gestion-utilisateurs/directions')} 
    />
  );
};

export default DirectionCreateScreen;