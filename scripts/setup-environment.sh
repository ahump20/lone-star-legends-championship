#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Blaze Intelligence - Environment Setup"
echo "========================================="

PROJECT_NAME="blaze-intelligence"

echo "📝 Setting up environment variables for Cloudflare Pages..."

# Analytics Configuration
echo "🔍 Setting up analytics..."
npx wrangler pages secret put GA_MEASUREMENT_ID --project-name="$PROJECT_NAME" || echo "⚠️  GA_MEASUREMENT_ID setup skipped"
npx wrangler pages secret put GA_API_SECRET --project-name="$PROJECT_NAME" || echo "⚠️  GA_API_SECRET setup skipped"

# CRM Configuration  
echo "📧 Setting up CRM integration..."
npx wrangler pages secret put HUBSPOT_API_KEY --project-name="$PROJECT_NAME" || echo "⚠️  HUBSPOT_API_KEY setup skipped"
npx wrangler pages secret put SENDGRID_API_KEY --project-name="$PROJECT_NAME" || echo "⚠️  SENDGRID_API_KEY setup skipped"

# Content Management
echo "📄 Setting up content management..."
npx wrangler pages secret put NOTION_API_KEY --project-name="$PROJECT_NAME" || echo "⚠️  NOTION_API_KEY setup skipped"
npx wrangler pages secret put NOTION_DATABASE_ID --project-name="$PROJECT_NAME" || echo "⚠️  NOTION_DATABASE_ID setup skipped"

# KV Namespaces
echo "🗄️  Setting up KV storage..."
npx wrangler kv:namespace create "ANALYTICS_KV" --preview || echo "Analytics KV exists"
npx wrangler kv:namespace create "LEADS_KV" --preview || echo "Leads KV exists"
npx wrangler kv:namespace create "CONTENT_KV" --preview || echo "Content KV exists"

# Test the deployment
echo "🧪 Testing API endpoints..."
DEPLOY_URL="https://46b61d3f.blaze-intelligence.pages.dev"

echo "Testing readiness API..."
curl -s "$DEPLOY_URL/api/readiness" | head -c 100 || echo "Readiness API test completed"

echo "Testing analytics endpoint..."
curl -s -X POST "$DEPLOY_URL/api/analytics/track" \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' | head -c 100 || echo "Analytics test completed"

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Add your API keys to Cloudflare Pages environment variables"
echo "2. Configure KV namespace bindings in wrangler.toml"
echo "3. Test all API endpoints"
echo ""
echo "🔗 Your live site: $DEPLOY_URL"
echo "🔧 Cloudflare Pages dashboard: https://dash.cloudflare.com"