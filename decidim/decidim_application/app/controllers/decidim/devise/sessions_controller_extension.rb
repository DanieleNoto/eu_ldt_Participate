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
        
        # Mark this as a manual logout to prevent auto-login on next visit
        session[:manual_logout] = true
        
        # Extract tokens from cookies BEFORE clearing them for revocation
        access_token = cookies['access_token']
        refresh_token = cookies['refresh_token']
        
        # Revoke OAuth2 tokens before logout if available
        if access_token.present? || refresh_token.present?
          token_revoked = Decidim::Keycloak::TokenService.revoke_tokens(access_token, refresh_token)
          if token_revoked
            Rails.logger.info "✓ Successfully revoked OAuth2 tokens during logout"
          else
            Rails.logger.warn "✗ Failed to revoke some OAuth2 tokens during logout"
          end
        end
        
  # CRITICAL FIX: Attempt an initial cleanup before Devise logout (best-effort)
  # CENTRALIZED: Uses Decidim::Keycloak::CookieManager
  Rails.logger.info "[Keycloak Logout] Initial clearing attempt before Devise logout - access_token present: #{cookies['access_token'].present?}, id_token present: #{cookies['id_token'].present?}"
  Decidim::Keycloak::CookieManager.clear_all_cookies(cookies, request.host, session)
  Rails.logger.info "[Keycloak Logout] Initial clear attempt done - access_token still present: #{cookies['access_token'].present?}, id_token still present: #{cookies['id_token'].present?}"
        
        # Perform normal Devise logout AFTER cookie cleanup
        signed_out = (::Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
        set_flash_message! :notice, :signed_out if signed_out

        yield if block_given?

        # IMPORTANT: Clear cookies again AFTER Devise sign_out and after any flash has been set,
        # but BEFORE sending the redirect response. Calling clear_all_cookies after redirect
        # cannot set Set-Cookie headers for the current response, so must be done here so the
        # browser receives expired cookies (including the Rails session cookie) in the same
        # response that performs sign out.
        Rails.logger.info "[Keycloak Logout] Clearing cookies after Devise sign_out (before redirect)"
        Decidim::Keycloak::CookieManager.clear_all_cookies(cookies, request.host, session)

        # Finally redirect
        if should_logout_from_keycloak && keycloak_logout_url.present?
          Rails.logger.info "[Keycloak Logout] Redirecting to Keycloak logout: #{keycloak_logout_url}"
          redirect_to keycloak_logout_url, allow_other_host: true
        else
          Rails.logger.info "[Keycloak Logout] Redirecting to local sign out path"
          redirect_to after_sign_out_path_for(resource_name)
        end
      end

      private

      def cleanup_keycloak_cookies
        # DEPRECATED: This method is no longer used
        # Cookie cleanup is now handled by Decidim::Keycloak::CookieManager
        # in the destroy method after sign_out
        Rails.logger.warn "[Keycloak] cleanup_keycloak_cookies called - this method is deprecated"
        Decidim::Keycloak::CookieManager.clear_all_cookies(cookies, request.host, session)
      end

      def determine_keycloak_cookie_domain
        # CENTRALIZED: Uses Decidim::Keycloak::CookieManager
        Decidim::Keycloak::CookieManager.calculate_cookie_domain(request.host)
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
        
        # Get id_token from cookies (not session) for automatic logout
        id_token = cookies['id_token']
        
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
