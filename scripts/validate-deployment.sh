#!/bin/bash

# Blaze Intelligence - Deployment Validation Script
# Tests all critical URLs and redirects after deployment

set -euo pipefail

# Configuration
SITE_URL="https://blaze-intelligence.pages.dev"
BACKUP_SITE_URL="https://d5404891.blaze-intelligence.pages.dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Utility functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test a URL and return status code
test_url() {
    local url="$1"
    local expected_status="${2:-200}"
    local description="$3"
    
    echo -n "Testing $description... "
    
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} ($status_code)"
        return 0
    else
        echo -e "${RED}✗${NC} (Expected: $expected_status, Got: $status_code)"
        return 1
    fi
}

# Test redirect
test_redirect() {
    local from_url="$1"
    local expected_location="$2"
    local description="$3"
    
    echo -n "Testing redirect $description... "
    
    local response_headers
    response_headers=$(curl -s -I "$from_url" 2>/dev/null || echo "")
    
    local status_code location
    status_code=$(echo "$response_headers" | grep -i "HTTP/" | awk '{print $2}' || echo "000")
    location=$(echo "$response_headers" | grep -i "location:" | cut -d' ' -f2- | tr -d '\r\n' || echo "")
    
    if [ "$status_code" = "301" ] && [[ "$location" == *"$expected_location"* ]]; then
        echo -e "${GREEN}✓${NC} (301 → $expected_location)"
        return 0
    else
        echo -e "${RED}✗${NC} (Status: $status_code, Location: $location)"
        return 1
    fi
}

# Test page content for key elements
test_content() {
    local url="$1"
    local search_text="$2"
    local description="$3"
    
    echo -n "Testing content $description... "
    
    local content
    content=$(curl -s "$url" 2>/dev/null || echo "")
    
    if [[ "$content" == *"$search_text"* ]]; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} (Content not found: $search_text)"
        return 1
    fi
}

# Main validation function
main() {
    echo "🔍 Blaze Intelligence - Deployment Validation"
    echo "============================================="
    echo ""
    
    local total_tests=0
    local passed_tests=0
    
    # Test 1: Homepage accessibility
    log_info "Testing homepage accessibility..."
    if test_url "$SITE_URL" "200" "Homepage"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    # Test 2: Key navigation sections
    log_info "Testing main navigation sections..."
    local nav_sections=("analytics" "capabilities" "games" "pricing" "company" "resources")
    
    for section in "${nav_sections[@]}"; do
        if test_url "$SITE_URL/$section/" "200" "/$section/ section"; then
            ((passed_tests++))
        fi
        ((total_tests++))
    done
    
    # Test 3: Critical redirects
    log_info "Testing critical 301 redirects..."
    local redirects=(
        "/statistics-dashboard-enhanced.html|/analytics/dashboard/|Statistics Dashboard"
        "/game.html|/games/baseball/|Game Demo"
        "/nil-trust-dashboard.html|/analytics/nil-valuation/|NIL Dashboard"
        "/presentations.html|/company/presentations/|Presentations"
        "/client-onboarding-enhanced.html|/onboarding/|Client Onboarding"
    )
    
    for redirect_test in "${redirects[@]}"; do
        IFS='|' read -r from_path to_path desc <<< "$redirect_test"
        if test_redirect "$SITE_URL$from_path" "$to_path" "$desc"; then
            ((passed_tests++))
        fi
        ((total_tests++))
    done
    
    # Test 4: SEO elements
    log_info "Testing SEO implementation..."
    
    if test_content "$SITE_URL" "<title>Blaze Intelligence" "Title tag"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    if test_content "$SITE_URL" 'meta name="description"' "Meta description"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    if test_content "$SITE_URL" 'link rel="canonical"' "Canonical URL"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    if test_content "$SITE_URL" '"@type": "Organization"' "Schema.org markup"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    # Test 5: Performance assets
    log_info "Testing performance assets..."
    
    if test_url "$SITE_URL/sitemap.xml" "200" "XML Sitemap"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    if test_url "$SITE_URL/robots.txt" "200" "Robots.txt"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    if test_content "$SITE_URL" "css/components.css" "Components CSS"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    if test_content "$SITE_URL" "js/core.js" "Core JavaScript"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    # Test 6: Security headers
    log_info "Testing security headers..."
    
    local headers_response
    headers_response=$(curl -s -I "$SITE_URL" 2>/dev/null || echo "")
    
    if echo "$headers_response" | grep -i "x-content-type-options" > /dev/null; then
        log_success "X-Content-Type-Options header present"
        ((passed_tests++))
    else
        log_error "X-Content-Type-Options header missing"
    fi
    ((total_tests++))
    
    if echo "$headers_response" | grep -i "x-frame-options" > /dev/null; then
        log_success "X-Frame-Options header present"
        ((passed_tests++))
    else
        log_error "X-Frame-Options header missing"
    fi
    ((total_tests++))
    
    if echo "$headers_response" | grep -i "content-security-policy" > /dev/null; then
        log_success "Content-Security-Policy header present"
        ((passed_tests++))
    else
        log_error "Content-Security-Policy header missing"
    fi
    ((total_tests++))
    
    # Final report
    echo ""
    echo "📊 VALIDATION RESULTS"
    echo "===================="
    echo "Tests Passed: $passed_tests/$total_tests"
    echo "Success Rate: $(( passed_tests * 100 / total_tests ))%"
    echo ""
    
    if [ "$passed_tests" -eq "$total_tests" ]; then
        log_success "🎉 All validation tests passed! Deployment is successful."
        echo ""
        echo "🚀 NEXT STEPS:"
        echo "1. Configure custom domain blaze-intelligence.com in Cloudflare dashboard"
        echo "2. Submit sitemap to Google Search Console: $SITE_URL/sitemap.xml"
        echo "3. Monitor Core Web Vitals and SEO migration performance"
        echo "4. Update any external references to point to new URLs"
        return 0
    else
        local failed_tests=$((total_tests - passed_tests))
        log_warning "⚠️  $failed_tests validation tests failed. Review issues above."
        echo ""
        echo "🔧 RECOMMENDED ACTIONS:"
        echo "1. Check Cloudflare Pages deployment logs"
        echo "2. Verify _redirects and _headers files are properly deployed"
        echo "3. Test problematic URLs manually"
        echo "4. Re-run deployment if necessary"
        return 1
    fi
}

# Handle script interruption
trap 'log_error "Validation interrupted!"; exit 1' INT TERM

# Run main validation
main "$@"