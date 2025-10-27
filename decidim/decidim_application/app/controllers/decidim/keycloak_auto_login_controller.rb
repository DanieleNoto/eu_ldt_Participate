module Decidim
  class KeycloakAutoLoginController < ApplicationController
    skip_before_action :check_keycloak_auto_login
    skip_before_action :check_keycloak_auto_logout

    def show
      # Render a page that automatically submits a POST form to Keycloak
      render inline: <<-HTML.html_safe
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting to Keycloak...</title>
          <script>
            window.onload = function() {
              document.getElementById('keycloak-form').submit();
            }
          </script>
        </head>
        <body>
          <p>Redirecting to Keycloak for automatic login...</p>
          <form id="keycloak-form" method="post" action="/users/auth/keycloak_openid">
            <input type="hidden" name="authenticity_token" value="<%= form_authenticity_token %>">
          </form>
        </body>
        </html>
      HTML
    end
  end
end