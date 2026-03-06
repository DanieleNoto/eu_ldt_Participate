# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

module Decidim
  module Keycloak
    # Centralized cookie management for Keycloak authentication
    # This module handles all cookie operations to prevent duplication and inconsistencies
    class CookieManager
      # Calculate the correct cookie domain for cross-subdomain sharing
      # @param request_host [String] The request host (e.g., "part-int.ldttoolbox.app")
      # @return [String, nil] The cookie domain (e.g., ".ldttoolbox.app") or nil
      def self.calculate_cookie_domain(request_host)
        return nil if request_host.blank?

        host = request_host.to_s

        # In production/development with subdomains, use the second-level domain
        # to allow cookie sharing across subdomains
        if Rails.env.production? || Rails.env.development?
          domain_parts = host.split(".")

          # For domains like *.ldttoolbox.app, use .ldttoolbox.app
          if domain_parts.length >= 3
            # Return domain with leading dot for cross-subdomain cookies
            return ".#{domain_parts[-2]}.#{domain_parts[-1]}"
          end
        end

        # Fallback to current host or nil for localhost
        host == "localhost" ? nil : host
      end

      # Calculate all possible cookie domains to clear cookies from
      # @param request_host [String] The request host
      # @return [Array<String>] Array of domains to clear cookies from
      def self.calculate_all_cookie_domains(request_host)
        return [] if request_host.blank?

        host = request_host.to_s
        domain_parts = host.split(".")

        domains = [host] # Exact host (e.g., "part-int.ldttoolbox.app")

        # Add cross-subdomain domain
        domains << ".#{domain_parts[-2]}.#{domain_parts[-1]}" if (Rails.env.production? || Rails.env.development?) && domain_parts.length >= 3

        # Add second-level domain (like request.domain)
        domains << "#{domain_parts[-2]}.#{domain_parts[-1]}" if domain_parts.length >= 2

        domains.uniq
      end

      # Clear all Keycloak cookies from all possible domains
      # @param cookies_obj [ActionDispatch::Cookies::CookieJar] The cookies object
      # @param request_host [String] The request host
      # @param session_obj [ActionDispatch::Request::Session, nil] Optional session object to clean
      def self.clear_all_cookies(cookies_obj, request_host, session_obj = nil)
        cookie_names = %w(access_token refresh_token id_token)
        domains = calculate_all_cookie_domains(request_host)

        Rails.logger.info "[Keycloak CookieManager] Clearing #{cookie_names.inspect} from #{domains.inspect}"

        cookie_names.each do |name|
          # Delete from each explicit domain (browser matches by name+domain+path)
          domains.each do |domain|
            cookies_obj.delete(name, domain: domain, path: "/")
          rescue StandardError => e
            Rails.logger.debug { "[Keycloak CookieManager] Could not delete #{name} from #{domain}: #{e.message}" }
          end

          # Also delete without domain (covers cookies set without explicit domain attribute)
          cookies_obj.delete(name, path: "/")
        rescue StandardError => e
          Rails.logger.debug { "[Keycloak CookieManager] Could not delete #{name}: #{e.message}" }
        end

        clear_session_data(session_obj)
      end

      def self.clear_session_data(session_obj)
        return unless session_obj

        session_obj.delete(:keycloak_authenticated)
        session_obj.delete(:keycloak_id_token)
      end

      # Save tokens to cookies using the JWT exp claim as source of truth for expiry.
      # @param cookies_obj [ActionDispatch::Cookies::CookieJar] The cookies object
      # @param tokens [Hash] Hash containing :access_token, :refresh_token, :id_token
      # @param request_host [String] The request host
      def self.save_tokens(cookies_obj, tokens, request_host)
        # First clear existing cookies to prevent duplication
        clear_all_cookies(cookies_obj, request_host)

        cookie_domain = calculate_cookie_domain(request_host)
        expires_at = extract_jwt_expiration(tokens[:access_token])
        refresh_expires_at = extract_jwt_expiration(tokens[:refresh_token])

        Rails.logger.debug { "[Keycloak CookieManager] Saving tokens with domain: #{cookie_domain.inspect}, expires_at: #{expires_at.inspect}" }

        if tokens[:access_token]
          cookies_obj["access_token"] = {
            value: tokens[:access_token],
            expires: expires_at,
            secure: Rails.env.production?,
            httponly: true,
            same_site: :lax,
            domain: cookie_domain
          }
        end

        if tokens[:refresh_token]
          cookies_obj["refresh_token"] = {
            value: tokens[:refresh_token],
            expires: refresh_expires_at,
            secure: Rails.env.production?,
            httponly: true,
            same_site: :lax,
            domain: cookie_domain
          }
        end

        if tokens[:id_token]
          cookies_obj["id_token"] = {
            value: tokens[:id_token],
            expires: refresh_expires_at,
            secure: Rails.env.production?,
            httponly: true,
            same_site: :lax,
            domain: cookie_domain
          }
        end

        Rails.logger.info "[Keycloak CookieManager] Saved tokens to cookies with domain: #{cookie_domain}"
      end

      # Extract the exp claim from a JWT token (no signature verification needed).
      # Returns nil if the token is blank, opaque, or cannot be decoded.
      # @param token [String] JWT token string
      # @return [Time, nil]
      def self.extract_jwt_expiration(token)
        return nil if token.blank?

        payload = JWT.decode(token, nil, false).first
        exp = payload["exp"]
        exp ? Time.zone.at(exp) : nil
      rescue StandardError
        nil
      end
    end
  end
end
