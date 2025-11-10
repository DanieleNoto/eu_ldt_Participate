# frozen_string_literal: true

require 'net/http'
require 'uri'

module Api
  # Chatbot Proxy Controller
  #
  # This controller proxies requests to the chatbot frontend service.
  # It allows the browser to load chatbot assets through Decidim's backend,
  # avoiding CORS issues and providing access to internal Kubernetes services.
  class ChatbotController < ApplicationController
    skip_before_action :verify_authenticity_token
    
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
      chatbot_url = ENV['CHATBOT_URL'] || 'http://chatbot-frontend:5001'
      
      # Rails separates format from path, so we need to reconstruct the full filename
      path = params[:path] || ''
      format = request.format.symbol.to_s
      
      # Reconstruct full path with extension if format is not HTML
      if format.present? && format != 'html' && !path.end_with?(".#{format}")
        path = "#{path}.#{format}"
      end
      
      full_url = "#{chatbot_url}/#{path}"

      # Remove any query parameters from the path and add them to the URL
      query_string = request.query_string.presence
      full_url = "#{full_url}?#{query_string}" if query_string

      Rails.logger.info "[Chatbot Proxy] Original request path: #{request.path}"
      Rails.logger.info "[Chatbot Proxy] Extracted path param: #{params[:path]}"
      Rails.logger.info "[Chatbot Proxy] Request format: #{format}"
      Rails.logger.info "[Chatbot Proxy] Reconstructed path: #{path}"
      Rails.logger.info "[Chatbot Proxy] Full URL to proxy: #{full_url}"

      proxy_request(full_url, format)
    end

    # Proxy for chatbot backend API calls
    def backend_proxy
      backend_url = ENV['CHATBOT_BACKEND_URL'] || 'http://backend:3002'
      path = params[:path] || ''
      
      # Add trailing slash if not present (backend requires it)
      path = "#{path}/" unless path.end_with?('/')
      
      full_url = "#{backend_url}/#{path}"
      query_string = request.query_string.presence
      full_url = "#{full_url}?#{query_string}" if query_string

      Rails.logger.info "[Chatbot Backend Proxy] Method: #{request.method}"
      Rails.logger.info "[Chatbot Backend Proxy] Path: #{path}"
      Rails.logger.info "[Chatbot Backend Proxy] Full URL: #{full_url}"

      proxy_api_request(full_url)
    end

    private

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
        uri = URI.parse(full_url)
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

        http_response = http.request(request_obj)
        
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
  end
end