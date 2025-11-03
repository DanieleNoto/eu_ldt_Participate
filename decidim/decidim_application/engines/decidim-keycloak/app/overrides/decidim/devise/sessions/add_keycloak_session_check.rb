Deface::Override.new(
  virtual_path: "decidim/devise/sessions/new",
  name: "add_keycloak_auto_login_session_check",
  insert_bottom: ".login__info",
  text: '
<script<%= " nonce=\"#{request.content_security_policy_nonce}\"" if request.respond_to?(:content_security_policy_nonce) %>>
document.addEventListener("DOMContentLoaded", function() {
  // Check if auto-login is pending from session
  <% if session.delete(:keycloak_auto_login_pending) %>
    window.keycloakAutoLogin = true;
    console.log("Keycloak auto-login enabled from session - attempting auto-login");
  <% else %>
    window.keycloakAutoLogin = false;
    console.log("Keycloak auto-login not enabled - no session flag found");
  <% end %>

  if (window.keycloakAutoLogin) {
    // Function to find and click Keycloak button with retry
    function findAndClickKeycloakButton(retryCount = 0) {
      const maxRetries = 10;
      const selectors = [
        ".login__omniauth-button--keycloakopenid",
        "a[href*=\"keycloakopenid\"]",
        "[data-provider=\"keycloakopenid\"]",
        ".button--keycloakopenid",
        ".omniauth-button-keycloakopenid",
        "a[href*=\"keycloak\"]",
        "[data-turbo=\"false\"][href*=\"keycloak\"]",
        "[class*=\"keycloak\"]",
        "[id*=\"keycloak\"]"
      ];

      console.log("Looking for Keycloak button, attempt", retryCount + 1);

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          console.log("Found Keycloak button with selector:", selector, element);
          element.click();
          return true;
        }
      }

      // Also try to find any button/link containing "keycloak" in text or href
      const allButtons = document.querySelectorAll('a, button');
      for (const button of allButtons) {
        const text = button.textContent?.toLowerCase() || '';
        const href = button.href?.toLowerCase() || '';
        if (text.includes('keycloak') || href.includes('keycloak')) {
          console.log("Found Keycloak button by text/href:", button);
          button.click();
          return true;
        }
      }

      if (retryCount < maxRetries) {
        setTimeout(() => findAndClickKeycloakButton(retryCount + 1), 500);
      } else {
        console.log("Keycloak button not found after", maxRetries, "retries");
        console.log("Available omniauth buttons:", document.querySelectorAll('.login__omniauth-button'));
        console.log("Available links:", document.querySelectorAll('a[href*="omniauth"]'));
        console.log("All buttons on page:", document.querySelectorAll('button'));
        console.log("All links on page:", document.querySelectorAll('a'));
      }
      return false;
    }

    console.log("Attempting Keycloak auto-login");
    // Try immediately first
    if (!findAndClickKeycloakButton()) {
      // If not found immediately, wait a bit and try again
      setTimeout(() => findAndClickKeycloakButton(0), 100);
    }
  }
});
</script>
'
)