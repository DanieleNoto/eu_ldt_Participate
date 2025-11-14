# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro


# config/initializers/sidekiq.rb
# Only configure Sidekiq if the gem is available. This prevents boot-time
# failures (NameError) when the bundle doesn't include Sidekiq (for example
# when running in an environment where the gem hasn't been installed or
# is grouped under :production and the app runs in :development).
if defined?(Sidekiq)
  # Configure concurrency-aware Redis connection pool to avoid a storm of
  # simultaneous non-blocking connects at startup which can trigger
  # "Operation already in progress - connect(2)" socket errors.
  concurrency = Integer(ENV.fetch('SIDEKIQ_CONCURRENCY', ENV.fetch('CONCURRENCY', '5')))
  # connection pool size for server should be a bit larger than concurrency
  pool_size = concurrency + 5
  redis_url = ENV.fetch('REDIS_URL', 'redis://redis:6379/0')

  Sidekiq.configure_server do |config|
    config.redis = {
      url: redis_url,
      size: pool_size,
      # network_timeout reduces long connect hangs; tune as needed
      network_timeout: 5
    }
  end

  Sidekiq.configure_client do |config|
    config.redis = {
      url: redis_url,
      size: concurrency,
      network_timeout: 5
    }
  end
else
  # Safe fallback: log that Sidekiq configuration was skipped.
  if defined?(Rails) && Rails.respond_to?(:logger)
    Rails.logger.info("Sidekiq gem not present; skipping Sidekiq initializer")
  end
end