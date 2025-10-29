# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

module Decidim
  module Keycloak
    class TokenService
      def self.ensure_valid_token(user, cookies_hash = nil, cookies_obj = nil, request_host = nil)
        new.ensure_valid_token(user, cookies_hash, cookies_obj, request_host)
      end

      def ensure_valid_token(user, cookies_hash = nil, cookies_obj = nil, request_host = nil)
        access_token = reconstruct_token_from_cookies(cookies_hash, 'access_token')
        expires_at = cookies_hash&.dig('token_expires_at')&.to_i if cookies_hash
        refresh_token = reconstruct_token_from_cookies(cookies_hash, 'refresh_token')
        
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
            save_tokens_to_cookies(cookies_obj, new_tokens, request_host)
            return new_tokens[:access_token]
          end
        end
        
        nil
      end

      def save_tokens_to_cookies(cookies_obj, tokens, request_host = nil)
        # Domain for cross-subdomain cookie sharing
        # Use the same logic as ApplicationController#keycloak_cookie_domain
        cookie_domain = determine_keycloak_cookie_domain(request_host)

        # Save access token
        if tokens[:access_token]
          cookies_obj['access_token'] = {
            value: tokens[:access_token],
            httponly: true,
            secure: Rails.env.production?,
            same_site: :lax,
            domain: cookie_domain,
            expires: 1.hour.from_now
          }
        end
        
        # Save refresh token
        if tokens[:refresh_token]
          cookies_obj['refresh_token'] = {
            value: tokens[:refresh_token],
            httponly: true,
            secure: Rails.env.production?,
            same_site: :lax,
            domain: cookie_domain,
            expires: 7.days.from_now
          }
        end
        
        # Save id_token
        if tokens[:id_token]
          cookies_obj['id_token'] = {
            value: tokens[:id_token],
            httponly: true,
            secure: Rails.env.production?,
            same_site: :lax,
            domain: cookie_domain,
            expires: 7.days.from_now
          }
        end
        
        # Save token expiry
        if tokens[:expires_in] && tokens[:expires_in] > 0
          expires_at = Time.current + tokens[:expires_in].seconds
          cookies_obj['token_expires_at'] = {
            value: expires_at.to_i.to_s,
            httponly: true,
            secure: Rails.env.production?,
            same_site: :lax,
            domain: cookie_domain,
            expires: expires_at
          }
        end
      end

      private

      def determine_keycloak_cookie_domain(request_host = nil)
        host = request_host || ENV['DECIDIM_HOST'] || 'localhost'

        # In production/development with subdomains, use the second-level domain
        # to allow cookie sharing across subdomains
        if Rails.env.production? || Rails.env.development?
          # Extract domain parts: part-int.ldttoolbox.app -> ['part-int', 'ldttoolbox', 'app']
          domain_parts = host.split('.')

          # For domains like *.ldttoolbox.app, use .ldttoolbox.app
          if domain_parts.length >= 3
            # Return domain with leading dot for cross-subdomain cookies
            ".#{domain_parts[-2]}.#{domain_parts[-1]}"
          else
            # Fallback to current host
            host
          end
        else
          # In other environments, use the current host or nil for localhost
          host.include?('localhost') ? nil : host
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

              if auth_method == :post
                form[:client_secret] = client_secret
              else
                request.basic_auth(client_id, client_secret)
              end

              request.set_form_data(form)

              response = http.request(request)

              if response.code == '200'
                result = JSON.parse(response.body)
                return result['access_token'] if result['access_token']
              end
            rescue StandardError => e
            end
          end
        end

        nil
      end

      private

      def reconstruct_token_from_cookies(cookies_hash, token_key)
        return nil unless cookies_hash
        cookies_hash[token_key]
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
