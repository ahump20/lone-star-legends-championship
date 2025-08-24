#!/bin/bash

echo "🔍 Blaze Intelligence Domain Status Check"
echo "========================================="
echo ""

# Test apex domain
echo "1. Testing blaze-intelligence.com (apex domain):"
echo "   DNS Resolution:"
dig +short blaze-intelligence.com @1.1.1.1
if [ $? -eq 0 ] && [ -n "$(dig +short blaze-intelligence.com @1.1.1.1)" ]; then
    echo "   ✅ DNS resolves"
    curl -s -o /dev/null -w "   HTTP Status: %{http_code}\n" https://blaze-intelligence.com
else
    echo "   ❌ DNS not resolving yet"
fi
echo ""

# Test www subdomain
echo "2. Testing www.blaze-intelligence.com:"
echo "   DNS Resolution:"
dig +short www.blaze-intelligence.com @1.1.1.1
if [ $? -eq 0 ] && [ -n "$(dig +short www.blaze-intelligence.com @1.1.1.1)" ]; then
    echo "   ✅ DNS resolves"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.blaze-intelligence.com)
    echo "   HTTP Status: $STATUS"
    if [ "$STATUS" = "200" ]; then
        echo "   ✅ Site accessible"
    else
        echo "   ⚠️ Site returns $STATUS (needs to be moved to correct project)"
    fi
else
    echo "   ❌ DNS not resolving"
fi
echo ""

# Test Pages deployment
echo "3. Testing blaze-intelligence.pages.dev:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://blaze-intelligence.pages.dev)
echo "   HTTP Status: $STATUS"
if [ "$STATUS" = "200" ]; then
    echo "   ✅ Pages deployment working"
else
    echo "   ❌ Pages deployment issue"
fi
echo ""

# Test Worker
echo "4. Testing Worker API:"
curl -s https://blaze-intelligence-worker.humphrey-austin20.workers.dev/api/health | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'   Status: {data[\"status\"]}'); print(f'   ✅ Worker operational')" 2>/dev/null || echo "   ❌ Worker not responding"
echo ""

echo "========================================="
echo "📝 Next Steps:"
echo ""
if [ -z "$(dig +short blaze-intelligence.com @1.1.1.1)" ]; then
    echo "1. Add CNAME record for apex domain in Cloudflare DNS:"
    echo "   - Name: @ (or 'blaze-intelligence.com')"
    echo "   - Target: blaze-intelligence.pages.dev"
    echo "   - Proxy: ON"
fi

STATUS_WWW=$(curl -s -o /dev/null -w "%{http_code}" https://www.blaze-intelligence.com 2>/dev/null)
if [ "$STATUS_WWW" = "404" ]; then
    echo ""
    echo "2. Move www.blaze-intelligence.com to correct Pages project:"
    echo "   - Remove from 'blazeintelligence' project"
    echo "   - Add to 'blaze-intelligence' project"
fi