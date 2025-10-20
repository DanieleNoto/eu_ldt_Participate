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
            
            puts "[DEVISE] === DEVISE_EXTENSION CREATE CALLED ==="
            puts "[DEVISE] auth_data present: #{auth_data.present?}, provider: #{auth_data&.provider}"
            puts "[DEVISE] auth_data.extra keys: #{auth_data&.extra&.keys.inspect}" if auth_data
            puts "[DEVISE] auth_data.credentials keys: #{auth_data&.credentials&.keys.inspect}" if auth_data
            
            # Call parent create (handles user creation/sign-in)
            result = super
            
            puts "[DEVISE] After super, current_user: #{current_user.present?}"
            
            # After user is signed in, save token to cache
            if auth_data&.provider == "keycloakopenid" && current_user
              puts "[DEVISE] CONDITIONS MET - Calling save_keycloak_token_to_cache"
              save_keycloak_token_to_cache(current_user, auth_data)
            else
              puts "[DEVISE] CONDITIONS NOT MET - provider=#{auth_data&.provider.inspect}, user=#{current_user.present?}"
            end
            
            result
          rescue => e
            puts "[DEVISE] ERROR in DeviseExtension#create: #{e.class} - #{e.message}"
            puts "[DEVISE] #{e.backtrace.join("\n")}"
            raise
          end
        end

        private

        def save_keycloak_token_to_cache(user, auth_data)
          puts "[SAVE_TOKEN] save_keycloak_token_to_cache called for user id=#{user.id}"
          puts "[SAVE_TOKEN] auth_data.class: #{auth_data.class}, auth_data.provider: #{auth_data&.provider}"
          puts "[SAVE_TOKEN] auth_data.credentials keys: #{auth_data&.credentials&.keys.inspect}"
          puts "[SAVE_TOKEN] auth_data.extra keys: #{auth_data&.extra&.keys&.inspect}"
          
          # Try multiple ways to get the token
          access_token = auth_data&.extra&.dig('access_token') || 
                        auth_data&.credentials&.dig('token') ||
                        auth_data&.credentials&.fetch('token', nil)
          refresh_token = auth_data&.extra&.dig('refresh_token') || 
                         auth_data&.credentials&.dig('refresh_token') ||
                         auth_data&.credentials&.fetch('refresh_token', nil)
          token_expires_in = auth_data&.extra&.dig('token_expires_in') || 
                            auth_data&.extra&.dig('expires_in') ||
                            auth_data&.credentials&.dig('expires_in') ||
                            auth_data&.credentials&.fetch('expires_in', nil)
          token_expires_in = token_expires_in.to_i if token_expires_in
          user_uid = auth_data&.uid
          
          puts "[SAVE_TOKEN] access_token present: #{access_token.present?}"
          puts "[SAVE_TOKEN] refresh_token present: #{refresh_token.present?}"
          puts "[SAVE_TOKEN] token_expires_in: #{token_expires_in}"

          if access_token
            # Save tokens to HTTP cookies in chunks (to avoid CookieOverflow)
            # Divide tokens into ~2KB chunks and save each as a separate HTTP cookie
            chunk_size = 2048
            
            # Save access token in chunks
            access_token_chunks = access_token.scan(/.{1,#{chunk_size}}/m)
            access_token_chunks.each_with_index do |chunk, index|
              cookies["keycloak_access_token_#{index}"] = {
                value: chunk,
                httponly: true,
                secure: Rails.env.production?,
                same_site: :lax,
                expires: 1.day.from_now
              }
            end
            cookies['keycloak_access_token_count'] = {
              value: access_token_chunks.length.to_s,
              httponly: true,
              expires: 1.day.from_now
            }
            puts "[SAVE_TOKEN] Split access_token into #{access_token_chunks.length} cookies"
            
            # Save refresh token in chunks if present
            if refresh_token
              refresh_token_chunks = refresh_token.scan(/.{1,#{chunk_size}}/m)
              refresh_token_chunks.each_with_index do |chunk, index|
                cookies["keycloak_refresh_token_#{index}"] = {
                  value: chunk,
                  httponly: true,
                  secure: Rails.env.production?,
                  same_site: :lax,
                  expires: 30.days.from_now
                }
              end
              cookies['keycloak_refresh_token_count'] = {
                value: refresh_token_chunks.length.to_s,
                httponly: true,
                expires: 30.days.from_now
              }
              puts "[SAVE_TOKEN] Split refresh_token into #{refresh_token_chunks.length} cookies"
            end
            
            # Save token expiry
            if token_expires_in && token_expires_in > 0
              expires_at = Time.current + token_expires_in.seconds
              cookies['keycloak_token_expires_at'] = {
                value: expires_at.to_i.to_s,
                httponly: true,
                expires: expires_at
              }
              puts "[SAVE_TOKEN] Saved token expiry to cookie: #{expires_at.to_i}"
            end
            
            puts "[SAVE_TOKEN] ✓ Keycloak: Tokens saved to HTTP cookies in chunks (#{access_token.length} bytes access_token)"

            # Sync admin role
            if auth_data.extra && auth_data.extra['is_decidim_admin']
              puts "[SAVE_TOKEN] User is admin in Keycloak - updating admin flag"
              user.update!(admin: true) unless user.admin?
            elsif user.admin?
              puts "[SAVE_TOKEN] User is NOT admin in Keycloak - removing admin flag"
              user.update!(admin: false)
            end
          else
            puts "[SAVE_TOKEN] ✗ Keycloak: Could not save token - access_token nil"
          end
        end
    end
  end
end
