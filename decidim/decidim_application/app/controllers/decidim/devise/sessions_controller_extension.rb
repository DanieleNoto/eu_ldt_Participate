# frozen_string_literal: true

module Decidim
  module Devise
    # Extension for SessionsController to implement Keycloak Single Logout (SLO)
    module SessionsControllerExtension
      extend ActiveSupport::Concern

      # Override destroy to implement Single Logout with Keycloak
      def destroy
        # Store logout info before super (which clears session)
        should_logout_from_keycloak = session[:keycloak_authenticated].present?
        keycloak_logout_url = build_keycloak_logout_url if should_logout_from_keycloak
        
        # Clean up ALL Keycloak cookies on logout to prevent cookie bloat
        cleanup_keycloak_cookies
        
        # If user authenticated via Keycloak, redirect to Keycloak logout instead of normal logout
        if should_logout_from_keycloak && keycloak_logout_url.present?
          signed_out = (::Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
          set_flash_message! :notice, :signed_out if signed_out
          yield if block_given?
          redirect_to keycloak_logout_url, allow_other_host: true
        else
          # Normal Decidim logout
          super
        end
      end

      private

      def cleanup_keycloak_cookies
        # Delete all possible Keycloak token cookies
        # This prevents cookie bloat and 400 Bad Request errors
        
        # Delete chunked tokens (up to 50 chunks to be safe)
        (0..50).each do |i|
          cookies.delete("keycloak_access_token_#{i}", domain: :all)
          cookies.delete("keycloak_refresh_token_#{i}", domain: :all)
        end
        
        # Delete count cookies
        cookies.delete('keycloak_access_token_count', domain: :all)
        cookies.delete('keycloak_refresh_token_count', domain: :all)
        cookies.delete('keycloak_token_expires_at', domain: :all)
        
        # Delete legacy token cookies
        cookies.delete('access_token', domain: :all)
        cookies.delete('id_token', domain: :all)
        cookies.delete('jwt_token', domain: :all)
        cookies.delete('refresh_token', domain: :all)
        
        Rails.logger.info "🧹 Cleaned up all Keycloak cookies on logout"
      end

      def build_keycloak_logout_url
        keycloak_site = ENV['OMNIAUTH_KEYCLOAK_SITE']
        realm = ENV['OMNIAUTH_KEYCLOAK_REALM']
        
        return nil unless keycloak_site.present? && realm.present?
        
        # Build the redirect URI (where to return after Keycloak logout)
        redirect_uri = if request.present?
          "#{request.protocol}#{request.host_with_port}#{decidim.root_path}"
        else
          decidim.root_url
        end
        
        # Get id_token from session for automatic logout
        id_token = session[:keycloak_id_token]
        
        # Keycloak logout endpoint with redirect and id_token_hint for automatic logout
        keycloak_logout_path = "/realms/#{realm}/protocol/openid-connect/logout"
        logout_url = "#{keycloak_site.chomp('/')}#{keycloak_logout_path}?post_logout_redirect_uri=#{CGI.escape(redirect_uri)}"
        
        # Add id_token_hint for automatic logout without confirmation page
        if id_token.present?
          logout_url += "&id_token_hint=#{CGI.escape(id_token)}"
          Rails.logger.info "✓ Using id_token_hint for automatic Keycloak logout"
        else
          Rails.logger.warn "✗ No id_token found in session, Keycloak will show confirmation page"
        end
        
        logout_url
      rescue => e
        Rails.logger.error "Error building Keycloak logout URL: #{e.message}"
        nil
      end
    end
  end
end
