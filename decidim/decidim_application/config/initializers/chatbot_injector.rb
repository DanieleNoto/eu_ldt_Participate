# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro
# frozen_string_literal: true

# Chatbot Widget Injector Middleware
#
# This middleware injects the EU LDT Participate chatbot widget into HTML responses.
# The chatbot appears as an overlay on all public-facing pages.
#
# Architecture:
# - The chatbot is a Web Component (<eu-chatbot>) built with React and Shadow DOM
# - It's loaded via Module Federation for efficient code splitting
# - The loader script (chatbot-loader) handles all initialization
# - Complete style isolation prevents conflicts with Decidim
#
# Environment Variables:
# - CHATBOT_ENABLED: 'true' to enable the chatbot
# - CHATBOT__URL: Internal URL of the chatbot frontend service (default: http://chatbot-frontend-svc:5001)
#   This is used by the API proxy controller, not directly by the frontend
#
# How it works:
# 1. Intercepts HTML responses (200 status only)
# 2. Injects <script> tag that loads from Decidim's /api/chatbot/ proxy
# 3. Proxy controller forwards requests to internal chatbot-frontend-svc:5001
# 4. Loader script creates <eu-chatbot> element in the DOM
# 5. Web component handles all UI, styling, and functionality
#
# See: frontend/CHATBOT_WEB_COMPONENT.md for technical details
class ChatbotInjector
  EXCLUDED_PATHS = [
    "/admin",
    "/admin/", # Add trailing slash variant
    "/system",
    "/system/", # Add trailing slash variant
    "/users/sign_in",
    "/users/sign_up",
    "/users/password",
    "/users/confirmation",
    "/users/unlock",
    "/chatbot-api", # Don't inject into chatbot API responses
    "/live_event" # Exclude live event pages for meetings
  ].freeze

  BODY_CLOSING_TAG = "</body>"

  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, response = @app.call(env)

    return [status, headers, response] unless injectable_response?(status, headers, env)

    body = extract_body(response)

    return [status, headers, [body]] unless body.include?(BODY_CLOSING_TAG)

    request = Rack::Request.new(env)
    Rails.logger.info("Chatbot: Checking path #{request.path} for injection")

    if excluded_path?(request.path)
      Rails.logger.info("Chatbot: Skipping injection for excluded path #{request.path}")
      return [status, headers, [body]]
    end

    injected_body = inject_chatbot_snippet(body, env)

    if injected_body
      headers = headers.dup
      headers["Content-Length"] = injected_body.bytesize.to_s if headers["Content-Length"]
      Rails.logger.info("Chatbot: Injecting widget for path #{request.path}")
      [status, headers, [injected_body]]
    else
      [status, headers, [body]]
    end
  rescue StandardError => e
    Rails.logger.error("Chatbot: Error injecting widget - #{e.class}: #{e.message}")
    Rails.logger.debug { e.backtrace.join("\n") } if Rails.logger.debug?
    body ? [status, headers, [body]] : [status, headers, response]
  end

  private

  def injectable_response?(status, headers, env)
    status == 200 &&
      html_response?(headers) &&
      chatbot_enabled? &&
      !excluded_path?(env["PATH_INFO"].to_s)
  end

  def chatbot_enabled?
    ENV["CHATBOT_ENABLED"] == "true"
  end

  def html_response?(headers)
    return false unless headers && headers.respond_to?(:[])

    content_type = headers["Content-Type"]
    content_type&.include?("text/html")
  end

  def excluded_path?(path)
    # Exclude paths that start with admin/system routes or exact auth paths
    normalized_path = path.downcase

    # Check exact path prefixes
    return true if EXCLUDED_PATHS.any? { |excluded| normalized_path.start_with?(excluded.downcase) }

    # Check for any meetings subpath: /meetings/{id}/* (including live_event and any other meeting pages)
    return true if normalized_path.match?(%r{/meetings/\d+(/|$)})

    false
  end

  def extract_body(response)
    return "" unless response

    body = +""
    if response.respond_to?(:each)
      response.each { |part| body << part.to_s if part }
    elsif response.respond_to?(:to_s)
      body = response.to_s
    end
    body
  ensure
    response.close if response.respond_to?(:close)
  end

  def inject_chatbot_snippet(html, env)
    snippet = build_snippet(env)
    return unless snippet

    html.sub(BODY_CLOSING_TAG, "#{snippet}\n#{BODY_CLOSING_TAG}")
  end

  def build_snippet(env)
    # Use Decidim's API proxy instead of direct service URL
    base_url = "/chatbot-api"
    cache_token = cache_buster_value
    loader_src = "#{base_url}/index.js"
    loader_src = "#{loader_src}?v=#{cache_token}" if cache_token

    # Detect language for the chatbot (priority: query param > path > session > default)
    language = Rack::Utils.escape_html(extract_locale(env))
    Rack::Utils.escape_html(loader_src)

    # Use relative URL for API - will work in both HTTP and HTTPS
    # The proxy controller will forward to the actual backend service
    api_url = "/chatbot-backend-api"

    <<~HTML.chomp
      <!-- EU LDT Participate Chatbot -->
      <script type="module">
        // Set global configuration before loading the chatbot
        window.__CHATBOT_BASE_URL__ = '/chatbot-api';
        window.__VITE_API_URL__ = '#{api_url}';

        // Load the chatbot web component
        import('/chatbot-api/index.js?v=#{cache_token}')
          .then(() => {
            // Create and append the chatbot element
            const chatbot = document.createElement('eu-chatbot');
            chatbot.setAttribute('language', '#{language}');
            chatbot.style.zIndex = '10';
            document.body.appendChild(chatbot);
            console.log('[Decidim] Chatbot web component loaded and mounted');
          })
          .catch(error => {
            console.error('[Decidim] Failed to load chatbot:', error);
          });
      </script>
      <!-- End EU LDT Participate Chatbot -->
    HTML
  end

  def cache_buster_value
    (Time.now.to_f * 1000).to_i.to_s
  end

  def extract_locale(env)
    query_locale(env) || path_locale(env) || env["decidim.current_locale"] || default_locale
  end

  def query_locale(env)
    query_string = env["QUERY_STRING"]
    return if query_string.blank?

    Rack::Utils.parse_query(query_string)["locale"].presence
  rescue StandardError
    nil
  end

  def path_locale(env)
    env["PATH_INFO"].to_s[%r{^/([a-z]{2})(?:/|$)}, 1]
  end

  def default_locale
    I18n.default_locale.to_s
  rescue StandardError
    "en"
  end
end

Rails.application.configure do
  config.middleware.use ChatbotInjector
end
