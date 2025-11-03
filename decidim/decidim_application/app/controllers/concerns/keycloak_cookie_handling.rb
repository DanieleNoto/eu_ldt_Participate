# frozen_string_literal: true

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

  # Check if Keycloak cookies are present and valid
  # CENTRALIZED: Uses Decidim::Keycloak::JwtParser
  def keycloak_cookies_present_and_valid?
    access_token = cookies['access_token']
    id_token = cookies['id_token']
    refresh_token = cookies['refresh_token']
    
    # Accept any valid Keycloak token combination for autologin
    # This allows autologin even with partial token sets
    has_any_token = access_token.present? || refresh_token.present?
    
    # If we have id_token, validate its structure
    if id_token.present?
      return false unless Decidim::Keycloak::JwtParser.valid_structure?(id_token)
      
      # IMPORTANT: Even if JWT is locally expired, we should trigger auto-login
      # because Keycloak might have a valid session and will handle refresh automatically
      if Decidim::Keycloak::JwtParser.locally_expired?(id_token)
        Rails.logger.info "[Keycloak AutoLogin] JWT expired, Keycloak will handle refresh during SSO"
      end
    end
    
    # Return true if we have any token (access_token, refresh_token, or valid id_token)
    has_any_token || id_token.present?
  rescue => e
    Rails.logger.warn "[Keycloak AutoLogin] Error validating cookies: #{e.message}"
    false
  end
end