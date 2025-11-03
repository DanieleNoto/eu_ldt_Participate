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
        # Delete all Keycloak token cookies from all possible domains to prevent accumulation
        # Use the same domain logic as ApplicationController#keycloak_cookie_domain
        
        # Domains to clear cookies from (most specific to least specific)
        domains_to_clear = [
          request.host,                    # e.g., "part-int.ldttoolbox.app"
          determine_keycloak_cookie_domain, # e.g., ".ldttoolbox.app"
          request.domain,                  # e.g., "ldttoolbox.app"
          nil                              # No domain (current host only)
        ].uniq
        
        domains_to_clear.each do |domain|
          Rails.logger.debug "[Keycloak Cookie Cleanup] Clearing cookies for domain: #{domain || 'current host'}"
          
          # Clear named Keycloak cookies
          ['access_token', 'refresh_token', 'id_token', 'token_expires_at'].each do |cookie_name|
            cookies.delete(cookie_name, domain: domain) if cookies[cookie_name].present?
          end
          
          # Clear any cookies starting with 'kc_' (Keycloak pattern)
          cookies.each do |name, _value|
            if name.start_with?('kc_')
              cookies.delete(name, domain: domain)
            end
          end
        end
        
        # Clean up session data
        session.delete(:keycloak_authenticated)
        session.delete(:keycloak_id_token) # Remove any leftover id_token from session
        
        Rails.logger.info "[Keycloak Cookie Cleanup] Cleared Keycloak cookies and session data from all domains"
      end

      private

      def determine_keycloak_cookie_domain
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
