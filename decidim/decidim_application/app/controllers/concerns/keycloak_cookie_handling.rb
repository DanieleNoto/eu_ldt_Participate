# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Cookie management utilities for Keycloak authentication.
# Provides helper methods for clearing and validating Keycloak cookies.
#
# All operations are delegated to Decidim::Keycloak::CookieManager
# to maintain a single source of truth.
#
# @see Decidim::Keycloak::CookieManager
# @see KeycloakAuthentication
module KeycloakCookieHandling
  extend ActiveSupport::Concern

  private

  # Determine the correct cookie domain for Keycloak tokens
  # @return [String, nil] The cookie domain for cross-subdomain sharing
  def keycloak_cookie_domain
    Decidim::Keycloak::CookieManager.calculate_cookie_domain(request.host)
  end

  # Clear all Keycloak cookies from all possible domains
  # This prevents cookie accumulation and ensures clean logout
  def clear_keycloak_cookies
    Decidim::Keycloak::CookieManager.clear_all_cookies(cookies, request.host, session)
    Rails.logger.debug "[Keycloak Cookie Cleanup] Cleared cookies from all domains"
  end

  # Validate Keycloak cookies and verify active session
  # @return [Boolean] true if cookies are valid and session is active
  # @deprecated Use KeycloakAuthentication#keycloak_session_valid? instead
  def keycloak_cookies_present_and_valid?
    valid = Decidim::Keycloak::SessionValidator.validate_tokens_and_session(
      cookies["access_token"],
      cookies["id_token"],
      cookies["refresh_token"],
      cookies
    )

    clear_keycloak_cookies unless valid
    valid
  rescue StandardError => e
    Rails.logger.warn "[Keycloak AutoLogin] Error validating cookies: #{e.message}"
    false
  end
end
