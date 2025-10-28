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
      console.log("Token validation error:", e);
      return false;
    }
  }

  // Check for valid Keycloak cookies
  const idToken = getCookie("id_token");
  const accessToken = getCookie("access_token");

  console.log("Keycloak auto-login check:");
  console.log("- id_token present:", !!idToken);
  console.log("- access_token present:", !!accessToken);

  if (idToken && accessToken && isTokenValid(idToken)) {
    console.log("Valid Keycloak tokens found, attempting auto-login");

    // Find and click the Keycloak button
    const keycloakButton = document.querySelector(".login__omniauth-button--keycloakopenid");
    if (keycloakButton) {
      console.log("Found Keycloak button, clicking...");
      keycloakButton.click();
    } else {
      console.log("Keycloak button not found!");
      // Log all available omniauth buttons
      const allButtons = document.querySelectorAll("[class*=\"omniauth\"]");
      console.log("Available omniauth buttons:", Array.from(allButtons).map(btn => btn.className));
    }
  } else {
    console.log("No valid Keycloak tokens found or tokens expired");
  }
});
</script>
'
)