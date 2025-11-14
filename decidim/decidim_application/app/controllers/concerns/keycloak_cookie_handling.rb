# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



module KeycloakCookieHandling
  extend ActiveSupport::Concern

  private

  # Determine the correct cookie domain for Keycloak tokens
  # CENTRALIZED: Uses Decidim::Keycloak::CookieManager
  def keycloak_cookie_domain
    Decidim::Keycloak::CookieManager.calculate_cookie_domain(request.host)
  end

  # Clear Keycloak cookies from all possible domains to prevent accumulation
  # CENTRALIZED: Uses Decidim::Keycloak::CookieManager
  def clear_keycloak_cookies
    Decidim::Keycloak::CookieManager.clear_all_cookies(cookies, request.host, session)
    Rails.logger.info "[Keycloak Cookie Cleanup] Cleared Keycloak cookies from all domains"
  end

  # Check if Keycloak cookies are present and valid, and verify active session
  # CENTRALIZED: Uses Decidim::Keycloak::SessionValidator for validation
  def keycloak_cookies_present_and_valid?
    access_token = cookies['access_token']
    id_token = cookies['id_token']
    refresh_token = cookies['refresh_token']
    
    # Use the centralized session validator from the Keycloak engine
    valid = Decidim::Keycloak::SessionValidator.validate_tokens_and_session(
      access_token, 
      id_token, 
      refresh_token, 
      cookies
    )
    
    # Clear cookies if validation failed
    if !valid
      Rails.logger.info "[Keycloak AutoLogin] Token validation failed, clearing cookies"
      clear_keycloak_cookies
    end
    
    valid
  rescue => e
    Rails.logger.warn "[Keycloak AutoLogin] Error validating cookies: #{e.message}"
    false
  end
end