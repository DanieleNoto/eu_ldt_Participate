# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



module Decidim
  module Keycloak
    class LocaleSynchronizer
      def initialize(id_token, current_locale)
        @id_token = id_token
        @current_locale = current_locale
      end

      def self.sync_from_token(id_token, current_locale)
        new(id_token, current_locale).sync
      end

      def sync
        return nil unless @id_token.present?

        token_locale = extract_locale_from_token
        return nil unless token_locale.present?

        if token_locale != @current_locale
          Rails.logger.info "[Keycloak Locale Sync] Locale changed from #{@current_locale} to #{token_locale}"
          token_locale
        else
          nil # No change needed
        end
      end

      private

      def extract_locale_from_token
        return nil unless @id_token.present?

        # CENTRALIZED: Uses Decidim::Keycloak::JwtParser
        available_locales = Decidim.available_locales
        user_locale = Decidim::Keycloak::JwtParser.extract_locale(@id_token, available_locales)
        
        if user_locale.blank?
          Rails.logger.debug "[Keycloak Locale Sync] No valid locale found in token"
        end
        
        user_locale
      rescue => e
        Rails.logger.warn "[Keycloak Locale Sync] Error extracting locale from JWT: #{e.message}"
        nil
      end
    end
  end
end