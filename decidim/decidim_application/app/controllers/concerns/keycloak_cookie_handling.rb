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
    id_token = cookies['id_token']
    return false unless id_token.present?

    # Use centralized JWT validation
    return false unless Decidim::Keycloak::JwtParser.valid_structure?(id_token)
    return false if Decidim::Keycloak::JwtParser.locally_expired?(id_token)

    Rails.logger.debug "[Keycloak AutoLogin] Valid Keycloak cookies found, redirecting for auto-login"
    true
  rescue => e
    Rails.logger.warn "[Keycloak AutoLogin] Error validating cookies: #{e.message}"
    false
  end
end