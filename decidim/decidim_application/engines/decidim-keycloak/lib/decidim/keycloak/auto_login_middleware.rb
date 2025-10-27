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
        path = request.path

        Rails.logger.debug "[Keycloak AutoLogin] Processing request: #{request.request_method} #{path}"

        # Skip auto-login for certain paths
        if skip_auto_login?(request)
          Rails.logger.debug "[Keycloak AutoLogin] Skipping auto-login for path: #{path}"
          return @app.call(env)
        end

        # Check if user is already authenticated
        if user_authenticated?(env)
          Rails.logger.debug "[Keycloak AutoLogin] User already authenticated, skipping"
          return @app.call(env)
        end

        # Check for valid Keycloak tokens in cookies
        if valid_tokens_present?(request)
          Rails.logger.debug "[Keycloak AutoLogin] Valid tokens found, attempting auto-login"
          return handle_auto_login(env, request)
        else
          Rails.logger.debug "[Keycloak AutoLogin] No valid tokens found in cookies"
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

        Rails.logger.debug "[Keycloak AutoLogin] All cookies in request: #{cookies.keys.join(', ')}"
        Rails.logger.debug "[Keycloak AutoLogin] Checking cookies: #{cookies.keys.grep(/access_token|refresh_token|id_token|token_expires/).join(', ')}"

        # Check for id token cookie (should be present if user was logged in)
        id_token = reconstruct_token_from_cookies(cookies, 'id_token')
        Rails.logger.debug "[Keycloak AutoLogin] ID token present: #{id_token ? 'YES' : 'NO'}"
        return false unless id_token

        # Check if token is not expired
        expires_at = cookies['token_expires_at']&.to_i
        Rails.logger.debug "[Keycloak AutoLogin] Token expires at: #{expires_at ? Time.at(expires_at) : 'NO EXPIRY'}"
        if expires_at && Time.at(expires_at) <= Time.current
          Rails.logger.debug "[Keycloak AutoLogin] Token is expired"
          return false
        end

        Rails.logger.debug "[Keycloak AutoLogin] Tokens are valid"
        true
      end

      def handle_auto_login(env, request)
        Rails.logger.debug "[Keycloak AutoLogin] Starting auto-login process"

        begin
          cookies = request.cookies
          id_token = reconstruct_token_from_cookies(cookies, 'id_token')
          Rails.logger.debug "[Keycloak AutoLogin] Reconstructed ID token: #{id_token ? 'PRESENT' : 'MISSING'}"

          # Validate token by decoding it
          user_info = validate_and_extract_user(id_token)
          Rails.logger.debug "[Keycloak AutoLogin] User info extracted: #{user_info ? user_info[:sub] : 'FAILED'}"
          return @app.call(env) unless user_info

          # Find user by identity
          user = find_user_by_identity(user_info)
          Rails.logger.debug "[Keycloak AutoLogin] User found: #{user ? user.id : 'NOT FOUND'}"
          return @app.call(env) unless user

          # Set up warden authentication
          Rails.logger.debug "[Keycloak AutoLogin] Setting up warden authentication"
          env['warden'].set_user(user, scope: :user)

          # Log successful auto-login
          Rails.logger.info "[Keycloak] Auto-login successful for user #{user.id} (#{user.email})"

          @app.call(env)
        rescue => e
          Rails.logger.error "[Keycloak] Auto-login failed: #{e.class} - #{e.message}"
          Rails.logger.error "[Keycloak] Backtrace: #{e.backtrace.first(5).join("\n")}"
          @app.call(env)
        end
      end

      def reconstruct_token_from_cookies(cookies, token_type)
        # First try to get the token as a single cookie (new format without chunking)
        single_cookie = cookies[token_type]
        Rails.logger.debug "[Keycloak AutoLogin] Single cookie #{token_type}: #{single_cookie ? 'PRESENT' : 'NOT FOUND'}"
        return single_cookie if single_cookie.present?

        # Fallback to chunked cookies (old format) for backward compatibility
        Rails.logger.debug "[Keycloak AutoLogin] Trying chunked cookies for #{token_type}"
        token_parts = []
        index = 0

        loop do
          cookie_name = "#{token_type}_#{index}"
          cookie_value = cookies[cookie_name]
          Rails.logger.debug "[Keycloak AutoLogin] Chunk cookie #{cookie_name}: #{cookie_value ? 'PRESENT' : 'NOT FOUND'}"
          break unless cookie_value
          token_parts << cookie_value
          index += 1
        end

        result = token_parts.empty? ? nil : token_parts.join('')
        Rails.logger.debug "[Keycloak AutoLogin] Reconstructed #{token_type}: #{result ? 'SUCCESS' : 'FAILED'}"
        result
      end

      def validate_and_extract_user(id_token)
        begin
          Rails.logger.debug "[Keycloak AutoLogin] Validating ID token"
          # Decode JWT token to extract claims
          token_parts = id_token.split('.')
          Rails.logger.debug "[Keycloak AutoLogin] Token parts: #{token_parts.length}"
          return nil unless token_parts.length >= 2

          # Decode payload (second part)
          payload = Base64.decode64(token_parts[1].ljust((token_parts[1].length + 3) / 4 * 4, '='))
          claims = JSON.parse(payload)

          Rails.logger.debug "[Keycloak AutoLogin] Token claims extracted: sub=#{claims['sub']}, email=#{claims['email']}, exp=#{claims['exp']}"

          # Extract user identifier (sub claim)
          user_sub = claims['sub']
          Rails.logger.debug "[Keycloak AutoLogin] User sub: #{user_sub}"
          return nil unless user_sub

          # Check if token is expired
          exp = claims['exp']
          if exp && Time.at(exp) < Time.now
            Rails.logger.debug "[Keycloak AutoLogin] Token expired at #{Time.at(exp)}"
            return nil
          end

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
        Rails.logger.debug "[Keycloak AutoLogin] Finding user by identity for sub: #{user_info[:sub]}"
        # Find user by Keycloak identity
        identity = Decidim::Identity.find_by(
          provider: 'keycloakopenid',
          uid: user_info[:sub]
        )

        Rails.logger.debug "[Keycloak AutoLogin] Identity found: #{identity ? identity.id : 'NOT FOUND'}"
        if identity
          Rails.logger.debug "[Keycloak AutoLogin] User found: #{identity.user.id} - #{identity.user.email}"
        else
          Rails.logger.debug "[Keycloak AutoLogin] No identity found for provider=keycloakopenid, uid=#{user_info[:sub]}"
        end

        identity&.user
      end
    end
  end
end