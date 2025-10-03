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
        Rails.logger.debug "=== Tool0ApiService Debug Info ==="
        Rails.logger.debug "TOOL0_TENANT_ID: #{@tenant_id.present? ? '[SET]' : '[MISSING]'}"
        Rails.logger.debug "TOOL0_DOMAIN: #{@domain.present? ? '[SET]' : '[MISSING]'}"
        Rails.logger.debug "Auth token: #{@auth_token.present? ? '[SET]' : '[MISSING]'}"
        Rails.logger.debug "API configured: #{api_configured?}"
        
        unless api_configured?
          Rails.logger.warn "API not configured"
          return 
        end

        begin
          response = make_api_request
          
          if response&.code == '200'
            Rails.logger.debug "API call successful, parsing response"
            parse_response(response.body)
          else
            Rails.logger.warn "Tool0 API returned status: #{response&.code}, body: #{response&.body}"            
          end
        rescue StandardError => e
          Rails.logger.error "Tool0 API error: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
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

        Rails.logger.debug "Making API request to: #{uri}"
        Rails.logger.debug "Headers: x-tenant-id=#{@tenant_id}, authorization=Bearer [REDACTED]"

        http.request(request)
      end

      def parse_response(response_body)
        data = JSON.parse(response_body)
        
        # Log the response structure for debugging
        Rails.logger.debug "API Response: #{data}"
        
        # Return the data as-is if it already has the expected structure
        data
      rescue JSON::ParserError => e
        Rails.logger.error "Tool0 API JSON parse error: #{e.message}"
      end

      def get_auth_token(current_user)
        Rails.logger.debug "=== Auth Token Debug ==="
        
        # Try to get token from current user's session/omniauth data
        if current_user&.respond_to?(:oauth_token)
          Rails.logger.debug "Found oauth_token from user"
          return current_user.oauth_token
        end
        
        # Try session data if available
        # This would need to be passed from the controller
        
        # Fallback to environment variables
        keycloak_token = ENV['KEYCLOAK_ACCESS_TOKEN']
        tool0_token = ENV['TOOL0_AUTH_TOKEN']
        
        Rails.logger.debug "KEYCLOAK_ACCESS_TOKEN: #{keycloak_token.present? ? '[SET]' : '[MISSING]'}"
        Rails.logger.debug "TOOL0_AUTH_TOKEN: #{tool0_token.present? ? '[SET]' : '[MISSING]'}"
        
        token = keycloak_token || tool0_token
        Rails.logger.debug "Final token: #{token.present? ? '[SET]' : '[MISSING]'}"
        
        token
      end
    end
  end
end