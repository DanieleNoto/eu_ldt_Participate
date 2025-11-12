# Shakapacker configuration for containerized development environment

if Rails.env.development?
  begin
    # Set environment variables that Shakapacker reads
    # These environment variables are used by Shakapacker to configure the dev server
    # Host should be 0.0.0.0 in container to bind to all interfaces
    # Public should point to the proxy (Rails server) so HMR goes through the proxy
    ENV['SHAKAPACKER_DEV_SERVER_HOST'] ||= '0.0.0.0'
    ENV['SHAKAPACKER_DEV_SERVER_PORT'] ||= '3035'
    ENV['SHAKAPACKER_DEV_SERVER_PUBLIC'] ||= 'http://localhost:3000/decidim-packs/'
    ENV['SHAKAPACKER_DEV_SERVER_ENABLED'] ||= 'true'
    
    Rails.logger.info "Shakapacker dev server configured: host=#{ENV['SHAKAPACKER_DEV_SERVER_HOST']}, public=#{ENV['SHAKAPACKER_DEV_SERVER_PUBLIC']}"
  rescue => e
    Rails.logger.warn "Shakapacker configuration failed: #{e.message}"
  end
end
