#!/bin/bash

# Blaze Intelligence - Production Secrets Configuration
# Sets up all required API keys and environment variables

set -e

echo "🔥 Blaze Intelligence - Production Configuration"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if secret exists
check_secret() {
    local secret_name=$1
    if npx wrangler secret list 2>/dev/null | grep -q "$secret_name"; then
        echo -e "${GREEN}✓${NC} $secret_name already configured"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $secret_name not configured"
        return 1
    fi
}

# Function to set a secret with validation
set_validated_secret() {
    local secret_name=$1
    local prompt_text=$2
    local validation_pattern=$3
    local example=$4
    
    if check_secret "$secret_name"; then
        echo -n "Update existing $secret_name? (y/N): "
        read update_choice
        if [[ ! "$update_choice" =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    while true; do
        echo -n "$prompt_text"
        if [ ! -z "$example" ]; then
            echo -n " (e.g., $example): "
        else
            echo -n ": "
        fi
        
        read -s secret_value
        echo ""
        
        if [ -z "$secret_value" ]; then
            echo -e "${YELLOW}Skipping $secret_name${NC}"
            return 0
        fi
        
        # Validate format if pattern provided
        if [ ! -z "$validation_pattern" ]; then
            if [[ ! "$secret_value" =~ $validation_pattern ]]; then
                echo -e "${RED}Invalid format. Please try again.${NC}"
                continue
            fi
        fi
        
        # Set the secret
        echo "$secret_value" | npx wrangler secret put "$secret_name" --name blaze-intelligence 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ $secret_name configured successfully${NC}"
        else
            echo -e "${RED}✗ Failed to set $secret_name${NC}"
        fi
        break
    done
}

echo "📊 Step 1: Sports Data API Configuration"
echo "----------------------------------------"
echo "These APIs provide real-time sports statistics and player data."
echo ""

# MLB Stats API (no key required)
echo -e "${GREEN}✓${NC} MLB Stats API: No key required (public API)"

# NFL/NBA via ESPN (no key required)
echo -e "${GREEN}✓${NC} ESPN API: No key required (public API)"

# SportsDataIO (paid)
set_validated_secret "SPORTSDATAIO_KEY" \
    "Enter SportsDataIO API key for NFL/NBA data" \
    "^[a-zA-Z0-9]{32}$" \
    "abc123def456..."

# CollegeFootballData
set_validated_secret "CFBD_KEY" \
    "Enter CollegeFootballData API key" \
    "^[a-zA-Z0-9\-]{36}$" \
    "uuid-format-key"

# Sportradar (optional)
set_validated_secret "SPORTRADAR_KEY" \
    "Enter Sportradar API key (optional)" \
    "^[a-zA-Z0-9\-]{20,}$" \
    ""

echo ""
echo "🔗 Step 2: Integration Services"
echo "--------------------------------"
echo "External services for CRM, payments, and collaboration."
echo ""

# Airtable
set_validated_secret "AIRTABLE_API_KEY" \
    "Enter Airtable API key" \
    "^key[a-zA-Z0-9]{14}$" \
    "keyXXXXXXXXXXXXXX"

set_validated_secret "AIRTABLE_BASE_ID" \
    "Enter Airtable Base ID" \
    "^app[a-zA-Z0-9]{14}$" \
    "appXXXXXXXXXXXXXX"

# Notion
set_validated_secret "NOTION_API_KEY" \
    "Enter Notion API key" \
    "^secret_[a-zA-Z0-9]{43}$" \
    "secret_XXXXX..."

set_validated_secret "NOTION_DATABASE_ID" \
    "Enter Notion Database ID" \
    "^[a-f0-9]{32}$" \
    "32-char-hex"

# HubSpot
set_validated_secret "HUBSPOT_API_KEY" \
    "Enter HubSpot API key" \
    "^pat-[a-z0-9\-]{36}$" \
    "pat-na1-XXXXX"

echo ""
echo "💳 Step 3: Payment Processing"
echo "-----------------------------"
echo "Payment gateway credentials for NIL transactions."
echo ""

# Stripe
set_validated_secret "STRIPE_SECRET_KEY" \
    "Enter Stripe Secret key" \
    "^sk_(test|live)_[a-zA-Z0-9]{24,}$" \
    "sk_test_XXXXX"

set_validated_secret "STRIPE_WEBHOOK_SECRET" \
    "Enter Stripe Webhook secret" \
    "^whsec_[a-zA-Z0-9]{32,}$" \
    "whsec_XXXXX"

# Square
set_validated_secret "SQUARE_ACCESS_TOKEN" \
    "Enter Square Access token" \
    "^EAAA[a-zA-Z0-9\-_]{40,}$" \
    "EAAAXXXXX"

echo ""
echo "🤖 Step 4: AI & Analytics"
echo "-------------------------"
echo "AI model endpoints and analytics services."
echo ""

# OpenAI (for advanced NLP)
set_validated_secret "OPENAI_API_KEY" \
    "Enter OpenAI API key (optional)" \
    "^sk-[a-zA-Z0-9]{48}$" \
    "sk-XXXXX"

# Anthropic (for Claude integration)
set_validated_secret "ANTHROPIC_API_KEY" \
    "Enter Anthropic API key (optional)" \
    "^sk-ant-[a-zA-Z0-9]{40,}$" \
    "sk-ant-XXXXX"

echo ""
echo "🔐 Step 5: Security & Authentication"
echo "------------------------------------"
echo ""

# JWT Secret
set_validated_secret "JWT_SECRET" \
    "Enter JWT secret (32+ chars)" \
    "^.{32,}$" \
    "your-very-long-secret-key-here"

# Session Secret
set_validated_secret "SESSION_SECRET" \
    "Enter Session secret (32+ chars)" \
    "^.{32,}$" \
    "another-very-long-secret-key"

echo ""
echo "📧 Step 6: Communication"
echo "------------------------"
echo ""

# SendGrid for emails
set_validated_secret "SENDGRID_API_KEY" \
    "Enter SendGrid API key" \
    "^SG\.[a-zA-Z0-9_\-]{22}\.[a-zA-Z0-9_\-]{43}$" \
    "SG.XXXXX"

# Twilio for SMS (optional)
set_validated_secret "TWILIO_ACCOUNT_SID" \
    "Enter Twilio Account SID" \
    "^AC[a-f0-9]{32}$" \
    "ACXXXXX"

set_validated_secret "TWILIO_AUTH_TOKEN" \
    "Enter Twilio Auth Token" \
    "^[a-f0-9]{32}$" \
    ""

echo ""
echo "🌐 Step 7: Domain & DNS"
echo "-----------------------"
echo ""

# Cloudflare
set_validated_secret "CLOUDFLARE_API_TOKEN" \
    "Enter Cloudflare API Token" \
    "^[a-zA-Z0-9_\-]{40}$" \
    ""

set_validated_secret "CLOUDFLARE_ACCOUNT_ID" \
    "Enter Cloudflare Account ID" \
    "^[a-f0-9]{32}$" \
    ""

echo ""
echo "================================================"
echo "📊 Configuration Summary"
echo "================================================"
echo ""

# Count configured secrets
TOTAL_SECRETS=$(npx wrangler secret list --name blaze-intelligence 2>/dev/null | grep -c "^│" || echo "0")

echo -e "Total secrets configured: ${GREEN}$TOTAL_SECRETS${NC}"
echo ""

echo "🔍 Verification Steps:"
echo "----------------------"
echo "1. Run: npx wrangler secret list --name blaze-intelligence"
echo "2. Test API connections: npm run test:api"
echo "3. Validate production: ./scripts/validate-production.sh"
echo ""

echo "📝 Environment File:"
echo "-------------------"
echo "Creating .env.production for local testing..."

cat > .env.production << EOF
# Blaze Intelligence Production Environment
# DO NOT COMMIT THIS FILE

NODE_ENV=production
ENVIRONMENT=production

# API Endpoints
API_BASE_URL=https://blaze-intelligence.pages.dev/api
CLOUDFLARE_PAGES_URL=https://blaze-intelligence.pages.dev

# Feature Flags
ENABLE_CHAMPION_ENIGMA=true
ENABLE_NIL_PREDICTIONS=true
ENABLE_MICRO_EXPRESSIONS=false
ENABLE_MULTIMODAL_TRANSFORMER=false

# Analytics
ANALYTICS_ENABLED=true
ERROR_TRACKING_ENABLED=true

# Cache Settings
CACHE_TTL=300
KV_CACHE_ENABLED=true

# Rate Limits
API_RATE_LIMIT=100
API_RATE_WINDOW=60

# Created: $(date)
EOF

echo -e "${GREEN}✓${NC} .env.production created"
echo ""

echo "🚀 Next Steps:"
echo "--------------"
echo "1. Configure domain DNS at your registrar:"
echo "   - Add CNAME: blaze-intelligence.com -> blaze-intelligence.pages.dev"
echo "2. Add custom domain in Cloudflare Pages dashboard"
echo "3. Run production validation: ./scripts/validate-production.sh"
echo "4. Deploy latest changes: git push origin main"
echo ""

echo -e "${GREEN}✅ Production configuration complete!${NC}"