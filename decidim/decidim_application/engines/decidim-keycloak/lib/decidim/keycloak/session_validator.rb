# frozen_string_literal: true

require 'net/http'

module Decidim
  module Keycloak
    # Centralized session validation utilities for Keycloak authentication
    # This module handles session validation to prevent duplication and improve maintainability
    class SessionValidator
      # Check if Keycloak session is still active by calling the userinfo endpoint
      # @param access_token [String] The access token from cookies
      # @param cookies_obj [ActionDispatch::Cookies::CookieJar] The cookies object for cleanup
      # @return [Boolean] true if session is active, false otherwise
      def self.session_active?(access_token, cookies_obj = nil)
        return true unless Rails.env.production? # Skip in development to avoid network calls
        
        begin
          keycloak_site = ENV['OMNIAUTH_KEYCLOAK_SITE']
          realm = ENV['OMNIAUTH_KEYCLOAK_REALM']
          
          return true unless keycloak_site.present? && realm.present?
          return false unless access_token.present?
          
          # Use the userinfo endpoint to verify if session/token is active
          userinfo_url = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/userinfo"
          
          uri = URI.parse(userinfo_url)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = (uri.scheme == 'https')
          http.open_timeout = 3
          http.read_timeout = 3
          
          request = Net::HTTP::Get.new(uri)
          request['Authorization'] = "Bearer #{access_token}"
          request['Accept'] = 'application/json'
          
          response = http.request(request)
          
          # If we get 200, token and session are valid
          # If we get 401/403, token/session is expired or invalid
          session_active = response.code.to_i == 200
          
          Rails.logger.info "[Keycloak SessionValidator] Session active: #{session_active} (HTTP #{response.code})"
          
          # If session is not active and we have cookies, optionally clean them
          if !session_active && cookies_obj
            Rails.logger.info "[Keycloak SessionValidator] Session expired, cookies will be cleared by caller"
          end
          
          session_active
        rescue Net::TimeoutError, Net::OpenTimeout, Net::ReadTimeout => e
          Rails.logger.warn "[Keycloak SessionValidator] Timeout checking session: #{e.message}, assuming active"
          true # Assume active on timeout to avoid blocking users
        rescue => e
          Rails.logger.warn "[Keycloak SessionValidator] Error checking session: #{e.message}, assuming active"
          true # Assume active on error to avoid blocking users
        end
      end
      
      # Validate token and session combination
      # @param access_token [String] The access token from cookies
      # @param id_token [String] The ID token from cookies
      # @param refresh_token [String] The refresh token from cookies
      # @param cookies_obj [ActionDispatch::Cookies::CookieJar] The cookies object for cleanup
      # @return [Boolean] true if tokens and session are valid
      def self.validate_tokens_and_session(access_token, id_token, refresh_token, cookies_obj = nil)
        # Accept any valid Keycloak token combination for autologin
        has_any_token = access_token.present? || refresh_token.present?
        
        # If we have id_token, validate its structure
        if id_token.present?
          return false unless JwtParser.valid_structure?(id_token)
          
          # Check if JWT is expired locally
          if JwtParser.locally_expired?(id_token)
            Rails.logger.info "[Keycloak SessionValidator] JWT expired locally, checking Keycloak session validity"
            
            # Use access_token to check session validity
            check_token = access_token.presence || refresh_token
            unless session_active?(check_token, cookies_obj)
              Rails.logger.info "[Keycloak SessionValidator] Keycloak session expired"
              return false
            end
            
            Rails.logger.info "[Keycloak SessionValidator] Keycloak session still active, proceeding with auto-login"
          end
        end
        
        # If we only have access_token or refresh_token, verify session validity
        if has_any_token && id_token.blank?
          check_token = access_token.presence || refresh_token
          unless session_active?(check_token, cookies_obj)
            Rails.logger.info "[Keycloak SessionValidator] No valid session found"
            return false
          end
        end
        
        # If we have no tokens at all, this might be cross-tool SSO scenario
        # Check if there's an active Keycloak session without tokens (i18next scenario)
        if !has_any_token && id_token.blank?
          Rails.logger.info "[Keycloak SessionValidator] No local tokens found, checking for active Keycloak session (cross-tool SSO)"
          return check_keycloak_session_without_tokens(cookies_obj)
        end
        
        # Return true if we have any token (access_token, refresh_token, or valid id_token)
        has_any_token || id_token.present?
      rescue => e
        Rails.logger.warn "[Keycloak SessionValidator] Error validating tokens: #{e.message}"
        false
      end
      
      # Check if there's an active Keycloak session without local tokens (cross-tool SSO scenario)
      # @param cookies_obj [ActionDispatch::Cookies::CookieJar] The cookies object for cleanup
      # @return [Boolean] true if Keycloak session is active
      def self.check_keycloak_session_without_tokens(cookies_obj = nil)
        return true unless Rails.env.production? # Skip in development
        
        begin
          keycloak_site = ENV['OMNIAUTH_KEYCLOAK_SITE']
          realm = ENV['OMNIAUTH_KEYCLOAK_REALM']
          
          return false unless keycloak_site.present? && realm.present?
          
          # Try to check session using Keycloak's session check endpoint
          # This doesn't require tokens if user has active browser session
          session_check_url = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/login-status-iframe.html"
          
          uri = URI.parse(session_check_url)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = (uri.scheme == 'https')
          http.open_timeout = 3
          http.read_timeout = 3
          
          request = Net::HTTP::Get.new(uri)
          response = http.request(request)
          
          # If we get 200, there might be an active session
          session_active = response.code.to_i == 200
          
          Rails.logger.info "[Keycloak SessionValidator] Cross-tool SSO check: #{session_active} (HTTP #{response.code})"
          session_active
        rescue Net::TimeoutError, Net::OpenTimeout, Net::ReadTimeout => e
          Rails.logger.warn "[Keycloak SessionValidator] Timeout checking cross-tool session: #{e.message}, assuming active"
          true # Assume active on timeout to enable SSO
        rescue => e
          Rails.logger.warn "[Keycloak SessionValidator] Error checking cross-tool session: #{e.message}, assuming active"  
          true # Assume active on error to enable SSO
        end
      end
    end
  end
end