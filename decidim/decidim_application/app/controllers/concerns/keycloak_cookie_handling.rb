# frozen_string_literal: true

require 'net/http'

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
  # CENTRALIZED: Uses Decidim::Keycloak::JwtParser and session validation
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
      
      # Check if JWT is expired locally
      if Decidim::Keycloak::JwtParser.locally_expired?(id_token)
        Rails.logger.info "[Keycloak AutoLogin] JWT expired locally, checking Keycloak session validity"
        
        # If JWT is expired, verify if Keycloak session is still active
        unless keycloak_session_active?
          Rails.logger.info "[Keycloak AutoLogin] Keycloak session expired, clearing cookies"
          clear_keycloak_cookies
          return false
        end
        
        Rails.logger.info "[Keycloak AutoLogin] Keycloak session still active, proceeding with auto-login"
      end
    end
    
    # If we only have access_token or refresh_token, verify session validity
    if has_any_token && id_token.blank?
      unless keycloak_session_active?
        Rails.logger.info "[Keycloak AutoLogin] No valid session found, clearing cookies"
        clear_keycloak_cookies
        return false
      end
    end
    
    # Return true if we have any token (access_token, refresh_token, or valid id_token)
    has_any_token || id_token.present?
  rescue => e
    Rails.logger.warn "[Keycloak AutoLogin] Error validating cookies: #{e.message}"
    false
  end

  # Check if Keycloak session is still active by calling the session endpoint
  def keycloak_session_active?
    return true unless Rails.env.production? # Skip in development to avoid network calls
    
    begin
      keycloak_site = ENV['OMNIAUTH_KEYCLOAK_SITE']
      realm = ENV['OMNIAUTH_KEYCLOAK_REALM']
      
      return true unless keycloak_site.present? && realm.present?
      
      # Use the session check endpoint to verify if session is active
      session_check_url = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/login-status-iframe.html"
      
      uri = URI.parse(session_check_url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      http.open_timeout = 3
      http.read_timeout = 3
      
      request = Net::HTTP::Head.new(uri)
      # Add cookies to check session
      cookie_header = []
      cookie_header << "KEYCLOAK_SESSION=#{cookies['KEYCLOAK_SESSION']}" if cookies['KEYCLOAK_SESSION'].present?
      cookie_header << "KEYCLOAK_SESSION_LEGACY=#{cookies['KEYCLOAK_SESSION_LEGACY']}" if cookies['KEYCLOAK_SESSION_LEGACY'].present?
      request['Cookie'] = cookie_header.join('; ') if cookie_header.any?
      
      response = http.request(request)
      
      # If we get 200, session is likely active
      # If we get 401/403, session is expired
      session_active = response.code.to_i == 200
      
      Rails.logger.info "[Keycloak Session Check] Session active: #{session_active} (HTTP #{response.code})"
      session_active
    rescue Net::TimeoutError, Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.warn "[Keycloak Session Check] Timeout checking session: #{e.message}, assuming active"
      true # Assume active on timeout to avoid blocking users
    rescue => e
      Rails.logger.warn "[Keycloak Session Check] Error checking session: #{e.message}, assuming active"
      true # Assume active on error to avoid blocking users
    end
  end
end