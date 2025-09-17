# Remove old server PID file if it exists
if [ -f tmp/pids/server.pid ]; then
  rm tmp/pids/server.pid
  echo "--- Removed old server PID file ---"
fi

# Check if we need to update dependencies (only if files changed)
echo "--- Checking for dependency updates ---"
BUNDLE_UPDATED=false
YARN_UPDATED=false

# Check if Gemfile changed or gems are missing
if [ ! -f vendor/bundle/.bundle-timestamp ] || [ Gemfile -nt vendor/bundle/.bundle-timestamp ] || [ Gemfile.lock -nt vendor/bundle/.bundle-timestamp ]; then
  echo "--- Gemfile changed, updating Ruby gems ---"
  # Try bundle install, if it fails due to dependency conflicts, regenerate Gemfile.lock
  if ! bundle install; then
    echo "--- Bundle install failed, regenerating Gemfile.lock ---"
    rm -f Gemfile.lock
    bundle install
  fi
  mkdir -p vendor/bundle
  touch vendor/bundle/.bundle-timestamp
  BUNDLE_UPDATED=true
else
  echo "--- Checking if gems are available ---"
  # Check if bundle can load gems, if not, force bundle install
  if ! bundle check > /dev/null 2>&1; then
    echo "--- Gems missing, forcing bundle install ---"
    # Try bundle install, if it fails due to dependency conflicts, regenerate Gemfile.lock
    if ! bundle install; then
      echo "--- Bundle install failed, regenerating Gemfile.lock ---"
      rm -f Gemfile.lock
      bundle install
    fi
    mkdir -p vendor/bundle
    touch vendor/bundle/.bundle-timestamp
    BUNDLE_UPDATED=true
  else
    echo "--- Ruby gems up to date ---"
  fi
fi

# Database setup
# If FORCE_DB_RESET=true we always drop and recreate the DB regardless of RAILS_ENV.
if [ "$FORCE_DB_RESET" = "true" ]; then
  echo "--- FORCE_DB_RESET=true, dropping database (any env) ---"
  bin/rails db:drop DISABLE_DATABASE_ENVIRONMENT_CHECK=1 || true
  echo "--- Database dropped ---"
fi

bin/rails db:create
bin/rails decidim_calendar:install:migrations
bin/rails decidim_calendar:webpacker:install
bin/rails decidim_decidim_awesome:install:migrations
bin/rails decidim_decidim_awesome:webpacker:install
bin/rails db:migrate

echo "--- Database created and migrated ---"

# Asset compilation and data setup
if [ "$RAILS_ENV" = "development" ]; then
  echo "--- Development environment detected, compiling assets ---"
  # Compile assets to ensure they're available even if shakapacker-dev-server isn't responsive
  bin/rails shakapacker:compile
  echo "--- Assets will also be served by shakapacker-dev-server ---"
elif [ "$RAILS_ENV" = "production" ]; then
  echo "--- Production environment detected, using precompiled assets ---"
  # Assets were precompiled during docker build, just verify they exist
  if [ ! -d "public/assets" ] || [ -z "$(ls -A public/assets 2>/dev/null)" ]; then
    echo "--- WARNING: No precompiled assets found, attempting to compile... ---"
    # Attempt to compile assets but don't fail if it doesn't work
    bin/rails assets:precompile || echo "--- WARNING: Asset compilation failed, but continuing anyway ---"
  else
    echo "--- Precompiled assets found, ready to serve ---"
  fi
else
  echo "--- Non-development environment detected, precompiling assets ---"
  bin/rails assets:precompile
fi

# Data setup: run prepare-db-for-tests.rb when requested via FORCE_DATA_SETUP
# or when in development and dependencies changed / data not prepared yet.
if [ "$FORCE_DATA_SETUP" = "true" ] || ( [ "$RAILS_ENV" = "development" ] && ( [ "$BUNDLE_UPDATED" = "true" ] || [ ! -f tmp/.data-prepared ] ) ); then
  echo "--- Preparing default data (FORCE_DATA_SETUP triggered or dev with changes) ---"
  mkdir -p tmp
  if bin/rails runner prepare-db-for-tests.rb ; then
    echo "--- Default data prepared successfully. ---"
    touch tmp/.data-prepared
  else
    echo "--- Failed to prepare default data. ---"
    echo "--- Running database checks ---"
    bin/rails runner "puts \"Organizations: #{Decidim::Organization.count}\"; puts \"Users: #{Decidim::User.count}\"; puts \"First organization: #{Decidim::Organization.first&.name rescue 'None'}\""
  fi
else
  echo "--- Default data already prepared, skipping ---"
fi

echo "--- Starting Rails server ---"
mkdir -p tmp
touch tmp/.rails-started
exec bundle exec rails s -b 0.0.0.0 -p 3000
