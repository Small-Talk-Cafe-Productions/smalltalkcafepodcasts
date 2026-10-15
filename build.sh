#!/bin/bash

# Production Build Script
# Builds the static site for deployment

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || nvm use 2>/dev/null || true

# Navigate to project directory
cd "$(dirname "$0")"

echo "🏗️  Building production site..."
echo ""

# Run TypeScript check
npm run check

# Build the site
npm run build

echo ""
echo "✅ Build complete! Output in ./dist/"
echo "📦 Preview locally: npm run preview"
