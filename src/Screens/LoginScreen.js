// screens/LoginScreen.jsx
import { useState } from "react";
import axios from "axios";
import { useHistory, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import "../style/LoginScreen.css";

// Schema de validation avec Zod
const loginSchema = z.object({
  email: z.string()
    .min(1, "L'email est requis")
    .email("Email invalide")
    .toLowerCase(),
  password: z.string()
    .min(1, "Le mot de passe est requis")
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  rememberMe: z.boolean().optional(),
});

const LoginScreen = () => {
  const history = useHistory();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onChange",
  });

  const formValues = watch();

  const onSubmit = async (data) => {
    console.log("Submit started with data:", data);
    setIsSubmitting(true);
    setLoginError(null);

    try {
      // IMPORTANT: Utilisez la bonne URL de votre API
      const res = await axios.post(`${API_BASE_URL}/connexion`, {
        email: data.email,
        password: data.password,
      });

      // La structure de votre réponse
      const responseData = res.data.data;
      const { user, roles, permissions, departements, token, stats } = responseData;

      // Stocker TOUTES les informations dans localStorage
      
      // 1. Informations de l'utilisateur
      localStorage.setItem("utilisateur", JSON.stringify({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        full_name: user.full_name,
        email: user.email,
        statut: user.statut,
        avatar: user.avatar,
        datecreation: user.datecreation,
        dernierconnection: user.dernierconnection
      }));

      // 2. Token
      if (token) localStorage.setItem("token", token);

      // 3. Rôles et permissions
      localStorage.setItem("role", JSON.stringify(roles));
      localStorage.setItem("permissions", JSON.stringify(permissions.codes));
      localStorage.setItem("permissionlist", JSON.stringify(permissions));
      localStorage.setItem("permissions_details", JSON.stringify(permissions.details));

      // 4. Départements
      localStorage.setItem("departements", JSON.stringify(departements));

      // 5. Statistiques
      localStorage.setItem("user_stats", JSON.stringify(stats));

      // 6. Option "Se souvenir de moi"
      if (data.rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      // Message de succès personnalisé
      Swal.fire({
        icon: 'success',
        title: 'Connexion réussie',
        html: `
          <div style="text-align: left;">
            <p><strong>Bienvenue ${user.prenom} ${user.nom} !</strong></p>
            <p>Vous êtes connecté en tant que <strong>${roles[0]?.nom || 'Utilisateur'}</strong></p>
            <p>Vous avez accès à <strong>${permissions.codes.length} permissions</strong></p>
            <p>Départements: <strong>${departements.map(d => d.sigle).join(', ')}</strong></p>
          </div>
        `,
        timer: 3000,
        timerProgressBar: true
      });

      // =============================================
      // VOTRE LOGIQUE DE REDIRECTION (AMÉLIORÉE)
      // =============================================
      
      // Récupérer le module depuis localStorage
      const module = localStorage.getItem("archive_module");
      
      // Récupérer les permissions de l'utilisateur
      const userPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');

      // Afficher les informations de debug dans la console
      console.log('=== INFORMATIONS DE REDIRECTION ===');
      console.log('Module demandé:', module);
      console.log('Permissions utilisateur:', userPermissions);
      console.log('====================================');

      // Redirection selon votre logique
      if (module === "ad") {
        if (userPermissions.includes('archiv_doc')) {
          console.log('✅ Accès autorisé au module admin (dashboard)');
          history.push("/tableaudebord");
        } else {
          console.log('❌ Accès refusé au module admin - permission dashboard manquante');
          Swal.fire({
            icon: 'error',
            title: 'Accès refusé',
            text: "Vous n'avez pas la permission 'Achivage Document' pour accéder au module d'administration",
            timer: 3000,
            timerProgressBar: true
          });
          // Redirection vers une page par défaut ou on reste sur la page de connexion
          // Vous pouvez décommenter la ligne ci-dessous si vous voulez rediriger
          // history.push("/");
        }
      } else if (module === "np") {
          history.push("/tableaudebordnote");
        if (userPermissions.includes('note_perception')) {
          console.log('✅ Accès autorisé au module note perception');
          history.push("/tableaudebordnote");
        } else {
          console.log('❌ Accès refusé au module note perception - permission note_perception manquante');
          Swal.fire({
            icon: 'error',
            title: 'Accès refusé',
            text: "Vous n'avez pas la permission 'note_perception' pour accéder au module Note de Perception",
            timer: 3000,
            timerProgressBar: true
          });
          // Redirection vers une page par défaut ou on reste sur la page de connexion
          // history.push("/");
        }
      } else {
        // Module par défaut - redirection vers le dashboard si la permission existe
        if (userPermissions.includes('archiv_doc')) {
          console.log('✅ Redirection vers le dashboard par défaut');
          history.push("/tableaudebord");
        } else {
          console.log('⚠️ Aucun module spécifique et pas de permission dashboard');
          // Si pas de permission dashboard, on peut rediriger vers une autre page
          // ou afficher un message
          Swal.fire({
            icon: 'info',
            title: 'Information',
            text: "Vous êtes connecté mais vous n'avez pas de module par défaut",
            timer: 3000,
            timerProgressBar: true
          });
          // Optionnel: rester sur la page de connexion ou rediriger vers une page d'accueil
          // history.push("/");
        }
      }

    } catch (error) {
      console.error("Login error:", error);
      
      // Gestion des erreurs selon votre structure de réponse
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          setLoginError(data.message || "Email ou mot de passe incorrect");
        } else if (status === 403) {
          setLoginError(data.message || "Votre compte est inactif. Contactez l'administrateur.");
        } else if (status === 422) {
          // Erreurs de validation
          if (data.errors) {
            const firstError = Object.values(data.errors)[0]?.[0];
            setLoginError(firstError || "Données invalides");
          } else {
            setLoginError("Données invalides");
          }
        } else {
          setLoginError(data.message || "Une erreur s'est produite lors de la connexion");
        }
      } else if (error.request) {
        setLoginError("Impossible de contacter le serveur. Vérifiez votre connexion.");
      } else {
        setLoginError("Une erreur s'est produite");
      }

      reset({ email: data.email, password: "", rememberMe: data.rememberMe });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting;

  const handleTestLogin = (email, password) => {
    reset({
      email,
      password,
      rememberMe: false,
    });
    setTimeout(() => {
      handleSubmit(onSubmit)();
    }, 100);
  };

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return (
    <div className="login-page min-vh-100 bg-gradient-custom d-flex align-items-center justify-content-center p-3 p-md-4">
      <div className="login-container w-100 max-w-4xl d-flex flex-column flex-lg-row rounded-lg shadow-lg overflow-hidden bg-white">
        {/* Section gauche - Illustration */}
        <div className="login-left col-lg-6 bg-gradient-left p-4 p-md-5 text-white d-flex flex-column">
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <Link
                to="/"
                className="btn btn-outline-light btn-sm d-flex align-items-center"
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "20px",
                  fontSize: "0.875rem"
                }}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Retour à l'accueil
              </Link>
              
              <div className="badge badge-light text-primary px-3 py-2">
                <i className="fas fa-lock mr-1"></i>
                Sécurité maximale
              </div>
            </div>

            <div className="d-flex align-items-center mb-5">
              <div className="login-logo-icon rounded-circle d-flex align-items-center justify-content-center mr-3">
                <i className="fas fa-archive fa-2x"></i>
              </div>
              <div>
                <h1 className="h2 font-weight-bold mb-0">GS-Archive</h1>
                <p className="login-subtitle mb-0">Gestion des Archives</p>
              </div>
            </div>

            <div className="my-5">
              <h2 className="h1 font-weight-bold mb-4">
                Gérez vos archives<br />efficacement
              </h2>
              <p className="login-description">
                Un système complet pour la gestion des documents, des archives et
                de leur suivi.
              </p>
            </div>

            <div className="row mt-5">
              <div className="col-6 mb-3">
                <div className="d-flex align-items-center">
                  <div className="login-feature-icon rounded-circle d-flex align-items-center justify-content-center mr-3">
                    <i className="fas fa-building"></i>
                  </div>
                  <div>
                    <p className="h4 font-weight-bold mb-0">500+</p>
                    <p className="login-feature-text small mb-0">Entreprises</p>
                  </div>
                </div>
              </div>
              <div className="col-6 mb-3">
                <div className="d-flex align-items-center">
                  <div className="login-feature-icon rounded-circle d-flex align-items-center justify-content-center mr-3">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <div>
                    <p className="h4 font-weight-bold mb-0">100%</p>
                    <p className="login-feature-text small mb-0">Sécurisé</p>
                  </div>
                </div>
              </div>
            </div>

            {isLocalhost && (
              <div className="login-debug mt-4 p-3 rounded">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small font-weight-medium">Debug Mode</span>
                  <button
                    onClick={() => setShowDebugInfo(!showDebugInfo)}
                    className="btn btn-sm btn-light btn-outline-light"
                  >
                    {showDebugInfo ? "Masquer" : "Afficher"}
                  </button>
                </div>
                {showDebugInfo && (
                  <div className="small">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Form Valid:</span>
                      <span className={`badge ${isValid ? "badge-success" : "badge-danger"}`}>
                        {isValid ? "Oui" : "Non"}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Email:</span>
                      <span className="text-monospace">
                        {formValues.email || "vide"}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Password:</span>
                      <span className="text-monospace">
                        {"*".repeat(formValues.password?.length || 0)}
                      </span>
                    </div>
                    <div className="pt-2 border-top border-white-20 mt-2">
                      <p className="font-weight-medium mb-1">Test Accounts:</p>
                      <div className="d-flex flex-column">
                        <button
                          onClick={() => handleTestLogin("pierrpapy@gmail.com", "password")}
                          className="btn btn-sm btn-light btn-outline-light text-left mb-1"
                        >
                          Pierre (Directeur)
                        </button>
                        <button
                          onClick={() => handleTestLogin("jean@example.com", "password")}
                          className="btn btn-sm btn-light btn-outline-light text-left"
                        >
                          Jean (Utilisateur)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="login-footer mt-4 pt-4 border-top">
            <p className="login-copyright small mb-0">
              © {new Date().getFullYear()} GS-Archive. Tous droits réservés.
            </p>
          </div>
        </div>

        {/* Section droite - Formulaire */}
        <div className="login-right col-lg-6 p-4 p-md-5">
          <div className="h-100 d-flex flex-column justify-content-center">
            <div className="login-form-container mx-auto w-100">
              <div className="text-center mb-5">
                <h2 className="h2 font-weight-bold text-dark mb-3">Connexion</h2>
                <p className="text-muted mb-4">
                  Entrez vos identifiants pour accéder à votre compte
                </p>
                
                <div className="d-block d-lg-none mb-3">
                  <Link
                    to="/"
                    className="btn btn-outline-primary btn-sm d-inline-flex align-items-center"
                    style={{
                      padding: "0.4rem 0.8rem",
                      borderRadius: "20px",
                      fontSize: "0.875rem"
                    }}
                  >
                    <i className="fas fa-home mr-2"></i>
                    Retour à l'accueil
                  </Link>
                </div>
              </div>

              {loginError && (
                <div className="alert alert-danger d-flex align-items-center mb-4 p-3">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  <span className="small">{loginError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group mb-4">
                  <label className="form-label font-weight-medium text-dark mb-2 d-block">
                    Adresse email
                  </label>
                  <div className="input-group login-input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text login-input-icon">
                        <i className="fas fa-envelope"></i>
                      </span>
                    </div>
                    <input
                      type="email"
                      className={`form-control login-input ${errors.email ? "is-invalid" : ""}`}
                      placeholder="email@entreprise.com"
                      disabled={isLoading}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <div className="invalid-feedback d-block mt-2">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {errors.email.message}
                    </div>
                  )}
                </div>

                <div className="form-group mb-4">
                  <label className="form-label font-weight-medium text-dark mb-2 d-block">
                    Mot de passe
                  </label>
                  <div className="input-group login-input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text login-input-icon">
                        <i className="fas fa-lock"></i>
                      </span>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`form-control login-input ${errors.password ? "is-invalid" : ""}`}
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...register("password")}
                    />
                    <div className="input-group-append">
                      <button
                        type="button"
                        className="input-group-text login-input-icon"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        style={{ cursor: "pointer" }}
                      >
                        <i className={`fas fa-${showPassword ? "eye-slash" : "eye"}`}></i>
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <div className="invalid-feedback d-block mt-2">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {errors.password.message}
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="remember-me"
                      disabled={isLoading}
                      {...register("rememberMe")}
                    />
                    <label
                      className="form-check-label text-muted ml-2"
                      htmlFor="remember-me"
                      style={{ cursor: "pointer" }}
                    >
                      Se souvenir de moi
                    </label>
                  </div>

                  <Link
                    to="/mot-de-passe-oublie"
                    className="login-link text-decoration-none"
                    onClick={(e) => isLoading && e.preventDefault()}
                  >
                    <small>Mot de passe oublié?</small>
                  </Link>
                </div>

                <button
                  type="submit"
                  className="login-btn btn btn-primary btn-lg w-100 py-3"
                  disabled={isLoading || !isValid}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm mr-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      Se connecter
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-5 pt-3">
                <p className="text-muted mb-3">
                  Pas encore de compte?{" "}
                  <Link
                    to="/register"
                    className="login-link font-weight-medium text-decoration-none"
                    onClick={(e) => isLoading && e.preventDefault()}
                  >
                    Créer un compte
                  </Link>
                </p>

                <div className="border-top pt-3">
                  <p className="small text-muted mb-3">
                    En vous connectant, vous acceptez nos{" "}
                    <a
                      href="#"
                      className="login-link text-decoration-none"
                      onClick={(e) => isLoading && e.preventDefault()}
                    >
                      conditions d'utilisation
                    </a>{" "}
                    et notre{" "}
                    <a
                      href="#"
                      className="login-link text-decoration-none"
                      onClick={(e) => isLoading && e.preventDefault()}
                    >
                      politique de confidentialité
                    </a>
                    .
                  </p>

                  <Link
                    to="/"
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center"
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "20px",
                      fontSize: "0.875rem"
                    }}
                  >
                    <i className="fas fa-arrow-circle-left mr-2"></i>
                    Retour à l'accueil
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;