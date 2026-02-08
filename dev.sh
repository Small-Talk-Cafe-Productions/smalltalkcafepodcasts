#!/bin/bash

# Development Server Startup Script
# Automatically loads nvm and starts Astro dev server

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Navigate to project directory
cd "$(dirname "$0")"

# Start development server
echo "🚀 Starting Small Talk Café Podcasts development server..."
echo "📍 Visit: http://localhost:4321"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
