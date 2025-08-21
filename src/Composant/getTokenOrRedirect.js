// utils/getTokenOrRedirect.js
const GetTokenOrRedirect = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/archive/";
    return null;
  }
  return token;
};

export default GetTokenOrRedirect;
