# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

require "net/http"
require "uri"
require "json"

module Decidim
  module AdminHeader
    class ApplicationsController < Decidim::Admin::ApplicationController
      def applications
        jwt = fetch_valid_jwt_token
        return render_unauthorized_error unless jwt

        tool0_response = fetch_tool0_applications(jwt)
        return if performed?

        render json: JSON.parse(tool0_response.body)
      rescue JSON::ParserError => e
        render json: { error: "parsing error: #{e.message}" }, status: :unprocessable_entity
      rescue StandardError => e
        Rails.logger.error("Unexpected error in applications controller: #{e.message}\n#{e.backtrace.join("\n")}")
        render json: { error: "unexpected error: #{e.message}" }, status: :internal_server_error
      end

      private

      def fetch_valid_jwt_token
        jwt = Decidim::Keycloak::TokenService.ensure_valid_token(current_user, request.cookies, cookies)
        return jwt if jwt

        Rails.logger.warn("No valid Keycloak JWT token available for user #{current_user&.id}")
        Rails.logger.warn("Available cookies: #{request.cookies.keys.grep(/keycloak/).inspect}")
        nil
      end

      def render_unauthorized_error
        render json: { error: "No valid Keycloak JWT token. Please log in again." }, status: :unauthorized
      end

      def fetch_tool0_applications(jwt)
        tool0_response = make_tool0_request(jwt)

        return tool0_response if tool0_response.code == "200"

        handle_tool0_error(tool0_response, jwt)
      end

      def make_tool0_request(jwt)
        uri = URI(tool0_url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"

        tool0_request = Net::HTTP::Get.new(uri)
        tool0_request["Authorization"] = "Bearer #{jwt}"
        tool0_request["Accept"] = "application/json"
        tool0_request["Content-Type"] = "application/json"
        tool0_request["Accept-Encoding"] = "gzip, deflate, br"

        http.request(tool0_request)
      end

      def tool0_url
        ENV.fetch("TOOL0_FULL_URL", "https://ie-int.ldttoolbox.app/api/dashboard/applications/external-tools")
      end

      def handle_tool0_error(tool0_response, jwt)
        return handle_unauthorized_response(jwt) if tool0_response.code == "401"

        Rails.logger.error("Tool0 API error - Status: #{tool0_response.code}, Body: #{tool0_response.body[0..500]}")
        render json: { error: "Tool0 returned status #{tool0_response.code}: #{tool0_response.body[0..200]}" }, status: :bad_gateway
        nil
      end

      def handle_unauthorized_response(_original_jwt)
        Rails.logger.warn("Tool0 API returned 401 - attempting token refresh and retry")

        refresh_token = reconstruct_token_from_cookies(request.cookies, "refresh_token")
        return render_auth_expired_error("No refresh token available") if refresh_token.blank?

        new_tokens = Decidim::Keycloak::TokenService.new.send(:refresh_access_token, refresh_token)
        return render_auth_expired_error("Token refresh failed") unless new_tokens

        retry_with_new_token(new_tokens)
      end

      def retry_with_new_token(new_tokens)
        Decidim::Keycloak::TokenService.new.save_tokens_to_cookies(cookies, new_tokens)
        jwt = new_tokens[:access_token]

        tool0_response = make_tool0_request(jwt)

        unless tool0_response.code == "200"
          Rails.logger.error("Tool0 API error after token refresh - Status: #{tool0_response.code}, Body: #{tool0_response.body[0..500]}")
          render json: { error: "Tool0 returned status #{tool0_response.code}: #{tool0_response.body[0..200]}" }, status: :bad_gateway
          return nil
        end

        tool0_response
      end

      def render_auth_expired_error(log_message)
        Rails.logger.error(log_message)
        render json: { error: "Authentication expired - please log in again" }, status: :unauthorized
        nil
      end

      def reconstruct_token_from_cookies(cookies_hash, token_key)
        return nil unless cookies_hash

        cookies_hash[token_key]
      end
    end
  end
end
