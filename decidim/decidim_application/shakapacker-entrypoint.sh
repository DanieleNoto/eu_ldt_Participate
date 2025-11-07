#!/bin/bash
set -e

echo "=== Shakapacker Dev Server Initialization ==="

# Ensure tmp directory exists with proper permissions
echo "--- Setting up tmp directory ---"
mkdir -p tmp/pids tmp/cache log

# Create webpacker runtime file if it doesn't exist
[ -f tmp/webpacker_runtime.yml ] || touch tmp/webpacker_runtime.yml

echo "--- Starting Shakapacker dev server ---"
exec bundle exec bin/shakapacker-dev-server
