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
          # Get JWT token from local endpoint using Net::HTTP instead of shell command
          jwt_url = "#{request.protocol}#{request.host_with_port}/api/jwt_token"
          uri = URI(jwt_url)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == 'https'
          
          request_obj = Net::HTTP::Get.new(uri)
          request_obj['Accept'] = 'application/json'
          
          jwt_response = http.request(request_obj).body
          jwt_json = JSON.parse(jwt_response) rescue {}
          jwt = jwt_json["token"]
          
          unless jwt
            return render json: { error: "failed to obtain jwt" }, status: :bad_gateway
          end

          # Get Tool0 URL from environment
          tool0_url = ENV['TOOL0_FULL_URL'] || 'https://ie-int.ldttoolbox.app/api/dashboard/applications/external-tools'

          # Call Tool0 API with JWT token using Net::HTTP instead of shell command
          uri = URI(tool0_url)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == 'https'
          
          tool0_request = Net::HTTP::Get.new(uri)
          tool0_request['Authorization'] = "Bearer #{jwt}"
          tool0_request['Accept'] = 'application/json'
          tool0_request['Content-Type'] = 'application/json'
          tool0_request['Accept-Encoding'] = 'gzip, deflate, br'

          tool0_response = http.request(tool0_request).body

          # Try to parse as JSON
          result = JSON.parse(tool0_response)
          
          render json: result
        rescue JSON::ParserError => e
          render json: { error: "parsing error: #{e.message}" }, status: :unprocessable_entity
        rescue => e
          render json: { error: "unexpected error: #{e.message}" }, status: :internal_server_error
        end
      end

    end
  end
end