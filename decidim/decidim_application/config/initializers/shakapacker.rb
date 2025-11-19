# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro

# Shakapacker configuration for containerized development environment

# frozen_string_literal: true

if Rails.env.development?
  begin
    # Set environment variables that Shakapacker reads
    # These environment variables are used by Shakapacker to configure the dev server
    # Host should be 0.0.0.0 in container to bind to all interfaces
    # Public should point to the proxy (Rails server) so HMR goes through the proxy
    ENV["SHAKAPACKER_DEV_SERVER_HOST"] ||= "0.0.0.0"
    ENV["SHAKAPACKER_DEV_SERVER_PORT"] ||= "3035"
    ENV["SHAKAPACKER_DEV_SERVER_PUBLIC"] ||= "http://localhost:3000/decidim-packs/"
    ENV["SHAKAPACKER_DEV_SERVER_ENABLED"] ||= "true"

    Rails.logger.info "Shakapacker dev server configured: host=#{ENV.fetch("SHAKAPACKER_DEV_SERVER_HOST", nil)}, public=#{ENV.fetch("SHAKAPACKER_DEV_SERVER_PUBLIC", nil)}"
  rescue StandardError => e
    Rails.logger.warn "Shakapacker configuration failed: #{e.message}"
  end
end
