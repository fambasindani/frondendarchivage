import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
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





function App() {
  return (
    <Router basename="/archive">
      <div className="App">
        <Switch>

          {/* Accueil par défaut → Login */}
          <Route exact path="/" component={LoginScreen} />

          {/* Routes de ton application */}


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


          








        </Switch>
      </div>
    </Router>
  );
}

export default App;
