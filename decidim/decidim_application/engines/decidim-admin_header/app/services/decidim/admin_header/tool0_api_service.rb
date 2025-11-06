# frozen_string_literal: true

module Decidim
  module AdminHeader
    class Tool0ApiService
      require 'net/http'
      require 'json'

      def initialize(current_user: nil)
        @tenant_id = ENV['TOOL0_TENANT_ID']
        @domain = ENV['TOOL0_DOMAIN']
        @api_path = ENV['TOOL0_API_TOOLBAR_APPLICATIONS'] || '/api/dashboard/applications/external-tools'
        @auth_token = get_auth_token(current_user)
        @current_user = current_user
      end

      def fetch_applications
        unless api_configured?
          Rails.logger.warn "Tool0 API not configured"
          return 
        end

        begin
          response = make_api_request
          
          if response&.code == '200'
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
        http.use_ssl = uri.scheme == 'https'
        http.read_timeout = 10 # seconds

        request = Net::HTTP::Get.new(uri.path)
        request['x-tenant-id'] = @tenant_id
        request['authorization'] = "Bearer #{@auth_token}"
        request['Content-Type'] = 'application/json'

        http.request(request)
      end

      def parse_response(response_body)
        data = JSON.parse(response_body)
        # Return the data as-is if it already has the expected structure
        data
      rescue JSON::ParserError => e
        Rails.logger.error "Tool0 API JSON parse error: #{e.message}"
      end

      def get_auth_token(current_user)
        # Try to get JWT token from current user's session or request
        if current_user
          # Try to get JWT token from session (if stored during OAuth login)
          jwt_token = get_jwt_from_session
          return jwt_token if jwt_token
          
          # Try to get from user's OAuth data if available
          begin
            access_token = Doorkeeper::AccessToken.where(resource_owner_id: current_user.id)
                                                  .where(revoked_at: nil)
                                                  .where("expires_in IS NULL OR (created_at + INTERVAL '1 second' * expires_in) > ?", Time.current)
                                                  .order(created_at: :desc)
                                                  .first
            
            if access_token && access_token.token.include?('.')
              return access_token.token
            end
          rescue => e
            Rails.logger.error "Error retrieving OAuth token for user #{current_user.id}: #{e.message}"
          end
        end
        
        # Fallback to environment variables
        keycloak_token = ENV['KEYCLOAK_ACCESS_TOKEN']
        tool0_token = ENV['TOOL0_AUTH_TOKEN']
        
        # Check if the token is just a placeholder
        if tool0_token == 'your_auth_token_here'
          Rails.logger.warn "TOOL0_AUTH_TOKEN is set to placeholder value - please configure a valid JWT token"
          return nil
        end
        
        keycloak_token || tool0_token
      end
      
      private
      
      def get_jwt_from_session
        # Try to get JWT token from current request/session
        # This might be available in different places depending on the OAuth setup
        
        # Check if there's a JWT in the session
        session_jwt = session['jwt_token'] || session['id_token'] || session['access_token']
        return session_jwt if session_jwt
        
        # Check cookies for JWT
        cookies_jwt = cookies['jwt_token'] || cookies['id_token'] || cookies['access_token']
        return cookies_jwt if cookies_jwt
        
        nil
      rescue
        nil
      end
    end
  end
end