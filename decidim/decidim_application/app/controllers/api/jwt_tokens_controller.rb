# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

module Api
  class JwtTokensController < ApplicationController
    # GET /api/jwt_token
    # Returns a valid JWT token from Keycloak for the current user
    def show
      Rails.logger.info "Getting JWT token for user #{current_user&.id}"
      
      begin
        # Check if we have a token in session from OmniAuth
        if session[:omniauth_id_token].present?
          Rails.logger.info "Found JWT token in session"
          return render json: { token: session[:omniauth_id_token] }
        end

        # Otherwise, get a new token from Keycloak using client_credentials
        token = fetch_token_from_keycloak
        
        if token
          render json: { token: token }
        else
          render json: { error: 'Failed to obtain token from Keycloak' }, status: :unauthorized
        end
      rescue => e
        Rails.logger.error "Error getting JWT token: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { error: "Failed to get JWT token: #{e.message}" }, status: :internal_server_error
      end
    end
    
    private
    
    def fetch_token_from_keycloak
      Rails.logger.info "Fetching token from Keycloak using client_credentials"
      
      keycloak_url = ENV['OMNIAUTH_KEYCLOAK_SITE']
      realm = ENV['OMNIAUTH_KEYCLOAK_REALM']
      client_id = ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID']
      client_secret = ENV['OMNIAUTH_KEYCLOAK_CLIENT_SECRET']
      
      unless keycloak_url && realm && client_id && client_secret
        Rails.logger.error "Missing Keycloak configuration"
        return nil
      end
      
      # Build token endpoint URL
      token_url = "#{keycloak_url}/realms/#{realm}/protocol/openid-connect/token"
      Rails.logger.info "Token URL: #{token_url}"
      
      uri = URI.parse(token_url)
      
      # Prepare request
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      http.read_timeout = 10
      
      request = Net::HTTP::Post.new(uri.request_uri)
      request['Content-Type'] = 'application/x-www-form-urlencoded'
      
      # Use client_credentials grant for confidential clients
      request.set_form_data({
        'grant_type' => 'client_credentials',
        'client_id' => client_id,
        'client_secret' => client_secret
      })
      
      Rails.logger.info "Sending request to Keycloak..."
      response = http.request(request)
      
      Rails.logger.info "Keycloak response status: #{response.code}"
      
      if response.code.to_i == 200
        data = JSON.parse(response.body)
        access_token = data['access_token']
        Rails.logger.info "Successfully obtained access token from Keycloak"
        return access_token
      else
        Rails.logger.error "Failed to get token from Keycloak: #{response.code} - #{response.body}"
        return nil
      end
    rescue => e
      Rails.logger.error "Error fetching token from Keycloak: #{e.message}\n#{e.backtrace.join("\n")}"
      return nil
    end
  end
end
