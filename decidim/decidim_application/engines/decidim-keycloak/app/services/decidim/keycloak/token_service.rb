# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

require "net/http"
require "uri"
require "json"
require "jwt"

module Decidim
  module Keycloak
    # Service for managing Keycloak tokens: validation, refresh, revocation.
    #
    # @example Validate and refresh token
    #   TokenService.ensure_valid_token(user, cookies.to_h, cookies, request.host, self)
    #
    # @example Using options hash
    #   TokenService.ensure_valid_token(user, cookies_hash: cookies.to_h, cookies_obj: cookies)
    #
    class TokenService
      # Options hash for ensure_valid_token to reduce parameter count
      # @param user [Decidim::User] The user to validate token for
      # @param options [Hash] Options hash with :cookies_hash, :cookies_obj, :request_host, :controller
      def self.ensure_valid_token(user, options = {})
        new.ensure_valid_token(user, **options)
      end

      def self.revoke_tokens(access_token, refresh_token = nil)
        new.revoke_tokens(access_token, refresh_token)
      end

      def self.introspect_token(access_token)
        new.introspect_token(access_token)
      end

      # Exchange a token for a specific audience (public API)
      # @param subject_token [String] The token to exchange
      # @param audience [String] The target audience/client ID
      # @return [String, nil] The exchanged access token or nil on failure
      def self.exchange_token_for_audience(subject_token, audience)
        new.send(:exchange_token_for_audience, subject_token, audience)
      end

      # Ensure the user has a valid token, refreshing silently if expired.
      #
      # Flow:
      #   1. Local JWT expiry check (zero network) → return token if valid
      #   2. Token expired/missing → attempt silent refresh via Keycloak
      #   3. HTTP 200 → save new tokens, return new access_token
      #   4. HTTP 400/401 → return nil (definitive rejection → logout)
      #   5. Network error → return :network_error (truthy → keep session, retry later)
      #
      # @param _user [Decidim::User] The user (unused but kept for API compatibility)
      # @param cookies_hash [Hash, nil] Hash of cookies
      # @param cookies_obj [ActionDispatch::Cookies, nil] Cookies object for writing
      # @param request_host [String, nil] Request host for cookie domain
      # @param controller [ActionController::Base, nil] Controller for callbacks
      # @return [String, Symbol, nil] token string or :network_error (truthy = keep session), nil = logout
      def ensure_valid_token(_user, cookies_hash: nil, cookies_obj: nil, request_host: nil, controller: nil)
        access_token = reconstruct_token_from_cookies(cookies_hash, "access_token")
        refresh_token = reconstruct_token_from_cookies(cookies_hash, "refresh_token")

        # Step 1: Local JWT expiry check — no network call
        if access_token.present?
          result = validate_existing_token(access_token)
          return result if result
        end

        # Step 2: Token expired or missing → silent refresh
        handle_token_refresh(refresh_token, cookies_obj: cookies_obj, request_host: request_host, controller: controller)
      end

      def save_tokens_to_cookies(cookies_obj, tokens, request_host = nil)
        # CENTRALIZED: Uses Decidim::Keycloak::CookieManager
        Decidim::Keycloak::CookieManager.save_tokens(cookies_obj, tokens, request_host)
      end

      def revoke_tokens(access_token, refresh_token = nil)
        revoked = false

        revoked = revoke_token(access_token) || revoked if access_token.present?

        revoked = revoke_token(refresh_token) || revoked if refresh_token.present?

        revoked
      end

      def introspect_token(access_token)
        return false if access_token.blank?

        keycloak_site = ENV.fetch("OMNIAUTH_KEYCLOAK_SITE", nil)
        realm = ENV["OMNIAUTH_KEYCLOAK_REALM"] || "master"
        client_id = ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_ID", nil)
        client_secret = ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_SECRET", nil)

        introspect_endpoint = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/token/introspect"

        begin
          uri = URI(introspect_endpoint)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == "https"

          request = Net::HTTP::Post.new(uri)
          request["Content-Type"] = "application/x-www-form-urlencoded"
          request.set_form_data(
            token: access_token,
            client_id: client_id,
            client_secret: client_secret
          )

          response = http.request(request)

          if response.code == "200"
            result = JSON.parse(response.body)
            active = result["active"]

            Rails.logger.debug { "[Keycloak Token Introspection] Token active: #{active}" }
            active == true
          else
            Rails.logger.warn "[Keycloak Token Introspection] Failed: HTTP #{response.code}"
            false
          end
        rescue StandardError => e
          Rails.logger.error "[Keycloak Token Introspection] Error: #{e.message}"
          false
        end
      end

      private

      # Exchange an incoming token (subject_token) for a token targeted at a specific audience/client
      # Returns the exchanged access_token string on success, or nil on failure.
      def exchange_token_for_audience(subject_token, audience)
        keycloak_site = ENV.fetch("OMNIAUTH_KEYCLOAK_SITE", nil)
        realm = ENV["OMNIAUTH_KEYCLOAK_REALM"] || "master"
        client_id = ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_ID", nil)
        client_secret = ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_SECRET", nil)

        token_endpoint = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/token"

        # Try a couple of subject_token_type and client auth strategies if Keycloak rejects the first attempt
        subject_token_types = [
          "urn:ietf:params:oauth:token-type:access_token",
          "urn:ietf:params:oauth:token-type:id_token",
          "urn:ietf:params:oauth:token-type:jwt"
        ]

        client_auth_methods = [:post, :basic]

        client_auth_methods.each do |auth_method|
          subject_token_types.each do |sub_type|
            uri = URI(token_endpoint)
            http = Net::HTTP.new(uri.host, uri.port)
            http.use_ssl = uri.scheme == "https"

            request = Net::HTTP::Post.new(uri)
            request["Content-Type"] = "application/x-www-form-urlencoded"

            form = {
              grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
              subject_token: subject_token,
              subject_token_type: sub_type,
              audience: audience,
              client_id: client_id
            }

            if auth_method == :post
              form[:client_secret] = client_secret
            else
              request.basic_auth(client_id, client_secret)
            end

            request.set_form_data(form)

            response = http.request(request)

            if response.code == "200"
              result = JSON.parse(response.body)
              return result["access_token"] if result["access_token"]
            end
          rescue StandardError => e
            Rails.logger.warn "[Keycloak TokenService] Error during token refresh attempt: #{e.class} - #{e.message}"
          end
        end

        nil
      end

      def reconstruct_token_from_cookies(cookies_hash, token_key)
        return nil unless cookies_hash

        cookies_hash[token_key]
      end

      def refresh_access_token(refresh_token)
        keycloak_site = ENV.fetch("OMNIAUTH_KEYCLOAK_SITE", nil)
        realm = ENV["OMNIAUTH_KEYCLOAK_REALM"] || "master"
        client_id = ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_ID", nil)
        client_secret = ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_SECRET", nil)

        token_endpoint = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/token"

        uri = URI(token_endpoint)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.open_timeout = 5
        http.read_timeout = 5

        request = Net::HTTP::Post.new(uri)
        request["Content-Type"] = "application/x-www-form-urlencoded"
        request.set_form_data(
          grant_type: "refresh_token",
          refresh_token: refresh_token,
          client_id: client_id,
          client_secret: client_secret
        )

        response = http.request(request)

        case response.code.to_i
        when 200
          result = JSON.parse(response.body)
          {
            access_token: result["access_token"],
            refresh_token: result["refresh_token"] || refresh_token,
            id_token: result["id_token"],
            expires_in: result["expires_in"].to_i,
            refresh_token_expires_in: result["refresh_token_expires_in"]&.to_i
          }
        when 400, 401
          # Definitive rejection: refresh token expired/revoked → logout
          Rails.logger.info "[Keycloak TokenService] Refresh rejected (HTTP #{response.code}) → session expired"
          nil
        else
          # Unexpected server/proxy error → keep session, retry next request
          Rails.logger.warn "[Keycloak TokenService] Unexpected refresh response (HTTP #{response.code}) → keeping session"
          :network_error
        end
      rescue Net::TimeoutError, Net::OpenTimeout, Net::ReadTimeout,
             Errno::ECONNREFUSED, Errno::EHOSTUNREACH, SocketError => e
        Rails.logger.warn "[Keycloak TokenService] Network error during refresh: #{e.class} - #{e.message}"
        :network_error
      rescue StandardError => e
        Rails.logger.error "[Keycloak TokenService] Unexpected error during refresh: #{e.class} - #{e.message}"
        :network_error
      end

      def revoke_token(token)
        return false if token.blank?

        keycloak_site = ENV.fetch("OMNIAUTH_KEYCLOAK_SITE", nil)
        realm = ENV["OMNIAUTH_KEYCLOAK_REALM"] || "master"
        client_id = ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_ID", nil)
        client_secret = ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_SECRET", nil)

        revoke_endpoint = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/revoke"

        begin
          uri = URI(revoke_endpoint)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == "https"

          request = Net::HTTP::Post.new(uri)
          request["Content-Type"] = "application/x-www-form-urlencoded"
          request.set_form_data(
            token: token,
            client_id: client_id,
            client_secret: client_secret
          )

          response = http.request(request)

          if response.code == "200"
            Rails.logger.info "✓ Successfully revoked token"
            true
          else
            Rails.logger.warn "✗ Failed to revoke token: HTTP #{response.code} - #{response.body}"
            false
          end
        rescue StandardError => e
          Rails.logger.error "Error revoking token: #{e.message}"
          false
        end
      end

      # Local JWT expiry check — no network call.
      # Returns the token if still valid, nil if expired.
      # If expiry cannot be parsed (opaque token), assumes valid to avoid false logouts.
      def validate_existing_token(access_token)
        expires_at = CookieManager.extract_jwt_expiration(access_token)
        # Cannot parse expiry (e.g. opaque token) → assume valid
        return access_token unless expires_at

        # Token not yet expired locally → valid
        expires_at > Time.current ? access_token : nil
      end


      def handle_token_refresh(refresh_token, cookies_obj: nil, request_host: nil, controller: nil)
        return nil unless refresh_token && cookies_obj

        Rails.logger.debug "[Keycloak Token Validation] Access token expired, attempting silent refresh"
        new_tokens = refresh_access_token(refresh_token)

        case new_tokens
        when Hash
          # Successful refresh: persist new tokens and return new access token
          clear_cookies_if_controller(controller)
          save_tokens_to_cookies(cookies_obj, new_tokens, request_host)
          Rails.logger.info "[Keycloak Token Validation] Token refreshed successfully"
          new_tokens[:access_token]
        when :network_error
          # Transient failure: keep session alive, retry on next request
          Rails.logger.warn "[Keycloak Token Validation] Network error during refresh → keeping session alive"
          :network_error
        else
          # nil: definitive rejection (400/401) → force logout
          Rails.logger.info "[Keycloak Token Validation] Refresh rejected by Keycloak → session expired"
          clear_cookies_if_controller(controller)
          nil
        end
      end

      def clear_cookies_if_controller(controller)
        controller.clear_keycloak_cookies if controller.respond_to?(:clear_keycloak_cookies)
      end
    end
  end
end
