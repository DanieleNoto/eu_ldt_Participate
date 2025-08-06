#!/bin/bash
set -e

echo "--- Shakapacker: Checking if gems are available ---"

# Check if bundle can load gems, if not, force bundle install
if ! bundle check > /dev/null 2>&1; then
  echo "--- Shakapacker: Gems missing, running bundle install ---"
  # Try bundle install, if it fails due to dependency conflicts, regenerate Gemfile.lock
  if ! bundle install; then
    echo "--- Shakapacker: Bundle install failed, regenerating Gemfile.lock ---"
    rm -f Gemfile.lock
    bundle install
  fi
else
  echo "--- Shakapacker: Gems available ---"
fi

echo "--- Shakapacker: Starting shakapacker-dev-server ---"
exec bundle exec bin/shakapacker-dev-server
