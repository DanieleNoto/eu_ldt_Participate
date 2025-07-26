# Shakapacker configuration for containerized development environment

if Rails.env.development?
  begin
    # Set environment variables that Shakapacker reads
    ENV['SHAKAPACKER_DEV_SERVER_HOST'] = '0.0.0.0'
    ENV['SHAKAPACKER_DEV_SERVER_PORT'] = '3035'
    ENV['SHAKAPACKER_DEV_SERVER_ENABLED'] = 'true'

    # Also configure directly if possible
    if defined?(Shakapacker) && Shakapacker.config
      Shakapacker.configure do |config|
        # In development, point to the shakapacker container
        config.dev_server.enabled = true
        config.dev_server.host = "0.0.0.0"
        config.dev_server.port = 3035
        config.dev_server.https = false
        config.dev_server.hmr = false
      end
    end
  rescue => e
    Rails.logger.warn "Shakapacker configuration failed: #{e.message}"
  end
end
