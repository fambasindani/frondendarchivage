import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import LoginScreen from './Screens/LoginScreen';
import Tableaudebord from './Screens/Tableaudebord';
import DirectionScreen from './Screens/DirectionScreen';
import ClasseurScreen from './Screens/ClasseurScreen';
import CentreScreen from './Screens/CentreScreen';
import EmplacementScreen from './Screens/EmplacementScreen';
import DocumentScreen from './Screens/DocumentScreen';
import MinistereScreen from './Screens/MinistereScreen';
import NoteperceptionScreen from './Screens/NoteperceptionScreen';
import NotePlusScreen from './Screens/NotePlusScreen';
import ScannerComponent from './Composant/ScannerComponent';
import ListeDocumentScreen from './Screens/ListeDocumentScreen';
import UtilisateurScreen from './Screens/UtilisateurScreen';
import Tableaudebordnote from './Screens/Tableaudebordnote';
import ListenoteScreen from './Screens/ListenoteScreen';
import './style/Loading.css'

import { UserProvider } from './Composant/UserContext';

// Import des nouveaux composants améliorés
import UserManagementLayout from './Composant/UserManagementLayout';
import Users from './Screens/UserScreen';
import Roles from './Screens/RoleScreen';
import Dashboard from './Composant/Dashboard';
import Permissions from './Screens/PermissionScreen';
import RoleCreateScreen from './Screens/RoleCreateScreen';
import FormDocumentScreen from './Screens/FormDocumentScreen';
import DetailScreen from './Screens/DetailDocumentScreen';
import HomeScreen from './Screens/HomeScreen';
import Directions from './Composant/Directions';
import DirectionCreateScreen from './Screens/DirectionCreateScreen';
import DirectionEditScreen from './Screens/DirectionEditScreen';
import DirectionViewScreen from './Screens/DirectionViewScreen';
import ScanViewers from './Composant/ScanViewers';
import RoleForm from './Screens/RoleFormScreen';
import RoleDetailScreen from './Screens/RoleDetailScreen';
import DirectionDetailScreen from './Screens/DirectionDetailScreen';
import ProfilScreen from './Screens/ProfilScreen';
import FormNoteScreen from './Screens/FormNoteScreen';
import DetailNoteScreen from './Screens/DetailNoteScreen';

// Import du composant IdleTimer
import IdleTimer from './Composant/Temps';

function AppContent() {
  const history = useHistory();
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.clear();
    history.push('/');
  };

  return (
    <>
      {/* IdleTimer uniquement si l'utilisateur est connecté */}
      {isAuthenticated && (
        <IdleTimer 
          timeout={10 * 60 * 1000} // 10 minutes
          onLogout={handleLogout}
        />
      )}
      
      <Switch>
        {/* Accueil par défaut → Login */}
        <Route path="/scan" component={ScanViewers} />
        <Route exact path="/login" component={LoginScreen} />

        <Route exact path="/" component={HomeScreen} />

        {/* Routes de ton application existante */}
        <Route path="/direction" component={DirectionScreen} />
        <Route path="/classeur" component={ClasseurScreen} />
        <Route path="/centre-ordonnancement" component={CentreScreen} />
        <Route path="/emplacement" component={EmplacementScreen} />
        <Route path="/document" component={DocumentScreen} />
        <Route path="/ministere" component={MinistereScreen} />
        <Route path="/tableaudebord" component={Tableaudebord} />
        <Route path="/note-perception" component={NoteperceptionScreen} />
        <Route path="/note-plus" component={NotePlusScreen} />
        <Route path="/scan" component={ScannerComponent} />
        <Route path="/listedocument/:id" component={ListeDocumentScreen} />
        <Route path="/utilisateur" component={UtilisateurScreen} />
        <Route path="/tableaudebordnote" component={Tableaudebordnote} />
        <Route path="/listenote/:id" component={ListenoteScreen} />
        <Route path="/addform" component={FormDocumentScreen} />
        <Route path="/note/form" component={FormNoteScreen} />
        <Route path="/note/detail/:id" component={DetailNoteScreen} />
        <Route path="/detail-document/:id" component={DetailScreen} />
        <Route path="/profil" component={ProfilScreen} />

        {/* Routes de gestion des utilisateurs */}
        <Route path="/gestion-utilisateurs">
          <UserManagementLayout>
            <Switch>
              <Route
                exact
                path="/gestion-utilisateurs/dashboard"
                render={(props) => <Dashboard {...props} />}
              />
              <Route
                exact
                path="/gestion-utilisateurs/utilisateurs"
                render={(props) => <Users {...props} />}
              />
              <Route
                exact
                path="/gestion-utilisateurs/roles/nouveau"
                render={(props) => <RoleCreateScreen {...props} />}
              />
              <Route
                exact
                path="/gestion-utilisateurs/roles/:id/modifier"
                render={(props) => <RoleForm {...props} />}
              />
              <Route
                exact
                path="/gestion-utilisateurs/roles/:id"
                render={(props) => <RoleDetailScreen {...props} />}
              />
              <Route
                exact
                path="/gestion-utilisateurs/roles"
                render={(props) => <Roles {...props} />}
              />
              <Route
                exact
                path="/gestion-utilisateurs/permissions"
                render={(props) => <Permissions {...props} />}
              />

              {/* Directions */}
              <Route
                exact
                path="/gestion-utilisateurs/directions/nouvelle"
                render={(props) => <DirectionCreateScreen {...props} />}
              />
              <Route
                exact
                path="/gestion-utilisateurs/directions/:id/modifier"
                render={(props) => <DirectionEditScreen {...props} />}
              />
              <Route
                exact
                path="/gestion-utilisateurs/directions/:id"
                render={(props) => <DirectionDetailScreen {...props} />}
              />
              <Route
                exact
                path="/gestion-utilisateurs/directions"
                render={(props) => <Directions {...props} />}
              />
            </Switch>
          </UserManagementLayout>
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <Router basename="/archive">
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;