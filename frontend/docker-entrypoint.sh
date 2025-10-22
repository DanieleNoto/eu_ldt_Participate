#!/bin/sh
set -eu

echo "[chatbot-frontend] Starting chatbot frontend..."

# Check if dist folder exists and has content
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
  echo "[chatbot-frontend] WARNING: dist folder is empty or missing!"
  echo "[chatbot-frontend] Building application..."
  npm run build
fi

echo "[chatbot-frontend] Dist folder contents:"
ls -la dist/

echo "[chatbot-frontend] Starting static server on port 5001..."
echo "[chatbot-frontend] Serving files from: $(pwd)/dist"
npm run serve:dist
