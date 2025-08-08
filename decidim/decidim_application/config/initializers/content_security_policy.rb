# For tuning the Content Security Policy, check the Decidim documentation site
# https://docs.decidim.org/develop/en/customize/content_security_policy

# Add development configuration for Shakapacker dev server
if Rails.env.development?
  # Be sure to restart your server when you modify this file.

# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self, :https
    policy.font_src    :self, :https, :data
    policy.img_src     :self, :https, :data
    policy.object_src  :none

    # Allow scripts from self and webpack dev server
    if Rails.env.development?
      policy.script_src :self, :unsafe_eval, :unsafe_inline, "http://localhost:3035", "http://0.0.0.0:3035", "ws://localhost:3035", "ws://0.0.0.0:3035"
      policy.style_src  :self, :unsafe_inline, "http://localhost:3035", "http://0.0.0.0:3035"
      policy.connect_src :self, "http://localhost:3035", "http://0.0.0.0:3035", "ws://localhost:3035", "ws://0.0.0.0:3035"
    else
      policy.script_src :self
      policy.style_src  :self, :unsafe_inline
      policy.connect_src :self
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
end
