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
  end
end