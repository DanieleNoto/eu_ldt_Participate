Deface::Override.new(
  virtual_path: "decidim/devise/sessions/new",
  name: "add_keycloak_auto_login_javascript",
  insert_bottom: ".login__container",
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
      console.log("Error validating token:", e);
      return false;
    }
  }

  // Function to find and click Keycloak button
  function findAndClickKeycloakButton() {
    // Try multiple selectors for the Keycloak button
    const selectors = [
      ".login__omniauth-button--keycloakopenid a",
      ".login__omniauth-button--keycloakopenid",
      "a[href*=\"keycloakopenid\"]",
      "[data-provider=\"keycloakopenid\"]",
      ".omniauth-button-keycloakopenid"
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log("Found Keycloak button with selector:", selector);
        element.click();
        return true;
      }
    }

    console.log("Keycloak button not found. Available omniauth buttons:");
    const allButtons = document.querySelectorAll(".login__omniauth-button, .omniauth-button, [class*=\"omniauth\"]");
    allButtons.forEach(btn => {
      console.log("Button classes:", btn.className, "href:", btn.href, "text:", btn.textContent);
    });

    return false;
  }

  // Check for valid Keycloak cookies
  const idToken = getCookie("id_token");
  const accessToken = getCookie("access_token");

  console.log("Checking for Keycloak tokens...");
  console.log("id_token present:", !!idToken);
  console.log("access_token present:", !!accessToken);

  if (idToken && accessToken && isTokenValid(idToken)) {
    console.log("Valid Keycloak tokens found, attempting auto-login...");

    // Try immediately
    if (!findAndClickKeycloakButton()) {
      // If not found, try again after a short delay
      setTimeout(findAndClickKeycloakButton, 500);
    }
  } else {
    console.log("No valid Keycloak tokens found or tokens expired");
  }
});
</script>
'
)