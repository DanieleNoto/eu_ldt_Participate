# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



module KeycloakTokenManagement
  extend ActiveSupport::Concern

  private

  # Attempt to refresh the Keycloak token using refresh_token
  def refresh_keycloak_token
    refresh_token = cookies['refresh_token']
    return false unless refresh_token.present? && keycloak_config_valid?

    config = keycloak_config

    begin
      Rails.logger.debug "[Keycloak Token Refresh] Attempting token refresh"

      uri = URI("#{config[:site]}/realms/#{config[:realm]}/protocol/openid-connect/token")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      http.cert_store = OpenSSL::SSL::SSLContext::DEFAULT_CERT_STORE
      http.open_timeout = 10
      http.read_timeout = 20

      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/x-www-form-urlencoded'
      request.body = URI.encode_www_form({
        grant_type: 'refresh_token',
        client_id: config[:client_id],
        client_secret: config[:client_secret],
        refresh_token: refresh_token
      })

      response = http.request(request)

      unless response.is_a?(Net::HTTPSuccess)
        Rails.logger.warn "[Keycloak Token Refresh] Refresh failed with status #{response.code}"
        return false
      end

      token_data = JSON.parse(response.body)

      # Validate that we got the required tokens
      unless token_data['access_token'] && token_data['refresh_token']
        Rails.logger.warn "[Keycloak Token Refresh] Refresh response missing required tokens"
        return false
      end

      # Save the new tokens to cookies
      save_keycloak_tokens_to_cookies(token_data)

      Rails.logger.info "[Keycloak Token Refresh] Token refresh successful"
      true
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error "[Keycloak Token Refresh] Network timeout during refresh: #{e.message}"
      false
    rescue JSON::ParserError => e
      Rails.logger.error "[Keycloak Token Refresh] Invalid JSON response during refresh: #{e.message}"
      false
    rescue => e
      Rails.logger.error "[Keycloak Token Refresh] Unexpected error during refresh: #{e.class} - #{e.message}"
      false
    end
  end

  # Save Keycloak tokens to cookies (extracted for reuse)
  # CENTRALIZED: Uses Decidim::Keycloak::CookieManager
  def save_keycloak_tokens_to_cookies(token_data)
    # Prepare tokens hash
    tokens = {
      access_token: token_data['access_token'],
      refresh_token: token_data['refresh_token'],
      id_token: token_data['id_token'],
      expires_in: token_data['expires_in']&.to_i
    }
    
    # Use centralized cookie manager
    Decidim::Keycloak::CookieManager.save_tokens(cookies, tokens, request.host)
    
    # Clear any cached validation results since we have new tokens
    invalidate_keycloak_token_cache
    
    Rails.logger.info "[Keycloak Token Save] Saved tokens to cookies"
  end

  # Extract token expiry from JWT id_token
  # CENTRALIZED: Uses Decidim::Keycloak::JwtParser
  def extract_token_expiry_from_jwt(id_token)
    Decidim::Keycloak::JwtParser.extract_expiry(id_token)
  end

  # Method to invalidate Keycloak token cache (useful for debugging)
  def invalidate_keycloak_token_cache
    id_token = cookies['id_token']
    return unless id_token.present?

    cache_key = "keycloak_token_#{Digest::SHA256.hexdigest(id_token)}"
    Rails.cache.delete(cache_key)
    Rails.logger.info "[Keycloak Cache] Invalidated cache for token"
  end

  # Check if token is locally expired (fast check before network call)
  # CENTRALIZED: Uses Decidim::Keycloak::JwtParser
  def token_locally_expired?(id_token)
    Decidim::Keycloak::JwtParser.locally_expired?(id_token)
  end

  # NEW: Proper token validation using Keycloak introspection endpoint
  def keycloak_token_still_valid?
    id_token = cookies['id_token']
    return false unless id_token.present?

    return false unless keycloak_config_valid?
    config = keycloak_config

    # Check cache first (30-second TTL for production)
    cache_key = "keycloak_token_#{Digest::SHA256.hexdigest(id_token)}"
    cached_result = Rails.cache.read(cache_key)
    if cached_result != nil
      return cached_result
    end

    Rails.logger.debug "[Keycloak Token Validation] Validating token with Keycloak"

    # First, check if token is locally expired to avoid unnecessary network calls
    if token_locally_expired?(id_token)
      Rails.logger.info "[Keycloak Token Validation] Token locally expired for user #{current_user&.id}, attempting refresh"

      # Try to refresh the token before giving up
      if refresh_keycloak_token
        Rails.logger.info "[Keycloak Token Validation] Token refreshed successfully for user #{current_user&.id}"
        return true
      else
        Rails.logger.info "[Keycloak Token Validation] Token refresh failed for user #{current_user&.id}"
        return false
      end
    end

    begin
      # Get access token for introspection using Net::HTTP with timeout and SSL
      uri = URI("#{config[:site]}/realms/#{config[:realm]}/protocol/openid-connect/token")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      # Use system CA certificates instead of hardcoded path
      http.cert_store = OpenSSL::SSL::SSLContext::DEFAULT_CERT_STORE
      http.open_timeout = 10  # 10 seconds (increased from 5s)
      http.read_timeout = 20 # 20 seconds (increased from 10s)

      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/x-www-form-urlencoded'
      request.body = URI.encode_www_form({
        grant_type: 'client_credentials',
        client_id: config[:client_id],
        client_secret: config[:client_secret]
      })

      token_response = http.request(request)
      return false unless token_response.is_a?(Net::HTTPSuccess)

      access_token = JSON.parse(token_response.body)['access_token']
      return false unless access_token

      # Introspect the user's token
      introspect_uri = URI("#{config[:site]}/realms/#{config[:realm]}/protocol/openid-connect/token/introspect")
      introspect_request = Net::HTTP::Post.new(introspect_uri)
      introspect_request['Content-Type'] = 'application/x-www-form-urlencoded'
      introspect_request.body = URI.encode_www_form({
        token: id_token,
        client_id: config[:client_id],
        client_secret: config[:client_secret]
      })

      introspect_response = http.request(introspect_request)
      return false unless introspect_response.is_a?(Net::HTTPSuccess)

      introspection_result = JSON.parse(introspect_response.body)
      is_active = introspection_result['active'] == true

      # Log token validation result for debugging
      if is_active
        Rails.logger.debug "[Keycloak Token Validation] Token is valid for user #{current_user&.id}"
      else
        Rails.logger.info "[Keycloak Token Validation] Token is invalid/revoked for user #{current_user&.id} - forcing logout"
        return false  # Don't attempt refresh for revoked tokens
      end

      # Cache the result for 10 seconds (reduced from 30s for better security)
      Rails.cache.write(cache_key, is_active, expires_in: 10.seconds)

      is_active
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error "[Keycloak Token Validation] Network timeout during validation: #{e.message}"
      false  # Force logout on network issues for security
    rescue JSON::ParserError => e
      Rails.logger.error "[Keycloak Token Validation] Invalid JSON response during validation: #{e.message}"
      false  # Force logout on invalid responses
    rescue => e
      Rails.logger.error "[Keycloak Token Validation] Unexpected error during validation: #{e.class} - #{e.message}"
      false  # Force logout on unexpected errors
    end
  end
end