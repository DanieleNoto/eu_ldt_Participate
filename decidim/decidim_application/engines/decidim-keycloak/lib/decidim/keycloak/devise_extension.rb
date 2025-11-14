# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



module Decidim
  module Keycloak
    # Extension for Devise OmniAuth to store Keycloak JWT token in cache
    # This module is prepended in OmniauthRegistrationsController
    module DeviseExtension
      # Override the method that Devise calls after successful OmniAuth callback
      def create
          begin
            # Get auth data before calling parent
            auth_data = request.env["omniauth.auth"]
            
            # Try to extract user's locale from Keycloak token first
            user_locale = extract_locale_from_keycloak_token(auth_data)
            Rails.logger.debug "[Keycloak] Locale extraction result: #{user_locale.inspect}"
            
            # Fallback to session locale if token doesn't have locale info
            if user_locale.blank? && session['omniauth.locale'].present?
              user_locale = session['omniauth.locale']
              Rails.logger.debug "[Keycloak] Using fallback session locale: #{user_locale}"
            end
            
            # Set locale if we have one
            if user_locale.present?
              I18n.locale = user_locale
              session['decidim-locale'] = user_locale
              Rails.logger.info "[Keycloak] Set locale from token/session: #{user_locale}"
            end
            
            # Call parent create (handles user creation/sign-in)
            result = super
            
            # After user is signed in, save token to cache
            if auth_data&.provider == "keycloakopenid" && current_user
              save_keycloak_token_to_cache(current_user, auth_data)
              
              # Mark session as Keycloak authenticated for Single Logout
              session[:keycloak_authenticated] = true
              
              # Note: id_token is now stored in cookies, not session, to avoid session cookie size limits
              Rails.logger.info "[Keycloak] User #{current_user.id} authenticated via Keycloak"
            end
            
            result
          rescue => e
            Rails.logger.error "[Keycloak] ERROR in DeviseExtension#create: #{e.class} - #{e.message}"
            raise
          end
        end

        private

        def extract_locale_from_keycloak_token(auth_data)
          return nil unless auth_data&.extra&.dig('id_token')
          
          # CENTRALIZED: Uses Decidim::Keycloak::JwtParser
          id_token = auth_data.extra['id_token']
          available_locales = Decidim.available_locales
          
          user_locale = Decidim::Keycloak::JwtParser.extract_locale(id_token, available_locales)
          
          if user_locale.blank?
            Rails.logger.debug "[Keycloak] No valid locale found in token"
          else
            Rails.logger.debug "[Keycloak] Extracted locale from token: #{user_locale}"
          end
          
          user_locale
        rescue => e
          Rails.logger.warn "[Keycloak] Failed to extract locale from token: #{e.message}"
          nil
        end

        def save_keycloak_token_to_cache(user, auth_data)
          # Try multiple ways to get the token
          access_token = auth_data&.extra&.dig('access_token') || 
                        auth_data&.credentials&.dig('token')
          refresh_token = auth_data&.extra&.dig('refresh_token') || 
                         auth_data&.credentials&.dig('refresh_token')
          id_token = auth_data&.extra&.dig('id_token') || 
                    auth_data&.credentials&.dig('id_token')
          token_expires_in = auth_data&.extra&.dig('token_expires_in') || 
                            auth_data&.extra&.dig('expires_in') ||
                            auth_data&.credentials&.dig('expires_in')
          token_expires_in = token_expires_in.to_i if token_expires_in
          
          # Try to get refresh_token_expires_in from auth data
          refresh_token_expires_in = auth_data&.extra&.dig('refresh_token_expires_in') ||
                                    auth_data&.credentials&.dig('refresh_token_expires_in')
          
          # Note: refresh_token_expires_in is typically not provided in initial OAuth response
          # It will be obtained during the first refresh operation
          
          refresh_token_expires_in = refresh_token_expires_in.to_i if refresh_token_expires_in

          if access_token
            # Use TokenService to save tokens to cookies
            tokens = {
              access_token: access_token,
              refresh_token: refresh_token,
              id_token: id_token,
              expires_in: token_expires_in,
              refresh_token_expires_in: refresh_token_expires_in
            }
            
            Decidim::Keycloak::TokenService.new.save_tokens_to_cookies(cookies, tokens, request.host)
            Rails.logger.info "[Keycloak] Tokens saved to cookies for user #{user.id}"

            # Sync admin role
            if auth_data.extra && auth_data.extra['is_decidim_admin']
              user.update!(admin: true) unless user.admin?
            elsif user.admin?
              user.update!(admin: false)
            end
          else
            Rails.logger.error "[Keycloak] Could not save token - access_token nil for user #{user.id}"
        end
      end
    end
  end
end