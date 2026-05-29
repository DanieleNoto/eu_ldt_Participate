# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Use cache_store with an explicit Redis or MemoryStore backend for sessions.
#
# This fixes the token-rotation race condition in Keycloak auto-logout:
# - TokenService#recent_successful_refresh? writes a timestamp to the session after a successful refresh
# - With CookieStore (default), concurrent requests load the session from the browser cookie and cannot
#   see each other's session writes until the response is sent → the race-condition guard is a no-op
# - With Redis-backed cache_store, session writes are immediately visible to all concurrent requests,
#   so the guard correctly prevents spurious logouts when two requests race to refresh the same token
#
# IMPORTANT: We pass an explicit `cache:` object instead of relying on Rails.cache because in
# development Rails.cache defaults to NullStore (caching disabled), which would silently discard
# every session write, causing CSRF token mismatches and login failures.
#
# NOTE: switching session stores invalidates all existing sessions (one-time logout for active users).
_session_cache = if ENV["REDIS_URL"].present?
  ActiveSupport::Cache::RedisCacheStore.new(url: ENV["REDIS_URL"], namespace: "sessions")
else
  ActiveSupport::Cache::MemoryStore.new
end

Rails.application.config.session_store :cache_store,
  key: "_decidim_session",
  expire_after: 2.hours,
  same_site: :lax,
  secure: Rails.env.production?,
  httponly: true,
  cache: _session_cache
