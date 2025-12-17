# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro
# Marco Pinnella
# Pierluigi Spedicato
# SPDX-License-Identifier: AGPL-3.0
# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header
#
# For tuning the Content Security Policy specific to Decidim, check:
# https://docs.decidim.org/develop/en/customize/content_security_policy

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self, :https
    policy.font_src :self, :https, :data
    policy.img_src :self, :https, :data, :blob
    policy.object_src :none
    policy.base_uri :self

    # Get chatbot URL from environment
    chatbot_url = ENV["CHATBOT_URL"]&.strip

    if Rails.env.development?
      # Development: Allow webpack-dev-server and unsafe eval/inline for hot reloading
      script_sources = [:self, :unsafe_eval, :unsafe_inline, "http://localhost:3035", "http://0.0.0.0:3035"]
      connect_sources = [:self, "http://localhost:3035", "http://0.0.0.0:3035", "ws://localhost:3035", "ws://0.0.0.0:3035"]
      style_sources = [:self, :unsafe_inline, "http://localhost:3035", "http://0.0.0.0:3035"]
      font_sources = [:self, :https, :data, "http://localhost:3035", "http://0.0.0.0:3035"]

      # Add chatbot URLs if configured
      if chatbot_url.present?
        script_sources << chatbot_url
        connect_sources << chatbot_url
        style_sources << chatbot_url
        font_sources << chatbot_url
      end

      policy.script_src(*script_sources.compact)
      policy.style_src(*style_sources.compact)
      policy.connect_src(*connect_sources.compact)
      policy.font_src(*font_sources.compact)
    else
      # Production: Decidim 0.30 requires :unsafe_inline for scripts
      # Future versions should migrate to nonce-based CSP
      script_sources = [:self, :unsafe_inline]
      connect_sources = [:self]
      style_sources = [:self, :unsafe_inline]

      # Add chatbot URLs if configured
      if chatbot_url.present?
        script_sources << chatbot_url
        connect_sources << chatbot_url
        style_sources << chatbot_url
      end

      policy.script_src(*script_sources.compact)
      policy.style_src(*style_sources.compact)
      policy.connect_src(*connect_sources.compact)
    end
  end

  # Generate session nonces for permitted importmap, inline scripts and inline styles.
  # Note: Nonces are currently not used in production due to Decidim 0.30 compatibility.
  # Inline scripts use :unsafe_inline directive instead.
  config.content_security_policy_nonce_generator = ->(request) { request.session.id.to_s }
  config.content_security_policy_nonce_directives = %w(script-src)

  # Report CSP violations to a specified URI. Uncomment to enable reporting.
  # config.content_security_policy_report_only = true
end
