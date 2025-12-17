# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# Marco Pinnella
# Pierluigi Spedicato
# frozen_string_literal: true

require_relative "boot"

require "decidim/rails"

# Add the frameworks used by your app that are not loaded by Decidim.
# require "action_mailbox/engine"
# require "action_text/engine"
require "action_cable/engine"
require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module DecidimApplication
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 6.1

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Configure trusted proxies for Kubernetes/Docker environments
    # This ensures Rails can correctly identify the real client IP from X-Forwarded-For headers
    config.action_dispatch.trusted_proxies = [
      "10.0.0.0/8",     # Private networks (Kubernetes pods)
      "172.16.0.0/12",  # Private networks (Docker networks)
      "192.168.0.0/16", # Private networks
      "127.0.0.0/8"     # Localhost
    ].map { |proxy| IPAddr.new(proxy) }

    # JSON Logging for ELK Stack
    if ENV["ENABLE_JSON_LOGS"].present? && ENV["ENABLE_JSON_LOGS"] != "false"
      # Load custom JSON formatter
      require_relative "../lib/json_log_formatter"

      # Configure logger to use JSON formatter for ALL logs
      config.log_formatter = JsonLogFormatter.new

      # Also configure lograge for HTTP request logs
      config.lograge.enabled = true
      config.lograge.formatter = Lograge::Formatters::Json.new
      config.lograge.custom_options = lambda do |event|
        {
          time: event.time,
          remote_ip: event.payload[:remote_ip],
          user_id: event.payload[:user_id],
          params: event.payload[:params].except("controller", "action", "format", "utf8", "authenticity_token")
        }
      end
    else
      # Standard text logging (development default)
      config.lograge.enabled = false
    end
  end
end
