# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



require 'net/http'
require 'uri'
require 'json'
require 'jwt'

module Decidim
  module Keycloak
    class TokenService
      def self.ensure_valid_token(user, cookies_hash = nil, cookies_obj = nil, request_host = nil, controller = nil)
        new.ensure_valid_token(user, cookies_hash, cookies_obj, request_host, controller)
      end

      def self.revoke_tokens(access_token, refresh_token = nil)
        new.revoke_tokens(access_token, refresh_token)
      end

      def self.introspect_token(access_token)
        new.introspect_token(access_token)
      end

      def ensure_valid_token(user, cookies_hash = nil, cookies_obj = nil, request_host = nil, controller = nil)
        access_token = reconstruct_token_from_cookies(cookies_hash, 'access_token')
        refresh_token = reconstruct_token_from_cookies(cookies_hash, 'refresh_token')
        
        # If we have access_token, validate it normally
        if access_token
          # Extract expiration from JWT token itself instead of cookie
          expires_at = extract_token_expiration(access_token)
          return access_token unless expires_at
          
          # If token not expired, check introspection to detect cross-app logouts
          if expires_at > Time.current
            Rails.logger.debug "[Keycloak Token Validation] Performing introspection check"
            if introspect_token(access_token)
              return access_token
            else
              Rails.logger.info "[Keycloak Token Validation] Token revoked or invalid, attempting refresh"
              # Token was revoked, try to refresh before giving up
              if refresh_token && cookies_obj
                new_tokens = refresh_access_token(refresh_token)
                if new_tokens
                  # Clear existing cookies from all domains before saving new ones
                  controller.clear_keycloak_cookies if controller.respond_to?(:clear_keycloak_cookies)
                  save_tokens_to_cookies(cookies_obj, new_tokens, request_host)
                  Rails.logger.info "[Keycloak Token Validation] Token refreshed successfully after introspection failure"
                  return new_tokens[:access_token]
                end
              end
              # Refresh failed or no refresh token, clear cookies
              Rails.logger.info "[Keycloak Token Validation] Refresh failed, clearing cookies"
              controller.clear_keycloak_cookies if controller.respond_to?(:clear_keycloak_cookies)
              return nil
            end
          end
        end
        
        # Token is expired or missing, try to refresh if we have refresh_token
        if refresh_token && cookies_obj
          Rails.logger.debug "[Keycloak Token Validation] No valid access_token, attempting refresh with refresh_token"
          new_tokens = refresh_access_token(refresh_token)
          if new_tokens
            # Clear existing cookies from all domains before saving new ones to prevent duplicates
            controller.clear_keycloak_cookies if controller.respond_to?(:clear_keycloak_cookies)
            save_tokens_to_cookies(cookies_obj, new_tokens, request_host)
            return new_tokens[:access_token]
          else
            Rails.logger.info "[Keycloak Token Validation] Refresh token invalid, clearing cookies"
            controller.clear_keycloak_cookies if controller.respond_to?(:clear_keycloak_cookies)
            return nil
          end
        end
        
        Rails.logger.debug "[Keycloak Token Validation] No access_token or refresh_token available"
        nil
      end

      def save_tokens_to_cookies(cookies_obj, tokens, request_host = nil)
        # CENTRALIZED: Uses Decidim::Keycloak::CookieManager
        Decidim::Keycloak::CookieManager.save_tokens(cookies_obj, tokens, request_host)
      end

      def revoke_tokens(access_token, refresh_token = nil)
        revoked = false

        if access_token.present?
          revoked = revoke_token(access_token) || revoked
        end

        if refresh_token.present?
          revoked = revoke_token(refresh_token) || revoked
        end

        revoked
      end

      def introspect_token(access_token)
        return false unless access_token.present?

        keycloak_site = ENV['OMNIAUTH_KEYCLOAK_SITE']
        realm = ENV['OMNIAUTH_KEYCLOAK_REALM'] || 'master'
        client_id = ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID']
        client_secret = ENV['OMNIAUTH_KEYCLOAK_CLIENT_SECRET']

        introspect_endpoint = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/token/introspect"

        begin
          uri = URI(introspect_endpoint)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == 'https'

          request = Net::HTTP::Post.new(uri)
          request['Content-Type'] = 'application/x-www-form-urlencoded'
          request.set_form_data(
            token: access_token,
            client_id: client_id,
            client_secret: client_secret
          )

          response = http.request(request)

          if response.code == '200'
            result = JSON.parse(response.body)
            active = result['active']

            Rails.logger.debug "[Keycloak Token Introspection] Token active: #{active}"
            active == true
          else
            Rails.logger.warn "[Keycloak Token Introspection] Failed: HTTP #{response.code}"
            false
          end
        rescue StandardError => e
          Rails.logger.error "[Keycloak Token Introspection] Error: #{e.message}"
          false
        end
      end

      private

      def clear_existing_keycloak_cookies(cookies_obj, request_host = nil)
        # CENTRALIZED: Uses Decidim::Keycloak::CookieManager
        Decidim::Keycloak::CookieManager.clear_all_cookies(cookies_obj, request_host)
      end

      def determine_keycloak_cookie_domain(request_host = nil)
        # CENTRALIZED: Uses Decidim::Keycloak::CookieManager
        Decidim::Keycloak::CookieManager.calculate_cookie_domain(request_host)
      end

      # Extract domain part similar to request.domain (removes subdomain)
      # This method is kept for backward compatibility but delegates to CookieManager
      def extract_domain_from_host(host)
        return nil unless host.present?
        
        domain_parts = host.split('.')
        return nil unless domain_parts.length >= 2
        
        # For domains like part-int.ldttoolbox.app, return ldttoolbox.app
        "#{domain_parts[-2]}.#{domain_parts[-1]}"
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
            id_token: result['id_token'], # Include id_token from refresh response
            expires_in: result['expires_in'].to_i,
            refresh_token_expires_in: result['refresh_token_expires_in']&.to_i
          }
        rescue StandardError => e
          nil
        end
      end

      private

      def revoke_token(token)
        return false unless token.present?

        keycloak_site = ENV['OMNIAUTH_KEYCLOAK_SITE']
        realm = ENV['OMNIAUTH_KEYCLOAK_REALM'] || 'master'
        client_id = ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID']
        client_secret = ENV['OMNIAUTH_KEYCLOAK_CLIENT_SECRET']

        revoke_endpoint = "#{keycloak_site}/realms/#{realm}/protocol/openid-connect/revoke"

        begin
          uri = URI(revoke_endpoint)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == 'https'

          request = Net::HTTP::Post.new(uri)
          request['Content-Type'] = 'application/x-www-form-urlencoded'
          request.set_form_data(
            token: token,
            client_id: client_id,
            client_secret: client_secret
          )

          response = http.request(request)

          if response.code == '200'
            Rails.logger.info "✓ Successfully revoked token"
            true
          else
            Rails.logger.warn "✗ Failed to revoke token: HTTP #{response.code} - #{response.body}"
            false
          end
        rescue StandardError => e
          Rails.logger.error "Error revoking token: #{e.message}"
          false
        end
      end

      private

      # Extract expiration time from JWT token
      # @param token [String] JWT token
      # @return [Time, nil] Expiration time or nil if extraction fails
      def extract_token_expiration(token)
        return nil unless token.present?

        begin
          # Decode JWT without verification (we just need the exp claim)
          decoded_token = JWT.decode(token, nil, false)
          payload = decoded_token.first

          # Extract exp claim (expiration time as Unix timestamp)
          exp_timestamp = payload['exp']
          return nil unless exp_timestamp

          Time.at(exp_timestamp)
        rescue JWT::DecodeError => e
          Rails.logger.warn "[Keycloak TokenService] Failed to decode token for expiration extraction: #{e.message}"
          nil
        rescue StandardError => e
          Rails.logger.warn "[Keycloak TokenService] Error extracting token expiration: #{e.message}"
          nil
        end
      end
    end
  end
end