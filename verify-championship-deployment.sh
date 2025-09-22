#!/bin/bash

# Verify Championship-Level Deployment Script
# Tests all Blaze Intelligence sites for proper features

echo "🏆 VERIFYING CHAMPIONSHIP-LEVEL DEPLOYMENT"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs to test
declare -a urls=(
    "https://3eca9ea9.blaze-intelligence-lsl.pages.dev/"
    "https://release-v1-0.blaze-intelligence-lsl.pages.dev/"
    "https://63323970.blaze-intelligence.pages.dev/"
    "https://release-v1-0.blaze-intelligence.pages.dev/"
)

# Features to check
check_features() {
    local url=$1
    local content=$(curl -s "$url")
    
    echo "Testing: $url"
    echo "----------------------------------------"
    
    # Check for Three.js
    if echo "$content" | grep -q "THREE.Scene"; then
        echo -e "${GREEN}✅ Three.js particle system${NC}"
    else
        echo -e "${RED}❌ Three.js missing${NC}"
    fi
    
    # Check for Chart.js
    if echo "$content" | grep -q "Chart.js"; then
        echo -e "${GREEN}✅ Chart.js visualizations${NC}"
    else
        echo -e "${RED}❌ Chart.js missing${NC}"
    fi
    
    # Check for video backgrounds
    if echo "$content" | grep -q "cloudflarestream.com"; then
        echo -e "${GREEN}✅ Cloudflare Stream videos${NC}"
    else
        echo -e "${YELLOW}⚠️  Video sources not found${NC}"
    fi
    
    # Check for GSAP animations
    if echo "$content" | grep -q "gsap\|ScrollTrigger"; then
        echo -e "${GREEN}✅ GSAP animations${NC}"
    else
        echo -e "${YELLOW}⚠️  GSAP not detected${NC}"
    fi
    
    # Check for glass morphism CSS
    if echo "$content" | grep -q "backdrop-filter\|glassmorphism"; then
        echo -e "${GREEN}✅ Glass morphism UI${NC}"
    else
        echo -e "${YELLOW}⚠️  Glass morphism CSS not found${NC}"
    fi
    
    # Check for real team data
    if echo "$content" | grep -q "Cardinals\|Titans\|Grizzlies\|Longhorns"; then
        echo -e "${GREEN}✅ Real team data${NC}"
    else
        echo -e "${RED}❌ Team data missing${NC}"
    fi
    
    # Check for loading screen
    if echo "$content" | grep -q "loading-screen\|loadingScreen"; then
        echo -e "${GREEN}✅ Loading screen${NC}"
    else
        echo -e "${YELLOW}⚠️  Loading screen not found${NC}"
    fi
    
    # Check page load time
    local start=$(date +%s%N)
    curl -s -o /dev/null "$url"
    local end=$(date +%s%N)
    local elapsed=$(( ($end - $start) / 1000000 ))
    
    if [ $elapsed -lt 2000 ]; then
        echo -e "${GREEN}✅ Fast load time: ${elapsed}ms${NC}"
    else
        echo -e "${YELLOW}⚠️  Slow load time: ${elapsed}ms${NC}"
    fi
    
    echo ""
}

# Test each URL
for url in "${urls[@]}"; do
    check_features "$url"
done

echo "=========================================="
echo "📊 SUMMARY"
echo ""

# Quick test of main features across all sites
total_sites=${#urls[@]}
working_sites=0

for url in "${urls[@]}"; do
    content=$(curl -s "$url")
    if echo "$content" | grep -q "THREE.Scene" && echo "$content" | grep -q "Chart.js"; then
        ((working_sites++))
        echo -e "${GREEN}✅ $url - Championship level${NC}"
    else
        echo -e "${RED}❌ $url - Needs upgrade${NC}"
    fi
done

echo ""
echo "Championship Sites: $working_sites/$total_sites"

if [ $working_sites -eq $total_sites ]; then
    echo -e "${GREEN}🏆 ALL SITES AT CHAMPIONSHIP LEVEL!${NC}"
else
    echo -e "${YELLOW}⚠️  Some sites still need upgrades${NC}"
    echo "Run: wrangler pages deploy . --project-name=<project-name> --commit-dirty=true"
fi