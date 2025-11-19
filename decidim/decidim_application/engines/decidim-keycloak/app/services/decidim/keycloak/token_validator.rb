# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

module Decidim
  module Keycloak
    class TokenValidator
      def initialize(id_token, user = nil)
        @id_token = id_token
        @user = user
      end

      def self.valid?(id_token, user = nil)
        new(id_token, user).valid?
      end

      def valid?
        return false if @id_token.blank?
        return false unless keycloak_config_valid?

        # Check cache first (1-minute TTL for production to reduce Keycloak API calls)
        cache_key = "keycloak_token_#{Digest::SHA256.hexdigest(@id_token)}"
        cached_result = Rails.cache.read(cache_key)
        return cached_result unless cached_result.nil?

        Rails.logger.debug "[Keycloak Token Validation] Validating token with Keycloak"

        # First, check if token is locally expired to avoid unnecessary network calls
        if token_locally_expired?(@id_token)
          Rails.logger.info "[Keycloak Token Validation] Token locally expired for user #{@user&.id}"
          return false
        end

        begin
          # Get access token for introspection using Net::HTTP with timeout and SSL
          uri = URI("#{keycloak_config[:site]}/realms/#{keycloak_config[:realm]}/protocol/openid-connect/token")
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == "https"
          http.verify_mode = OpenSSL::SSL::VERIFY_PEER
          http.cert_store = OpenSSL::SSL::SSLContext::DEFAULT_CERT_STORE
          http.open_timeout = 10
          http.read_timeout = 20

          request = Net::HTTP::Post.new(uri)
          request["Content-Type"] = "application/x-www-form-urlencoded"
          request.body = URI.encode_www_form({
                                               grant_type: "client_credentials",
                                               client_id: keycloak_config[:client_id],
                                               client_secret: keycloak_config[:client_secret]
                                             })

          token_response = http.request(request)
          return false unless token_response.is_a?(Net::HTTPSuccess)

          access_token = JSON.parse(token_response.body)["access_token"]
          return false unless access_token

          # Introspect the user's token
          introspect_uri = URI("#{keycloak_config[:site]}/realms/#{keycloak_config[:realm]}/protocol/openid-connect/token/introspect")
          introspect_request = Net::HTTP::Post.new(introspect_uri)
          introspect_request["Content-Type"] = "application/x-www-form-urlencoded"
          introspect_request.body = URI.encode_www_form({
                                                          token: @id_token,
                                                          client_id: keycloak_config[:client_id],
                                                          client_secret: keycloak_config[:client_secret]
                                                        })

          introspect_response = http.request(introspect_request)
          return false unless introspect_response.is_a?(Net::HTTPSuccess)

          introspection_result = JSON.parse(introspect_response.body)
          is_active = introspection_result["active"] == true

          # Log token validation result for debugging
          if is_active
            Rails.logger.debug { "[Keycloak Token Validation] Token is valid for user #{@user&.id}" }
          else
            Rails.logger.info "[Keycloak Token Validation] Token is invalid/revoked for user #{@user&.id} - forcing logout"
          end

          # Cache the result for 1 minute to reduce Keycloak API calls and avoid rate limits
          Rails.cache.write(cache_key, is_active, expires_in: 1.minute)

          is_active
        rescue Net::OpenTimeout, Net::ReadTimeout => e
          Rails.logger.error "[Keycloak Token Validation] Network timeout during validation: #{e.message}"
          false
        rescue JSON::ParserError => e
          Rails.logger.error "[Keycloak Token Validation] Invalid JSON response during validation: #{e.message}"
          false
        rescue StandardError => e
          Rails.logger.error "[Keycloak Token Validation] Unexpected error during validation: #{e.class} - #{e.message}"
          false
        end
      end

      private

      def keycloak_config
        Decidim::Keycloak::Configuration.config
      end

      def keycloak_config_valid?
        Decidim::Keycloak::Configuration.valid?
      end

      def token_locally_expired?(id_token)
        # CENTRALIZED: Uses Decidim::Keycloak::JwtParser
        Decidim::Keycloak::JwtParser.locally_expired?(id_token)
      end
    end
  end
end
