# Check if we need to update dependencies (only if files changed)
echo "--- Checking for dependency updates ---"
BUNDLE_UPDATED=false
YARN_UPDATED=false

# Check if Gemfile changed
if [ ! -f vendor/bundle/.bundle-timestamp ] || [ Gemfile -nt vendor/bundle/.bundle-timestamp ] || [ Gemfile.lock -nt vendor/bundle/.bundle-timestamp ]; then
  echo "--- Gemfile changed, updating Ruby gems ---"
  bundle install
  mkdir -p vendor/bundle
  touch vendor/bundle/.bundle-timestamp
  BUNDLE_UPDATED=true
else
  echo "--- Ruby gems up to date ---"
fi

# Check if package.json changed
if [ ! -f node_modules/.yarn-timestamp ] || [ package.json -nt node_modules/.yarn-timestamp ] || [ yarn.lock -nt node_modules/.yarn-timestamp ]; then
  echo "--- Package.json changed, updating Node.js packages ---"
  yarn install --frozen-lockfile
  mkdir -p node_modules
  touch node_modules/.yarn-timestamp
  YARN_UPDATED=true
else
  echo "--- Node.js packages up to date ---"
fi

# Database setup
if [ "$RAILS_ENV" = "development" ]; then
  # Only drop DB if FORCE_DB_RESET is set
  if [ "$FORCE_DB_RESET" = "true" ]; then
    echo "--- FORCE_DB_RESET=true, dropping and recreating database ---"
    bin/rails db:drop DISABLE_DATABASE_ENVIRONMENT_CHECK=1 || true
    bin/rails db:create
    bin/rails decidim_calendar:install:migrations
    bin/rails decidim_calendar:webpacker:install
    bin/rails db:migrate
    echo "--- Database dropped, created and migrated ---"
  else
    echo "--- Creating database (if it doesn't exist) ---"
    bin/rails db:create || true
    bin/rails decidim_calendar:install:migrations
    bin/rails decidim_calendar:webpacker:install
    echo "--- Running database migrations ---"
    bin/rails db:migrate
    echo "--- Database setup completed ---"
  fi
else
  echo "--- Creating database (if it doesn't exist) ---"
  bin/rails db:create || true
  bin/rails decidim_calendar:install:migrations
  bin/rails decidim_calendar:webpacker:install
  echo "--- Running database migrations ---"
  bin/rails db:migrate
fi

# Asset compilation and data setup
if [ "$RAILS_ENV" = "development" ]; then
  echo "--- Development environment detected, skipping asset precompilation ---"
  echo "--- Assets will be served by shakapacker-dev-server ---"

  # Only run data preparation if dependencies were updated or FORCE_DATA_SETUP is set
  if { [ "$BUNDLE_UPDATED" = "true" ] || [ "$YARN_UPDATED" = "true" ] || [ "$FORCE_DATA_SETUP" = "true" ] || [ ! -f tmp/.data-prepared ]; } && [ "$FORCE_DB_RESET" = "true" ]; then
    echo "--- Setting up default data ---"
    mkdir -p tmp
    bin/rails runner prepare-db-for-tests.rb \
      && echo "--- Default data prepared successfully. ---" \
      && touch tmp/.data-prepared \
      || echo "--- Failed to prepare default data. ---"
  else
    echo "--- Default data already prepared, skipping ---"
  fi
else
  echo "--- Production environment detected, precompiling assets ---"
  bin/rails assets:precompile
  echo "--- Not in development environment, skipping data preparation ---"
  echo "RAILS_ENV is currently: $RAILS_ENV"
fi

# if [ "$RAILS_ENV" = "development" ]; then
#   echo "--- Development environment detected, skipping asset precompilation ---"
#   echo "--- Assets will be served by shakapacker-dev-server ---"
#   echo "--- Development environment detected, setting up default data ---"
#   bin/rails runner prepare-db-for-tests.rb \
#     && echo "--- Default data prepared successfully. ---" \
#     || echo "--- Failed to prepare default data. ---"
# else
#   echo "--- Production environment detected, precompiling assets ---"
#   bin/rails assets:precompile
#   echo "--- Not in development environment or RAILS_ENV not set to 'development', skipping data preparation ---"
#   echo "RAILS_ENV is currently: $RAILS_ENV"
# fi

echo "--- Starting Rails server ---"
mkdir -p tmp
touch tmp/.rails-started
exec bundle exec rails s -b 0.0.0.0 -p 3000
