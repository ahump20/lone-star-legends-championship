#!/usr/bin/env bash
set -euo pipefail

echo "🔥 Blaze Intelligence - Custom Domain Setup"
echo "==========================================="

# Check for required environment variables
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    echo "❌ CLOUDFLARE_API_TOKEN environment variable not set"
    echo "Please set your Cloudflare API token:"
    echo "export CLOUDFLARE_API_TOKEN=your_token_here"
    exit 1
fi

# Domain configuration
DOMAIN="blaze-intelligence.com"
SUBDOMAIN="www.blaze-intelligence.com"
PROJECT_NAME="blaze-intelligence"

echo "📡 Setting up custom domain: $DOMAIN"

# Add custom domain to Cloudflare Pages
echo "🌐 Adding custom domain to Pages project..."
npx wrangler pages domain add "$DOMAIN" --project-name="$PROJECT_NAME"

# Add www subdomain
echo "🌐 Adding www subdomain..."
npx wrangler pages domain add "$SUBDOMAIN" --project-name="$PROJECT_NAME"

# Verify domain configuration
echo "✅ Verifying domain setup..."
npx wrangler pages domain list --project-name="$PROJECT_NAME"

echo ""
echo "🎯 Next Steps:"
echo "1. Update your domain's DNS settings:"
echo "   - Add CNAME record: $DOMAIN -> $PROJECT_NAME.pages.dev"
echo "   - Add CNAME record: $SUBDOMAIN -> $PROJECT_NAME.pages.dev"
echo ""
echo "2. Enable SSL in Cloudflare dashboard"
echo "3. Set up redirects from www to apex domain"
echo ""
echo "🔧 DNS Configuration Commands:"
echo "# For apex domain"
echo "wrangler pages domain add $DOMAIN --project-name=$PROJECT_NAME"
echo ""
echo "# For www subdomain"
echo "wrangler pages domain add $SUBDOMAIN --project-name=$PROJECT_NAME"
echo ""
echo "✨ Domain setup initiated! Check Cloudflare Pages dashboard for propagation status."