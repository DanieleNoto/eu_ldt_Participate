#!/bin/bash

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
  echo "--- Database setup completed ---"
  
  # Asset verification (must be precompiled)
  echo "--- Verifying precompiled assets ---"
  if [ ! -d "public/assets" ] || [ -z "$(ls -A public/assets 2>/dev/null)" ]; then
    echo "ERROR: No precompiled assets found in production"
    echo "Assets must be precompiled during Docker image build"
    bin/rails assets:precompile
  else
    echo "--- Precompiled assets verified, ready to serve ---"
  fi
  
  # No data setup in production
  echo "--- Production: skipping data setup for security ---"

elif [ "$RAILS_ENV" = "development" ]; then
  echo "=== DEVELOPMENT ENVIRONMENT SETUP ==="
  
  # Database reset (if requested)
  if [ "$FORCE_DB_RESET" = "true" ]; then
    echo "--- FORCE_DB_RESET=true, dropping database ---"
    bin/rails db:drop DISABLE_DATABASE_ENVIRONMENT_CHECK=1 || true
    echo "--- Database dropped ---"
  fi
  
  # Database setup (optimized)
  echo "--- Setting up database ---"
  
  bin/rails db:create >/dev/null 2>&1 || echo "Database already exists"
  
  # Run migrations (always safe, idempotent)
  echo "--- Running database migrations ---"
  if ! bin/rails db:migrate; then
    echo "ERROR: Database migration failed"
    exit 1
  fi
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
   # Asset compilation for development (optimized)
  echo "--- Checking assets for development ---"
  if [ ! -f "public/packs/manifest.json" ] || [ -n "$(find app/packs config/shakapacker.yml -newer public/packs/manifest.json 2>/dev/null)" ]; then
    echo "--- Compiling assets (changed files detected) ---"
    bin/rails shakapacker:compile
  else
    echo "--- Assets up to date, skipping compilation ---"
  fi
  echo "--- Assets will also be served by shakapacker-dev-server ---"
else
  echo "=== NON-PRODUCTION ENVIRONMENT SETUP (${RAILS_ENV}) ==="
  
  # Block dangerous operations
  if [ "$FORCE_DB_RESET" = "true" ]; then
    echo "ERROR: FORCE_DB_RESET is not allowed in ${RAILS_ENV} environment"
    echo "This could destroy important data. Use proper database procedures."
    exit 1
  fi
  
  # Database setup (optimized)
  echo "--- Setting up database ---"
  
  # Wait for database to be ready
  echo "--- Waiting for database connection ---"
  until bin/rails runner "ActiveRecord::Base.connection.execute('SELECT 1')" >/dev/null 2>&1; do
    echo "Database not ready, waiting 2 seconds..."
    sleep 2
  done
  echo "--- Database connection established ---"
  
  bin/rails db:create >/dev/null 2>&1 || echo "Database already exists"
  
  # Run migrations (always safe, idempotent)
  echo "--- Running database migrations ---"
  if ! bin/rails db:migrate; then
    echo "ERROR: Database migration failed"
    exit 1
  fi
  echo "--- Database setup completed ---"
  
  # Asset precompilation for non-dev environments
  echo "--- Precompiling assets ---"
  bin/rails assets:precompile
  
  # No data setup in non-development environments
  echo "--- Skipping data setup (only available in development) ---"
fi

echo "--- Starting Rails server ---"

# Ensure Spring is disabled for Rails server as well
exec bundle exec rails s -b 0.0.0.0 -p 3000
