# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
#   Gianfranco Cedro
#   Marco Pinnella
# frozen_string_literal: true

module Decidim
  module Keycloak
    # Controller to handle external login redirects that need to establish
    # a Decidim session before initiating OAuth flow
    class ExternalLoginController < Decidim::ApplicationController
      skip_before_action :verify_authenticity_token, only: [:initiate]
      skip_before_action :store_current_location

      # GET /users/auth/keycloakopenid/external
      # This endpoint is designed to be called from external applications
      # It establishes a session, generates CSRF state, and redirects directly to Keycloak
      def initiate
        # Ensure we have an organization context
        unless current_organization
          Rails.logger.error "External login failed: No organization found for host #{request.host}"
          render plain: "Organization not found for this domain", status: :not_found
          return
        end

        # Verify Keycloak is enabled for this organization
        keycloak_config = current_organization.enabled_omniauth_providers[:keycloakopenid]
        unless keycloak_config
          Rails.logger.error "External login failed: Keycloak not enabled for #{current_organization.name}"
          render plain: "Keycloak authentication not enabled", status: :forbidden
          return
        end

        # Store locale if provided
        locale = params[:locale].presence || current_organization.default_locale || "en"
        session["decidim-locale"] = locale if current_organization.available_locales.include?(locale)

        # Store return_to URL if provided (for post-login redirect)
        session[:user_return_to] = params[:return_to] if params[:return_to].present?

        # Generate and store CSRF state token (same as OmniAuth does)
        state = SecureRandom.hex(32)
        session["omniauth.state"] = state

        # Determine protocol and build callback URL
        protocol = request.ssl? ? "https" : "http"
        callback_url = "#{protocol}://#{request.host_with_port}/users/auth/keycloakopenid/callback"

        # Build validated Keycloak authorization URL using centralized configuration
        auth_url = Decidim::Keycloak::Configuration.authorization_url(
          redirect_uri: callback_url,
          state: state
        )

        unless auth_url
          Rails.logger.error "External login failed: Could not build valid authorization URL for #{current_organization.name}"
          render plain: "Invalid authentication configuration", status: :internal_server_error
          return
        end

        Rails.logger.info "External login: Redirecting to Keycloak with state=#{state[0..8]}..."
        Rails.logger.info "   Callback URL: #{callback_url}"

        # Redirect to the validated and sanitized Keycloak URL
        redirect_to auth_url, allow_other_host: true
      end
    end
  end
end
