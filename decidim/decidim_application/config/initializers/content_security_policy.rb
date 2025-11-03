# For tuning the Content Security Policy, check the Decidim documentation site
# https://docs.decidim.org/develop/en/customize/content_security_policy

# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self, :https
    policy.font_src    :self, :https, :data, "ms-browser-extension:"
    policy.img_src     :self, :https, :data
    policy.object_src  :none

    # Get chatbot URL from environment
    chatbot_url = ENV['CHATBOT_URL']

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

      policy.script_src *script_sources
      policy.style_src  *style_sources
      policy.connect_src *connect_sources
      policy.font_src   *font_sources
    else
      script_sources = [:self]
      connect_sources = [:self]

      # Add chatbot URLs if configured
      if chatbot_url.present?
        script_sources << chatbot_url
        connect_sources << chatbot_url
      end

      policy.script_src *script_sources
      policy.style_src  :self, :unsafe_inline
      policy.connect_src *connect_sources
    end
  end

  # Don't use nonces in development to allow unsafe-inline
  if Rails.env.development?
    config.content_security_policy_nonce_generator = nil
    config.content_security_policy_nonce_directives = []
  else
    # Generate session nonces for permitted importmap and inline scripts in production
    config.content_security_policy_nonce_generator = ->(request) { request.session.id.to_s }
    config.content_security_policy_nonce_directives = %w(script-src)
  end

  # Report violations without enforcing the policy.
  # config.content_security_policy_report_only = true
end
