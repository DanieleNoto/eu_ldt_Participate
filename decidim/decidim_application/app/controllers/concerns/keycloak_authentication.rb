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
    
    # Skip if user manually logged out (don't auto-login after manual logout)
    if session[:manual_logout]
      Rails.logger.info "[Keycloak AutoLogin] Skipping auto-login - user manually logged out"
      session.delete(:manual_logout) # Clear flag for next session
      return
    end
    
    # Skip if automatic logout occurred due to expired/invalid token (don't auto-login after session expired)
    if session[:automatic_logout_no_autologin]
      Rails.logger.info "[Keycloak AutoLogin] Skipping auto-login - automatic logout due to expired/invalid token"
      session.delete(:automatic_logout_no_autologin) # Clear flag for next session
      return
    end

    # Check if Keycloak provider is enabled for this organization
    organization = current_organization
    return unless organization&.enabled_omniauth_providers&.dig(:keycloakopenid).present?

    # Check for valid Keycloak cookies
    cookies_valid = keycloak_cookies_present_and_valid?
    Rails.logger.info "[Keycloak AutoLogin] Cookies valid: #{cookies_valid}, Controller: #{controller_name}, Action: #{action_name}"
    
    # If we're already on the login page with valid cookies, set the flag directly
    # Check controller and action instead of comparing paths to avoid parameter inheritance issues
    if cookies_valid && controller_name == "sessions" && action_name == "new"
      session[:keycloak_auto_login_pending] = true
      Rails.logger.info "[Keycloak AutoLogin] Setting auto-login flag on login page"
      return
    end
    
    return unless cookies_valid

    # Set session flag for frontend auto-login and redirect to login page
    session[:keycloak_auto_login_pending] = true
    # Force session save before redirect
    session.save if session.respond_to?(:save)
    Rails.logger.info "[Keycloak AutoLogin] Session saved, redirecting to login page for auto-login"
    
    # Use 302 redirect with a parameter to indicate auto-login (using string path to avoid route helper issues)
    redirect_to "/users/sign_in?keycloak_auto_login=1", status: :found
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