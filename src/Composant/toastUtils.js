// src/Composant/toastUtils.js
import Swal from "sweetalert2";

export const showSuccess = (message) => {
  Swal.fire({
    icon: "success",
    title: "Succès",
    text: message,
    timer: 2000,
    showConfirmButton: false,
    position: "top-end",
    toast: true,
  });
};

export const showError = (message) => {
  Swal.fire({
    icon: "error",
    title: "Erreur",
    text: message,
    timer: 3000,
    showConfirmButton: false,
    position: "top-end",
    toast: true,
  });
};
