# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

module Decidim
  module AdminHeader
    # Service to fetch applications from Tool0 external API.
    # Uses Keycloak JWT tokens for authentication.
    #
    # @example
    #   service = Tool0ApiService.new(current_user: current_user, cookies: cookies)
    #   applications = service.fetch_applications
    #
    class Tool0ApiService
      require "net/http"
      require "json"

      def initialize(current_user: nil, cookies: nil)
        @tenant_id = ENV.fetch("TOOL0_TENANT_ID", nil)
        @domain = ENV.fetch("TOOL0_DOMAIN", nil)
        @api_path = ENV["TOOL0_API_TOOLBAR_APPLICATIONS"] || "/api/dashboard/applications/external-tools"
        @current_user = current_user
        @cookies = cookies
        @auth_token = fetch_auth_token
      end

      def fetch_applications
        unless api_configured?
          Rails.logger.warn "Tool0 API not configured"
          return
        end

        begin
          response = make_api_request

          if response&.code == "200"
            parse_response(response.body)
          else
            Rails.logger.warn "Tool0 API returned status: #{response&.code}"
          end
        rescue StandardError => e
          Rails.logger.error "Tool0 API error: #{e.message}"
        end
      end

      private

      def api_configured?
        @tenant_id.present? && @domain.present? && @auth_token.present?
      end

      def make_api_request
        uri = URI("#{@domain}#{@api_path}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.read_timeout = 10

        request = Net::HTTP::Get.new(uri.path)
        request["x-tenant-id"] = @tenant_id
        request["authorization"] = "Bearer #{@auth_token}"
        request["Content-Type"] = "application/json"

        http.request(request)
      end

      def parse_response(response_body)
        JSON.parse(response_body)
      rescue JSON::ParserError => e
        Rails.logger.error "Tool0 API JSON parse error: #{e.message}"
        nil
      end

      # Fetch auth token using centralized Keycloak cookie access
      def fetch_auth_token
        # Priority 1: Get token from cookies
        token = token_from_cookies
        return token if token.present?

        # Priority 2: Try Doorkeeper tokens if user is present
        token = token_from_doorkeeper
        return token if token.present?

        # Priority 3: Fallback to environment variables
        token_from_env
      end

      def token_from_cookies
        return nil unless @cookies

        # Use the cookies hash directly (supports both Hash and CookieJar)
        cookies_hash = @cookies.respond_to?(:to_h) ? @cookies.to_h : @cookies

        # Access token is the JWT we need
        access_token = cookies_hash["access_token"]
        return access_token if access_token.present?

        # Fallback to id_token
        cookies_hash["id_token"]
      end

      def token_from_doorkeeper
        return nil unless @current_user

        begin
          access_token = Doorkeeper::AccessToken
                         .where(resource_owner_id: @current_user.id)
                         .where(revoked_at: nil)
                         .where("expires_in IS NULL OR (created_at + INTERVAL '1 second' * expires_in) > ?", Time.current)
                         .order(created_at: :desc)
                         .first

          # Only return if it looks like a JWT (contains dots)
          return access_token.token if access_token&.token&.include?(".")
        rescue StandardError => e
          Rails.logger.debug { "Error retrieving Doorkeeper token: #{e.message}" }
        end

        nil
      end

      def token_from_env
        keycloak_token = ENV.fetch("KEYCLOAK_ACCESS_TOKEN", nil)
        tool0_token = ENV.fetch("TOOL0_AUTH_TOKEN", nil)

        # Check if the token is just a placeholder
        if tool0_token == "your_auth_token_here"
          Rails.logger.warn "TOOL0_AUTH_TOKEN is set to placeholder value"
          return nil
        end

        keycloak_token || tool0_token
      end
    end
  end
end
