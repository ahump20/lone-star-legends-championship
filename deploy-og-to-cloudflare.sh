#!/bin/bash

# 🏆 Blaze Intelligence OG Remaster - Cloudflare Pages Deployment
# One-click deployment to production with custom domain

set -e

echo "🏆 BLAZE INTELLIGENCE OG REMASTER - CLOUDFLARE DEPLOYMENT"
echo "⚾ Deploying Championship Baseball to the Cloud..."
echo ""

# Configuration
PROJECT_NAME="blaze-og-remaster"
CUSTOM_DOMAIN="baseball.blaze-intelligence.com"
BUILD_DIR="apps/og-remaster"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build production bundle
echo -e "${YELLOW}🔨 Building production bundle...${NC}"

# Create dist directory
mkdir -p $BUILD_DIR/dist

# Copy all necessary files
echo "📦 Copying game files..."
cp -r $BUILD_DIR/*.html $BUILD_DIR/dist/ 2>/dev/null || true
cp -r $BUILD_DIR/*.css $BUILD_DIR/dist/ 2>/dev/null || true
cp -r $BUILD_DIR/*.js $BUILD_DIR/dist/ 2>/dev/null || true
cp -r $BUILD_DIR/*.ts $BUILD_DIR/dist/ 2>/dev/null || true
cp -r $BUILD_DIR/manifest.json $BUILD_DIR/dist/ 2>/dev/null || true
cp -r $BUILD_DIR/sw.js $BUILD_DIR/dist/ 2>/dev/null || true

# Copy directories
echo "📁 Copying asset directories..."
cp -r $BUILD_DIR/assets $BUILD_DIR/dist/ 2>/dev/null || true
cp -r $BUILD_DIR/audio $BUILD_DIR/dist/ 2>/dev/null || true
cp -r $BUILD_DIR/modes $BUILD_DIR/dist/ 2>/dev/null || true
cp -r $BUILD_DIR/renderer $BUILD_DIR/dist/ 2>/dev/null || true
cp -r $BUILD_DIR/ui $BUILD_DIR/dist/ 2>/dev/null || true
cp -r $BUILD_DIR/analytics $BUILD_DIR/dist/ 2>/dev/null || true
cp -r $BUILD_DIR/leaderboard $BUILD_DIR/dist/ 2>/dev/null || true

# Copy shared packages
echo "📚 Copying shared packages..."
mkdir -p $BUILD_DIR/dist/packages
cp -r packages/rules $BUILD_DIR/dist/packages/ 2>/dev/null || true

# Copy content
mkdir -p $BUILD_DIR/dist/content
cp -r content/og $BUILD_DIR/dist/content/ 2>/dev/null || true

# Create _headers file for proper CORS and caching
cat > $BUILD_DIR/dist/_headers << EOF
/*
  Access-Control-Allow-Origin: *
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/*.js
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: application/javascript

/*.css
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: text/css

/*.html
  Cache-Control: public, max-age=0, must-revalidate
  Content-Type: text/html

/sw.js
  Cache-Control: public, max-age=0, must-revalidate
  Content-Type: application/javascript

/*.png
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: image/png

/*.json
  Cache-Control: public, max-age=3600
  Content-Type: application/json
EOF

# Create _redirects file
cat > $BUILD_DIR/dist/_redirects << EOF
# SPA fallback
/*    /index.html   200

# API redirects (if needed)
/api/*  https://api.blaze-intelligence.com/:splat  200
EOF

# Create wrangler.toml for the project
cat > $BUILD_DIR/dist/wrangler.toml << EOF
name = "$PROJECT_NAME"
compatibility_date = "2025-09-02"

[site]
bucket = "./dist"

[env.production]
name = "$PROJECT_NAME-production"
route = "$CUSTOM_DOMAIN/*"

[build]
command = ""
watch_paths = []
EOF

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found!${NC}"
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Deploy to Cloudflare Pages
echo -e "${YELLOW}☁️ Deploying to Cloudflare Pages...${NC}"

cd $BUILD_DIR/dist

# Deploy with wrangler
wrangler pages deploy . \
    --project-name="$PROJECT_NAME" \
    --branch=main \
    --commit-message="🏆 Deploy OG Remaster - $(date +%Y%m%d-%H%M%S)" \
    --compatibility-date=2025-09-02

cd ../../..

# Get deployment URL
DEPLOYMENT_URL="https://$PROJECT_NAME.pages.dev"

# Output success message
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🏆 DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Deployment Details:"
echo "   Project: $PROJECT_NAME"
echo "   URL: $DEPLOYMENT_URL"
echo "   Custom Domain: $CUSTOM_DOMAIN (configure in Cloudflare dashboard)"
echo "   Branch: main"
echo "   Status: ✅ Live"
echo ""
echo "🎯 Next Steps:"
echo "1. Visit Cloudflare Pages dashboard"
echo "2. Add custom domain: $CUSTOM_DOMAIN"
echo "3. Configure DNS records:"
echo "   Type: CNAME"
echo "   Name: baseball"
echo "   Value: $PROJECT_NAME.pages.dev"
echo ""
echo "📱 Test URLs:"
echo "   Production: $DEPLOYMENT_URL"
echo "   Quick Play: $DEPLOYMENT_URL?mode=quick"
echo "   Sandlot: $DEPLOYMENT_URL?mode=sandlot"
echo "   Season: $DEPLOYMENT_URL?mode=season"
echo ""
echo -e "${GREEN}⚾ Pattern Recognition Weaponized in Digital Baseball! ⚾${NC}"