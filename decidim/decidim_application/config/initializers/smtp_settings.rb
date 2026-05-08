# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# SMTP configuration override — kept in initializer to survive Decidim upstream updates to production.rb.
return unless Rails.env.production?

smtp_port = Decidim::Env.new("SMTP_PORT", 587).to_i
# SMTP_TLS=true for implicit SSL (port 465). SMTP_STARTTLS_AUTO=true for STARTTLS (port 587).
use_tls = Decidim::Env.new("SMTP_TLS", "false").to_s == "true"
use_starttls_auto = !use_tls && (Decidim::Env.new("SMTP_STARTTLS_AUTO", "true").to_s != "false")

smtp_settings = {
  address:             Decidim::Env.new("SMTP_ADDRESS").to_s,
  port:                smtp_port,
  authentication:      Decidim::Env.new("SMTP_AUTHENTICATION", "login").to_s,
  user_name:           Decidim::Env.new("SMTP_USERNAME").to_s,
  password:            Decidim::Env.new("SMTP_PASSWORD").to_s,
  domain:              Decidim::Env.new("SMTP_DOMAIN").to_s,
  openssl_verify_mode: "none",
  open_timeout:        Decidim::Env.new("SMTP_OPEN_TIMEOUT", 30).to_i,
  read_timeout:        Decidim::Env.new("SMTP_READ_TIMEOUT", 60).to_i
}

smtp_settings[:tls] = true if use_tls
smtp_settings[:enable_starttls_auto] = true if use_starttls_auto

Rails.application.config.action_mailer.smtp_settings = smtp_settings
