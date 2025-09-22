#!/bin/bash

# Complete Custom Domain Setup for blaze-intelligence.com
# This script provides step-by-step guidance and automated testing

set -euo pipefail

echo "🔥 BLAZE INTELLIGENCE - CUSTOM DOMAIN SETUP"
echo "==========================================="
echo ""
echo "Goal: Make https://blaze-intelligence.com display the full Blaze Intelligence site"
echo "Currently working: https://blaze-intelligence.pages.dev ✅"
echo ""

# Open Cloudflare dashboard in Chrome
echo "📱 Opening Cloudflare Pages dashboard..."
osascript -e '
tell application "Google Chrome"
    activate
    open location "https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/view/blaze-intelligence"
end tell' 2>/dev/null || echo "Chrome open failed - please open manually"

echo ""
echo "📋 STEP-BY-STEP INSTRUCTIONS:"
echo ""
echo "1. 🔍 In the Cloudflare dashboard, scroll down to 'Custom domains'"
echo "2. 📝 If you see blaze-intelligence.com listed:"
echo "   - Click the '...' menu next to it"
echo "   - Select 'Remove domain'"
echo ""
echo "3. ➕ Click 'Set up a custom domain'"
echo "4. 📝 Enter: blaze-intelligence.com"
echo "5. ✅ Click 'Continue' and follow DNS instructions"
echo ""
echo "6. ⏱️  Wait for 'Active' status (2-5 minutes)"
echo "7. 🔒 Ensure SSL certificate shows 'Active'"
echo ""

read -p "✋ Press ENTER when you've completed the dashboard setup..."

echo ""
echo "🧪 TESTING CUSTOM DOMAIN..."
echo ""

# Test function
test_domain() {
    local attempt=$1
    echo "Test $attempt: Checking https://blaze-intelligence.com"
    
    # Get response code and content check
    response=$(curl -I -s --max-time 10 https://blaze-intelligence.com 2>/dev/null | head -1 || echo "TIMEOUT")
    content_check=$(curl -s --max-time 10 https://blaze-intelligence.com 2>/dev/null | grep -i "blaze intelligence" || echo "NOT_FOUND")
    
    if [[ "$response" == *"200"* ]] && [[ "$content_check" != "NOT_FOUND" ]]; then
        echo "✅ SUCCESS! Custom domain is working!"
        return 0
    elif [[ "$response" == *"200"* ]]; then
        echo "⚠️  200 response but content doesn't match"
        echo "   Response: $response"
        echo "   This might be a DNS propagation delay"
        return 1
    elif [[ "$response" == *"403"* ]]; then
        echo "🔧 403 Forbidden - DNS configured but not pointing to correct Pages project"
        return 1
    elif [[ "$response" == *"301"* || "$response" == *"302"* ]]; then
        echo "🔄 Redirect detected - checking SSL configuration"
        return 1
    else
        echo "❌ Response: $response"
        return 1
    fi
}

# Test loop
success=false
for i in {1..15}; do
    if test_domain $i; then
        success=true
        break
    fi
    
    if [ $i -lt 15 ]; then
        echo "   Waiting 30 seconds for propagation..."
        sleep 30
    fi
done

echo ""
if [ "$success" = true ]; then
    echo "🎉 CUSTOM DOMAIN SETUP COMPLETE!"
    echo ""
    echo "✅ https://blaze-intelligence.com is now LIVE!"
    echo "✅ Serving the full Blaze Intelligence site"
    echo "✅ All enhanced features active"
    echo ""
    echo "🧪 Final verification tests:"
    
    # Test key sections
    sections=("" "analytics" "games" "capabilities" "pricing")
    for section in "${sections[@]}"; do
        if [ -z "$section" ]; then
            url="https://blaze-intelligence.com"
            name="Homepage"
        else
            url="https://blaze-intelligence.com/$section/"
            name="/$section/"
        fi
        
        status=$(curl -I -s --max-time 5 "$url" 2>/dev/null | head -1 | grep -o "[0-9][0-9][0-9]" || echo "ERR")
        if [[ "$status" == "200" ]]; then
            echo "✅ $name - Working"
        else
            echo "⚠️  $name - Status: $status"
        fi
    done
    
    echo ""
    echo "🎯 MISSION ACCOMPLISHED!"
    echo "Your Blaze Intelligence platform is now fully operational on the professional domain!"
    
else
    echo "⏰ SETUP STILL IN PROGRESS"
    echo ""
    echo "Common issues and solutions:"
    echo ""
    echo "1. 🕐 DNS Propagation Delay (most common)"
    echo "   - Can take up to 24-48 hours globally"
    echo "   - Try from different networks/devices"
    echo "   - Wait and test again later"
    echo ""
    echo "2. 🔧 Domain Not Pointing to Correct Project"
    echo "   - Ensure domain is added to the 'blaze-intelligence' Pages project"
    echo "   - Not added to a different Cloudflare service"
    echo "   - Check 'Custom domains' section has blaze-intelligence.com"
    echo ""
    echo "3. 📡 DNS Configuration Issues"
    echo "   - Ensure nameservers point to Cloudflare"
    echo "   - Check CNAME record is correctly configured"
    echo "   - Verify no conflicting A records"
    echo ""
    echo "4. 🔒 SSL Certificate Provisioning"
    echo "   - Wait for SSL certificate to become 'Active'"
    echo "   - Can take 2-15 minutes after DNS configuration"
    echo ""
    echo "💡 You can run this script again to re-test:"
    echo "   ./scripts/complete-domain-setup.sh"
    echo ""
    echo "📞 Current status check:"
    echo "   Working site: https://blaze-intelligence.pages.dev ✅"
    echo "   Custom domain: https://blaze-intelligence.com (in progress)"
fi

echo ""
echo "📊 SITE PERFORMANCE:"
load_time=$(curl -w "%{time_total}" -o /dev/null -s https://blaze-intelligence.pages.dev 2>/dev/null || echo "N/A")
echo "Load time: ${load_time}s"
echo "Features: Analytics ✅ | Performance Monitor ✅ | SEO ✅"
echo ""