# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

require "net/http"
require "uri"
require "pathname"
require "openssl"

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
    def check_keycloak_auto_logout
      # No-op for API proxy controller
    end

    def check_keycloak_locale_sync
      # No-op for API proxy controller
    end

    # Proxy for chatbot frontend assets
    def proxy
      # Prefer HTTPS by default to avoid cleartext transmission. In development
      # this can be overridden via ENV. In production use internal K8s service names.
      # Internal K8s services use HTTP for performance, external connections should use HTTPS
      chatbot_url = ENV["CHATBOT_URL"].presence ||
                    (Rails.env.production? ? "http://chatbot-frontend-svc:5001" : "http://localhost:5001")

      # Rails separates format from path, so we need to reconstruct the full filename
      raw_path = params[:path].to_s
      format = request.format.symbol.to_s

      # If path is empty (like /chatbot-api), default to index.js
      raw_path = "index" if raw_path.blank?

      # Reconstruct full path with extension if format is not HTML
      path = raw_path.dup
      path = "#{path}.#{format}" if format.present? && format != "html" && !path.end_with?(".#{format}")

      # Sanitize the path to avoid scheme/host injection and path traversal
      begin
        sanitized_path = sanitize_relative_path(path)
        unless sanitized_path
          Rails.logger.warn "[Chatbot Proxy] Rejected unsafe path: #{path.inspect}"
          return render plain: "Bad request", status: :bad_request
        end

        # Build full URL safely
        query_string = request.query_string.presence
        full_url = build_full_url(chatbot_url, sanitized_path, query_string)
      rescue StandardError => e
        Rails.logger.error "[Chatbot Proxy] Error building URL: #{e.class} - #{e.message}\n#{e.backtrace.first(10).join("\n")}"
        return render plain: "Service unavailable", status: :service_unavailable
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
      backend_url = ENV["CHATBOT_BACKEND_URL"].presence ||
                    (Rails.env.production? ? "http://chatbot-backend-svc:3002" : "http://localhost:3002")
      raw_path = params[:path].to_s || ""

      begin
        sanitized_path = sanitize_relative_path(raw_path)
        unless sanitized_path
          Rails.logger.warn "[Chatbot Backend Proxy] Rejected unsafe path: #{raw_path.inspect}"
          return render json: { error: "Bad request" }, status: :bad_request
        end

        query_string = request.query_string.presence
        full_url = build_full_url(backend_url, sanitized_path, query_string)
      rescue StandardError => e
        Rails.logger.error "[Chatbot Backend Proxy] Error building URL: #{e.class} - #{e.message}\n#{e.backtrace.first(10).join("\n")}"
        return render json: { error: "Service unavailable" }, status: :service_unavailable
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
      if request.path.start_with?("/chatbot-backend-api") || request.format.json?
        render json: { error: "Internal server error" }, status: :internal_server_error
      else
        render plain: "Service unavailable", status: :service_unavailable
      end
    end

    def proxy_request(full_url, format)
      uri = URI.parse(full_url)

      # Security: Ensure we're using a safe protocol
      unless %w(http https).include?(uri.scheme)
        Rails.logger.error "[Chatbot Proxy] Unsupported scheme: #{uri.scheme}"
        return render plain: "Bad request", status: :bad_request
      end

      # Security: Block HTTP connections to external services in all environments
      if uri.scheme == "http" && !is_internal_k8s_service?(uri.host)
        Rails.logger.error "[Chatbot Proxy] HTTP blocked for external service: #{uri.host}"
        return render plain: "Secure connection required", status: :bad_request
      end

      # Validate URI components
      unless uri.host.present? && uri.port.present?
        Rails.logger.error "[Chatbot Proxy] Invalid URI - host: #{uri.host}, port: #{uri.port}"
        return render plain: "Bad request", status: :bad_request
      end

      http = Net::HTTP.new(uri.host, uri.port)
      http.open_timeout = 10
      http.read_timeout = 30

      # Use SSL if HTTPS
      if uri.scheme == "https"
        http.use_ssl = true
        configure_ssl_verification(http, uri)
      else
        http.use_ssl = false
      end

      request_obj = Net::HTTP::Get.new(uri)
      # Add headers to indicate we want the actual file, not HTML fallback
      case format
      when "js"
        request_obj["Accept"] = "application/javascript, text/javascript, */*"
        request_obj["X-Requested-With"] = "XMLHttpRequest" # Prevent HTML fallback
      when "css"
        request_obj["Accept"] = "text/css, */*"
      else
        request_obj["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      end

      http_response = http.request(request_obj)

      Rails.logger.info "[Chatbot Proxy] Response status: #{http_response.code}"
      Rails.logger.info "[Chatbot Proxy] Response content-type: #{http_response.content_type}"
      Rails.logger.info "[Chatbot Proxy] Response body size: #{http_response.body&.bytesize || 0} bytes"
      Rails.logger.info "[Chatbot Proxy] Response body preview: #{http_response.body&.first(200)}"

      # Validate content type matches expected format
      if format == "js" && http_response.content_type && !http_response.content_type.match?(/javascript|json/)
        Rails.logger.warn "[Chatbot Proxy] Expected JS but got #{http_response.content_type}"
        # If we expected JS but got HTML, return 404 instead
        return render plain: "JavaScript file not found", status: :not_found if http_response.content_type.match?(/html/)
      end

      # Forward relevant headers
      forwarded_headers = {}
      http_response.each_header do |key, value|
        # Skip hop-by-hop headers
        next if ["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade"].include?(key.downcase)

        # Handle CORS headers
        forwarded_headers[key] = if key.downcase == "access-control-allow-origin"
                                   "*" # Allow from any origin since we're proxying
                                 else
                                   value
                                 end
      end

      # Set forwarded headers in Rails response
      forwarded_headers.each do |key, value|
        response.headers[key] = value
      end

      render plain: http_response.body, status: http_response.code, content_type: http_response.content_type
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error "[Chatbot Proxy] Network timeout: #{e.message}"
      render plain: "Service timeout", status: :gateway_timeout
    rescue StandardError => e
      Rails.logger.error "[Chatbot Proxy] Unexpected error: #{e.class} - #{e.message}"
      render plain: "Service unavailable", status: :service_unavailable
    end

    def proxy_api_request(full_url)
      # First attempt without modification
      http_response = perform_http_request(full_url)

      # If we get a 404 and the URL doesn't end with /, try adding a trailing slash
      if http_response.code == "404" && !full_url.end_with?("/")
        Rails.logger.info "[Chatbot Backend Proxy] Got 404, retrying with trailing slash"
        full_url_with_slash = "#{full_url.split("?")[0]}/"
        query_part = full_url.split("?", 2)[1]
        full_url_with_slash = "#{full_url_with_slash}?#{query_part}" if query_part
        http_response = perform_http_request(full_url_with_slash)
      end

      Rails.logger.info "[Chatbot Backend Proxy] Response status: #{http_response.code}"

      # Forward response headers
      http_response.each_header do |key, value|
        next if ["connection", "keep-alive", "transfer-encoding"].include?(key.downcase)

        response.headers[key] = value
      end

      # Enable CORS
      response.headers["Access-Control-Allow-Origin"] = "*"
      response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
      response.headers["Access-Control-Allow-Headers"] = "*"

      render plain: http_response.body, status: http_response.code, content_type: http_response.content_type
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.error "[Chatbot Backend Proxy] Network timeout: #{e.message}"
      render json: { error: "Service timeout" }, status: :gateway_timeout
    rescue StandardError => e
      Rails.logger.error "[Chatbot Backend Proxy] Unexpected error: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: "Service unavailable" }, status: :service_unavailable
    end

    def perform_http_request(full_url)
      uri = URI.parse(full_url)

      # Security: Validate scheme
      raise ArgumentError, "Unsupported scheme: #{uri.scheme}" unless %w(http https).include?(uri.scheme)

      # Ensure we are not accidentally connecting to an IP that came from untrusted input
      # (uri.host should come from a trusted base URL plus a sanitized relative path)
      raise ArgumentError, "Invalid host in URL" if uri.host.blank?

      # Security: Block HTTP connections to external services in all environments
      if uri.scheme == "http" && !is_internal_k8s_service?(uri.host)
        Rails.logger.error "[Chatbot Backend Proxy] HTTP blocked for external service: #{uri.host}"
        raise SecurityError, "Secure connection required for external services"
      end

      # Validate URI components
      raise ArgumentError, "Invalid port in URL: #{uri}" if uri.port.blank?

      http = Net::HTTP.new(uri.host, uri.port)
      http.open_timeout = 10
      http.read_timeout = 30

      # Use SSL if HTTPS
      if uri.scheme == "https"
        http.use_ssl = true
        configure_ssl_verification(http, uri)
      else
        http.use_ssl = false
      end

      # Map Rails request method to Net::HTTP class
      request_class = case request.method
                      when "GET" then Net::HTTP::Get
                      when "POST" then Net::HTTP::Post
                      when "PUT" then Net::HTTP::Put
                      when "DELETE" then Net::HTTP::Delete
                      when "PATCH" then Net::HTTP::Patch
                      else Net::HTTP::Get
                      end

      request_obj = request_class.new(uri)

      # Forward headers
      request.headers.each do |key, value|
        next if %w(HTTP_HOST HTTP_X_FORWARDED_HOST).include?(key)

        header_name = key.sub(/^HTTP_/, "").split("_").map(&:capitalize).join("-")
        request_obj[header_name] = value if key.start_with?("HTTP_")
      end

      # Forward body for POST/PUT/PATCH
      if %w(POST PUT PATCH).include?(request.method)
        request_obj.body = request.raw_post
        request_obj["Content-Type"] = request.content_type if request.content_type
      end

      http.request(request_obj)
    end

    # Sanitize a user-supplied relative path. Returns a cleaned relative path
    # without any leading //, scheme, host or path traversal components. Returns
    # nil if the path is unsafe.
    def sanitize_relative_path(raw)
      return "" if raw.blank?

      # Reject any attempt to inject a scheme or authority
      return nil if raw =~ /^[a-zA-Z][a-zA-Z0-9+.-]*:/ || raw.start_with?("//")

      # Only allow typical safe filename characters (alnum, underscore, hyphen, dot and slash)
      return nil unless raw =~ %r{\A[0-9A-Za-z._\-/]*/?\z}

      # Split path into segments and normalize
      segments = raw.split("/").reject(&:empty?)

      # Resolve . and .. segments manually to avoid Pathname.new with user input
      normalized_segments = []
      segments.each do |segment|
        case segment
        when "."
          # Current directory - skip
          next
        when ".."
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
      normalized = normalized_segments.join("/")

      # Add leading slash if original had one (for root-relative paths)
      normalized = "/#{normalized}" if raw.start_with?("/")

      normalized
    end

    # Safely build a full URL from a base and a relative path + optional query
    def build_full_url(base, relative_path, query_string = nil)
      begin
        base_uri = URI.parse(base)
      rescue StandardError => e
        Rails.logger.error "[Chatbot Proxy] Invalid base URL: #{base} - #{e.message}"
        raise
      end

      # Enforce TLS in production environments, but allow HTTP for internal K8s services
      if Rails.env.production? && base_uri.scheme != "https" && !is_internal_k8s_service?(base_uri.host)
        Rails.logger.error "[Chatbot Proxy] Insecure backend URL used in production: #{base}"
        raise "Insecure backend URL configured"
      end

      # Concatenate paths safely
      combined_path = [base_uri.path.to_s.sub(%r{/$}, ""), relative_path.to_s].reject(&:empty?).join("/")
      base_uri.path = combined_path.start_with?("/") ? combined_path : "/#{combined_path}"
      base_uri.query = query_string if query_string.present?
      base_uri.to_s
    end

    # Check if a hostname is an internal Kubernetes service
    def is_internal_k8s_service?(hostname)
      return false if hostname.blank?

      # Common K8s internal service patterns
      k8s_patterns = [
        /.*-svc$/, # Kubernetes service suffix
        /.*\..*\.svc\.cluster\.local$/, # Full K8s DNS name
        /^chatbot-frontend$/, # Our specific service names
        /^chatbot-backend$/,
        /^backend$/,
        /^frontend$/
      ]

      k8s_patterns.any? { |pattern| hostname.match?(pattern) }
    end

    # Configure SSL verification - always enforce proper certificate validation
    def configure_ssl_verification(http, uri)
      # Always use full SSL verification for all services
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      http.verify_hostname = true

      # For internal K8s services, allow custom CA certificates if configured
      if is_internal_k8s_service?(uri.hostname) && ENV["INTERNAL_CA_CERT_PATH"].present?
        ca_cert_path = ENV.fetch("INTERNAL_CA_CERT_PATH", nil)
        if File.exist?(ca_cert_path)
          http.ca_file = ca_cert_path
          Rails.logger.debug { "Using custom CA certificate for internal service: #{uri.hostname}" }
        else
          Rails.logger.warn "Custom CA certificate path configured but file not found: #{ca_cert_path}"
        end
      end

      Rails.logger.debug { "SSL verification enabled for #{uri.hostname}" }
    end
  end
end
