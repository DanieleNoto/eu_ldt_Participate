# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

module Decidim
  module Keycloak
    class TokenService
      def self.ensure_valid_token(user, cookies_hash = nil, cookies_obj = nil)
        new.ensure_valid_token(user, cookies_hash, cookies_obj)
      end

      def ensure_valid_token(user, cookies_hash = nil, cookies_obj = nil)
        # Get tokens from cookies - they are stored as separate chunks in HTTP cookies
        access_token = reconstruct_token_from_cookies(cookies_hash, 'keycloak_access_token')
        expires_at = cookies_hash&.dig('keycloak_token_expires_at')&.to_i if cookies_hash
        refresh_token = reconstruct_token_from_cookies(cookies_hash, 'keycloak_refresh_token')
        
        return nil unless access_token

        
        # If no expiration set, assume it's still valid
        return access_token unless expires_at
        
        # If token not expired, return it
        if Time.at(expires_at) > Time.current
          return access_token
        end
        
        # Token is expired, try to refresh
        if refresh_token && cookies_obj
          new_tokens = refresh_access_token(refresh_token)
          if new_tokens
            save_tokens_to_cookies(cookies_obj, new_tokens)
            return new_tokens[:access_token]
          end
        end
        
        nil
      end

      def save_tokens_to_cookies(cookies_obj, tokens)
        # Optimize chunk size: smaller chunks = more flexible, less risk of hitting single cookie limit
        # Max single cookie size is typically 4KB, we use 1500 bytes to be safe
        chunk_size = 1500
        
        # Save access token in chunks
        access_token = tokens[:access_token]
        
        # Log token size for monitoring
        
        access_token_chunks = access_token.scan(/.{1,#{chunk_size}}/m)
        
        # Clear old chunks first
        old_count = cookies_obj['keycloak_access_token_count'].to_i
        old_count.times do |i|
          cookies_obj.delete("keycloak_access_token_#{i}")
        end
        
        # Save new chunks
        access_token_chunks.each_with_index do |chunk, index|
          cookies_obj["keycloak_access_token_#{index}"] = {
            value: chunk,
            httponly: true,
            secure: Rails.env.production?,
            same_site: :lax,
            expires: 1.day.from_now
          }
        end
        cookies_obj['keycloak_access_token_count'] = {
          value: access_token_chunks.length.to_s,
          httponly: true,
          expires: 1.day.from_now
        }
        
        # Save refresh token in chunks
        if tokens[:refresh_token]
          refresh_token = tokens[:refresh_token]
          refresh_token_chunks = refresh_token.scan(/.{1,#{chunk_size}}/m)
          
          # Clear old chunks
          old_refresh_count = cookies_obj['keycloak_refresh_token_count'].to_i
          old_refresh_count.times do |i|
            cookies_obj.delete("keycloak_refresh_token_#{i}")
          end
          
          # Save new chunks
          refresh_token_chunks.each_with_index do |chunk, index|
            cookies_obj["keycloak_refresh_token_#{index}"] = {
              value: chunk,
              httponly: true,
              secure: Rails.env.production?,
              same_site: :lax,
              expires: 30.days.from_now
            }
          end
          cookies_obj['keycloak_refresh_token_count'] = {
            value: refresh_token_chunks.length.to_s,
            httponly: true,
            expires: 30.days.from_now
          }
        end
        
        # Save token expiry
        if tokens[:expires_in] && tokens[:expires_in] > 0
          expires_at = Time.current + tokens[:expires_in].seconds
          cookies_obj['keycloak_token_expires_at'] = {
            value: expires_at.to_i.to_s,
            httponly: true,
            expires: expires_at
          }
        end
        
      end

      # Exchange an incoming token (subject_token) for a token targeted at a specific audience/client
      # Returns the exchanged access_token string on success, or nil on failure.
      def exchange_token_for_audience(subject_token, audience)
        keycloak_site = ENV['OMNIAUTH_KEYCLOAK_SITE']
        realm = ENV['OMNIAUTH_KEYCLOAK_REALM'] || 'master'
        client_id = ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID']
        client_secret = ENV['OMNIAUTH_KEYCLOAK_CLIENT_SECRET']

        token_endpoint = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/token"

        # Try a couple of subject_token_type and client auth strategies if Keycloak rejects the first attempt
        subject_token_types = [
          'urn:ietf:params:oauth:token-type:access_token',
          'urn:ietf:params:oauth:token-type:id_token',
          'urn:ietf:params:oauth:token-type:jwt'
        ]

        client_auth_methods = [:post, :basic]

        client_auth_methods.each do |auth_method|
          subject_token_types.each do |sub_type|
            begin
              uri = URI(token_endpoint)
              http = Net::HTTP.new(uri.host, uri.port)
              http.use_ssl = uri.scheme == 'https'

              request = Net::HTTP::Post.new(uri)
              request['Content-Type'] = 'application/x-www-form-urlencoded'

              form = {
                grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
                subject_token: subject_token,
                subject_token_type: sub_type,
                audience: audience,
                client_id: client_id
              }

              # Attach client authentication
              if auth_method == :post
                form[:client_secret] = client_secret
              else
                request.basic_auth(client_id, client_secret)
              end

              request.set_form_data(form)

              response = http.request(request)

              if response.code == '200'
                result = JSON.parse(response.body)
                if result['access_token']
                  return result['access_token']
                else
                  return nil
                end
              else
                # Try next combination
              end
            rescue StandardError => e
            end
          end
        end

        nil
      end

      private

      def reconstruct_token_from_cookies(cookies_hash, token_key)
        # Reconstruct token from chunks stored in HTTP cookies
        return nil unless cookies_hash
        
        chunk_count = cookies_hash["#{token_key}_count"].to_i
        return nil if chunk_count == 0
        
        
        chunks = []
        chunk_count.times do |i|
          chunk = cookies_hash["#{token_key}_#{i}"]
          if chunk
            chunks << chunk
          else
            break
          end
        end
        
        return nil if chunks.length != chunk_count
        chunks.join
      end

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

          response = http.request(request)

          unless response.code == '200'
            return nil
          end

          result = JSON.parse(response.body)
          
          
          {
            access_token: result['access_token'],
            refresh_token: result['refresh_token'] || refresh_token, # Keep old refresh_token if not provided
            expires_in: result['expires_in'].to_i
          }
        rescue StandardError => e
          nil
        end
      end
    end
  end
end
