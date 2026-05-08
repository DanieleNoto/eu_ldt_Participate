# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

Rails.application.config.to_prepare do
  # Override Decidim's OmniAuth callbacks controller to handle CSRF errors with auto-login
  Decidim::Devise::OmniauthRegistrationsController.class_eval do
    # Override failure action to handle CSRF errors
    def failure
      # Check if it's a CSRF error from Keycloak
      if params[:message] == "csrf_detected" && params[:strategy] == "keycloakopenid"
        Rails.logger.info "[Keycloak] CSRF error detected, clearing tokens and signing out to prevent inconsistent session state"

        # Clear the redirect debounce so a subsequent (single) login attempt can proceed
        session.delete("keycloak_autologin_redirect_at")

        # Clear Keycloak tokens so check_keycloak_background_auto_login won't retrigger.
        # Without this, locally-valid tokens would cause an immediate redirect back to Keycloak,
        # producing another CSRF error in an infinite loop.
        Decidim::Keycloak::CookieManager.clear_all_cookies(cookies, request.host, session)

        # Also sign out from Decidim to avoid an inconsistent state where the user appears
        # logged in (Warden session intact) but has no Keycloak tokens, which causes
        # check_keycloak_auto_logout to immediately fire "session expired" on the next request.
        sign_out(current_user) if current_user.present?

        redirect_to("/users/sign_in") && return
      end

      # Call original failure handling for other errors
      super
    end
  end
end
