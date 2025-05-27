#!/bin/bash
set -e 

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

echo "--- Creating database (if it doesn't exist) ---"

bin/rails db:create || true

echo "--- Running database migrations ---"
bin/rails db:migrate

echo "--- Precompiling assets ---"
bin/rails assets:precompile

if [ "$RAILS_ENV" = "development" ]; then
  echo "--- Development environment detected, checking for existing admin user ---"

  # Check if any system admins already exist
  ADMIN_COUNT_OUTPUT=$(bin/rails runner "print Decidim::System::Admin.count" 2>/dev/null)
  
  if [ $? -ne 0 ] || ! [[ "$ADMIN_COUNT_OUTPUT" =~ ^[0-9]+$ ]]; then
    echo "--- WARNING: Could not reliably determine existing admin count. Skipping automatic admin creation to be safe. ---"
    ADMIN_COUNT="-1" 
  else
    ADMIN_COUNT=$ADMIN_COUNT_OUTPUT
  fi

  echo "Current system admin count: $ADMIN_COUNT"

  if [ "$ADMIN_COUNT" -eq 0 ]; then
    echo "--- No existing admin users found. Proceeding to create a new admin user. ---"
    DEFAULT_ADMIN_EMAIL="admin@admin.com"
    DEFAULT_ADMIN_PASSWORD="decidim123456789"

    ADMIN_EMAIL="${SYSTEM_ADMIN_EMAIL:-$DEFAULT_ADMIN_EMAIL}"
    ADMIN_PASSWORD="${SYSTEM_ADMIN_PASSWORD:-$DEFAULT_ADMIN_PASSWORD}"

    echo "Attempting to create admin user with email: $ADMIN_EMAIL"

    bin/rails runner "Decidim::System::Admin.create!(email: '$ADMIN_EMAIL', password: '$ADMIN_PASSWORD', password_confirmation: '$ADMIN_PASSWORD')" \
      && echo '--- Admin user created successfully. ---' \
      || echo '--- Failed to create admin user. It may already exist or there was a validation error. ---'
  else
    echo "--- Existing admin users found (Count: $ADMIN_COUNT). Skipping automatic admin creation. ---"
  fi
else
  echo "--- Not in development environment or RAILS_ENV not set to 'development', skipping admin creation ---"
  echo "RAILS_ENV is currently: $RAILS_ENV"
fi

echo "--- Starting Rails server ---"

exec bundle exec rails s -b 0.0.0.0 -p 3000
