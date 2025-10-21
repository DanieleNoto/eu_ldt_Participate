#!/bin/sh
set -eu

echo "[chatbot-frontend] Checking for pre-built dist folder..."
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
  echo "ERROR: dist folder is empty or missing!"
  echo "Please build on Windows host first: npm run build"
  exit 1
fi

echo "[chatbot-frontend] Installing server dependencies..."
if [ -d node_modules ]; then
  echo "[chatbot-frontend] Using existing node_modules"
else
  npm ci --production
fi

echo "[chatbot-frontend] Starting static server..."
echo "[chatbot-frontend] Serving files from: $(pwd)/dist"
npm run serve:dist
