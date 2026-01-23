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
        Rails.logger.info "[Keycloak] CSRF error detected, redirecting to login"
        # Redirect to login page (background check will handle auto-login if session valid)
        redirect_to("/users/sign_in") && return
      end

      # Call original failure handling for other errors
      super
    end
  end
end
