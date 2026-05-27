#!/bin/bash
set -e
echo "🚀 Starting Grevya HR Portal..."

# Install backend deps
cd backend && npm install --production && cd ..

# Build frontend
cd frontend && npm install && npm run build && cd ..

# Copy frontend build to backend public
mkdir -p backend/public
mkdir -p backend/public && cp -r frontend/dist/* backend/public/

echo "✅ Build complete. Starting server..."
cd backend && node server.js
