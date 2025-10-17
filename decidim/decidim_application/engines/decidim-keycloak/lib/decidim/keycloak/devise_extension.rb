# frozen_string_literal: true

module Decidim
  module Keycloak
    # Extension for Devise OmniAuth to store Keycloak JWT token in cache
    # This module is included in OmniauthRegistrationsController
    module DeviseExtension
      def self.included(base)
        base.prepend InstanceMethods
      end

      module InstanceMethods
        # Override the method that Devise calls after successful OmniAuth callback
        def create
          # Get auth data before calling parent
          auth_data = request.env["omniauth.auth"]
          
          # Call parent create (handles user creation/sign-in)
          result = super
          
          # After user is signed in, save token to cache
          if auth_data&.provider == "keycloakopenid" && current_user
            save_keycloak_token_to_cache(current_user, auth_data)
          end
          
          result
        end

        private

        def save_keycloak_token_to_cache(user, auth_data)
          access_token = auth_data&.extra&.dig('access_token')
          refresh_token = auth_data&.extra&.dig('refresh_token')
          token_expires_in = auth_data&.extra&.dig('token_expires_in').to_i
          user_uid = auth_data&.uid

          if access_token
            # Save to user's extended_data (persistent in database)
            user.extended_data ||= {}
            user.extended_data['keycloak_access_token'] = access_token
            user.extended_data['keycloak_refresh_token'] = refresh_token if refresh_token
            
            if token_expires_in > 0
              expires_at = Time.current + token_expires_in.seconds
              user.extended_data['keycloak_token_expires_at'] = expires_at.to_i
              user.save!
            else
              user.extended_data.delete('keycloak_token_expires_at')
              user.save!
            end

            # Sync admin role
            if auth_data.extra && auth_data.extra['is_decidim_admin']
              user.update!(admin: true) unless user.admin?
            elsif user.admin?
              user.update!(admin: false)
            end
          else
            Rails.logger.warn "✗ Keycloak: Could not save token - token present: #{access_token.present?}"
          end
        end
      end
    end
  end
end
