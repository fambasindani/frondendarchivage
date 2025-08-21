// screens/LoginScreen.jsx
import { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config";
import Input from "../Composant/Input"
import Button from "../Composant/Button";

const LoginScreen = () => {
  const history = useHistory();

  const [form, setForm] = useState({
    email: "",
    password: ""
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

    try {
      const res = await axios.post(`${API_BASE_URL}/login`, form);

      const { token, utilisateur } = res.data;

      // Sauvegarder les infos de l'utilisateur dans le localStorage
      localStorage.setItem("utilisateur", JSON.stringify({
        id: utilisateur.id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        compagnie: utilisateur.compagnie,  // { id, nom }
        modules: utilisateur.modules        // [{ id, nom }]
      }));

      // Sauvegarder le token
      if (token) {
        localStorage.setItem("token", token);
      }

      Swal.fire("Succès", "Connexion réussie", "success");
      history.push("/direction");

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

              <div className="row">
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
