# frozen_string_literal: true

module KeycloakAuthentication
  extend ActiveSupport::Concern

  included do
    before_action :check_keycloak_auto_login
    before_action :check_keycloak_auto_logout
    before_action :check_keycloak_locale_sync
  end

  private

  # Centralized Keycloak configuration
  def keycloak_config
    Decidim::Keycloak::Configuration.config
  end

  def keycloak_config_valid?
    Decidim::Keycloak::Configuration.valid?
  end

  # Check if user logged in with Keycloak
  def user_logged_in_with_keycloak?(user)
    # Check if user has a Keycloak identity
    user.identities.where(provider: 'keycloakopenid').exists?
  end

  # Check if Keycloak authentication tokens are present (not just configuration cookies like i18next)
  def keycloak_auth_tokens_present?
    access_token = cookies['access_token']
    refresh_token = cookies['refresh_token'] 
    id_token = cookies['id_token']
    
    # Return true only if actual authentication tokens are present
    access_token.present? || refresh_token.present? || id_token.present?
  end

  # Check if any Keycloak-related cookies are present (including i18next for cross-tool SSO)
  def keycloak_cookies_present?
    keycloak_auth_tokens_present? || cookies['i18next'].present?
  end
  
  # Check if we're coming from another tool in the same domain (cross-tool navigation)
  def coming_from_same_domain_tool?
    referer = request.referer
    return false unless referer.present?
    
    begin
      referer_uri = URI.parse(referer)
      current_host = request.host
      
      # Get the Decidim host from environment variable
      decidim_host = ENV['DECIDIM_HOST'] || current_host
      
      # Avoid loops: skip if referer is from the same Decidim instance
      if referer_uri.host == decidim_host || referer_uri.host == current_host
        Rails.logger.debug "[Keycloak AutoLogin] Referer is same Decidim host, avoiding loop"
        return false
      end
      
      # Extract domain from Decidim host for same-domain check
      # E.g., part-int.ldttoolbox.app → .ldttoolbox.app
      decidim_host_parts = decidim_host.split('.')
      if decidim_host_parts.length >= 2
        base_domain = ".#{decidim_host_parts[-2]}.#{decidim_host_parts[-1]}"
        
        # Check if referer is from same base domain but different subdomain
        if referer_uri.host != current_host && referer_uri.host&.end_with?(base_domain)
          Rails.logger.info "[Keycloak AutoLogin] Cross-tool navigation detected: #{referer_uri.host} → #{current_host} (domain: #{base_domain})"
          return true
        end
      end
    rescue URI::InvalidURIError => e
      Rails.logger.debug "[Keycloak AutoLogin] Invalid referer URI: #{e.message}"
    end
    
    false
  end

  # Validate Keycloak session using the centralized SessionValidator
  def keycloak_session_valid?
    access_token = cookies['access_token']
    id_token = cookies['id_token']
    refresh_token = cookies['refresh_token']
    
    # Use the SessionValidator from the Keycloak engine
    Decidim::Keycloak::SessionValidator.validate_tokens_and_session(
      access_token, 
      id_token, 
      refresh_token, 
      cookies
    )
  rescue => e
    Rails.logger.warn "[Keycloak AutoLogin] Error validating session: #{e.message}"
    false
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
    
    # Skip for error pages (404, 500, etc.) to avoid auto-login loops
    return if controller_name == 'errors' || action_name == 'not_found' || action_name == 'internal_server_error'

    # Skip if user is already authenticated
    return if current_user.present?
    
    # Skip if user manually logged out (check cookie instead of session)
    if cookies['manual_logout'] == 'true'
      Rails.logger.info "[Keycloak AutoLogin] Skipping auto-login - user manually logged out"
      # Clear the cookie for next time
      cookies.delete('manual_logout', domain: Decidim::Keycloak::CookieManager.calculate_cookie_domain(request.host))
      cookies.delete('manual_logout') # Also without domain
      return
    end
    
    # Skip if automatic logout occurred due to expired/invalid token
    if session[:automatic_logout_no_autologin]
      Rails.logger.info "[Keycloak AutoLogin] Skipping auto-login - automatic logout due to expired/invalid token"
      session.delete(:automatic_logout_no_autologin)
      return
    end

    # Check if Keycloak provider is enabled for this organization
    organization = current_organization
    return unless organization&.enabled_omniauth_providers&.dig(:keycloakopenid).present?

    # First check: do we have any Keycloak-related cookies (including i18next for cross-tool SSO)?
    return unless keycloak_cookies_present?

    has_auth_tokens = keycloak_auth_tokens_present?
    has_i18next = cookies['i18next'].present?
    from_same_domain = coming_from_same_domain_tool?
    
    if has_auth_tokens
      Rails.logger.info "[Keycloak AutoLogin] Found Keycloak auth tokens, validating session..."
    elsif has_i18next
      if from_same_domain
        Rails.logger.info "[Keycloak AutoLogin] Cross-tool SSO detected (i18next + same domain referer), checking Keycloak session..."
      else
        Rails.logger.info "[Keycloak AutoLogin] Found i18next cookie, checking for active Keycloak session..."
      end
    end

    # Second check: validate if Keycloak session is actually active
    if keycloak_session_valid?
      Rails.logger.info "[Keycloak AutoLogin] Session valid, redirecting for auto-login"
      
      # Skip if we're already on the login page to avoid redirect loops
      if controller_name == "sessions" && action_name == "new"
        Rails.logger.info "[Keycloak AutoLogin] Already on login page, auto-login will be handled by frontend"
        return
      end
      
      # Direct redirect to login with auto-login parameter
      redirect_to "/users/sign_in?keycloak_auto_login=1", status: :found
    else
      Rails.logger.info "[Keycloak AutoLogin] Session invalid, cookies already cleared by SessionValidator"
    end
  end

  def check_keycloak_auto_logout
    # Skip for API requests, assets, admin paths, auth callbacks, and AJAX requests
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

    # Try to validate and refresh token if needed
    valid_token = Decidim::Keycloak::TokenService.ensure_valid_token(
      current_user, 
      cookies.to_h, 
      cookies, 
      request.host, 
      self
    )

    # If token is valid or was successfully refreshed, keep the session active
    if valid_token
      Rails.logger.debug "[Keycloak AutoLogout] Token valid or refreshed successfully, keeping session active for user #{current_user.id}"
      return
    end

    # Token is invalid and refresh failed - perform automatic logout without auto-login
    Rails.logger.info "[Keycloak AutoLogout] Keycloak session invalid and refresh failed, performing automatic logout for user #{current_user.id}"

    # Set flag to prevent auto-login after automatic logout (session expired, not manual logout)
    session[:automatic_logout_no_autologin] = true

    # Clear all Keycloak-related cookies from all possible domains
    clear_keycloak_cookies

    # Sign out the user and redirect immediately to prevent further processing
    sign_out current_user
    
    # Redirect to login page using string path to avoid route helper issues in admin controllers
    redirect_to "/users/sign_in" and return
  end

  def check_keycloak_locale_sync
    # Skip for API requests, assets, admin paths, auth callbacks, and AJAX requests
    return if request.path.start_with?('/api/')
    return if request.path.start_with?('/assets/')
    return if request.path.start_with?('/admin/')
    return if request.path.start_with?('/users/auth/')
    return if request.path.match?(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
    return if request.xhr?
    return if request.format.json?

    # Only check for authenticated users who logged in with Keycloak
    return unless current_user.present? && user_logged_in_with_keycloak?(current_user)

    # Check if Keycloak provider is enabled for this organization
    organization = current_organization
    return unless organization&.enabled_omniauth_providers&.dig(:keycloakopenid).present?

    current_session_locale = session['decidim-locale'] || I18n.locale.to_s
    new_locale = nil

    # First priority: Check for i18next cookie from Keycloak
    i18next_cookie = cookies['i18next']
    if i18next_cookie.present?
      # Keycloak i18next cookie format is typically just the locale code (e.g., "en", "it", "pt-BR")
      keycloak_locale = i18next_cookie.strip
      
      # Map Keycloak locale to Decidim available locales
      if current_organization.available_locales.include?(keycloak_locale)
        new_locale = keycloak_locale
        Rails.logger.info "[Keycloak Locale Sync] Using locale from i18next cookie: #{keycloak_locale} for user #{current_user.id}"
      else
        Rails.logger.debug "[Keycloak Locale Sync] i18next cookie locale '#{keycloak_locale}' not available in organization locales"
      end
    end

    # Second priority: Extract locale from id_token if i18next cookie not present or invalid
    if new_locale.nil?
      id_token = cookies['id_token']
      if id_token.present?
        new_locale = Decidim::Keycloak::LocaleSynchronizer.sync_from_token(id_token, current_session_locale)
        Rails.logger.info "[Keycloak Locale Sync] Using locale from id_token claim: #{new_locale} for user #{current_user.id}" if new_locale.present?
      end
    end

    # Apply the new locale if found and different from current
    if new_locale.present? && new_locale != current_session_locale
      I18n.locale = new_locale
      session['decidim-locale'] = new_locale
      Rails.logger.info "[Keycloak Locale Sync] Updated locale from #{current_session_locale} to #{new_locale} for user #{current_user.id}"
    end
  end
end