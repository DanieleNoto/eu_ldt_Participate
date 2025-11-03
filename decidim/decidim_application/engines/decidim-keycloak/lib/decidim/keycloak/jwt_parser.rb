# frozen_string_literal: true

module Decidim
  module Keycloak
    # Centralized JWT token parsing and validation utilities
    # This module handles all JWT operations to prevent duplication
    class JwtParser
      # Parse JWT token and extract claims
      # @param jwt_token [String] The JWT token string
      # @return [Hash, nil] The claims hash or nil if invalid
      def self.parse_claims(jwt_token)
        return nil unless jwt_token.present?
        
        begin
          token_parts = jwt_token.split('.')
          return nil unless token_parts.length >= 2
          
          # Decode payload (second part)
          payload = Base64.decode64(token_parts[1].ljust((token_parts[1].length + 3) / 4 * 4, '='))
          claims = JSON.parse(payload)
          
          claims
        rescue JSON::ParserError => e
          Rails.logger.warn "[Keycloak JwtParser] JSON parsing error: #{e.message}"
          nil
        rescue => e
          Rails.logger.warn "[Keycloak JwtParser] Error parsing JWT: #{e.message}"
          nil
        end
      end
      
      # Extract expiry time from JWT token
      # @param jwt_token [String] The JWT token string
      # @return [Time, nil] The expiry time or nil if not present/invalid
      def self.extract_expiry(jwt_token)
        claims = parse_claims(jwt_token)
        return nil unless claims
        
        exp = claims['exp']
        return nil unless exp
        
        # Handle both seconds and milliseconds timestamps
        # Keycloak can return timestamps in milliseconds (> 1 trillion)
        exp > 1_000_000_000_000 ? Time.at(exp / 1000) : Time.at(exp)
      rescue => e
        Rails.logger.warn "[Keycloak JwtParser] Error extracting expiry: #{e.message}"
        nil
      end
      
      # Check if token is locally expired (no network call)
      # @param jwt_token [String] The JWT token string
      # @return [Boolean] true if expired or invalid, false if still valid
      def self.locally_expired?(jwt_token)
        return true unless jwt_token.present?
        
        expiry_time = extract_expiry(jwt_token)
        return true unless expiry_time
        
        expiry_time < Time.now
      end
      
      # Extract user locale from JWT token
      # @param jwt_token [String] The JWT token string
      # @param available_locales [Array<String>] List of available locales
      # @return [String, nil] The locale code or nil if not found/invalid
      def self.extract_locale(jwt_token, available_locales = nil)
        claims = parse_claims(jwt_token)
        return nil unless claims
        
        # Try different locale claims in order of preference
        user_locale = claims['locale'] || 
                     claims['preferred_locale'] || 
                     claims['ui_locales']&.first
        
        return nil unless user_locale.present?
        
        # If available_locales provided, validate against them
        if available_locales
          locales_list = available_locales.map(&:to_s)
          
          # Try exact match
          return user_locale.to_s if locales_list.include?(user_locale.to_s)
          
          # Try language code only (e.g., 'en' from 'en-US')
          language_code = user_locale.to_s.split('-').first
          return language_code if locales_list.include?(language_code)
          
          Rails.logger.debug "[Keycloak JwtParser] Locale #{user_locale} not in available locales: #{locales_list.join(', ')}"
          return nil
        end
        
        user_locale.to_s
      end
      
      # Validate basic JWT structure and required claims
      # @param jwt_token [String] The JWT token string
      # @return [Boolean] true if valid structure, false otherwise
      def self.valid_structure?(jwt_token)
        return false unless jwt_token.present?
        
        claims = parse_claims(jwt_token)
        return false unless claims
        
        # Check for required claims
        claims['sub'].present? && claims['email'].present?
      rescue => e
        Rails.logger.warn "[Keycloak JwtParser] Validation error: #{e.message}"
        false
      end
    end
  end
end
