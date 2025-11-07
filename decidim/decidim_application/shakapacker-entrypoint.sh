#!/bin/bash
set -e

echo "=== Shakapacker Dev Server Initialization ==="

# Ensure tmp directory exists with proper permissions
echo "--- Setting up tmp directory ---"
mkdir -p tmp/pids tmp/cache log

# Create webpacker runtime file if it doesn't exist
[ -f tmp/webpacker_runtime.yml ] || touch tmp/webpacker_runtime.yml

# Check if bundle is ready (should be pre-installed in image)
if ! bundle check > /dev/null 2>&1; then
  echo "ERROR: Gems not installed in image. Please rebuild the Docker image:"
  echo "  docker compose build decidim shakapacker"
  exit 1
fi

echo "--- Starting Shakapacker dev server ---"
exec bundle exec bin/shakapacker-dev-server
