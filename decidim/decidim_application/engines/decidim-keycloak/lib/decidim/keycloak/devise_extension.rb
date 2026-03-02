# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

module Decidim
  module Keycloak
    # Extension for Devise OmniAuth to store Keycloak JWT token in cache
    # This module is prepended in OmniauthRegistrationsController
    module DeviseExtension
      # Override the method that Devise calls after successful OmniAuth callback
      def create
        auth_data = request.env["omniauth.auth"]
        user_locale = determine_user_locale(auth_data)

        apply_locale_to_session(user_locale)

        result = super

        handle_keycloak_post_auth(auth_data, user_locale) if keycloak_auth?(auth_data)

        result
      rescue StandardError => e
        Rails.logger.error "[Keycloak] ERROR in DeviseExtension#create: #{e.class} - #{e.message}"
        raise
      end

      private

      def determine_user_locale(auth_data)
        locale = extract_locale_from_keycloak_token(auth_data)
        locale = session["omniauth.locale"] if locale.blank? && session["omniauth.locale"].present?
        Rails.logger.debug { "[Keycloak] Determined user locale: #{locale.inspect}" }
        locale
      end

      def apply_locale_to_session(user_locale)
        return if user_locale.blank?

        I18n.locale = user_locale
        session["decidim-locale"] = user_locale
        Rails.logger.info "[Keycloak] Set locale from token/session: #{user_locale}"
      end

      def keycloak_auth?(auth_data)
        auth_data&.provider == "keycloakopenid" && current_user
      end

      def handle_keycloak_post_auth(auth_data, user_locale)
        save_keycloak_token_to_cache(current_user, auth_data)
        update_user_locale(user_locale)
        session[:keycloak_authenticated] = true
        # Persist id_token server-side — the cookie expires with the JWT (~5 min)
        # but we need id_token_hint for SLO logout for the entire session lifetime.
        id_token = auth_data&.extra&.dig("id_token") || auth_data&.credentials&.dig("id_token")
        session[:keycloak_id_token] = id_token if id_token.present?
        Rails.logger.info "[Keycloak] User #{current_user.id} authenticated via Keycloak"
      end

      def update_user_locale(user_locale)
        return if user_locale.blank? || current_user.locale == user_locale

        current_user.update!(locale: user_locale)
        Rails.logger.info "[Keycloak] Updated user #{current_user.id} locale to: #{user_locale}"
      end

      def extract_locale_from_keycloak_token(auth_data)
        return nil unless auth_data&.extra&.dig("id_token")

        # CENTRALIZED: Uses Decidim::Keycloak::JwtParser
        id_token = auth_data.extra["id_token"]
        available_locales = Decidim.available_locales

        user_locale = Decidim::Keycloak::JwtParser.extract_locale(id_token, available_locales)

        if user_locale.blank?
          Rails.logger.debug "[Keycloak] No valid locale found in token"
        else
          Rails.logger.debug { "[Keycloak] Extracted locale from token: #{user_locale}" }
        end

        user_locale
      rescue StandardError => e
        Rails.logger.warn "[Keycloak] Failed to extract locale from token: #{e.message}"
        nil
      end

      def save_keycloak_token_to_cache(user, auth_data)
        tokens = extract_tokens_from_auth_data(auth_data)
        save_tokens_if_available(user, tokens)
        sync_admin_role(user, auth_data)
      end

      def extract_tokens_from_auth_data(auth_data)
        {
          access_token: extract_token(auth_data, "access_token", "token"),
          refresh_token: extract_token(auth_data, "refresh_token", "refresh_token"),
          id_token: extract_token(auth_data, "id_token", "id_token"),
          expires_in: extract_expiry(auth_data, "token_expires_in", "expires_in"),
          refresh_token_expires_in: extract_expiry(auth_data, "refresh_token_expires_in", "refresh_token_expires_in")
        }
      end

      def extract_token(auth_data, extra_key, credentials_key)
        auth_data&.extra&.dig(extra_key) || auth_data&.credentials&.dig(credentials_key)
      end

      def extract_expiry(auth_data, *keys)
        value = keys.lazy.filter_map { |key| auth_data&.extra&.dig(key) || auth_data&.credentials&.dig(key) }.first
        value&.to_i
      end

      def save_tokens_if_available(user, tokens)
        return unless tokens[:access_token]

        Decidim::Keycloak::TokenService.new.save_tokens_to_cookies(cookies, tokens, request.host)
        Rails.logger.info "[Keycloak] Tokens saved to cookies for user #{user.id}"
      end

      def sync_admin_role(user, auth_data)
        return unless auth_data&.extra

        if auth_data.extra["is_decidim_admin"]
          user.update!(admin: true) unless user.admin?
        elsif user.admin?
          user.update!(admin: false)
        end
      rescue StandardError
        Rails.logger.error "[Keycloak] Could not save token - access_token nil for user #{user.id}"
      end
    end
  end
end
