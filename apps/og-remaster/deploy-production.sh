#!/bin/bash

# 🏆 Blaze Intelligence OG Remaster - Production Deployment
# Championship-ready deployment to multiple platforms

set -e

echo "🏆 BLAZE INTELLIGENCE OG REMASTER - PRODUCTION DEPLOYMENT"
echo "⚾ Deploying Championship Baseball to the Cloud..."
echo ""

# Configuration
PROJECT_NAME="blaze-og-remaster"
CLOUDFLARE_PROJECT="blaze-intelligence-og"
VERCEL_PROJECT="blaze-og-baseball"
DOMAIN="baseball.blaze-intelligence.com"

# Build production assets
echo "🔨 Building production bundle..."
npm run build:og-production

# Optimize assets
echo "⚡ Optimizing assets for production..."
npx terser apps/og-remaster/main.ts -o apps/og-remaster/dist/main.min.js --compress --mangle
npx cssnano apps/og-remaster/style.css apps/og-remaster/dist/style.min.css
npx html-minifier-terser apps/og-remaster/index.html -o apps/og-remaster/dist/index.html \
  --collapse-whitespace --remove-comments --minify-css --minify-js

# Generate production manifest
echo "📱 Creating production PWA manifest..."
node -e "
const manifest = require('./apps/og-remaster/manifest.json');
manifest.start_url = 'https://${DOMAIN}/';
manifest.scope = 'https://${DOMAIN}/';
require('fs').writeFileSync(
  './apps/og-remaster/dist/manifest.json',
  JSON.stringify(manifest, null, 2)
);
console.log('✅ Production manifest created');
"

# Deploy to Cloudflare Pages
deploy_cloudflare() {
  echo "☁️ Deploying to Cloudflare Pages..."
  
  if command -v wrangler &> /dev/null; then
    cd apps/og-remaster/dist
    wrangler pages deploy . \
      --project-name="$CLOUDFLARE_PROJECT" \
      --branch=main \
      --commit-message="Deploy OG Remaster $(date +%Y%m%d-%H%M%S)"
    cd ../../..
    
    echo "✅ Deployed to Cloudflare Pages"
    echo "🌐 URL: https://${CLOUDFLARE_PROJECT}.pages.dev"
  else
    echo "⚠️ Wrangler not installed. Skipping Cloudflare deployment."
  fi
}

# Deploy to Vercel
deploy_vercel() {
  echo "▲ Deploying to Vercel..."
  
  if command -v vercel &> /dev/null; then
    cd apps/og-remaster
    vercel --prod --name="$VERCEL_PROJECT" --yes
    cd ../..
    
    echo "✅ Deployed to Vercel"
    echo "🌐 URL: https://${VERCEL_PROJECT}.vercel.app"
  else
    echo "⚠️ Vercel CLI not installed. Skipping Vercel deployment."
  fi
}

# Deploy to GitHub Pages
deploy_github() {
  echo "🐙 Deploying to GitHub Pages..."
  
  # Create gh-pages branch if it doesn't exist
  git checkout -B gh-pages
  
  # Copy built files
  cp -r apps/og-remaster/dist/* .
  
  # Commit and push
  git add .
  git commit -m "Deploy OG Remaster to GitHub Pages $(date +%Y%m%d-%H%M%S)"
  git push origin gh-pages --force
  
  # Switch back to main branch
  git checkout main
  
  echo "✅ Deployed to GitHub Pages"
  echo "🌐 URL: https://yourusername.github.io/lone-star-legends-championship"
}

# Deploy to custom domain with SSL
setup_custom_domain() {
  echo "🌐 Setting up custom domain..."
  
  # Create CNAME file for GitHub Pages
  echo "$DOMAIN" > apps/og-remaster/dist/CNAME
  
  # DNS configuration instructions
  cat << EOF
  
📋 DNS CONFIGURATION REQUIRED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Add these records to your DNS provider:

Type: CNAME
Name: baseball
Value: ${CLOUDFLARE_PROJECT}.pages.dev
TTL: Auto

OR for Vercel:

Type: CNAME  
Name: baseball
Value: cname.vercel-dns.com
TTL: Auto
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
}

# Run performance tests
run_performance_tests() {
  echo "🧪 Running production performance tests..."
  
  # Test with Lighthouse CI
  if command -v lhci &> /dev/null; then
    lhci autorun \
      --collect.url="http://localhost:8080" \
      --assert.preset="lighthouse:recommended" \
      --assert.assertions.categories:performance=90 \
      --assert.assertions.categories:pwa=100 \
      --assert.assertions.categories:accessibility=90
  fi
  
  # Run custom performance audit
  node apps/og-remaster/performance-audit.cjs
}

# Deploy to CDN
deploy_cdn() {
  echo "🚀 Deploying to CDN..."
  
  # Upload to Cloudinary for asset hosting
  if [ -n "$CLOUDINARY_URL" ]; then
    npx cloudinary-cli upload apps/og-remaster/dist/assets/* \
      --folder="blaze-og-remaster" \
      --resource-type="auto"
    
    echo "✅ Assets deployed to Cloudinary CDN"
  fi
  
  # Upload to AWS S3 + CloudFront
  if command -v aws &> /dev/null; then
    aws s3 sync apps/og-remaster/dist/ s3://blaze-og-remaster/ \
      --delete \
      --cache-control "max-age=31536000, public"
    
    aws cloudfront create-invalidation \
      --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
      --paths "/*"
    
    echo "✅ Deployed to AWS CloudFront CDN"
  fi
}

# Main deployment flow
main() {
  echo "🎯 Select deployment target:"
  echo "1) Cloudflare Pages (Recommended)"
  echo "2) Vercel"
  echo "3) GitHub Pages"
  echo "4) All platforms"
  echo "5) Custom domain setup only"
  
  read -p "Enter choice (1-5): " choice
  
  case $choice in
    1) deploy_cloudflare ;;
    2) deploy_vercel ;;
    3) deploy_github ;;
    4) 
      deploy_cloudflare
      deploy_vercel
      deploy_github
      deploy_cdn
      ;;
    5) setup_custom_domain ;;
    *) echo "Invalid choice" ;;
  esac
  
  # Always run tests after deployment
  run_performance_tests
  
  echo ""
  echo "🏆 DEPLOYMENT COMPLETE!"
  echo "⚾ OG Remaster is live and ready for championship baseball!"
  echo ""
  echo "📊 Deployment Summary:"
  echo "   Build Size: $(du -sh apps/og-remaster/dist | cut -f1)"
  echo "   Files: $(find apps/og-remaster/dist -type f | wc -l)"
  echo "   Timestamp: $(date)"
  echo ""
  echo "🎯 Pattern Recognition Weaponized in Digital Baseball!"
}

# Run main deployment
main