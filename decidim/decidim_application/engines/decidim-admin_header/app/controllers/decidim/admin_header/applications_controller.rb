# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

module Decidim
  module AdminHeader
    class ApplicationsController < Decidim::Admin::ApplicationController
      def applications
        # Backend endpoint to fetch applications from Tool0
        # Use the JWT token saved to cookies during Keycloak login
        begin
          # Ensure token is valid (refresh if expired) - pass request.cookies for token lookup
          jwt = Decidim::Keycloak::TokenService.ensure_valid_token(current_user, request.cookies)
          
          unless jwt
            Rails.logger.warn("No valid Keycloak JWT token available for user #{current_user&.id}")
            Rails.logger.warn("Available cookies: #{request.cookies.keys.grep(/keycloak/).inspect}")
            return render json: { error: "No valid Keycloak JWT token. Please log in again." }, status: :unauthorized
          end

          # Get Tool0 URL from environment
          tool0_url = ENV['TOOL0_FULL_URL'] || 'https://ie-int.ldttoolbox.app/api/dashboard/applications/external-tools'

          # Call Tool0 API with user's JWT token
          uri = URI(tool0_url)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == 'https'
          
          tool0_request = Net::HTTP::Get.new(uri)
          tool0_request['Authorization'] = "Bearer #{jwt}"
          tool0_request['Accept'] = 'application/json'
          tool0_request['Content-Type'] = 'application/json'
          tool0_request['Accept-Encoding'] = 'gzip, deflate, br'

          tool0_response = http.request(tool0_request)
          
          # Check response status
          unless tool0_response.code == '200'
            Rails.logger.error("Tool0 API error - Status: #{tool0_response.code}, Body: #{tool0_response.body[0..500]}")
            return render json: { error: "Tool0 returned status #{tool0_response.code}: #{tool0_response.body[0..200]}" }, status: :bad_gateway
          end

          # Try to parse as JSON
          result = JSON.parse(tool0_response.body)
          
          render json: result
        rescue JSON::ParserError => e
          render json: { error: "parsing error: #{e.message}" }, status: :unprocessable_entity
        rescue => e
          Rails.logger.error("Unexpected error in applications controller: #{e.message}\n#{e.backtrace.join("\n")}")
          render json: { error: "unexpected error: #{e.message}" }, status: :internal_server_error
        end
      end

    end
  end
end