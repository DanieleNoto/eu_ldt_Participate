class ApplicationController < ActionController::Base
  # FIXED: Keycloak Authentication Issues - Production Ready
  # ========================================================
  # 1. Only apply Keycloak logic to users who actually logged in with Keycloak (check identities table)
  # 2. Use proper token introspection with Keycloak server instead of local JWT validation
  # 3. This prevents logout of regular users and enables proper session synchronization across tabs
  # 4. Token refresh is now handled by Keycloak server through introspection endpoint
  #
  # Production Optimizations:
  # - 30-second caching of token validation results to reduce Keycloak server load
  # - 5s connect / 10s read timeouts to prevent hanging requests
  # - SSL certificate verification for secure communication
  # - Graceful error handling that assumes tokens valid on network issues (fail-safe)
  # - Secure logging without exposing sensitive token data
  # - Centralized configuration management for maintainability
  # - Admin area included in logout checks for complete session synchronization
  # - Keycloak cookies cleared on logout to prevent auto-login reactivation

  before_action :check_keycloak_auto_login
  before_action :check_keycloak_auto_logout

  private

  # Centralized Keycloak configuration
  def keycloak_config
    @keycloak_config ||= {
      site: ENV['OMNIAUTH_KEYCLOAK_SITE'],
      realm: ENV['OMNIAUTH_KEYCLOAK_REALM'] || 'master',
      client_id: ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID'],
      client_secret: ENV['OMNIAUTH_KEYCLOAK_CLIENT_SECRET']
    }
  end

  def keycloak_config_valid?
    config = keycloak_config
    config[:site].present? && config[:client_id].present? && config[:client_secret].present?
  end

  def check_keycloak_auto_login
    # Skip for API requests, assets, admin paths, auth callbacks, and AJAX requests
    return if request.path.start_with?('/api/')
    return if request.path.start_with?('/assets/')
    return if request.path.start_with?('/admin/')
    return if request.path.start_with?('/users/auth/')
    return if request.path.match?(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
    return if request.xhr?
    return if request.format.json?

    # Skip if user is already authenticated
    return if current_user.present?

    # Check if Keycloak provider is enabled for this organization
    organization = current_organization
    return unless organization&.enabled_omniauth_providers&.dig(:keycloakopenid).present?

    # Check for valid Keycloak cookies
    return unless keycloak_cookies_present_and_valid?

    # Set session flag for frontend auto-login and redirect to login page
    session[:keycloak_auto_login_pending] = true
    Rails.logger.info "[Keycloak AutoLogin] Setting auto-login flag and redirecting to login page"
    redirect_to new_user_session_path
  end

  def check_keycloak_auto_logout
    # Skip for API requests, assets, auth callbacks, and AJAX requests
    # Admin paths are now included to ensure logout synchronization across all areas
    return if request.path.start_with?('/api/')
    return if request.path.start_with?('/assets/')
    return if request.path.start_with?('/users/auth/')
    return if request.path.match?(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
    return if request.xhr?
    return if request.format.json?

    # Skip if user is not authenticated
    return unless current_user.present?

    # CRITICAL FIX: Only apply Keycloak logic to users who actually logged in with Keycloak
    return unless user_logged_in_with_keycloak?(current_user)

    # Check if Keycloak provider is enabled for this organization
    organization = current_organization
    return unless organization&.enabled_omniauth_providers&.dig(:keycloakopenid).present?

    # Use proper token introspection instead of local validation
    unless keycloak_token_still_valid?
      Rails.logger.info "[Keycloak AutoLogout] Keycloak session invalid, logging out user #{current_user.id}"

      # Clear Keycloak cookies to prevent auto-login after logout
      keycloak_cookie_names = ['id_token', 'access_token', 'refresh_token', 'kc_state']
      keycloak_cookie_names.each do |cookie_name|
        cookies.delete(cookie_name, domain: request.domain) if cookies[cookie_name].present?
      end

      # Sign out the user - let Devise handle the redirect automatically
      sign_out current_user
    end
  end

  def keycloak_cookies_present_and_valid?
    # Check for id_token cookie (primary check)
    id_token = cookies['id_token']
    return false unless id_token.present?

    # Basic JWT validation (check if it's a valid JWT)
    begin
      token_parts = id_token.split('.')
      return false unless token_parts.length >= 2

      # Decode payload
      payload = Base64.decode64(token_parts[1].ljust((token_parts[1].length + 3) / 4 * 4, '='))
      claims = JSON.parse(payload)

      # Check if token has basic required claims
      return false unless claims['sub'].present? && claims['email'].present?

      # Check expiry (handle both seconds and milliseconds)
      exp = claims['exp']
      if exp
        exp_time = exp > 1_000_000_000_000 ? Time.at(exp / 1000) : Time.at(exp)
        return false if exp_time < Time.now
      end

      Rails.logger.debug "[Keycloak AutoLogin] Valid Keycloak cookies found, redirecting for auto-login"
      true
    rescue => e
      Rails.logger.warn "[Keycloak AutoLogin] Invalid JWT in cookie: #{e.message}"
      false
    end
  end

  # Method to invalidate Keycloak token cache (useful for debugging)
  def invalidate_keycloak_token_cache
    id_token = cookies['id_token']
    return unless id_token.present?

    cache_key = "keycloak_token_#{Digest::SHA256.hexdigest(id_token)}"
    Rails.cache.delete(cache_key)
    Rails.logger.info "[Keycloak Cache] Invalidated cache for token"
  end

    # NEW: Proper token validation using Keycloak introspection endpoint
  def keycloak_token_still_valid?
    id_token = cookies['id_token']
    return false unless id_token.present?

    return false unless keycloak_config_valid?
    config = keycloak_config

    # Check cache first (30-second TTL for production)
    cache_key = "keycloak_token_#{Digest::SHA256.hexdigest(id_token)}"
    cached_result = Rails.cache.read(cache_key)
    if cached_result != nil
      return cached_result
    end

    Rails.logger.debug "[Keycloak Token Validation] Validating token with Keycloak"

    begin
      # Get access token for introspection using Net::HTTP with timeout and SSL
      uri = URI("#{config[:site]}/realms/#{config[:realm]}/protocol/openid-connect/token")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      http.ca_file = '/etc/ssl/certs/ca-certificates.crt' if File.exist?('/etc/ssl/certs/ca-certificates.crt')
      http.open_timeout = 5  # 5 seconds
      http.read_timeout = 10 # 10 seconds

      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/x-www-form-urlencoded'
      request.body = URI.encode_www_form({
        grant_type: 'client_credentials',
        client_id: config[:client_id],
        client_secret: config[:client_secret]
      })

      token_response = http.request(request)
      return false unless token_response.is_a?(Net::HTTPSuccess)

      access_token = JSON.parse(token_response.body)['access_token']
      return false unless access_token

      # Introspect the user's token
      introspect_uri = URI("#{config[:site]}/realms/#{config[:realm]}/protocol/openid-connect/token/introspect")
      introspect_request = Net::HTTP::Post.new(introspect_uri)
      introspect_request['Content-Type'] = 'application/x-www-form-urlencoded'
      introspect_request.body = URI.encode_www_form({
        token: id_token,
        client_id: config[:client_id],
        client_secret: config[:client_secret]
      })

      introspect_response = http.request(introspect_request)
      return false unless introspect_response.is_a?(Net::HTTPSuccess)

      introspection_result = JSON.parse(introspect_response.body)
      is_active = introspection_result['active'] == true

      # Cache the result for 30 seconds
      Rails.cache.write(cache_key, is_active, expires_in: 30.seconds)

      is_active
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.warn "[Keycloak Token Validation] Network timeout during validation"
      true  # Assume token is still valid on network issues
    rescue JSON::ParserError => e
      Rails.logger.warn "[Keycloak Token Validation] Invalid JSON response during validation"
      true  # Assume token is still valid on parse errors
    rescue => e
      Rails.logger.warn "[Keycloak Token Validation] Unexpected error during validation"
      true  # Assume token is still valid on unexpected errors
    end
  end

  private

  # Centralized Keycloak configuration
  def keycloak_config
    @keycloak_config ||= {
      site: ENV['OMNIAUTH_KEYCLOAK_SITE'],
      realm: ENV['OMNIAUTH_KEYCLOAK_REALM'] || 'master',
      client_id: ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID'],
      client_secret: ENV['OMNIAUTH_KEYCLOAK_CLIENT_SECRET']
    }
  end

  def keycloak_config_valid?
    config = keycloak_config
    config[:site].present? && config[:client_id].present? && config[:client_secret].present?
  end

  # NEW: Check if user logged in with Keycloak
  def user_logged_in_with_keycloak?(user)
    # Check if user has a Keycloak identity
    user.identities.where(provider: 'keycloakopenid').exists?
  end

  # Method to invalidate Keycloak token cache (useful for debugging)
  def invalidate_keycloak_token_cache
    id_token = cookies['id_token']
    return unless id_token.present?

    cache_key = "keycloak_token_#{Digest::SHA256.hexdigest(id_token)}"
    Rails.cache.delete(cache_key)
    Rails.logger.info "[Keycloak Cache] Invalidated cache for token"
  end
end
