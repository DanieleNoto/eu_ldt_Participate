# config/initializers/sidekiq.rb
# Only configure Sidekiq if the gem is available. This prevents boot-time
# failures (NameError) when the bundle doesn't include Sidekiq (for example
# when running in an environment where the gem hasn't been installed or
# is grouped under :production and the app runs in :development).
if defined?(Sidekiq)
  Sidekiq.configure_server do |config|
    config.redis = { url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0') }
  end

  Sidekiq.configure_client do |config|
    config.redis = { url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0') }
  end
else
  # Safe fallback: log that Sidekiq configuration was skipped.
  if defined?(Rails) && Rails.respond_to?(:logger)
    Rails.logger.info("Sidekiq gem not present; skipping Sidekiq initializer")
  end
end