# frozen_string_literal: true

module Decidim
  module Keycloak
    # Centralized configuration for Keycloak authentication
    # Eliminates duplication across concerns and service objects
    module Configuration
      class << self
        def config
          @config ||= {
            site: ENV['OMNIAUTH_KEYCLOAK_SITE'],
            realm: ENV['OMNIAUTH_KEYCLOAK_REALM'] || 'master',
            client_id: ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID'],
            client_secret: ENV['OMNIAUTH_KEYCLOAK_CLIENT_SECRET']
          }
        end

        def site
          config[:site]
        end

        def realm
          config[:realm]
        end

        def client_id
          config[:client_id]
        end

        def client_secret
          config[:client_secret]
        end

        def valid?
          site.present? && client_id.present? && client_secret.present?
        end

        # Clear cached config (useful for testing)
        def reset!
          @config = nil
        end
      end
    end
  end
end