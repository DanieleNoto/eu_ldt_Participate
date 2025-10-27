# frozen_string_literal: true

module Decidim
  module Keycloak
    # Middleware for automatic login when valid Keycloak tokens are present in cookies
    class AutoLoginMiddleware
      def initialize(app)
        @app = app
      end

      def call(env)
        request = Rack::Request.new(env)

        # Skip auto-login for certain paths
        return @app.call(env) if skip_auto_login?(request)

        # Check if user is already authenticated
        return @app.call(env) if user_authenticated?(env)

        # Check for valid Keycloak tokens in cookies
        if valid_tokens_present?(request)
          return handle_auto_login(env, request)
        end

        @app.call(env)
      end

      private

      def skip_auto_login?(request)
        # Skip for API paths, assets, admin paths, and auth callbacks
        path = request.path
        return true if path.start_with?('/api/')
        return true if path.start_with?('/assets/')
        return true if path.start_with?('/admin/')
        return true if path.start_with?('/users/auth/')
        return true if path.start_with?('/cable')
        return true if path.match?(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
        false
      end

      def user_authenticated?(env)
        # Check if warden user is set
        env['warden']&.user&.present?
      end

      def valid_tokens_present?(request)
        cookies = request.cookies

        # Check for access token cookie (should be present if user was logged in)
        access_token = reconstruct_token_from_cookies(cookies, 'access_token')
        return false unless access_token

        # Check if token is not expired
        expires_at = cookies['token_expires_at']&.to_i
        return false if expires_at && Time.at(expires_at) <= Time.current

        true
      end

      def handle_auto_login(env, request)
        begin
          cookies = request.cookies
          access_token = reconstruct_token_from_cookies(cookies, 'access_token')

          # Validate token by decoding it
          user_info = validate_and_extract_user(access_token)
          return @app.call(env) unless user_info

          # Find user by identity
          user = find_user_by_identity(user_info)
          return @app.call(env) unless user

          # Set up warden authentication
          env['warden'].set_user(user, scope: :user)

          # Log successful auto-login
          Rails.logger.info "[Keycloak] Auto-login successful for user #{user.id} (#{user.email})"

          @app.call(env)
        rescue => e
          Rails.logger.error "[Keycloak] Auto-login failed: #{e.class} - #{e.message}"
          @app.call(env)
        end
      end

      def reconstruct_token_from_cookies(cookies, token_type)
        # Reconstruct token from cookie chunks (same logic as TokenService)
        token_parts = []
        index = 0

        loop do
          cookie_name = "#{token_type}_#{index}"
          break unless cookies[cookie_name]
          token_parts << cookies[cookie_name]
          index += 1
        end

        token_parts.empty? ? nil : token_parts.join('')
      end

      def validate_and_extract_user(access_token)
        begin
          # Decode JWT token to extract claims
          token_parts = access_token.split('.')
          return nil unless token_parts.length >= 2

          # Decode payload (second part)
          payload = Base64.decode64(token_parts[1].ljust((token_parts[1].length + 3) / 4 * 4, '='))
          claims = JSON.parse(payload)

          # Extract user identifier (sub claim)
          user_sub = claims['sub']
          return nil unless user_sub

          # Return user info
          {
            sub: user_sub,
            email: claims['email'],
            preferred_username: claims['preferred_username']
          }
        rescue => e
          Rails.logger.warn "[Keycloak] Failed to validate token: #{e.message}"
          nil
        end
      end

      def find_user_by_identity(user_info)
        # Find user by Keycloak identity
        identity = Decidim::Identity.find_by(
          provider: 'keycloakopenid',
          uid: user_info[:sub]
        )

        identity&.user
      end
    end
  end
end