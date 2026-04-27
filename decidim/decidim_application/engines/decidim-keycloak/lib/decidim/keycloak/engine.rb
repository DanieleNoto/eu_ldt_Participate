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

      # Configure Zeitwerk to ignore decorators directory completely
      # Decorators use module_eval and don't define new constants
      config.before_initialize do
        Rails.autoloaders.main.ignore("#{root}/app/decorators")
      end

      # Load decorators when the app is prepared
      config.to_prepare do
        Dir.glob("#{Decidim::Keycloak::Engine.root}/app/decorators/**/*_decorator.rb").each do |decorator|
          load decorator
        end
      end

      initializer "decidim.keycloak.register_provider", before: "decidim.keycloak.middleware" do
        Decidim.omniauth_providers[:keycloakopenid] = {
          enabled: ENV["OMNIAUTH_KEYCLOAK_CLIENT_ID"].present?,
          client_id: ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_ID", nil),
          client_secret: ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_SECRET", nil),
          site: ENV.fetch("OMNIAUTH_KEYCLOAK_SITE", nil),
          realm: ENV.fetch("OMNIAUTH_KEYCLOAK_REALM", "master"),
          icon_path: "media/images/keycloak_logo.svg"
        }
      end

      initializer "decidim.keycloak.middleware" do |app|
        next unless Decidim.omniauth_providers[:keycloakopenid]&.fetch(:enabled, false)

        app.config.middleware.use OmniAuth::Builder do
          provider :keycloak_openid, setup: lambda { |env|
            request = Rack::Request.new(env)
            callback_uri = Addressable::URI.parse(env["omniauth.strategy"].callback_url).omit(:query)
            organization = Decidim::Organization.find_by(host: request.host)
            config = organization.enabled_omniauth_providers[:keycloakopenid]

            session = env["rack.session"] || {}
            current_locale = session["decidim-locale"] || request.params["locale"] || organization.default_locale || "en"
            session["omniauth.locale"] = current_locale.to_s

            base_url = config[:site].to_s.chomp("/")
            realm = config[:realm].to_s

            env["omniauth.strategy"].options[:client_id] = config[:client_id]
            env["omniauth.strategy"].options[:client_secret] = config[:client_secret]
            env["omniauth.strategy"].options[:client_options] = {
              site: base_url,
              realm: realm,
              base_url: "",
              authorize_url: "/realms/#{realm}/protocol/openid-connect/auth",
              token_url: "/realms/#{realm}/protocol/openid-connect/token",
              userinfo_endpoint: "/realms/#{realm}/protocol/openid-connect/userinfo",
              jwks_uri: "/realms/#{realm}/protocol/openid-connect/certs",
              redirect_uri: callback_uri.to_s
            }
            env["omniauth.strategy"].options[:authorize_params] = {
              ui_locales: current_locale.to_s,
              kc_locale: current_locale.to_s
            }
            # Ensure we request the OpenID Connect scopes so id_token is returned
            env["omniauth.strategy"].options[:scope] = "openid profile email"
          }
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

          def extra
            hash = build_basic_extra_hash
            add_keycloak_roles(hash)
            add_admin_role_info(hash)
            hash
          end

          private

          def build_basic_extra_hash
            hash = {}
            hash[:raw_info] = raw_info if raw_info
            hash[:id_info] = id_info if respond_to?(:id_info) && id_info
            hash[:id_token] = access_token.params["id_token"] if access_token.params["id_token"]
            hash[:access_token] = access_token.token if access_token.token
            hash[:refresh_token] = access_token.params["refresh_token"] if access_token.params["refresh_token"]
            hash[:token_expires_in] = access_token.params["expires_in"] if access_token.params["expires_in"]
            hash
          end

          def add_keycloak_roles(hash)
            return unless raw_info && raw_info["resource_access"]

            hash[:keycloak_roles] = raw_info["resource_access"]
            hash[:keycloak_realm_roles] = raw_info["realm_access"]&.dig("roles") || []
          end

          def add_admin_role_info(hash)
            return unless raw_info && raw_info["resource_access"]

            client_key = ENV["OMNIAUTH_KEYCLOAK_CLIENT_ID"] || "tool3"
            client_key = client_key.to_s

            if raw_info["resource_access"][client_key]
              client_roles = raw_info["resource_access"][client_key]["roles"] || []
              hash[:is_decidim_admin] = client_roles.include?("Admin")
            else
              hash[:is_decidim_admin] = false
            end
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

      initializer "decidim_keycloak.shakapacker.assets_path" do
        Decidim.register_assets_path File.expand_path("app/packs", root)
      end

      # Add custom routes for external login handling
      initializer "decidim_keycloak.mount_routes", after: :add_routing_paths do |app|
        app.routes.prepend do
          scope module: "decidim/keycloak" do
            get "/users/auth/keycloakopenid/external",
                to: "external_login#initiate",
                as: :keycloak_external_login
          end
        end
      end
    end
  end
end
