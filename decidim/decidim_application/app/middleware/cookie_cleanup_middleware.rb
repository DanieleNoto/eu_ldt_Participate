# SPDX-License-Identifier: EUPL-1.2
# Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
# See: https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12
#
# Authors:
# - Gianfranco Cedro

# frozen_string_literal: true

# Middleware to clean up stale Keycloak token cookies
# This helps prevent 400 Bad Request errors from oversized Cookie headers
class CookieCleanupMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    request = ActionDispatch::Request.new(env)
    
    # Clean up stale Keycloak token cookies periodically
    # Only run cleanup every 10 requests to avoid performance impact
    if should_cleanup?(request)
      cleanup_stale_cookies(request)
    end
    
    @app.call(env)
  end

  private

  def should_cleanup?(request)
    # Only cleanup for authenticated users (has session cookie)
    return false unless request.cookies['_session_id']
    
    # Run cleanup 10% of the time (random sampling)
    rand < 0.1
  end

  def cleanup_stale_cookies(request)
    cookies_to_delete = []
    
    # Find orphaned Keycloak token chunks
    # These are chunks whose count cookie is missing or doesn't match
    access_token_count = request.cookies['keycloak_access_token_count'].to_i
    refresh_token_count = request.cookies['keycloak_refresh_token_count'].to_i
    
    # Check for orphaned access token chunks (index >= count)
    (0..50).each do |i|
      if request.cookies["keycloak_access_token_#{i}"] && i >= access_token_count
        cookies_to_delete << "keycloak_access_token_#{i}"
      end
    end
    
    # Check for orphaned refresh token chunks
    (0..50).each do |i|
      if request.cookies["keycloak_refresh_token_#{i}"] && i >= refresh_token_count
        cookies_to_delete << "keycloak_refresh_token_#{i}"
      end
    end
    
    # Clean up legacy token cookies
    legacy_cookies = ['access_token', 'id_token', 'jwt_token', 'refresh_token']
    legacy_cookies.each do |cookie_name|
      if request.cookies[cookie_name]
        cookies_to_delete << cookie_name
      end
    end
    
    # Log cleanup if any cookies found
    if cookies_to_delete.any?
      Rails.logger.info "🧹 Cookie cleanup: removing #{cookies_to_delete.length} stale cookies: #{cookies_to_delete.join(', ')}"
      
      # Delete cookies by setting them to expire immediately
      # This is done in the response, which will be set by the controller
      request.env['decidim.cookies_to_delete'] = cookies_to_delete
    end
  end
end
