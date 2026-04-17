#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro

# Clean up any stale PID file (safety check)
[ -f tmp/pids/server.pid ] && rm -f tmp/pids/server.pid

# Dependencies are pre-installed in Docker image, no need to verify at runtime

# Environment-specific setup
if [ "$RAILS_ENV" = "production" ]; then
  echo "=== PRODUCTION ENVIRONMENT SETUP ==="
  
  # Database setup (optimized)
  echo "--- Setting up database ---"
  bin/rails db:create >/dev/null 2>&1 || echo "Database already exists"

  # Run migrations (always safe, idempotent)
  echo "--- Running database migrations ---"
  if ! bin/rails db:migrate; then
    echo "ERROR: Database migration failed"
    exit 1
  fi
  if ! bin/rails data:migrate 2>/dev/null; then
    echo "WARNING: Database data migration completed with non-critical errors (expected if data:migrate task not defined)"
  fi
  echo "--- Database setup completed ---"
  
  # Run storage cleanup on production startup
  echo "--- Running storage cleanup ---"
  bin/rails storage:cleanup_orphaned_blobs
  
  # Verify assets compiled by init container
  echo "--- Verifying assets from init container ---"
  if [ ! -d "public/decidim-packs" ] || [ -z "$(ls -A public/decidim-packs 2>/dev/null)" ]; then
    echo "ERROR: No compiled assets found in public/decidim-packs"
    echo "The init container may have failed to compile assets"
    exit 1
  else
    echo "--- Compiled assets verified successfully ---"
  fi
  
  # No data setup in production
  echo "--- Production: skipping data setup for security ---"

elif [ "$RAILS_ENV" = "development" ]; then
  echo "=== DEVELOPMENT ENVIRONMENT SETUP ==="
  
  # Database setup (optimized)
  echo "--- Setting up database ---"
  bin/rails db:create >/dev/null 2>&1 || true
  bin/rails db:migrate
  bin/rails data:migrate 2>/dev/null || true
  echo "--- Database setup completed ---"

  # Data setup (if requested)
  if [ "$FORCE_DATA_SETUP" = "true" ]; then
    echo "--- FORCE_DATA_SETUP=true, preparing default data ---"
    echo "--- Note: Some errors during data generation are expected and non-fatal ---"
    if bin/rails runner prepare-db-for-tests.rb ; then
      echo "--- Default data prepared successfully ---"
    else
      echo "--- Data preparation completed with some expected errors ---"
      echo "--- This is normal for duplicate data and permission issues ---"
    fi
  else
    echo "--- Skipping data setup (set FORCE_DATA_SETUP=true to enable) ---"
  fi
  echo "--- Assets will be served by shakapacker-dev-server ---"
else
  echo "=== NON-PRODUCTION ENVIRONMENT SETUP (${RAILS_ENV}) ==="
  
  bin/rails db:create >/dev/null 2>&1 || true
  bin/rails db:migrate
  bin/rails data:migrate 2>/dev/null || true
  
  # No data setup in non-development environments
  echo "--- Skipping data setup (only available in development) ---"
fi

echo "--- Starting server ---"

# If a command was passed (e.g. bin/dev from docker-compose), execute it;
# otherwise fall back to the plain Rails server.
if [ $# -gt 0 ]; then
  exec "$@"
else
  exec bundle exec rails s -b 0.0.0.0 -p 3000
fi
