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

    # Skip if user is already authenticated
    return if current_user.present?

    # Check if Keycloak provider is enabled for this organization
    organization = current_organization
    return unless organization&.enabled_omniauth_providers&.dig(:keycloakopenid).present?

    # Check for valid Keycloak cookies
    cookies_valid = keycloak_cookies_present_and_valid?
    
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
    Rails.logger.info "[Keycloak AutoLogin] Redirecting to login page for auto-login"
    
    # Use 302 redirect to avoid CSRF token issues
    redirect_to new_user_session_path, status: :found
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

    # Try to refresh token first before checking validity
    valid_token = Decidim::Keycloak::TokenService.ensure_valid_token(
      current_user, 
      cookies.to_h, 
      cookies, 
      request.host, 
      self
    )

    unless valid_token
      Rails.logger.info "[Keycloak AutoLogout] Keycloak session invalid and refresh failed, logging out user #{current_user.id}"

      # Clear all Keycloak-related cookies from all possible domains
      clear_keycloak_cookies

      # Sign out the user and redirect immediately to prevent further processing
      sign_out current_user
      
      # Redirect to login page or home page to prevent errors on admin pages
      redirect_to new_user_session_path and return
    end
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

    # Extract current locale from id_token and sync if different
    id_token = cookies['id_token']
    if id_token.present?
      current_session_locale = session['decidim-locale'] || I18n.locale.to_s
      new_locale = Decidim::Keycloak::LocaleSynchronizer.sync_from_token(id_token, current_session_locale)
      if new_locale.present?
        I18n.locale = new_locale
        session['decidim-locale'] = new_locale
        Rails.logger.info "[Keycloak Locale Sync] Updated locale from #{current_session_locale} to #{new_locale} for user #{current_user.id}"
      end
    end
  end
end