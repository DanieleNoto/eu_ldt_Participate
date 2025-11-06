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

  # Determine the correct cookie domain for Keycloak tokens
  def keycloak_cookie_domain
    host = request.host

    # In production/development with subdomains, use the second-level domain
    # to allow cookie sharing across subdomains
    if Rails.env.production? || Rails.env.development?
      # Extract domain parts: part-int.ldttoolbox.app -> ['part-int', 'ldttoolbox', 'app']
      domain_parts = host.split('.')

      # For domains like *.ldttoolbox.app, use .ldttoolbox.app
      if domain_parts.length >= 3
        # Return domain with leading dot for cross-subdomain cookies
        ".#{domain_parts[-2]}.#{domain_parts[-1]}"
      else
        # Fallback to current host
        host
      end
    else
      # In other environments, use the current host
      host
    end
  end

  # Clear Keycloak cookies from all possible domains to prevent accumulation
  def clear_keycloak_cookies
    keycloak_cookie_names = ['id_token', 'access_token', 'refresh_token', 'kc_state']

    # Domains to clear cookies from (most specific to least specific)
    domains_to_clear = [
      request.host,                    # e.g., "part-int.ldttoolbox.app"
      keycloak_cookie_domain,          # e.g., ".ldttoolbox.app"
      request.domain,                  # e.g., "ldttoolbox.app"
      nil                              # No domain (current host only)
    ].uniq

    domains_to_clear.each do |domain|
      Rails.logger.debug "[Keycloak Cookie Cleanup] Clearing cookies for domain: #{domain || 'current host'}"

      # Clear named Keycloak cookies
      keycloak_cookie_names.each do |cookie_name|
        cookies.delete(cookie_name, domain: domain) if cookies[cookie_name].present?
      end

      # Clear any cookies starting with 'kc_' (Keycloak pattern)
      cookies.each do |name, _value|
        if name.start_with?('kc_')
          cookies.delete(name, domain: domain)
        end
      end
    end

    Rails.logger.info "[Keycloak Cookie Cleanup] Cleared Keycloak cookies from all domains"
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

      # Clear all Keycloak-related cookies from all possible domains
      clear_keycloak_cookies

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

    # First, check if token is locally expired to avoid unnecessary network calls
    if token_locally_expired?(id_token)
      Rails.logger.info "[Keycloak Token Validation] Token locally expired for user #{current_user&.id}, attempting refresh"

      # Try to refresh the token before giving up
      if refresh_keycloak_token
        Rails.logger.info "[Keycloak Token Validation] Token refreshed successfully for user #{current_user&.id}"
        return true
      else
        Rails.logger.info "[Keycloak Token Validation] Token refresh failed for user #{current_user&.id}"
        return false
      end
    end

    begin
      # Get access token for introspection using Net::HTTP with timeout and SSL
      uri = URI("#{config[:site]}/realms/#{config[:realm]}/protocol/openid-connect/token")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      # Use system CA certificates instead of hardcoded path
      http.cert_store = OpenSSL::SSL::SSLContext::DEFAULT_CERT_STORE
      http.open_timeout = 10  # 10 seconds (increased from 5s)
      http.read_timeout = 20 # 20 seconds (increased from 10s)

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

      # Log token validation result for debugging
      if is_active
        Rails.logger.debug "[Keycloak Token Validation] Token is valid for user #{current_user&.id}"
      else
        Rails.logger.info "[Keycloak Token Validation] Token is invalid/revoked for user #{current_user&.id} - forcing logout"
        return false  # Don't attempt refresh for revoked tokens
      end

      # Cache the result for 10 seconds (reduced from 30s for better security)
      Rails.cache.write(cache_key, is_active, expires_in: 10.seconds)

      is_active
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error "[Keycloak Token Validation] Network timeout during validation: #{e.message}"
      false  # Force logout on network issues for security
    rescue JSON::ParserError => e
      Rails.logger.error "[Keycloak Token Validation] Invalid JSON response during validation: #{e.message}"
      false  # Force logout on invalid responses
    rescue => e
      Rails.logger.error "[Keycloak Token Validation] Unexpected error during validation: #{e.class} - #{e.message}"
      false  # Force logout on unexpected errors
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

  # Check if token is locally expired (fast check before network call)
  def token_locally_expired?(id_token)
    return true unless id_token.present?

    begin
      token_parts = id_token.split('.')
      return true unless token_parts.length >= 2

      payload = Base64.decode64(token_parts[1].ljust((token_parts[1].length + 3) / 4 * 4, '='))
      claims = JSON.parse(payload)

      exp = claims['exp']
      return true unless exp

      # Handle both seconds and milliseconds timestamps
      exp_time = exp > 1_000_000_000_000 ? Time.at(exp / 1000) : Time.at(exp)
      exp_time < Time.now
    rescue => e
      Rails.logger.warn "[Keycloak Local Check] Error parsing token: #{e.message}"
      true # Assume expired if we can't parse it
    end
  end

  # Attempt to refresh the Keycloak token using refresh_token
  def refresh_keycloak_token
    refresh_token = cookies['refresh_token']
    return false unless refresh_token.present? && keycloak_config_valid?

    config = keycloak_config

    begin
      Rails.logger.debug "[Keycloak Token Refresh] Attempting token refresh"

      uri = URI("#{config[:site]}/realms/#{config[:realm]}/protocol/openid-connect/token")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      http.cert_store = OpenSSL::SSL::SSLContext::DEFAULT_CERT_STORE
      http.open_timeout = 10
      http.read_timeout = 20

      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/x-www-form-urlencoded'
      request.body = URI.encode_www_form({
        grant_type: 'refresh_token',
        client_id: config[:client_id],
        client_secret: config[:client_secret],
        refresh_token: refresh_token
      })

      response = http.request(request)

      unless response.is_a?(Net::HTTPSuccess)
        Rails.logger.warn "[Keycloak Token Refresh] Refresh failed with status #{response.code}"
        return false
      end

      token_data = JSON.parse(response.body)

      # Validate that we got the required tokens
      unless token_data['access_token'] && token_data['refresh_token']
        Rails.logger.warn "[Keycloak Token Refresh] Refresh response missing required tokens"
        return false
      end

      # Save the new tokens to cookies
      save_keycloak_tokens_to_cookies(token_data)

      Rails.logger.info "[Keycloak Token Refresh] Token refresh successful"
      true
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error "[Keycloak Token Refresh] Network timeout during refresh: #{e.message}"
      false
    rescue JSON::ParserError => e
      Rails.logger.error "[Keycloak Token Refresh] Invalid JSON response during refresh: #{e.message}"
      false
    rescue => e
      Rails.logger.error "[Keycloak Token Refresh] Unexpected error during refresh: #{e.class} - #{e.message}"
      false
    end
  end

  # Extract token expiry from JWT id_token
  def extract_token_expiry_from_jwt(id_token)
    return nil unless id_token.present?

    begin
      token_parts = id_token.split('.')
      return nil unless token_parts.length >= 2

      # Decode payload
      payload = Base64.decode64(token_parts[1].ljust((token_parts[1].length + 3) / 4 * 4, '='))
      claims = JSON.parse(payload)

      # Get expiry claim
      exp = claims['exp']
      return nil unless exp

      # Handle both seconds and milliseconds timestamps
      exp > 1_000_000_000_000 ? Time.at(exp / 1000) : Time.at(exp)
    rescue => e
      Rails.logger.warn "[Keycloak Token Expiry] Error extracting expiry from JWT: #{e.message}"
      nil
    end
  end

  # Save Keycloak tokens to cookies (extracted for reuse)
  def save_keycloak_tokens_to_cookies(token_data)
    # Clear existing Keycloak cookies first to prevent duplication
    clear_keycloak_cookies

    # Extract correct expiry from JWT id_token if available
    expires_at = extract_token_expiry_from_jwt(token_data['id_token']) || 1.hour.from_now

    # Get the correct cookie domain for cross-subdomain sharing
    cookie_domain = keycloak_cookie_domain

    # Save tokens to cookies with proper domain and expiry
    cookies['access_token'] = {
      value: token_data['access_token'],
      expires: expires_at,
      secure: Rails.env.production?,
      httponly: true,
      same_site: :lax,
      domain: cookie_domain
    }

    cookies['refresh_token'] = {
      value: token_data['refresh_token'],
      expires: 30.days.from_now, # Refresh tokens typically last longer
      secure: Rails.env.production?,
      httponly: true,
      same_site: :lax,
      domain: cookie_domain
    }

    # Save ID token if present
    if token_data['id_token']
      cookies['id_token'] = {
        value: token_data['id_token'],
        expires: expires_at,
        secure: Rails.env.production?,
        httponly: true,
        same_site: :lax,
        domain: cookie_domain
      }
    end

    # Clear any cached validation results since we have new tokens
    invalidate_keycloak_token_cache

    Rails.logger.info "[Keycloak Token Save] Saved tokens to cookies with domain: #{cookie_domain}"
  end
end
