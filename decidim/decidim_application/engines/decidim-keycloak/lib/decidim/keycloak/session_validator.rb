# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

require "net/http"

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
          keycloak_site = ENV.fetch("OMNIAUTH_KEYCLOAK_SITE", nil)
          realm = ENV.fetch("OMNIAUTH_KEYCLOAK_REALM", nil)

          return true unless keycloak_site.present? && realm.present?
          return false if access_token.blank?

          # Use the userinfo endpoint to verify if session/token is active
          userinfo_url = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/userinfo"

          uri = URI.parse(userinfo_url)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = (uri.scheme == "https")
          http.open_timeout = 3
          http.read_timeout = 3

          request = Net::HTTP::Get.new(uri)
          request["Authorization"] = "Bearer #{access_token}"
          request["Accept"] = "application/json"

          response = http.request(request)

          # If we get 200, token and session are valid
          # If we get 401/403, token/session is expired or invalid
          session_active = response.code.to_i == 200

          Rails.logger.info "[Keycloak SessionValidator] Session active: #{session_active} (HTTP #{response.code})"

          # If session is not active and we have cookies, optionally clean them
          Rails.logger.info "[Keycloak SessionValidator] Session expired, cookies will be cleared by caller" if !session_active && cookies_obj

          session_active
        rescue Net::TimeoutError, Net::OpenTimeout, Net::ReadTimeout => e
          Rails.logger.warn "[Keycloak SessionValidator] Timeout checking session: #{e.message}, assuming active"
          true # Assume active on timeout to avoid blocking users
        rescue StandardError => e
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
        has_any_token = access_token.present? || refresh_token.present?

        return validate_with_id_token(id_token, access_token, refresh_token, cookies_obj) if id_token.present?
        return validate_with_any_token(access_token, refresh_token, cookies_obj) if has_any_token
        return check_keycloak_session_without_tokens(cookies_obj) if !has_any_token && id_token.blank?

        # Return true if we have any token
        has_any_token || id_token.present?
      rescue StandardError => e
        Rails.logger.warn "[Keycloak SessionValidator] Error validating tokens: #{e.message}"
        false
      end

      # Check if there's an active Keycloak session without local tokens (cross-tool SSO scenario)
      # @param cookies_obj [ActionDispatch::Cookies::CookieJar] The cookies object for cleanup
      # @return [Boolean] true if Keycloak session is active
      def self.check_keycloak_session_without_tokens(_cookies_obj = nil)
        return true unless Rails.env.production? # Skip in development

        begin
          keycloak_site = ENV.fetch("OMNIAUTH_KEYCLOAK_SITE", nil)
          realm = ENV.fetch("OMNIAUTH_KEYCLOAK_REALM", nil)

          return false unless keycloak_site.present? && realm.present?

          # Try to check session using Keycloak's session check endpoint
          # This doesn't require tokens if user has active browser session
          session_check_url = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/login-status-iframe.html"

          uri = URI.parse(session_check_url)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = (uri.scheme == "https")
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
        rescue StandardError => e
          Rails.logger.warn "[Keycloak SessionValidator] Error checking cross-tool session: #{e.message}, assuming active"
          true # Assume active on error to enable SSO
        end
      end

      # Validate tokens when id_token is present
      # @param id_token [String] The ID token from cookies
      # @param access_token [String] The access token from cookies
      # @param refresh_token [String] The refresh token from cookies
      # @param cookies_obj [ActionDispatch::Cookies::CookieJar] The cookies object for cleanup
      # @return [Boolean] true if id_token and session are valid
      def self.validate_with_id_token(id_token, access_token, refresh_token, cookies_obj)
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

        true
      end

      # Validate tokens when only access_token or refresh_token are present
      # @param access_token [String] The access token from cookies
      # @param refresh_token [String] The refresh token from cookies
      # @param cookies_obj [ActionDispatch::Cookies::CookieJar] The cookies object for cleanup
      # @return [Boolean] true if session is active
      def self.validate_with_any_token(access_token, refresh_token, cookies_obj)
        check_token = access_token.presence || refresh_token
        unless session_active?(check_token, cookies_obj)
          Rails.logger.info "[Keycloak SessionValidator] No valid session found"
          return false
        end

        true
      end
    end
  end
end
