# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



# Configure Rack::Attack for rate limiting and IP whitelisting
if defined?(Rack::Attack)
  # Configure cache store (using Rails cache)
  Rack::Attack.cache.store = Rails.cache

  # Safelist internal IPs to avoid rate limiting from internal services
  # This includes private IP ranges commonly used in Kubernetes clusters
  Rack::Attack.safelist('internal IPs') do |req|
    ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'].any? do |range|
      IPAddr.new(range).include?(req.ip)
    end
  end

  # Throttle requests by IP
  Rack::Attack.throttle('requests by ip', limit: 300, period: 5.minutes) do |req|
    req.ip unless req.path.start_with?('/assets')
  end

  # Throttle login attempts
  Rack::Attack.throttle('logins/ip', limit: 5, period: 20.seconds) do |req|
    req.ip if req.path == '/users/sign_in' && req.post?
  end

  # Block suspicious requests
  Rack::Attack.blocklist('fail2ban') do |req|
    Rack::Attack::Fail2Ban.filter("fail2ban #{req.ip}", maxretry: 3, findtime: 10.minutes, bantime: 5.minutes) do
      CGI.unescape(req.query_string) =~ %r{/etc/passwd}
    end
  end
end