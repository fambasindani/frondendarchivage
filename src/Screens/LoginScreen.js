// screens/LoginScreen.jsx
import { useState } from "react";
import axios from "axios";
import { useHistory, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config";
import Input from "../Composant/Input";
import Button from "../Composant/Button";
import Droplist from "../Composant/DropList ";


const LoginScreen = () => {
  const history = useHistory();

  const [form, setForm] = useState({
    email: "",
    password: "",
    entreprise: "", // ✅ on ajoute le champ entreprise
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({});
  };

  const connection = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // ✅ Validation locale
    const validationErrors = {};
    if (!form.email) validationErrors.email = ["L'email est obligatoire"];
    if (!form.password) validationErrors.password = ["Le mot de passe est obligatoire"];
    if (form.entreprise === "") validationErrors.entreprise = ["Le type d'entreprise est obligatoire"];

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/login`, form);
      const { token, utilisateur } = res.data;

      // Sauvegarde utilisateur
      localStorage.setItem("utilisateur", JSON.stringify({
        id: utilisateur.id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        id_direction: utilisateur.id_direction,
        id_note: utilisateur.id_note,
        role: utilisateur.role,
        entreprise: form.entreprise, // ✅ On sauvegarde aussi le type
      }));

      if (token) localStorage.setItem("token", token);

      //;

      // ✅ Redirection selon entreprise
      if (parseInt(form.entreprise) === parseInt(utilisateur.entreprise)) {
        if (parseInt(utilisateur.entreprise) === 0) {
          history.push("/tableaudebord");
          Swal.fire("Succès", "Connexion réussie", "success");
        } else if (parseInt(utilisateur.entreprise) === 1) {
          history.push("/tableaudebordnote");
          Swal.fire("Succès", "Connexion réussie", "success")
        }
      } else {
        if (parseInt(utilisateur.entreprise) === 1) {
         // alert("Vous n'avez pas le droit d'accéder au module direction");
            Swal.fire("Erreur", "Vous n'avez pas le droit d'accéder au module autres docs", "error");
          
        } else {
             Swal.fire("Erreur", "Vous n'avez pas le droit d'accéder au module NP", "error");
         // alert("Vous n'avez pas le droit d'accéder au module centre");
        }
      }




    } catch (error) {
      if (error.response?.status === 401) {
        Swal.fire("Erreur", "Email ou mot de passe incorrect", "error");
      } else if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        Swal.fire("Erreur", "Une erreur s'est produite", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hold-transition login-page">
      <div className="login-box">
        <div className="card">
          <div className="card-body login-card-body">
            <h5 className="login-box-msg">Connexion</h5>
            <form onSubmit={connection}>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                icon="fas fa-envelope"
                error={errors.email && errors.email[0]}
              />

              <Input
                type="password"
                name="password"
                placeholder="Mot de passe"
                value={form.password}
                onChange={handleChange}
                icon="fas fa-lock"
                error={errors.password && errors.password[0]}
              />

              {/* ✅ Ajout de la droplist */}
              <Droplist
                name="entreprise"
                value={form.entreprise}
                onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
                options={[
                  //  { id: "", nom: "-- Sélectionnez un type --" },
                  { id: "0", nom: "Autres docs" },
                  { id: "1", nom: "NP" },
                ]}
                placeholder="-- Sélectionnez un type --"
                error={errors.entreprise && errors.entreprise[0]}
              />

              <div className="row mt-3">
                <div className="col-12">
                  <Button
                    type="submit"
                    loading={loading}
                    icon="ion-checkmark-circled"
                  >
                    Se connecter
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-3 text-center">
              <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
