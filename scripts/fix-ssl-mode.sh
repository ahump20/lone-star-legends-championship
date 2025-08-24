#!/bin/bash

# SSL Mode Fix Script for blaze-intelligence.com
# This script provides instructions and automated testing

set -euo pipefail

echo "🔧 SSL MODE FIX - blaze-intelligence.com"
echo "======================================="
echo ""
echo "The Cloudflare dashboard should now be open in Chrome."
echo ""
echo "📋 MANUAL STEPS (5 minutes):"
echo "1. In the dashboard, find and click on 'blaze-intelligence.com'"
echo "2. Click 'SSL/TLS' in the left sidebar"
echo "3. Click 'Overview' tab"
echo "4. Change SSL mode from 'Flexible' to 'Full' or 'Full (Strict)'"
echo "5. Click 'Save'"
echo ""
echo "⏱️ WAITING FOR PROPAGATION..."
echo "Please complete the steps above, then press any key to test..."
read -n 1 -s

echo ""
echo "🧪 TESTING SSL FIX..."
echo ""

# Test loop
for i in {1..12}; do
    echo "Test $i/12: Checking HTTPS response..."
    
    response=$(curl -I -s --max-time 10 https://blaze-intelligence.com 2>/dev/null | head -1 || echo "TIMEOUT")
    
    if [[ "$response" == *"200"* ]]; then
        echo "✅ SUCCESS! Custom domain is working!"
        echo "🎉 https://blaze-intelligence.com is now LIVE!"
        echo ""
        echo "Testing all sections..."
        
        # Test key sections
        sections=("" "analytics" "games" "capabilities" "company" "pricing")
        for section in "${sections[@]}"; do
            url="https://blaze-intelligence.com/$section"
            if [ -z "$section" ]; then
                url="https://blaze-intelligence.com"
            fi
            
            status=$(curl -I -s --max-time 5 "$url" 2>/dev/null | head -1 | grep -o "[0-9][0-9][0-9]" || echo "ERR")
            if [[ "$status" == "200" ]]; then
                echo "✅ /$section - Working"
            else
                echo "⚠️  /$section - Status: $status"
            fi
        done
        
        echo ""
        echo "🚀 CUSTOM DOMAIN ACTIVATION: COMPLETE!"
        exit 0
        
    elif [[ "$response" == *"301"* ]]; then
        echo "⚠️  Still redirecting (SSL mode may not be propagated yet)"
        
    else
        echo "❌ Response: $response"
    fi
    
    if [ $i -lt 12 ]; then
        echo "Waiting 30 seconds for propagation..."
        sleep 30
    fi
done

echo ""
echo "⚠️  SSL fix may need more time to propagate."
echo "🔄 You can run this script again in a few minutes."
echo "💡 If issues persist, double-check the SSL mode is set to 'Full' in Cloudflare."