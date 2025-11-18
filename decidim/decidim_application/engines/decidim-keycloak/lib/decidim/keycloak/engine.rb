# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro
# frozen_string_literal: true



require "omniauth/strategies/keycloak-openid"
require "deface"
require_relative "devise_extension"

module Decidim
  module Keycloak
    # This is the engine that runs on the public interface of keycloak.
    class Engine < ::Rails::Engine
      isolate_namespace Decidim::Keycloak

      initializer "decidim.keycloak.middleware" do |app|
        # Ensure OmniAuth uses Devise paths (/users/auth/...)
        OmniAuth.config.path_prefix = "/users/auth"
        omniauth_config = Rails.application.secrets[:omniauth]
        next if omniauth_config[:keycloakopenid].blank?

        app.config.middleware.use OmniAuth::Builder do
          provider :keycloak_openid, 
            client_id: "dummy",
            client_secret: "dummy",
            client_options: {
              site: "https://dummy.com",
              base_url: ""
            },
            setup: lambda { |env|
            request = Rack::Request.new(env)
            organization = Decidim::Organization.find_by(host: request.host)
            config = organization.enabled_omniauth_providers[:keycloakopenid]
            
            base_url = config[:site].chomp('/')
            realm = config[:realm]
            
            # Extract current locale from session or request
            # This ensures Keycloak login page shows in the correct language
            session = env['rack.session'] || {}
            current_locale = session['decidim-locale'] || request.params['locale'] || organization.default_locale || 'en'
            
            # Force override all strategy options
            strategy = env["omniauth.strategy"]
            strategy.options[:client_id] = config[:client_id]
            strategy.options[:client_secret] = config[:client_secret]
            strategy.options[:realm] = realm
            strategy.options[:client_options] = {
              site: base_url,
              realm: realm,
              base_url: "",  # This tells the gem NOT to use /auth prefix for modern Keycloak
              authorize_url: "/realms/#{realm}/protocol/openid-connect/auth",
              token_url: "/realms/#{realm}/protocol/openid-connect/token",
              userinfo_endpoint: "/realms/#{realm}/protocol/openid-connect/userinfo",
              jwks_uri: "/realms/#{realm}/protocol/openid-connect/certs"
            }

            # Ensure we request the OpenID Connect scopes so access_token can be used with userinfo
            strategy.options[:scope] = 'openid profile email'
            
            # Store locale in session to preserve it through OAuth redirect
            # OmniAuth preserves session data even during external redirects
            session['omniauth.locale'] = current_locale.to_s
            
            # Pass current locale to Keycloak for localized login/error messages
            # This fixes the "invalid credentials" issue when using non-English locales
            strategy.options[:authorize_params] = {
              ui_locales: current_locale.to_s,
              kc_locale: current_locale.to_s  # Fallback for older Keycloak versions
            }
            
            # Force callback_url without locale parameter to match Keycloak configuration
            # Decidim adds locale to URLs automatically, but Keycloak requires exact redirect_uri match
            # Must use callback_url (full URL) not callback_path to override Decidim's locale injection
            protocol = request.ssl? ? 'https' : 'http'
            callback_url = "#{protocol}://#{request.host_with_port}/users/auth/keycloakopenid/callback"
            strategy.options[:callback_url] = callback_url
            
            # Override the callback_url method to ensure it returns the URL without query parameters
            # This is critical because OmniAuth uses callback_url() during token exchange
            def strategy.callback_url
              options[:callback_url]
            end
            
            Rails.logger.info "🌍 Keycloak login with locale: #{current_locale}, callback: #{callback_url}"
            
            # Additional JWT options to handle verification issues
            strategy.options[:jwt_options] = {
              # Skip some JWT verification in development due to potential SSL issues
              verify_iss: Rails.env.production?,
              verify_aud: Rails.env.production?,
              verify_sub: true,
              verify_expiration: true,
              verify_not_before: true,
              verify_iat: true,
              verify_jti: false,
              leeway: 30 # 30 seconds leeway for clock skew
            }
          }
          
          # Add error handling callback
          on_failure do |env|
            Rails.logger.error "OmniAuth Keycloak failure: #{env['omniauth.error']}"
            Rails.logger.error "Error type: #{env['omniauth.error.type']}"
            Rails.logger.error "Error strategy: #{env['omniauth.error.strategy']}"
          end
        end
      end

      config.to_prepare do
        class OmniAuth::Strategies::KeycloakOpenId
          uid { raw_info["preferred_username"] }

          info do
            {
              nickname: raw_info["preferred_username"],
              name: raw_info["name"],
              email: raw_info["email"]
            }
          end

          # Override extra to include additional user information from Keycloak
          def extra
            hash = {}
            hash[:raw_info] = raw_info if raw_info
            hash[:id_info] = id_info if respond_to?(:id_info) && id_info
            hash[:id_token] = access_token.params['id_token'] if access_token.params['id_token']
            
            
            # Store the access_token and refresh_token for session saving
            # These will be saved to session/extended_data by DeviseExtension
            hash[:access_token] = access_token.token if access_token.token
            hash[:refresh_token] = access_token.params['refresh_token'] if access_token.params['refresh_token']
            hash[:token_expires_in] = access_token.params['expires_in'] if access_token.params['expires_in']

            # Add Keycloak roles to the extra hash for Decidim to use
            if raw_info && raw_info['resource_access']
              hash[:keycloak_roles] = raw_info['resource_access']
              hash[:keycloak_realm_roles] = raw_info['realm_access']&.dig('roles') || []
            end
            
            # Store admin role information for later use in Decidim callbacks
            if raw_info && raw_info['resource_access']
              # Prefer explicit environment variable OMNIAUTH_KEYCLOAK_CLIENT_ID if present
              client_key = ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID'] || Rails.application.secrets.dig(:omniauth, :keycloakopenid, :client_id) || 'tool3'
              client_key = client_key.to_s

              if raw_info['resource_access'][client_key]
                client_roles = raw_info['resource_access'][client_key]['roles'] || []
                hash[:is_decidim_admin] = client_roles.include?('Admin')
              else
                hash[:is_decidim_admin] = false
              end
            else
              hash[:is_decidim_admin] = false
            end
            
            hash
          end
        end
      end

      # Token caching and admin role sync using Devise extension
      # This extension overrides the create method in OmniauthRegistrationsController
      # to save Keycloak tokens to session after successful authentication
      initializer "decidim_keycloak.integrate_devise_extension" do
        # Include our Devise extension in OmniAuth controller
        # We use to_prepare to ensure the class is loaded before inclusion
        config.to_prepare do
          Decidim::Devise::OmniauthRegistrationsController.prepend Decidim::Keycloak::DeviseExtension
          
        end
      end

      initializer "decidim_keycloak.webpacker.assets_path" do
        Decidim.register_assets_path File.expand_path("app/packs", root)
      end
    end
  end
end