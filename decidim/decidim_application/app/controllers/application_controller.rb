# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# Marco Pinnella
# Pierluigi Spedicato
# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include KeycloakCookieHandling
  include KeycloakAuthentication

  before_action :check_keycloak_background_auto_login

  private

  # Background auto-login check: If user has potentially valid Keycloak tokens but isn't
  # logged in, silently authenticate them via Keycloak SSO without showing redirect/flicker.
  # Two triggers:
  #   1. User has locally-valid tokens (returning user on this app)
  #   2. User navigates from another tool in the same SSO domain (cross-tool SSO)
  def check_keycloak_background_auto_login
    # Skip for API controllers (no current_organization)
    return if self.class.module_parent == Api

    # Don't check if user already authenticated
    return if current_user.present?

    # Don't check if current_organization is not available (e.g. ErrorsController)
    return unless respond_to?(:current_organization, true)

    # Don't check if Keycloak not enabled (current_organization might be nil)
    return if current_organization.blank?
    return unless keycloak_enabled_for_organization?

    # Don't check on specific paths
    return if request.path.start_with?("/api/", "/assets/", "/users/auth/", "/admin/")
    return if request.xhr? || request.format.json?

    # Attempt SSO if:
    # - User has locally-valid auth tokens (returning user), OR
    # - User navigates from another tool in the same SSO domain (cross-tool SSO, may have no tokens yet)
    has_valid_tokens = keycloak_auth_tokens_present? && any_keycloak_token_locally_valid?
    from_same_domain = coming_from_same_domain_tool?

    unless has_valid_tokens || from_same_domain
      Rails.logger.info "[Keycloak BG Auto-Login] No valid tokens and not from same domain, skipping"
      return
    end

    Rails.logger.info "[Keycloak BG Auto-Login] Initiating SSO auto-login (tokens=#{has_valid_tokens}, cross-tool=#{from_same_domain})"

    # Generate CSRF state for OmniAuth
    state = SecureRandom.hex(32)
    session["omniauth.state"] = state

    # Build callback URL
    protocol = request.ssl? ? "https" : "http"
    callback_url = "#{protocol}://#{request.host_with_port}/users/auth/keycloakopenid/callback"

    # Get Keycloak authorization endpoint
    auth_url = Decidim::Keycloak::Configuration.authorization_url(
      redirect_uri: callback_url,
      state: state
    )

    redirect_to auth_url, allow_other_host: true
  end

  # Check if any Keycloak JWT cookie has not yet expired locally (zero network).
  # Avoids redirecting to Keycloak when all tokens are definitively expired.
  def any_keycloak_token_locally_valid?
    %w(access_token refresh_token id_token).any? do |name|
      token = cookies[name]
      token.present? && !Decidim::Keycloak::JwtParser.locally_expired?(token)
    end
  rescue StandardError
    true # On parse error, allow redirect (Keycloak will decide)
  end
end
