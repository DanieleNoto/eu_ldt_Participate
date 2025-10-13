# frozen_string_literal: true

require "omniauth/strategies/keycloak-openid"

module Decidim
  module Keycloak
    # This is the engine that runs on the public interface of keycloak.
    class Engine < ::Rails::Engine
      isolate_namespace Decidim::Keycloak

      initializer "decidim.keycloak.middleware" do |app|
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

      # Add callback for admin role synchronization using Decidim's OmniAuth callbacks
      initializer "decidim_keycloak.sync_admin_roles" do
        # Hook into Decidim's OmniAuth callbacks that fire during user registration/authentication
        ActiveSupport.on_load(:after_initialize) do
          # Override the Decidim OmniAuth registration controller to sync admin roles
          Decidim::Devise::OmniauthRegistrationsController.class_eval do
            # Override create method to handle admin role sync after successful auth
            alias_method :original_create, :create
            
            def create
              # Store OmniAuth auth data before calling original create
              auth_data = request.env["omniauth.auth"]
              
              # Call original create method
              result = original_create
              
              # After successful authentication, sync admin roles if this was Keycloak auth
              if auth_data&.provider == "keycloakopenid" && current_user
                sync_keycloak_admin_role(current_user, auth_data)
              end
              
              result
            end
            
            private
            
            def sync_keycloak_admin_role(user, auth_data)
              begin
                if auth_data.extra && auth_data.extra['is_decidim_admin']
                  user.update!(admin: true)
                else
                  # Optionally remove admin role if user no longer has it in Keycloak
                  if user.admin?
                    user.update!(admin: false)
                  end
                end
              rescue => e
                Rails.logger.error "Error syncing Keycloak admin role: #{e.message}"
              end
            end
          end
        end
      end

      initializer "decidim_keycloak.webpacker.assets_path" do
        Decidim.register_assets_path File.expand_path("app/packs", root)
      end
    end
  end
end
