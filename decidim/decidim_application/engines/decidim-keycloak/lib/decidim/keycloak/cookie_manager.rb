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
        cookie_names = ['access_token', 'refresh_token', 'id_token', 'token_expires_at', 'kc_state']
        domains = calculate_all_cookie_domains(request_host)
        
        Rails.logger.debug "[Keycloak CookieManager] Clearing cookies from domains: #{domains.inspect}"
        
        domains.each do |domain|
          # Clear named Keycloak cookies with all possible attribute combinations
          cookie_names.each do |name|
            next unless cookies_obj[name].present?
            
            # Delete with domain attribute
            cookies_obj.delete(name, domain: domain, secure: true, httponly: true, same_site: :lax)
            cookies_obj.delete(name, domain: domain, secure: false, httponly: true, same_site: :lax)
            cookies_obj.delete(name, domain: domain)
            
            # Force expiry in the past (belt and suspenders approach)
            cookies_obj[name] = {
              value: '',
              expires: 1.year.ago,
              domain: domain,
              secure: Rails.env.production?,
              httponly: true,
              same_site: :lax
            }
          end
          
          # Clear any cookies starting with 'kc_' (Keycloak session pattern)
          cookies_obj.each do |name, _value|
            if name.start_with?('kc_')
              cookies_obj.delete(name, domain: domain, secure: true, httponly: true, same_site: :lax)
              cookies_obj.delete(name, domain: domain, secure: false, httponly: true, same_site: :lax)
              cookies_obj.delete(name, domain: domain)
            end
          end
        end
        
        # Clean session data if provided
        if session_obj
          session_obj.delete(:keycloak_authenticated)
          session_obj.delete(:keycloak_id_token)
          session_obj.delete(:keycloak_auto_login_pending)
        end
        
        Rails.logger.info "[Keycloak CookieManager] Cleared all Keycloak cookies from #{domains.length} domain(s)"
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
        
        # Save token expiry timestamp
        if expires_at
          cookies_obj['token_expires_at'] = {
            value: expires_at.to_i.to_s,
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
