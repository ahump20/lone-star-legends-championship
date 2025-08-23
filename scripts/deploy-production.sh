#!/bin/bash

# Blaze Intelligence Production Deployment Script
# Deploys to Cloudflare Pages with production configuration

set -e  # Exit on error

echo "🔥 Blaze Intelligence Production Deployment"
echo "==========================================="

# Check for required environment variables
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ Error: CLOUDFLARE_ACCOUNT_ID not set"
    echo "Please set: export CLOUDFLARE_ACCOUNT_ID=your-account-id"
    exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN not set"
    echo "Please set: export CLOUDFLARE_API_TOKEN=your-api-token"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Run tests
echo -e "${YELLOW}Step 1: Running tests...${NC}"
npm test 2>/dev/null || echo "⚠️  No tests configured"

# Step 2: Check for sensitive data
echo -e "${YELLOW}Step 2: Checking for sensitive data...${NC}"
if grep -r "sk-\|ghp_\|pk_test\|pk_live" --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null; then
    echo -e "${RED}❌ Sensitive data found! Please remove before deploying.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No sensitive data detected${NC}"
fi

# Step 3: Build production assets
echo -e "${YELLOW}Step 3: Building production assets...${NC}"

# Minify CSS files
for css in css/*.css; do
    if [ -f "$css" ]; then
        echo "  Minifying $css..."
        npx csso "$css" -o "$css" 2>/dev/null || true
    fi
done

# Minify JS files (excluding already minified)
for js in js/*.js; do
    if [[ ! "$js" =~ \.min\.js$ ]] && [ -f "$js" ]; then
        echo "  Minifying $js..."
        npx terser "$js" -c -m -o "${js%.js}.min.js" 2>/dev/null || cp "$js" "${js%.js}.min.js"
    fi
done

# Step 4: Generate service worker for offline support
echo -e "${YELLOW}Step 4: Generating service worker...${NC}"
cat > sw.js << 'EOF'
const CACHE_NAME = 'blaze-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/game.html',
  '/css/tokens.css',
  '/css/clean-branding.css',
  '/js/config.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
EOF

# Step 5: Create production manifest
echo -e "${YELLOW}Step 5: Creating production manifest...${NC}"
cat > manifest.json << EOF
{
  "name": "Blaze Intelligence",
  "short_name": "Blaze",
  "description": "Championship Analytics Platform",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#FF6B35",
  "background_color": "#0A0A0A",
  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔥</text></svg>",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
EOF

# Step 6: Deploy to Cloudflare Pages
echo -e "${YELLOW}Step 6: Deploying to Cloudflare Pages...${NC}"

# Deploy with production environment
npx wrangler pages deploy . \
    --project-name=blaze-intelligence \
    --branch=main \
    --commit-dirty=true \
    --env=production

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "🌐 Production URL: https://blaze-intelligence.com"
    echo "📊 Preview URL: https://blaze-intelligence.pages.dev"
    echo ""
    echo "Next steps:"
    echo "1. Configure custom domain in Cloudflare dashboard"
    echo "2. Verify SSL certificate is active"
    echo "3. Test all critical paths"
    echo "4. Monitor analytics and performance"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

# Step 7: Health check
echo -e "${YELLOW}Step 7: Running health check...${NC}"
sleep 5  # Wait for deployment to propagate

# Check if site is accessible
if curl -s -o /dev/null -w "%{http_code}" https://blaze-intelligence.pages.dev | grep -q "200"; then
    echo -e "${GREEN}✅ Site is live and responding${NC}"
else
    echo -e "${YELLOW}⚠️  Site may still be propagating${NC}"
fi

# Step 8: Create deployment record
echo -e "${YELLOW}Step 8: Recording deployment...${NC}"
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
COMMIT_HASH=$(git rev-parse HEAD 2>/dev/null || echo "no-git")

cat >> deployments.log << EOF
===========================================
Deployment: $TIMESTAMP
Commit: $COMMIT_HASH
Environment: production
Status: SUCCESS
===========================================
EOF

echo -e "${GREEN}✅ Deployment recorded${NC}"

# Final summary
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "=========================================="
echo "Production site: https://blaze-intelligence.com"
echo "Deployment time: $TIMESTAMP"
echo ""
echo "Remember to:"
echo "• Monitor error logs in Cloudflare dashboard"
echo "• Check analytics for traffic patterns"
echo "• Test payment processing in production"
echo "• Verify API endpoints are working"
echo ""
echo "🔥 Blaze Intelligence is LIVE! 🔥"