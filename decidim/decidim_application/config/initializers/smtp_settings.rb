# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# SMTP configuration override — kept in initializer to survive Decidim upstream updates to production.rb.
return unless Rails.env.production?

starttls_auto = Decidim::Env.new("SMTP_STARTTLS_AUTO", "false").to_boolean_string

Rails.application.config.action_mailer.smtp_settings = {
  address:              Decidim::Env.new("SMTP_ADDRESS").to_s,
  port:                 Decidim::Env.new("SMTP_PORT", 587).to_i,
  authentication:       Decidim::Env.new("SMTP_AUTHENTICATION", "login").to_s,
  user_name:            Decidim::Env.new("SMTP_USERNAME").to_s,
  password:             Decidim::Env.new("SMTP_PASSWORD").to_s,
  domain:               Decidim::Env.new("SMTP_DOMAIN").to_s,
  enable_starttls_auto: Decidim::Env.new("SMTP_STARTTLS_AUTO").to_boolean_string,
  openssl_verify_mode:  "none",
  open_timeout:         Decidim::Env.new("SMTP_OPEN_TIMEOUT", 30).to_i,
  read_timeout:         Decidim::Env.new("SMTP_READ_TIMEOUT", 60).to_i
}
