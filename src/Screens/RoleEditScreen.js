import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useUser } from '../Composant/UserContext';
import RoleForm from './RoleFormScreen';

const RoleEditScreen = () => {
  const { id } = useParams();
  const history = useHistory();
  const { roles } = useUser();
  
  const role = roles.find(r => r.id === id);
  
  if (!role) {
    return (
      <div className="alert alert-danger m-4">
        Rôle non trouvé
      </div>
    );
  }
  
  return (
    <RoleForm 
      role={role} 
      onSuccess={() => history.push('/gestion-utilisateurs/roles')} 
    />
  );
};

export default RoleEditScreen;