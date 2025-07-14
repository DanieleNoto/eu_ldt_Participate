# frozen_string_literal: true

# Configure Decidim AI module to use the correct Redis connection
if Decidim.module_installed?(:ai)
  Decidim::Ai.configure do |config|
    # Configure Redis connection for AI spam detection
    if ENV["REDIS_URL"].present?
      config.spam_detection_redis_url = ENV["REDIS_URL"]
    end
  end
end

# Alternative: Override the Redis backend configuration for classifier-reborn
# This ensures the Bayes spam detection uses the correct Redis instance
Rails.application.config.to_prepare do
  if defined?(ClassifierReborn::BayesRedisBackend)
    ClassifierReborn::BayesRedisBackend.class_eval do
      def initialize(options = {})
        @redis = if ENV["REDIS_URL"].present?
                   Redis.new(url: ENV["REDIS_URL"])
                 else
                   Redis.new(options)
                 end
      end
    end
  end
end
