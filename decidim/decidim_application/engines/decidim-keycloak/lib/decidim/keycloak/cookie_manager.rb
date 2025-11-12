# frozen_string_literal: true

module Decidim
  module Keycloak
    # Centralized cookie management for Keycloak authentication
    # This module handles all cookie operations to prevent duplication and inconsistencies
    class CookieManager
      # Calculate the correct cookie domain for cross-subdomain sharing
      # @param request_host [String] The request host (e.g., "part-int.ldttoolbox.app")
      # @return [String, nil] The cookie domain (e.g., ".ldttoolbox.app") or nil
      def self.calculate_cookie_domain(request_host)
        return nil unless request_host.present?
        
        host = request_host.to_s
        
        # In production/development with subdomains, use the second-level domain
        # to allow cookie sharing across subdomains
        if Rails.env.production? || Rails.env.development?
          domain_parts = host.split('.')
          
          # For domains like *.ldttoolbox.app, use .ldttoolbox.app
          if domain_parts.length >= 3
            # Return domain with leading dot for cross-subdomain cookies
            return ".#{domain_parts[-2]}.#{domain_parts[-1]}"
          end
        end
        
        # Fallback to current host or nil for localhost
        host == 'localhost' ? nil : host
      end
      
      # Calculate all possible cookie domains to clear cookies from
      # @param request_host [String] The request host
      # @return [Array<String, nil>] Array of domains to clear cookies from
      def self.calculate_all_cookie_domains(request_host)
        return [nil] unless request_host.present?
        
        host = request_host.to_s
        domain_parts = host.split('.')
        
        domains = [
          host,  # Exact host (e.g., "part-int.ldttoolbox.app")
          nil    # Current domain only (no domain attribute)
        ]
        
        # Add cross-subdomain domain
        if (Rails.env.production? || Rails.env.development?) && domain_parts.length >= 3
          domains << ".#{domain_parts[-2]}.#{domain_parts[-1]}"
        end
        
        # Add second-level domain (like request.domain)
        if domain_parts.length >= 2
          domains << "#{domain_parts[-2]}.#{domain_parts[-1]}"
        end
        
        domains.uniq
      end
      
      # Clear all Keycloak cookies from all possible domains
      # @param cookies_obj [ActionDispatch::Cookies::CookieJar] The cookies object
      # @param request_host [String] The request host
      # @param session_obj [ActionDispatch::Request::Session, nil] Optional session object to clean
      def self.clear_all_cookies(cookies_obj, request_host, session_obj = nil)
        # include Rails session cookie to ensure session is removed client-side on logout
        cookie_names = ['access_token', 'refresh_token', 'id_token', '_session_id']
        domains = calculate_all_cookie_domains(request_host)
        
        Rails.logger.info "[Keycloak CookieManager] Clearing cookies #{cookie_names.inspect} from domains: #{domains.inspect}"
        Rails.logger.debug "[Keycloak CookieManager] Current cookies before clearing: access_token=#{cookies_obj['access_token']&.length}, refresh_token=#{cookies_obj['refresh_token']&.length}, id_token=#{cookies_obj['id_token']&.length}"
        
        # CRITICAL: Try all combinations of domain, secure, path and same_site attributes
        # Rails requires exact match of all attributes to delete a cookie. We will attempt
        # deletion even if the server did not receive the cookie (browser may not send
        # cookies for mismatched domains), by setting expired Set-Cookie headers for each
        # candidate domain/attribute combination.
        domains.each do |domain|
          cookie_names.each do |name|
            Rails.logger.debug "[Keycloak CookieManager] Attempting to clear #{name} from domain: #{domain.inspect} (regardless of presence)"

            # Try all combinations of secure and same_site (production vs development)
            [true, false].each do |secure_flag|
              [:lax, :strict, :none, nil].each do |same_site_val|
                # With httponly
                cookies_obj.delete(name, domain: domain, secure: secure_flag, httponly: true, same_site: same_site_val, path: '/')
                # Without httponly
                cookies_obj.delete(name, domain: domain, secure: secure_flag, httponly: false, same_site: same_site_val, path: '/')
                # Minimal attributes
                cookies_obj.delete(name, domain: domain, secure: secure_flag, path: '/')
              end

              # Just domain and secure (no same_site)
              cookies_obj.delete(name, domain: domain, secure: secure_flag, path: '/')
            end

            # Try with just domain
            cookies_obj.delete(name, domain: domain, path: '/')

            # Force expiry in the past (belt and suspenders approach)
            # This sets the cookie with empty value and past expiry for each domain
            [true, false].each do |secure_flag|
              cookies_obj[name] = {
                value: '',
                expires: 1.year.ago,
                domain: domain,
                secure: secure_flag,
                httponly: true,
                same_site: :lax,
                path: '/'
              }
            end
          end
        end
        
        # Additional safety: always clear without domain attribute at all (path '/', multiple same_site)
        cookie_names.each do |name|
          Rails.logger.debug "[Keycloak CookieManager] Additional clearing of #{name} without domain (forcing expired cookie)"
          cookies_obj.delete(name, path: '/')
          cookies_obj.delete(name)
          # Force expired cookie without domain to ensure browser receives a Set-Cookie
          cookies_obj[name] = {
            value: '',
            expires: 1.year.ago,
            secure: Rails.env.production?,
            httponly: true,
            same_site: :lax,
            path: '/'
          }

          # Also attempt SameSite=None variant (for cross-site contexts)
          cookies_obj[name] = {
            value: '',
            expires: 1.year.ago,
            secure: true,
            httponly: true,
            same_site: :none,
            path: '/'
          }
        end
        
        # Clean session data if provided
        if session_obj
          session_obj.delete(:keycloak_authenticated)
          session_obj.delete(:keycloak_id_token)
        end
        
        Rails.logger.info "[Keycloak CookieManager] Cleared all Keycloak cookies from #{domains.length} domain(s). Final state: access_token=#{cookies_obj['access_token']&.length}, refresh_token=#{cookies_obj['refresh_token']&.length}, id_token=#{cookies_obj['id_token']&.length}"
      end
      
      # Save tokens to cookies with proper domain and expiry
      # @param cookies_obj [ActionDispatch::Cookies::CookieJar] The cookies object
      # @param tokens [Hash] Hash containing :access_token, :refresh_token, :id_token, :expires_in
      # @param request_host [String] The request host
      def self.save_tokens(cookies_obj, tokens, request_host)
        # First clear existing cookies to prevent duplication
        clear_all_cookies(cookies_obj, request_host)
        
        cookie_domain = calculate_cookie_domain(request_host)
        expires_at = if tokens[:expires_in] && tokens[:expires_in] > 0
                      Time.current + tokens[:expires_in].seconds
                    else
                      1.hour.from_now
                    end
        
        Rails.logger.debug "[Keycloak CookieManager] Saving tokens with domain: #{cookie_domain.inspect}"
        
        # Save access token
        if tokens[:access_token]
          cookies_obj['access_token'] = {
            value: tokens[:access_token],
            expires: expires_at,
            secure: Rails.env.production?,
            httponly: true,
            same_site: :lax,
            domain: cookie_domain
          }
        end
        
        # Save refresh token (longer expiry)
        if tokens[:refresh_token]
          refresh_expires_at = if tokens[:refresh_token_expires_in] && tokens[:refresh_token_expires_in] > 0
                                Time.current + tokens[:refresh_token_expires_in].seconds
                              else
                                30.days.from_now
                              end
          
          cookies_obj['refresh_token'] = {
            value: tokens[:refresh_token],
            expires: refresh_expires_at,
            secure: Rails.env.production?,
            httponly: true,
            same_site: :lax,
            domain: cookie_domain
          }
        end
        
        # Save ID token
        if tokens[:id_token]
          cookies_obj['id_token'] = {
            value: tokens[:id_token],
            expires: expires_at,
            secure: Rails.env.production?,
            httponly: true,
            same_site: :lax,
            domain: cookie_domain
          }
        end
        
        Rails.logger.info "[Keycloak CookieManager] Saved tokens to cookies with domain: #{cookie_domain}"
      end
    end
  end
end
