# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro
# Marco Pinnella
# Pierluigi Spedicato
# SPDX-License-Identifier: AGPL-3.0
# frozen_string_literal: true

# For tuning the Content Security Policy, check the Decidim documentation site
# https://docs.decidim.org/develop/en/customize/content_security_policy

# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self, :https
    policy.font_src :self, :https, :data, "ms-browser-extension:"
    policy.img_src :self, :https, :data
    policy.object_src :none

    # Get chatbot URL from environment
    chatbot_url = ENV["CHATBOT_URL"]&.strip

    # Allow scripts from self and webpack dev server
    if Rails.env.development?
      script_sources = [:self, :unsafe_eval, :unsafe_inline, "http://localhost:3035", "http://0.0.0.0:3035", "ws://localhost:3035", "ws://0.0.0.0:3035"]
      connect_sources = [:self, "http://localhost:3035", "http://0.0.0.0:3035", "ws://localhost:3035", "ws://0.0.0.0:3035"]
      style_sources = [:self, :unsafe_inline, "http://localhost:3035", "http://0.0.0.0:3035"]
      font_sources = [:self, :https, :data, "ms-browser-extension:", "http://localhost:3035", "http://0.0.0.0:3035"]

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
      script_sources = [:self]
      connect_sources = [:self]

      # Add chatbot URLs if configured
      if chatbot_url.present?
        script_sources << chatbot_url
        connect_sources << chatbot_url
      end

      policy.script_src(*script_sources.compact)
      policy.style_src :self, :unsafe_inline
      policy.connect_src(*connect_sources.compact)
    end
  end

  # Configure CSP nonces based on the current request
  # Disable nonces in development to allow inline scripts
  config.content_security_policy_nonce_generator = lambda { |request|
    if Rails.env.development?
      nil # No nonce in development - allow unsafe-inline
    else
      request.session.id.to_s
    end
  }

  config.content_security_policy_nonce_directives = %w(script-src)

  # Report violations without enforcing the policy.
  # config.content_security_policy_report_only = true
end
