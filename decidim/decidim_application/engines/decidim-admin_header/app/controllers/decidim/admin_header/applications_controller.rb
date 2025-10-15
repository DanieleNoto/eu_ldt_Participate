# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

module Decidim
  module AdminHeader
    class ApplicationsController < Decidim::Admin::ApplicationController
      def keycloak_config
        # Return Keycloak configuration for frontend
        config = {
          url: ENV['OMNIAUTH_KEYCLOAK_SITE'],
          realm: ENV['OMNIAUTH_KEYCLOAK_REALM'],
          clientId: ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID'],
          tool0Url: ENV['TOOL0_FULL_URL'] || 'https://ie-int.ldttoolbox.app/api/dashboard/applications/external-tools',
          tenantId: ENV['TOOL0_TENANT_ID'] || 'a6b3523b-b882-4a10-82d9-0db4dbe12f8e',
          redirectUri: ENV['OMNIAUTH_KEYCLOAK_REDIRECT_URI'] || 'http://localhost:3000'
        }
        
        render json: config
      end

      def get_jwt_token
        # Get JWT token from Keycloak for the current user
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

      def get_user_jwt_token(user)
        Rails.logger.info "Getting JWT token for user #{user&.id}"
        
        # For testing/development, allow JWT token from environment
        env_jwt = ENV['TOOL0_JWT_TOKEN']
        if env_jwt.present? && env_jwt != 'your_jwt_token_here'
          Rails.logger.info "Using JWT token from environment"
          return env_jwt
        end
        
        return nil unless user
        
        Rails.logger.info "User extended_data: #{user.extended_data.inspect}"
        
        # Try to get JWT from user's extended_data (saved during Keycloak login)
        if user.extended_data && user.extended_data['keycloak_jwt_token']
          jwt_token = user.extended_data['keycloak_jwt_token']
          Rails.logger.info "Found JWT token in user extended_data for user #{user.id}"
          return jwt_token
        end
        
        Rails.logger.info "No JWT token found in extended_data for user #{user.id}"
        
        # Try to get JWT from session/cookies first
        jwt_token = session['jwt_token'] || session['id_token'] || cookies['jwt_token'] || cookies['id_token']
        if jwt_token
          Rails.logger.info "Found JWT token in session/cookies for user #{user.id}"
          return jwt_token
        end
        
        # Try to get from OAuth access tokens (if they are JWT)
        begin
          access_token = Doorkeeper::AccessToken.where(resource_owner_id: user.id)
                                                .where(revoked_at: nil)
                                                .where("expires_in IS NULL OR (created_at + INTERVAL '1 second' * expires_in) > ?", Time.current)
                                                .order(created_at: :desc)
                                                .first
          
          if access_token&.token&.include?('.')
            Rails.logger.info "Found JWT token in OAuth access token for user #{user.id}"
            return access_token.token
          end
        rescue => e
          Rails.logger.error "Error getting JWT token for user #{user.id}: #{e.message}"
        end
        
        Rails.logger.info "No JWT token found for user #{user.id}"
        nil
      end
    end
  end
end