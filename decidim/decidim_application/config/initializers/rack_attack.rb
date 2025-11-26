# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Configure Rack::Attack for rate limiting and IP whitelisting
if defined?(Rack::Attack)
  # Configure cache store (using Rails cache)
  Rack::Attack.cache.store = Rails.cache

  # Safelist internal IPs to avoid rate limiting from internal services
  # This includes private IP ranges commonly used in Kubernetes clusters
  Rack::Attack.safelist("internal IPs") do |req|
    ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.1"].any? do |range|
      IPAddr.new(range).include?(req.ip)
    end
  end

  # Safelist healthcheck endpoints
  Rack::Attack.safelist("healthcheck") do |req|
    req.path == "/health" || req.path == "/up"
  end

  # === THROTTLING RULES ===
  
  # General browsing: Only count dynamic HTML requests, not assets
  # Each page load = 1 HTML + ~10 assets (Active Storage, images, etc.)
  # Allow 150 HTML requests per 5 minutes = ~30 req/min = ~30 page loads/5min
  Rack::Attack.throttle("requests by ip", limit: 150, period: 5.minutes) do |req|
    # Exclude all asset and static file requests from throttling
    req.ip unless req.path.start_with?(
      "/decidim-packs",           # Webpacker compiled assets
      "/uploads",                 # User uploaded files
      "/system",                  # System files
      "/rails/active_storage",    # Active Storage files (images, attachments)
      "/assets",                  # Legacy assets
      "/favicon.ico",             # Favicon
      "/.well-known"              # Well-known URIs (security.txt, etc.)
    ) || req.path.match?(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)
  end

  # Login attempts: very restrictive to prevent brute force
  # 5 attempts per 20 seconds, then 15 per hour
  Rack::Attack.throttle("logins/ip", limit: 5, period: 20.seconds) do |req|
    req.ip if req.path == "/users/sign_in" && req.post?
  end

  # Registration: prevent mass account creation
  Rack::Attack.throttle("registrations/ip", limit: 3, period: 1.hour) do |req|
    req.ip if req.path == "/users" && req.post?
  end

  # Search: can be resource-intensive
  Rack::Attack.throttle("search/ip", limit: 20, period: 1.minute) do |req|
    req.ip if req.path.include?("/search")
  end

  # === BLOCKING RULES ===

  # Block suspicious requests
  Rack::Attack.blocklist("fail2ban pentesters") do |req|
    Rack::Attack::Fail2Ban.filter("pentest-#{req.ip}", maxretry: 3, findtime: 10.minutes, bantime: 1.hour) do
      CGI.unescape(req.query_string) =~ %r{/etc/passwd|\.\.\/|<script|SELECT.*FROM|UNION.*SELECT}i ||
      req.path =~ %r{\.php$|wp-admin|phpmyadmin}i
    end
  end

  # Block requests with suspicious User-Agents
  Rack::Attack.blocklist("bad user agents") do |req|
    req.user_agent.present? && 
    req.user_agent =~ /sqlmap|nikto|masscan|nmap|zgrab/i
  end

  # === LOGGING & MONITORING ===

  # Log blocked requests
  ActiveSupport::Notifications.subscribe("rack.attack") do |name, start, finish, request_id, payload|
    req = payload[:request]
    
    case req.env["rack.attack.match_type"]
    when :throttle
      Rails.logger.warn "[Rack Attack] Throttled: #{req.ip} - #{req.request_method} #{req.path} (#{req.env['rack.attack.matched']})"
    when :blocklist
      Rails.logger.error "[Rack Attack] Blocked: #{req.ip} - #{req.request_method} #{req.path} (#{req.env['rack.attack.matched']})"
    end
  end

  # Custom response for throttled requests
  Rack::Attack.throttled_responder = lambda do |env|
    match_data = env["rack.attack.match_data"]
    now = match_data[:epoch_time]
    
    headers = {
      "Content-Type" => "text/html",
      "Retry-After" => (match_data[:period] - (now % match_data[:period])).to_s
    }

    body = <<-HTML
      <!DOCTYPE html>
      <html>
      <head><title>Rate Limit Exceeded</title></head>
      <body>
        <h1>Too Many Requests</h1>
        <p>You have exceeded the rate limit. Please try again in #{headers['Retry-After']} seconds.</p>
      </body>
      </html>
    HTML

    [429, headers, [body]]
  end
end
