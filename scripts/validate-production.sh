#!/bin/bash

# Blaze Intelligence - Production Validation Script
# Validates all critical systems are operational

set -e

echo "🔥 Blaze Intelligence Production Validation"
echo "==========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation results
ERRORS=0
WARNINGS=0

# Function to check endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    status=$(curl -L -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} ($status)"
    else
        echo -e "${RED}✗${NC} (got $status, expected $expected_status)"
        ((ERRORS++))
    fi
}

# Function to check API health
check_api() {
    local endpoint=$1
    local name=$2
    
    echo -n "Testing $name API... "
    response=$(curl -s "$endpoint" || echo "{}")
    
    if echo "$response" | grep -q "error"; then
        echo -e "${YELLOW}⚠${NC} (API key may be required)"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✓${NC}"
    fi
}

echo "1. Website Availability"
echo "-----------------------"
check_endpoint "https://blaze-intelligence.pages.dev" "Main site"
check_endpoint "https://blaze-intelligence.pages.dev/index.html" "Homepage"
check_endpoint "https://blaze-intelligence.pages.dev/game.html" "Game page"
check_endpoint "https://blaze-intelligence.pages.dev/presentations.html" "Presentations"
echo ""

echo "2. API Endpoints"
echo "----------------"
check_endpoint "https://blaze-intelligence.pages.dev/api/health" "Health check"
check_endpoint "https://blaze-intelligence.pages.dev/api/teams" "Teams API"
check_endpoint "https://blaze-intelligence.pages.dev/api/players" "Players API"
check_endpoint "https://blaze-intelligence.pages.dev/api/sports" "Sports API"
echo ""

echo "3. Cloudflare Resources"
echo "-----------------------"
echo -n "Checking D1 database... "
if npx wrangler d1 list 2>/dev/null | grep -q "blaze-db"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ((ERRORS++))
fi

echo -n "Checking KV namespaces... "
kv_count=$(npx wrangler kv:namespace list 2>/dev/null | grep -c "binding" || echo "0")
if [ "$kv_count" -ge "3" ]; then
    echo -e "${GREEN}✓${NC} ($kv_count namespaces)"
else
    echo -e "${YELLOW}⚠${NC} (only $kv_count namespaces found)"
    ((WARNINGS++))
fi
echo ""

echo "4. Data Freshness"
echo "-----------------"
echo -n "Checking readiness data... "
if [ -f "site/src/data/readiness.json" ]; then
    age=$(( ($(date +%s) - $(stat -f %m "site/src/data/readiness.json")) / 60 ))
    if [ "$age" -lt "60" ]; then
        echo -e "${GREEN}✓${NC} (updated $age minutes ago)"
    else
        echo -e "${YELLOW}⚠${NC} (updated $age minutes ago)"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC} (file not found)"
    ((ERRORS++))
fi
echo ""

echo "5. External APIs"
echo "----------------"
check_api "https://statsapi.mlb.com/api/v1/teams/138" "MLB Stats"
check_api "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams" "ESPN"
echo ""

echo "6. Security & Configuration"
echo "---------------------------"
echo -n "Checking for exposed secrets... "
if grep -r "sk-\|ghp_\|pk_test\|pk_live" . --exclude-dir=.git --exclude-dir=node_modules 2>/dev/null | grep -v ".example" | grep -v "REDACTED"; then
    echo -e "${RED}✗${NC} (secrets found in code!)"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC}"
fi

echo -n "Checking .env.example... "
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} (missing .env.example)"
    ((WARNINGS++))
fi
echo ""

echo "7. Performance Metrics"
echo "----------------------"
echo -n "Measuring homepage load time... "
load_time=$(curl -s -o /dev/null -w "%{time_total}" "https://blaze-intelligence.pages.dev")
load_ms=$(echo "$load_time * 1000" | bc | cut -d. -f1)

if [ "$load_ms" -lt "1000" ]; then
    echo -e "${GREEN}✓${NC} (${load_ms}ms)"
elif [ "$load_ms" -lt "3000" ]; then
    echo -e "${YELLOW}⚠${NC} (${load_ms}ms - could be optimized)"
    ((WARNINGS++))
else
    echo -e "${RED}✗${NC} (${load_ms}ms - too slow)"
    ((ERRORS++))
fi

echo -n "Checking bundle size... "
total_size=$(find . -name "*.js" -o -name "*.css" | xargs du -ch 2>/dev/null | tail -1 | cut -f1)
echo -e "${GREEN}✓${NC} ($total_size)"
echo ""

echo "=========================================="
echo "Validation Complete"
echo ""

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}✅ All systems operational!${NC}"
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    echo "System is operational but could be optimized."
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
    echo "Critical issues detected. Please review and fix."
    exit 1
fi