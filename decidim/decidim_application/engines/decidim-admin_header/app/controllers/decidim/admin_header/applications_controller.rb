# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

module Decidim
  module AdminHeader
    class ApplicationsController < Decidim::Admin::ApplicationController
      def applications
        # Backend endpoint to fetch applications from Tool0
        # Handles JWT token retrieval and Tool0 API communication
        begin
          # Get JWT token from local endpoint
          jwt_url = "#{request.protocol}#{request.host_with_port}/api/jwt_token"
          jwt_cmd = "curl -s '#{jwt_url}' -H 'Accept: application/json'"
          jwt_response = `#{jwt_cmd}`
          
          jwt_json = JSON.parse(jwt_response) rescue {}
          jwt = jwt_json["token"]
          
          unless jwt
            Rails.logger.error "Failed to obtain JWT token"
            return render json: { error: "failed to obtain jwt" }, status: :bad_gateway
          end

          Rails.logger.info "JWT token obtained successfully"

          # Get Tool0 URL from environment
          tool0_url = ENV['TOOL0_FULL_URL'] || 'https://ie-int.ldttoolbox.app/api/dashboard/applications/external-tools'

          # Call Tool0 API with JWT token
          # Include headers that browsers typically send
          # Use -i to see response headers (including Set-Cookie)
          tool0_cmd = "curl -s -X GET '#{tool0_url}' " \
                      "-H 'Authorization: Bearer #{jwt}' " \
                      "-H 'Accept: application/json' " \
                      "-H 'Content-Type: application/json' " \
                      "-H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' " \
                      "-H 'Accept-Language: en-US,en;q=0.9' " \
                      "-H 'Accept-Encoding: gzip, deflate, br'"

          Rails.logger.info "Calling Tool0 API: #{tool0_url}"
          Rails.logger.info "JWT token (first 50 chars): #{jwt[0..50]}..."

          tool0_response = `#{tool0_cmd}`

          Rails.logger.info "Tool0 Raw Response (first 1000 chars): #{tool0_response[0..1000]}"
          Rails.logger.info "Tool0 Response status code would be visible with -w flag"

          # Check if response is HTML (error)
          if tool0_response.strip.start_with?('<!DOCTYPE', '<!doctype', '<html')
            Rails.logger.error "Tool0 returned HTML response - likely authentication issue"
            return render json: { error: "Tool0 returned HTML - authentication issue", response: tool0_response[0..500] }, status: :bad_gateway
          end

          # Try to parse as JSON
          result = JSON.parse(tool0_response)
          
          Rails.logger.info "Successfully fetched applications from Tool0. Groups count: #{result['groups']&.length || 0}"
          render json: result
        rescue JSON::ParserError => e
          Rails.logger.error "JSON parsing error: #{e.message}"
          Rails.logger.error "Failed to parse response: #{tool0_response[0..500]}"
          render json: { error: "parsing error: #{e.message}", raw_response: tool0_response[0..500] }, status: :unprocessable_entity
        rescue => e
          Rails.logger.error "Unexpected error: #{e.message}\n#{e.backtrace.join("\n")}"
          render json: { error: "unexpected error: #{e.message}" }, status: :internal_server_error
        end
      end

    end
  end
end