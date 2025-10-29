# frozen_string_literal: true

require 'securerandom'

module Decidim
  module Keycloak
    # Alternative token storage using Redis cache instead of cookies
    # Use this if JWT tokens are too large even with chunking
    class RedisTokenService
      REDIS_KEY_PREFIX = 'keycloak_token'
      TOKEN_EXPIRY = 1.day.to_i # 24 hours
      
      def self.ensure_valid_token(user, cookies_hash = nil, cookies_obj = nil)
        new.ensure_valid_token(user, cookies_hash, cookies_obj)
      end

      def ensure_valid_token(user, cookies_hash = nil, cookies_obj = nil)
        return nil unless user
        
        # Get token session ID from cookie
        token_session_id = cookies_hash&.dig('keycloak_session_id')
        return nil unless token_session_id
        
        # Retrieve token from Redis
        redis_key = "#{REDIS_KEY_PREFIX}:#{user.id}:#{token_session_id}"
        token_data = Rails.cache.read(redis_key)
        
        return nil unless token_data
        
        access_token = token_data[:access_token]
        expires_at = token_data[:expires_at]
        refresh_token = token_data[:refresh_token]
        
        Rails.logger.info "Using token from REDIS (expires_at: #{expires_at ? Time.at(expires_at) : 'N/A'})"
        
        # If no expiration set, assume it's still valid
        return access_token unless expires_at
        
        # If token not expired, return it
        if Time.at(expires_at) > Time.current
          Rails.logger.info "Token is still valid (expires in #{(Time.at(expires_at) - Time.current).to_i} seconds)"
          return access_token
        end
        
        # Token is expired, try to refresh
        if refresh_token && cookies_obj
          Rails.logger.info "Token expired for user #{user.id}, attempting refresh..."
          new_tokens = refresh_access_token(refresh_token)
          
          if new_tokens
            # Update Redis cache with new tokens
            save_tokens_to_redis(user, token_session_id, cookies_obj, new_tokens)
            return new_tokens[:access_token]
          else
            Rails.logger.warn "Token refresh failed, user needs to re-login"
          end
        end
        
        nil
      end

      def save_tokens_to_redis(user, token_session_id, cookies_obj, tokens)
        # Generate new session ID if not provided
        token_session_id ||= SecureRandom.hex(16)
        
        redis_key = "#{REDIS_KEY_PREFIX}:#{user.id}:#{token_session_id}"
        
        expires_at = if tokens[:expires_in] && tokens[:expires_in] > 0
                      Time.current + tokens[:expires_in].seconds
                    else
                      Time.current + TOKEN_EXPIRY.seconds
                    end
        
        token_data = {
          access_token: tokens[:access_token],
          refresh_token: tokens[:refresh_token],
          expires_at: expires_at.to_i
        }
        
        # Save to Redis with expiration
        Rails.cache.write(redis_key, token_data, expires_in: TOKEN_EXPIRY)
        
        # Save only session ID in cookie (very small!)
        cookies_obj['keycloak_session_id'] = {
          value: token_session_id,
          httponly: true,
          secure: Rails.env.production?,
          same_site: :lax,
          expires: expires_at
        }
        
        Rails.logger.info "✓ Saved token to Redis (key: #{redis_key}, token size: #{tokens[:access_token].length} bytes)"
      end

      private

      def refresh_access_token(refresh_token)
        # Get Keycloak configuration
        keycloak_site = ENV['OMNIAUTH_KEYCLOAK_SITE']
        realm = ENV['OMNIAUTH_KEYCLOAK_REALM'] || 'master'
        client_id = ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID']
        client_secret = ENV['OMNIAUTH_KEYCLOAK_CLIENT_SECRET']
        
        token_endpoint = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/token"

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

          Rails.logger.info "Refreshing token at #{token_endpoint}"
          response = http.request(request)

          unless response.code == '200'
            Rails.logger.warn "Keycloak token refresh failed: #{response.code} - #{response.body[0..200]}"
            return nil
          end

          result = JSON.parse(response.body)
          
          Rails.logger.info "✓ Token refreshed successfully (expires_in: #{result['expires_in']}s)"
          
          {
            access_token: result['access_token'],
            refresh_token: result['refresh_token'] || refresh_token,
            expires_in: result['expires_in'].to_i
          }
        rescue StandardError => e
          Rails.logger.error "Error refreshing token: #{e.class} - #{e.message}\n#{e.backtrace.first(5).join("\n")}"
          nil
        end
      end
    end
  end
end
