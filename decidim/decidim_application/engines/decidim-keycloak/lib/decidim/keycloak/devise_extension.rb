# frozen_string_literal: true

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
            
            # Restore locale from session if it was stored during OAuth initiation
            # This ensures the user stays in their selected language after Keycloak redirect
            if session['omniauth.locale'].present?
              stored_locale = session['omniauth.locale']
              I18n.locale = stored_locale
              session['decidim-locale'] = stored_locale
              Rails.logger.info "[Keycloak] Restored locale: #{stored_locale}"
            end
            
            # Call parent create (handles user creation/sign-in)
            result = super
            
            # After user is signed in, save token to cache
            if auth_data&.provider == "keycloakopenid" && current_user
              save_keycloak_token_to_cache(current_user, auth_data)
              
              # Mark session as Keycloak authenticated for Single Logout
              session[:keycloak_authenticated] = true
              
              # Save id_token for logout (needed for automatic logout without confirmation page)
              id_token = auth_data&.extra&.dig('id_token') || auth_data&.credentials&.dig('id_token')
              
              if id_token.present?
                session[:keycloak_id_token] = id_token
                Rails.logger.info "[Keycloak] Saved id_token to session for user #{current_user.id}"
              else
                Rails.logger.warn "[Keycloak] No id_token found in auth_data for user #{current_user.id}"
              end
            end
            
            result
          rescue => e
            Rails.logger.error "[Keycloak] ERROR in DeviseExtension#create: #{e.class} - #{e.message}"
            raise
          end
        end

        private

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

          if access_token
            # Use TokenService to save tokens to cookies
            tokens = {
              access_token: access_token,
              refresh_token: refresh_token,
              id_token: id_token,
              expires_in: token_expires_in
            }
            
            Decidim::Keycloak::TokenService.new.save_tokens_to_cookies(cookies, tokens)
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
