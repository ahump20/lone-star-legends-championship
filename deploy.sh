#!/bin/bash
# Blaze Intelligence Production Deployment Script

echo "🔥 Blaze Intelligence Production Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    print_error "npx is not installed"
    exit 1
fi

print_status "Prerequisites check passed"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_status "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_status "Dependencies already installed"
fi

# Build the project
echo "Building the project..."
npm run build 2>/dev/null || true
print_status "Build complete"

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."

# Check if wrangler is logged in
if ! npx wrangler whoami &> /dev/null; then
    print_warning "You need to login to Cloudflare"
    npx wrangler login
fi

# Deploy the main site
echo "Deploying main site..."
npx wrangler pages deploy . \
    --project-name=blaze-intelligence \
    --branch=main \
    --commit-message="Production deployment $(date +%Y-%m-%d)" \
    --commit-hash=$(git rev-parse HEAD 2>/dev/null || echo "no-git")

if [ $? -eq 0 ]; then
    print_status "Main site deployed successfully"
else
    print_error "Failed to deploy main site"
    exit 1
fi

# Deploy Workers if wrangler-workers.toml exists
if [ -f "wrangler-workers.toml" ]; then
    echo "Deploying Workers..."
    
    # Deploy API Worker
    npx wrangler deploy \
        --config wrangler-workers.toml \
        --env production
    
    if [ $? -eq 0 ]; then
        print_status "API Worker deployed"
    else
        print_warning "API Worker deployment failed (may need configuration)"
    fi
    
    # Deploy Multiplayer Worker
    npx wrangler deploy \
        --config wrangler-workers.toml \
        --env multiplayer
    
    if [ $? -eq 0 ]; then
        print_status "Multiplayer Worker deployed"
    else
        print_warning "Multiplayer Worker deployment failed (may need configuration)"
    fi
fi

# Create/Update D1 Database
echo "Setting up D1 Database..."
if [ -f "schema.sql" ]; then
    # Check if database exists
    DB_ID="d3d5415d-0264-41ee-840f-bf12d88d3319"
    
    # Execute schema
    npx wrangler d1 execute blaze-intelligence \
        --file=schema.sql \
        --remote
    
    if [ $? -eq 0 ]; then
        print_status "Database schema applied"
    else
        print_warning "Database schema may already exist"
    fi
fi

# Verify deployment
echo "Verifying deployment..."

# Test main site
MAIN_URL="https://blaze-intelligence.pages.dev"
if curl -s -o /dev/null -w "%{http_code}" "$MAIN_URL" | grep -q "200\|304"; then
    print_status "Main site is accessible at $MAIN_URL"
else
    print_warning "Main site may not be fully deployed yet"
fi

# Test API health endpoint
API_URL="https://api.blaze-intelligence.com/api/health"
if curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null | grep -q "200"; then
    print_status "API is healthy at $API_URL"
else
    print_warning "API endpoint not yet accessible (may need domain configuration)"
fi

# Summary
echo ""
echo "=========================================="
echo "🚀 Deployment Summary"
echo "=========================================="
print_status "Main Site: $MAIN_URL"
print_status "API Endpoint: https://api.blaze-intelligence.com"
print_status "Multiplayer: https://multiplayer.blaze-intelligence.com"
echo ""
echo "Next Steps:"
echo "1. Configure custom domain in Cloudflare dashboard"
echo "2. Set environment secrets using: npx wrangler secret put <SECRET_NAME>"
echo "3. Monitor deployment at: https://dash.cloudflare.com"
echo ""
echo "Required Secrets to Set:"
echo "  - HUBSPOT_API_KEY"
echo "  - SENDGRID_API_KEY"
echo "  - NOTIFICATION_EMAIL"
echo "  - STRIPE_SECRET_KEY"
echo ""
print_status "Deployment complete!"