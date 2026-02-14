import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useUser } from '../Composant/UserContext';
import RoleDetails from './RoleDetailScreen';

const RoleViewScreen = () => {
  const { id } = useParams();
  const history = useHistory();
  const { getRoleWithDetails } = useUser();
  
  const roleDetails = getRoleWithDetails(id);
  
  if (!roleDetails) {
    return (
      <div className="alert alert-danger m-4">
        Rôle non trouvé
      </div>
    );
  }
  
  return (
    <RoleDetails 
      role={roleDetails} 
      onBack={() => history.push('/gestion-utilisateurs/roles')} 
    />
  );
};

export default RoleViewScreen;