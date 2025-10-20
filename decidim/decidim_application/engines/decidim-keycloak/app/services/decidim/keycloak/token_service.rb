# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

module Decidim
  module Keycloak
    class TokenService
      def self.ensure_valid_token(user, cookies_or_session = nil)
        new.ensure_valid_token(user, cookies_or_session)
      end

      def ensure_valid_token(user, cookies_or_session = nil)
        # Get tokens from cookies - they are stored as separate chunks in HTTP cookies
        access_token = reconstruct_token_from_cookies(cookies_or_session, 'keycloak_access_token')
        expires_at = cookies_or_session&.dig('keycloak_token_expires_at')&.to_i if cookies_or_session
        refresh_token = reconstruct_token_from_cookies(cookies_or_session, 'keycloak_refresh_token')
        
        return nil unless access_token

        Rails.logger.info "Using token from COOKIES (expires_at: #{expires_at})"
        
        # If no expiration set, assume it's still valid
        return access_token unless expires_at
        
        # If token not expired, return it
        return access_token if Time.at(expires_at) > Time.current
        
        # Token is expired, try to refresh
        if refresh_token
          Rails.logger.info "Cookie token expired for user #{user.id}, attempting refresh..."
          new_token = refresh_access_token_with_cookies(cookies_or_session, refresh_token)
          return new_token if new_token
        end
        
        nil
      end

      private

      def reconstruct_token_from_cookies(cookies_or_session, token_key)
        # Reconstruct token from chunks stored in HTTP cookies
        return nil unless cookies_or_session
        
        chunk_count = cookies_or_session["#{token_key}_count"].to_i
        return nil if chunk_count == 0
        
        Rails.logger.debug "Reconstructing #{token_key} from #{chunk_count} chunks"
        
        chunks = []
        chunk_count.times do |i|
          chunk = cookies_or_session["#{token_key}_#{i}"]
          if chunk
            Rails.logger.debug "  Chunk #{i}: found (#{chunk.length} bytes)"
            chunks << chunk
          else
            Rails.logger.warn "  Chunk #{i}: NOT FOUND - reconstruction will fail"
            break
          end
        end
        
        if chunks.length != chunk_count
          Rails.logger.warn "Could not reconstruct #{token_key}: expected #{chunk_count} chunks, got #{chunks.length}"
          return nil
        end
        
        reconstructed = chunks.join
        Rails.logger.debug "Reconstructed #{token_key} from #{chunk_count} cookies (#{reconstructed.length} bytes)"
        reconstructed
      end

      def refresh_access_token_with_cookies(session, refresh_token)
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

          # NOTE: We cannot update cookies from here because we don't have access to the response object
          # The cookies will be updated on the next login
          # For now, just log the refresh
          Rails.logger.info "Token refreshed successfully (refresh happened server-side, will be updated on next request)"
          new_access_token
        rescue StandardError => e
          Rails.logger.error "Error refreshing token: #{e.message}"
          nil
        end
      end
    end
  end
end
