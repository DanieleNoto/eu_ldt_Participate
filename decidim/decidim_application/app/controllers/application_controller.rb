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

  # Background auto-login check: If user has valid Keycloak cookies but isn't logged in,
  # silently authenticate them without showing redirect/flicker.
  # This runs on EVERY page before rendering.
  def check_keycloak_background_auto_login
    # Don't check if user already authenticated
    return if current_user.present?

    # Don't check if Keycloak not enabled
    return unless keycloak_enabled_for_organization?

    # Don't check if no Keycloak cookies
    return unless keycloak_cookies_present?

    # Don't check on specific paths
    return if request.path.start_with?("/api/", "/assets/", "/users/auth/", "/admin/")
    return if request.xhr? || request.format.json?

    # Validate Keycloak session
    unless keycloak_session_valid?
      Rails.logger.info "[Keycloak BG Auto-Login] Cookies present but session invalid, skipping"
      return
    end

    Rails.logger.info "[Keycloak BG Auto-Login] Valid Keycloak session detected, initiating auto-login..."
    
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
    
    Rails.logger.info "[Keycloak BG Auto-Login] Redirecting to Keycloak for SSO login"
    redirect_to auth_url, allow_other_host: true
  end

  def keycloak_enabled_for_organization?
    current_organization&.enabled_omniauth_providers&.dig(:keycloakopenid).present?
  end

  def keycloak_cookies_present?
    %w(access_token refresh_token id_token).any? { |name| cookies[name].present? }
  end

  def keycloak_session_valid?
    Decidim::Keycloak::SessionValidator.validate_tokens_and_session(
      cookies["access_token"],
      cookies["id_token"],
      cookies["refresh_token"],
      cookies
    )
  rescue StandardError => e
    Rails.logger.warn "[Keycloak BG Auto-Login] Error validating session: #{e.message}"
    false
  end
end
