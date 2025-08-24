#!/bin/bash

echo "🚀 DEPLOYING CHAMPIONSHIP VERSION TO ALL PROJECTS"
echo "=================================================="
echo ""

# Ensure we have the latest championship index.html
if [ ! -f "index.html" ]; then
    echo "❌ index.html not found!"
    exit 1
fi

# Check if index.html has Three.js
if grep -q "THREE.Scene" index.html && grep -q "Chart.js" index.html; then
    echo "✅ index.html contains championship features"
else
    echo "⚠️  index.html missing championship features, copying from index-fixed.html"
    cp index-fixed.html index.html
fi

echo ""
echo "📦 Deploying to all projects..."
echo ""

# Deploy to LSL project
echo "1️⃣ Deploying to blaze-intelligence-lsl..."
wrangler pages deploy . --project-name=blaze-intelligence-lsl --commit-dirty=true
echo ""

# Deploy to main project  
echo "2️⃣ Deploying to blaze-intelligence..."
wrangler pages deploy . --project-name=blaze-intelligence --commit-dirty=true
echo ""

# Try to purge cache (if we have access)
echo "3️⃣ Attempting cache purge..."
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}' 2>/dev/null || echo "Cache purge requires API credentials"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Test URLs:"
echo "  - https://release-v1-0.blaze-intelligence-lsl.pages.dev/ (should work immediately)"
echo "  - https://release-v1-0.blaze-intelligence.pages.dev/ (should work immediately)"
echo "  - https://3eca9ea9.blaze-intelligence-lsl.pages.dev/ (may take 5-10 min for cache)"
echo "  - https://63323970.blaze-intelligence.pages.dev/ (may take 5-10 min for cache)"
echo ""
echo "Run ./verify-championship-deployment.sh in 10 minutes to confirm all sites upgraded"