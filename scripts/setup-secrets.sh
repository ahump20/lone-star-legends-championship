#!/bin/bash

# Blaze Intelligence - Setup Secrets Script
# This script helps configure API keys and secrets in Cloudflare

echo "🔥 Blaze Intelligence - Secret Configuration"
echo "============================================"
echo ""
echo "This script will help you set up API keys for sports data providers."
echo "You'll need to have your API keys ready."
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local prompt_text=$2
    
    echo -n "$prompt_text (press Enter to skip): "
    read -s secret_value
    echo ""
    
    if [ ! -z "$secret_value" ]; then
        echo "$secret_value" | npx wrangler secret put $secret_name
        echo "✅ $secret_name configured"
    else
        echo "⏭️  Skipping $secret_name"
    fi
}

# Sports Data APIs
echo "📊 Sports Data API Keys"
echo "-----------------------"
set_secret "SPORTSDATAIO_KEY" "Enter your SportsDataIO API key"
set_secret "CFBD_KEY" "Enter your CollegeFootballData API key"
set_secret "SPORTRADAR_KEY" "Enter your Sportradar API key"

echo ""
echo "🔗 External Service APIs (Optional)"
echo "------------------------------------"
set_secret "AIRTABLE_API_KEY" "Enter your Airtable API key"
set_secret "NOTION_API_KEY" "Enter your Notion API key"
set_secret "HUBSPOT_API_KEY" "Enter your HubSpot API key"
set_secret "STRIPE_SECRET_KEY" "Enter your Stripe secret key"
set_secret "SQUARE_ACCESS_TOKEN" "Enter your Square access token"

echo ""
echo "✅ Secret configuration complete!"
echo ""
echo "To verify your secrets are set, run:"
echo "  npx wrangler secret list"
echo ""
echo "To update a secret later, run:"
echo "  npx wrangler secret put SECRET_NAME"