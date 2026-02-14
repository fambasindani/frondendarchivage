import React from 'react';
import { useHistory } from 'react-router-dom';
import RoleForm from './RoleFormScreen';

const RoleCreateScreen = () => {
  const history = useHistory();
  
  return (
    <RoleForm 
      onSuccess={() => history.push('/gestion-utilisateurs/roles')} 
    />
  );
};

export default RoleCreateScreen;