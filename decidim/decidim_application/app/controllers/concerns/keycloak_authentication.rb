# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

require "net/http"
require "uri"

# Main Keycloak authentication concern for Decidim controllers.
# Handles auto-login, auto-logout, and locale synchronization.
#
# Dependencies (from decidim-keycloak engine):
# - Decidim::Keycloak::Configuration - Centralized config
# - Decidim::Keycloak::TokenService - Token validation/refresh (Silent Refresh pattern)
# - Decidim::Keycloak::CookieManager - Cookie operations
# - Decidim::Keycloak::LocaleSynchronizer - Locale sync from tokens
#
# @see KeycloakCookieHandling for cookie management utilities
module KeycloakAuthentication
  extend ActiveSupport::Concern

  # Provider identifier used in Decidim identities table
  KEYCLOAK_PROVIDER = "keycloakopenid"

  included do
    before_action :check_keycloak_auto_logout
    before_action :check_keycloak_locale_sync
  end

  private

  # ============================================================================
  # User & Organization Checks
  # ============================================================================

  # Check if user authenticated via Keycloak
  # @param user [Decidim::User] The user to check
  # @return [Boolean] true if user has Keycloak identity
  def user_logged_in_with_keycloak?(user)
    return false unless user

    user.identities.exists?(provider: KEYCLOAK_PROVIDER)
  end

  # Check if Keycloak provider is enabled for current organization
  # @return [Boolean] true if enabled
  def keycloak_enabled_for_organization?
    current_organization&.enabled_omniauth_providers&.dig(:keycloakopenid).present?
  end

  # ============================================================================
  # Token & Cookie Detection
  # ============================================================================

  # Check if Keycloak authentication tokens are present
  # @return [Boolean] true if any auth token exists
  def keycloak_auth_tokens_present?
    %w(access_token refresh_token id_token).any? { |name| cookies[name].present? }
  end

  # ============================================================================
  # Cross-Tool SSO Detection
  # ============================================================================

  # Check if we're coming from another tool in the same domain
  # @return [Boolean] true if cross-tool navigation detected
  def coming_from_same_domain_tool?
    referer = request.referer
    return false if referer.blank?

    Decidim::Keycloak::CrossToolDetector.from_same_domain?(
      referer: referer,
      current_host: request.host,
      decidim_host: ENV.fetch("DECIDIM_HOST", nil)
    )
  rescue URI::InvalidURIError => e
    false
  end

  # ============================================================================
  # Paths to skip for checks
  # ============================================================================

  SKIP_PATH_PREFIXES = %w(/api/ /assets/ /users/auth/).freeze
  SKIP_ADMIN_PATH = "/admin/"
  SKIP_FILE_EXTENSIONS = /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/

  def should_skip_keycloak_checks?
    SKIP_PATH_PREFIXES.any? { |prefix| request.path.start_with?(prefix) } ||
      request.path.match?(SKIP_FILE_EXTENSIONS) ||
      request.xhr? ||
      request.format.json?
  end

  # ============================================================================
  # Auto-Logout Logic
  # ============================================================================

  def check_keycloak_auto_logout
    return if should_skip_keycloak_checks?
    return if current_user.blank?
    return unless user_logged_in_with_keycloak?(current_user)
    return unless keycloak_enabled_for_organization?

    # Delegate token validation and refresh to TokenService
    valid_token = Decidim::Keycloak::TokenService.ensure_valid_token(
      current_user,
      cookies_hash: request.cookies,
      cookies_obj: cookies,
      request_host: request.host,
      controller: self
    )

    if valid_token
      return
    end

    perform_automatic_logout
  end

  # ============================================================================
  # Locale Synchronization
  # ============================================================================

  def check_keycloak_locale_sync
    return if should_skip_keycloak_checks?
    return if request.path.start_with?(SKIP_ADMIN_PATH)
    return unless current_user.present? && user_logged_in_with_keycloak?(current_user)
    return unless keycloak_enabled_for_organization?

    current_session_locale = session["decidim-locale"] || I18n.locale.to_s
    new_locale = detect_keycloak_locale(current_session_locale)

    apply_locale_if_changed(new_locale, current_session_locale)
  end

  def perform_automatic_logout
    Rails.logger.warn "[Keycloak AutoLogout] Forcing logout for user #{current_user&.id} — " \
                      "access_token=#{cookies["access_token"].present? ? 'present' : 'missing'}, " \
                      "refresh_token=#{cookies["refresh_token"].present? ? 'present' : 'missing'}, " \
                      "path=#{request.path}"

    # Back-channel SLO: notify Keycloak server-to-server so other SSO apps get logged out
    notify_keycloak_session_end(cookies["id_token"])

    # Clear tokens first — this also prevents the background auto-login loop on the next
    # request (check_keycloak_background_auto_login will find no tokens and return early).
    clear_keycloak_cookies
    sign_out current_user

    flash[:alert] = I18n.t("decidim.keycloak.sessions.session_expired")
    redirect_to("/users/sign_in") && return
  end

  # Back-channel logout: POST to Keycloak logout endpoint to propagate SLO to other apps.
  # Non-blocking — failures are logged but do not prevent local logout.
  def notify_keycloak_session_end(id_token)
    keycloak_site = ENV.fetch("OMNIAUTH_KEYCLOAK_SITE", nil)
    realm = ENV["OMNIAUTH_KEYCLOAK_REALM"] || "master"
    return unless keycloak_site.present? && realm.present?

    uri = URI("#{keycloak_site.to_s.chomp('/')}/realms/#{realm}/protocol/openid-connect/logout")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    http.open_timeout = 3
    http.read_timeout = 3

    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/x-www-form-urlencoded"
    params = {
      client_id: ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_ID", nil),
      client_secret: ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_SECRET", nil)
    }
    params[:id_token_hint] = id_token if id_token.present?
    request.set_form_data(params)

    response = http.request(request)
    unless response.code.to_i.between?(200, 299)
      Rails.logger.warn "[Keycloak SLO] Back-channel logout returned HTTP #{response.code} — " \
                        "Keycloak SSO session may still be active; user could be auto-re-logged in"
    end
  rescue StandardError => e
    Rails.logger.warn "[Keycloak SLO] Back-channel logout failed (#{e.class}: #{e.message}) — " \
                      "Keycloak SSO session may still be active; user could be auto-re-logged in"
  end

  def detect_keycloak_locale(current_session_locale)
    # Priority 1: i18next cookie from Keycloak
    if cookies["i18next"].present?
      locale = cookies["i18next"].strip
      if current_organization.available_locales.include?(locale)
        return locale
      end
    end

    # Priority 2: id_token locale claim
    id_token = cookies["id_token"]
    if id_token.present?
      locale = Decidim::Keycloak::LocaleSynchronizer.sync_from_token(id_token, current_session_locale)
      if locale.present?
        return locale
      end
    end

    nil
  end

  def apply_locale_if_changed(new_locale, current_session_locale)
    return if new_locale.blank? || new_locale == current_session_locale

    I18n.locale = new_locale
    session["decidim-locale"] = new_locale
  end
end
