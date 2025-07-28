#!/bin/bash
set -e

echo "--- Fixing line endings for bin scripts ---"
# Fix line endings for all scripts in bin/ directory
for script in bin/*; do
  if [ -f "$script" ]; then
    sed -i 's/\r$//' "$script"
  fi
done

# Create necessary directories
mkdir -p tmp/pids tmp/cache tmp/sockets

# Remove old server PID file if it exists
if [ -f tmp/pids/server.pid ]; then
  rm tmp/pids/server.pid
fi

echo "--- Cleaning Yarn cache ---"
yarn cache clean

echo "--- Installing Ruby gems ---"
bundle install

echo "--- Installing Node.js packages ---"
yarn install

echo "--- Testing Redis connection ---"
until redis-cli -h redis -p 6379 ping; do
  echo "Waiting for Redis to be ready..."
  sleep 2
done
echo "--- Redis is ready ---"

if [ "$RAILS_ENV" = "development" ]; then
  echo "--- Dropping and recreating database for a clean state ---"
  bin/rails db:drop DISABLE_DATABASE_ENVIRONMENT_CHECK=1 || true
  bin/rails db:create
  bin/rails db:migrate
  echo "--- Database dropped, created and migrated ---"
else
  echo "--- Creating database (if it doesn't exist) ---"
  bin/rails db:create || true
  echo "--- Running database migrations ---"
  bin/rails db:migrate
fi

if [ "$RAILS_ENV" = "development" ]; then
  echo "--- Development environment detected, skipping asset precompilation ---"
  echo "--- Assets will be served by shakapacker-dev-server ---"
  echo "--- Development environment detected, setting up default data ---"
  bin/rails runner prepare-db-for-tests.rb \
    && echo "--- Default data prepared successfully. ---" \
    || echo "--- Failed to prepare default data. ---"
else
  echo "--- Production environment detected, precompiling assets ---"
  bin/rails assets:precompile
  echo "--- Not in development environment or RAILS_ENV not set to 'development', skipping data preparation ---"
  echo "RAILS_ENV is currently: $RAILS_ENV"
fi

echo "--- Starting Rails server ---"

exec bundle exec rails s -b 0.0.0.0 -p 3000
