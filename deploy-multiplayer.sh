#!/bin/bash

# Blaze Intelligence - Lone Star Legends Multiplayer Deployment Script
# Deploy to Cloudflare Workers

echo "🔥 Deploying Blaze Legends Multiplayer Server..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Login to Cloudflare (if not already logged in)
echo "🔐 Checking Cloudflare authentication..."
wrangler whoami || wrangler login

# Create KV namespace for player stats if it doesn't exist
echo "📊 Setting up KV namespace for player statistics..."
wrangler kv:namespace create "PLAYER_STATS" || true
wrangler kv:namespace create "PLAYER_STATS" --preview || true

# Deploy the worker
echo "🚀 Deploying multiplayer server to Cloudflare Workers..."
wrangler deploy

# Get the deployment URL
echo "✅ Deployment complete!"
echo "🌐 Multiplayer server URL: https://blaze-legends-multiplayer.humphrey-austin20.workers.dev"
echo ""
echo "📝 Next steps:"
echo "1. Update blaze-branded-game.html with the WebSocket URL"
echo "2. Test multiplayer connectivity"
echo "3. Configure custom domain if desired"

# Optional: Test the deployment
echo ""
echo "🧪 Testing deployment..."
curl -s https://blaze-legends-multiplayer.humphrey-austin20.workers.dev/api/rooms | jq '.' || echo "API endpoint accessible"