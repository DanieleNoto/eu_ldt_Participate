Deface::Override.new(
  virtual_path: "decidim/devise/sessions/new",
  name: "add_keycloak_auto_login_javascript",
  insert_bottom: ".login__info",
  text: '
<script>
document.addEventListener("DOMContentLoaded", function() {
  // Function to get cookie value
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  // Function to check if JWT token is valid (not expired)
  function isTokenValid(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (e) {
      return false;
    }
  }

  // Check for valid Keycloak cookies
  const idToken = getCookie("id_token");
  const accessToken = getCookie("access_token");

  if (idToken && accessToken && isTokenValid(idToken)) {
    // Find and click the Keycloak button
    const keycloakButton = document.querySelector(".login__omniauth-button--keycloakopenid");
    if (keycloakButton) {
      console.log("Valid Keycloak tokens found, auto-clicking Keycloak login button");
      keycloakButton.click();
    }
  }
});
</script>
'
)