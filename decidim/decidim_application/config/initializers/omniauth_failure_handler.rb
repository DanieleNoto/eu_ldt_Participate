# frozen_string_literal: true

Rails.application.config.to_prepare do
  # Override Decidim's OmniAuth callbacks controller to handle CSRF errors with auto-login
  Decidim::Devise::OmniauthRegistrationsController.class_eval do
    # Override failure action to add auto-login parameter for CSRF errors
    def failure
      # Check if it's a CSRF error from Keycloak
      if params[:message] == 'csrf_detected' && params[:strategy] == 'keycloakopenid'
        Rails.logger.info "[Keycloak] CSRF error detected, redirecting with auto-login flag"
        # Redirect to login page with auto-login parameter to trigger auto-retry
        redirect_to "/users/sign_in?keycloak_auto_login=1" and return
      end
      
      # Call original failure handling for other errors
      super
    end
  end
end
