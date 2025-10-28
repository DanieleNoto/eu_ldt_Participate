class ApplicationController < ActionController::Base
  before_action :check_keycloak_auto_login
  before_action :check_keycloak_auto_logout

  private

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
    # Skip for API requests, assets, admin paths, auth callbacks, and AJAX requests
    return if request.path.start_with?('/api/')
    return if request.path.start_with?('/assets/')
    return if request.path.start_with?('/admin/')
    return if request.path.start_with?('/users/auth/')
    return if request.path.match?(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
    return if request.xhr?
    return if request.format.json?

    # Skip if user is not authenticated
    return unless current_user.present?

    # Check if Keycloak provider is enabled for this organization
    organization = current_organization
    return unless organization&.enabled_omniauth_providers&.dig(:keycloakopenid).present?

    # If Keycloak cookies are missing or invalid, logout the user
    unless keycloak_cookies_present_and_valid?
      Rails.logger.info "[Keycloak AutoLogout] Keycloak session invalid, logging out user #{current_user.id}"
      sign_out current_user
      redirect_to root_path, notice: "You have been logged out due to session expiration."
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
end
