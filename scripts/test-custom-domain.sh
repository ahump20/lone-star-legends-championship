#!/bin/bash

# Test Custom Domain Activation - blaze-intelligence.com
# Run this after completing Cloudflare Pages domain setup

set -euo pipefail

DOMAIN="blaze-intelligence.com"
FALLBACK_DOMAIN="blaze-intelligence.pages.dev"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🧪 Testing Custom Domain Activation"
echo "================================="
echo "Domain: https://$DOMAIN"
echo ""

# Test 1: Basic connectivity
echo -n "1. Basic connectivity... "
if curl -s --max-time 10 -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC} - Domain may still be propagating"
fi

# Test 2: SSL certificate
echo -n "2. SSL certificate... "
if curl -s --max-time 10 -I "https://$DOMAIN" 2>/dev/null | grep -q "HTTP/2"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ PENDING${NC} - SSL may still be provisioning"
fi

# Test 3: Content verification
echo -n "3. Content delivery... "
if curl -s --max-time 10 "https://$DOMAIN" 2>/dev/null | grep -q "Blaze Intelligence"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC} - Content not loading properly"
fi

# Test 4: Navigation sections
echo "4. Navigation sections:"
sections=("analytics" "capabilities" "games" "pricing" "company")
for section in "${sections[@]}"; do
    echo -n "   /${section}/... "
    if curl -s --max-time 5 -o /dev/null -w "%{http_code}" "https://$DOMAIN/$section/" | grep -q "200"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC}"
    fi
done

# Test 5: Performance
echo -n "5. Page load performance... "
load_time=$(curl -s -o /dev/null -w "%{time_total}" "https://$DOMAIN" 2>/dev/null || echo "0")
if (( $(echo "$load_time < 2.0" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} (${load_time}s)"
else
    echo -e "${YELLOW}⚠ SLOW${NC} (${load_time}s)"
fi

# Test 6: SEO elements
echo -n "6. SEO elements... "
content=$(curl -s --max-time 10 "https://$DOMAIN" 2>/dev/null || echo "")
if [[ "$content" == *"<title>"* ]] && [[ "$content" == *"meta name=\"description\""* ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo ""
echo "📊 DOMAIN STATUS SUMMARY"
echo "======================="

# Overall status check
if curl -s --max-time 5 "https://$DOMAIN" >/dev/null 2>&1; then
    echo -e "Status: ${GREEN}ACTIVE${NC}"
    echo "URL: https://$DOMAIN"
    echo "SSL: $(curl -s --max-time 5 -I "https://$DOMAIN" 2>/dev/null | head -1 || echo 'Checking...')"
    echo ""
    echo -e "${GREEN}🎉 SUCCESS: Custom domain is active!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update Google Analytics with new domain"
    echo "2. Submit sitemap to Google Search Console"
    echo "3. Update external references and backlinks"
    echo "4. Monitor DNS propagation globally"
else
    echo -e "Status: ${YELLOW}PENDING${NC}"
    echo ""
    echo "Domain activation still in progress:"
    echo "• DNS propagation: May take up to 48 hours"
    echo "• SSL certificate: Usually 2-15 minutes"
    echo "• CDN distribution: Usually instant"
    echo ""
    echo "Fallback URL: https://$FALLBACK_DOMAIN"
fi