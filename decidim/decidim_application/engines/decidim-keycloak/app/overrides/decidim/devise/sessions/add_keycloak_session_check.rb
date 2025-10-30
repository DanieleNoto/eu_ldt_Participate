Deface::Override.new(
  virtual_path: "decidim/devise/sessions/new",
  name: "add_keycloak_auto_login_session_check",
  insert_bottom: ".login__info",
  text: '
<script>
document.addEventListener("DOMContentLoaded", function() {
  // Check if auto-login is pending from session
  <% if session.delete(:keycloak_auto_login_pending) %>
    window.keycloakAutoLogin = true;
    console.log("Keycloak auto-login enabled from session");
  <% else %>
    window.keycloakAutoLogin = false;
  <% end %>

  if (window.keycloakAutoLogin) {
    // Function to find and click Keycloak button with retry
    function findAndClickKeycloakButton(retryCount = 0) {
      const maxRetries = 10;
      const selectors = [
        ".login__omniauth-button--keycloakopenid",
        "a[href*=\"keycloakopenid\"]",
        "[data-provider=\"keycloakopenid\"]"
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          console.log("Found Keycloak button with selector:", selector);
          element.click();
          return true;
        }
      }

      if (retryCount < maxRetries) {
        setTimeout(() => findAndClickKeycloakButton(retryCount + 1), 500);
      } else {
        console.log("Keycloak button not found after", maxRetries, "retries");
      }
      return false;
    }

    console.log("Attempting Keycloak auto-login");
    findAndClickKeycloakButton();
  }
});
</script>
'
)