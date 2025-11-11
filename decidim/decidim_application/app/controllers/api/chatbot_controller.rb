# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'pathname'

module Api
  # Chatbot Proxy Controller
  #
  # This controller proxies requests to the chatbot frontend service.
  # It allows the browser to load chatbot assets through Decidim's backend,
  # avoiding CORS issues and providing access to internal Kubernetes services.
  class ChatbotController < ApplicationController
    skip_before_action :verify_authenticity_token
  # Fallback handler to ensure API clients always receive JSON (not HTML error pages)
  rescue_from StandardError, with: :handle_internal_error
    
    # Override Keycloak callbacks to prevent them from running on API proxy
    def check_keycloak_auto_login
      # No-op for API proxy controller
    end
    
    def check_keycloak_auto_logout
      # No-op for API proxy controller
    end
    
    def check_keycloak_locale_sync
      # No-op for API proxy controller
    end

    # Proxy for chatbot frontend assets
    def proxy
      # Prefer HTTPS by default to avoid cleartext transmission. In development
      # this can be overridden via ENV. In production we enforce that the URL
      # uses HTTPS.
      chatbot_url = ENV['CHATBOT_URL'].presence || 'https://chatbot-frontend:5001'

      # Rails separates format from path, so we need to reconstruct the full filename
      raw_path = params[:path].to_s || ''
      format = request.format.symbol.to_s

      # Reconstruct full path with extension if format is not HTML
      path = raw_path.dup
      if format.present? && format != 'html' && !path.end_with?(".#{format}")
        path = "#{path}.#{format}"
      end

      # Sanitize the path to avoid scheme/host injection and path traversal
      begin
        sanitized_path = sanitize_relative_path(path)
        unless sanitized_path
          Rails.logger.warn "[Chatbot Proxy] Rejected unsafe path: #{path.inspect}"
          return render plain: 'Bad request', status: 400
        end

        # Build full URL safely
        query_string = request.query_string.presence
        full_url = build_full_url(chatbot_url, sanitized_path, query_string)
      rescue => e
        Rails.logger.error "[Chatbot Proxy] Error building URL: #{e.class} - #{e.message}\n#{e.backtrace.first(10).join("\n")}" 
        return render plain: 'Service unavailable', status: 503
      end

      Rails.logger.info "[Chatbot Proxy] Original request path: #{request.path}"
      Rails.logger.info "[Chatbot Proxy] Extracted path param: #{params[:path]}"
      Rails.logger.info "[Chatbot Proxy] Request format: #{format}"
      Rails.logger.info "[Chatbot Proxy] Reconstructed path: #{path}"
      Rails.logger.info "[Chatbot Proxy] Full URL to proxy: #{full_url}"

      proxy_request(full_url, format)
    end

    # Proxy for chatbot backend API calls
    def backend_proxy
      backend_url = ENV['CHATBOT_BACKEND_URL'].presence || 'https://backend:3002'
      raw_path = params[:path].to_s || ''

      begin
        sanitized_path = sanitize_relative_path(raw_path)
        unless sanitized_path
          Rails.logger.warn "[Chatbot Backend Proxy] Rejected unsafe path: #{raw_path.inspect}"
          return render json: { error: 'Bad request' }, status: 400
        end

        query_string = request.query_string.presence
        full_url = build_full_url(backend_url, sanitized_path, query_string)
      rescue => e
        Rails.logger.error "[Chatbot Backend Proxy] Error building URL: #{e.class} - #{e.message}\n#{e.backtrace.first(10).join("\n")}" 
        return render json: { error: 'Service unavailable' }, status: 503
      end

      Rails.logger.info "[Chatbot Backend Proxy] Method: #{request.method}"
      Rails.logger.info "[Chatbot Backend Proxy] Path: #{sanitized_path}"
      Rails.logger.info "[Chatbot Backend Proxy] Full URL: #{full_url}"

      proxy_api_request(full_url)
    end

    private

    def handle_internal_error(exception)
      Rails.logger.error "[Chatbot Proxy] Unhandled exception: #{exception.class} - #{exception.message}\n#{exception.backtrace.join("\n")}"

      # If the request appears to be an API call, return JSON; otherwise plain text.
      if request.path.start_with?('/chatbot-backend-api') || request.format.json?
        render json: { error: 'Internal server error' }, status: 500
      else
        render plain: 'Service unavailable', status: 503
      end
    end

    def proxy_request(full_url, format)
      begin
        uri = URI.parse(full_url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.open_timeout = 10
        http.read_timeout = 30

        # Use SSL if HTTPS
        http.use_ssl = (uri.scheme == 'https')

        request_obj = Net::HTTP::Get.new(uri)
        # Add headers to indicate we want the actual file, not HTML fallback
        case format
        when 'js'
          request_obj['Accept'] = 'application/javascript, text/javascript, */*'
        when 'css'
          request_obj['Accept'] = 'text/css, */*'
        end
        
        http_response = http.request(request_obj)
        
        Rails.logger.info "[Chatbot Proxy] Response status: #{http_response.code}"
        Rails.logger.info "[Chatbot Proxy] Response content-type: #{http_response.content_type}"
        Rails.logger.info "[Chatbot Proxy] Response body size: #{http_response.body&.bytesize || 0} bytes"
        Rails.logger.info "[Chatbot Proxy] Response body preview: #{http_response.body&.first(200)}"

        # Forward relevant headers
        forwarded_headers = {}
        http_response.each_header do |key, value|
          # Skip hop-by-hop headers
          next if ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade'].include?(key.downcase)

          # Handle CORS headers
          if key.downcase == 'access-control-allow-origin'
            forwarded_headers[key] = '*'  # Allow from any origin since we're proxying
          else
            forwarded_headers[key] = value
          end
        end

        # Set forwarded headers in Rails response
        forwarded_headers.each do |key, value|
          response.headers[key] = value
        end

        render plain: http_response.body, status: http_response.code, content_type: http_response.content_type
      rescue Net::OpenTimeout, Net::ReadTimeout => e
        Rails.logger.error "[Chatbot Proxy] Network timeout: #{e.message}"
        render plain: 'Service timeout', status: 504
      rescue => e
        Rails.logger.error "[Chatbot Proxy] Unexpected error: #{e.class} - #{e.message}"
        render plain: 'Service unavailable', status: 503
      end
    end

    def proxy_api_request(full_url)
      begin
        # First attempt without modification
        http_response = perform_http_request(full_url)
        
        # If we get a 404 and the URL doesn't end with /, try adding a trailing slash
        if http_response.code == '404' && !full_url.end_with?('/')
          Rails.logger.info "[Chatbot Backend Proxy] Got 404, retrying with trailing slash"
          full_url_with_slash = full_url.split('?')[0] + '/'
          query_part = full_url.split('?', 2)[1]
          full_url_with_slash = "#{full_url_with_slash}?#{query_part}" if query_part
          http_response = perform_http_request(full_url_with_slash)
        end
        
        Rails.logger.info "[Chatbot Backend Proxy] Response status: #{http_response.code}"

        # Forward response headers
        http_response.each_header do |key, value|
          next if ['connection', 'keep-alive', 'transfer-encoding'].include?(key.downcase)
          response.headers[key] = value
        end

        # Enable CORS
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = '*'

        render plain: http_response.body, status: http_response.code, content_type: http_response.content_type
      rescue Net::OpenTimeout, Net::ReadTimeout => e
        Rails.logger.error "[Chatbot Backend Proxy] Network timeout: #{e.message}"
        render json: { error: 'Service timeout' }, status: 504
      rescue => e
        Rails.logger.error "[Chatbot Backend Proxy] Unexpected error: #{e.class} - #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: 'Service unavailable' }, status: 503
      end
    end

    def perform_http_request(full_url)
      uri = URI.parse(full_url)

      # Ensure we are not accidentally connecting to an IP that came from untrusted input
      # (uri.host should come from a trusted base URL plus a sanitized relative path)
      unless uri.host.present?
        raise ArgumentError, 'Invalid host in URL'
      end

      http = Net::HTTP.new(uri.host, uri.port)
      http.open_timeout = 10
      http.read_timeout = 30

      # Use SSL if HTTPS
      http.use_ssl = (uri.scheme == 'https')

      # Map Rails request method to Net::HTTP class
      request_class = case request.method
                      when 'GET' then Net::HTTP::Get
                      when 'POST' then Net::HTTP::Post
                      when 'PUT' then Net::HTTP::Put
                      when 'DELETE' then Net::HTTP::Delete
                      when 'PATCH' then Net::HTTP::Patch
                      else Net::HTTP::Get
                      end

      request_obj = request_class.new(uri)
      
      # Forward headers
      request.headers.each do |key, value|
        next if ['HTTP_HOST', 'HTTP_X_FORWARDED_HOST'].include?(key)
        header_name = key.sub(/^HTTP_/, '').split('_').map(&:capitalize).join('-')
        request_obj[header_name] = value if key.start_with?('HTTP_')
      end

      # Forward body for POST/PUT/PATCH
      if ['POST', 'PUT', 'PATCH'].include?(request.method)
        request_obj.body = request.raw_post
        request_obj['Content-Type'] = request.content_type if request.content_type
      end

      http.request(request_obj)
    end

    # Sanitize a user-supplied relative path. Returns a cleaned relative path
    # without any leading //, scheme, host or path traversal components. Returns
    # nil if the path is unsafe.
    def sanitize_relative_path(raw)
      return '' if raw.blank?

      # Reject any attempt to inject a scheme or authority
      return nil if raw =~ %r{^[a-zA-Z][a-zA-Z0-9+.-]*:} || raw.start_with?('//')

      # Only allow typical safe filename characters (alnum, underscore, hyphen, dot and slash)
      return nil unless raw =~ %r{\A[0-9A-Za-z._\-/]*/?\z}

      # Split path into segments and normalize
      segments = raw.split('/').reject(&:empty?)

      # Resolve . and .. segments manually to avoid Pathname.new with user input
      normalized_segments = []
      segments.each do |segment|
        case segment
        when '.'
          # Current directory - skip
          next
        when '..'
          # Parent directory - remove last segment if it exists
          if normalized_segments.empty?
            # Trying to go above root - invalid
            return nil
          end
          normalized_segments.pop
        else
          # Regular segment - add it
          normalized_segments << segment
        end
      end

      # Reconstruct normalized path
      normalized = normalized_segments.join('/')

      # Add leading slash if original had one (for root-relative paths)
      normalized = "/#{normalized}" if raw.start_with?('/')

      normalized
    end

    # Safely build a full URL from a base and a relative path + optional query
    def build_full_url(base, relative_path, query_string = nil)
      begin
        base_uri = URI.parse(base)
      rescue => e
        Rails.logger.error "[Chatbot Proxy] Invalid base URL: #{base} - #{e.message}"
        raise
      end

      # Enforce TLS in production environments
      if Rails.env.production? && base_uri.scheme != 'https'
        Rails.logger.error "[Chatbot Proxy] Insecure backend URL used in production: #{base}"
        raise "Insecure backend URL configured"
      end

      # Concatenate paths safely
      combined_path = [base_uri.path.to_s.sub(%r{/$}, ''), relative_path.to_s].reject(&:empty?).join('/')
      base_uri.path = combined_path.start_with?('/') ? combined_path : "/#{combined_path}"
      base_uri.query = query_string if query_string.present?
      base_uri.to_s
    end
  end
end