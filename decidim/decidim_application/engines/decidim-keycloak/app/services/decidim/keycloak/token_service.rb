# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

module Decidim
  module Keycloak
    class TokenService
      def self.ensure_valid_token(user)
        new.ensure_valid_token(user)
      end

      def ensure_valid_token(user)
        return nil unless user&.extended_data

        access_token = user.extended_data['keycloak_access_token']
        expires_at = user.extended_data['keycloak_token_expires_at']

        # If no expiration set, assume it's still valid
        return access_token unless expires_at

        # If token not expired, return it
        return access_token if Time.at(expires_at) > Time.current

        # Token is expired, try to refresh
        refresh_token = user.extended_data['keycloak_refresh_token']
        return nil unless refresh_token

        Rails.logger.info "Token expired for user #{user.id}, attempting refresh..."
        refresh_access_token(user, refresh_token)
      end

      private

      def refresh_access_token(user, refresh_token)
        token_endpoint = ENV['OMNIAUTH_KEYCLOAK_TOKEN_URL'] || "#{ENV['OMNIAUTH_KEYCLOAK_SITE']}/token"
        client_id = ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID']
        client_secret = ENV['OMNIAUTH_KEYCLOAK_CLIENT_SECRET']

        begin
          uri = URI(token_endpoint)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == 'https'

          request = Net::HTTP::Post.new(uri)
          request['Content-Type'] = 'application/x-www-form-urlencoded'
          request.set_form_data(
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
            client_id: client_id,
            client_secret: client_secret
          )

          response = http.request(request)

          unless response.code == '200'
            Rails.logger.warn "Keycloak token refresh failed: #{response.code}"
            return nil
          end

          result = JSON.parse(response.body)
          new_access_token = result['access_token']
          new_refresh_token = result['refresh_token']
          expires_in = result['expires_in'].to_i

          # Update user's tokens
          user.extended_data ||= {}
          user.extended_data['keycloak_access_token'] = new_access_token
          user.extended_data['keycloak_refresh_token'] = new_refresh_token if new_refresh_token
          user.extended_data['keycloak_token_expires_at'] = (Time.current + expires_in.seconds).to_i
          user.save!

          Rails.logger.info "Token refreshed successfully for user #{user.id}"
          new_access_token
        rescue StandardError => e
          Rails.logger.error "Error refreshing token: #{e.message}"
          nil
        end
      end
    end
  end
end
