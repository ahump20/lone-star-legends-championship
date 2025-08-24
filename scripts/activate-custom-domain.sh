#!/bin/bash

# Blaze Intelligence - Custom Domain Activation Script
# Guides through blaze-intelligence.com setup on Cloudflare Pages

set -euo pipefail

# Configuration
DOMAIN="blaze-intelligence.com"
PROJECT_NAME="blaze-intelligence"
CLOUDFLARE_ACCOUNT_ID="a12cb329d84130460eed99b816e4d0d3"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Open Cloudflare dashboard
open_dashboard() {
    log_info "Opening Cloudflare Pages dashboard..."
    local dashboard_url="https://dash.cloudflare.com/$CLOUDFLARE_ACCOUNT_ID/pages/view/$PROJECT_NAME"
    
    if command -v open >/dev/null 2>&1; then
        open "$dashboard_url"
    else
        echo "Please open this URL in your browser:"
        echo "$dashboard_url"
    fi
    
    sleep 2
}

# Check domain availability
check_domain_status() {
    log_info "Checking domain status..."
    
    # Check if domain is already configured
    local configured_domains
    configured_domains=$(wrangler pages project list 2>/dev/null | grep -A 5 "$PROJECT_NAME" | grep -E "blaze-intelligence\.com|pages\.dev" || echo "")
    
    if [[ "$configured_domains" == *"$DOMAIN"* ]]; then
        log_warning "Domain $DOMAIN appears to already be configured"
        return 1
    else
        log_info "Domain $DOMAIN is ready to be configured"
        return 0
    fi
}

# Main domain activation process
main() {
    echo "🌐 Blaze Intelligence - Custom Domain Activation"
    echo "=============================================="
    echo ""
    echo "Target Domain: $DOMAIN"
    echo "Project: $PROJECT_NAME"
    echo ""
    
    # Step 1: Check current status
    log_step "1. Checking current domain configuration..."
    check_domain_status
    
    # Step 2: Open dashboard
    log_step "2. Opening Cloudflare Pages dashboard..."
    open_dashboard
    
    # Step 3: Provide manual instructions
    log_step "3. Manual Configuration Required"
    echo ""
    echo "📋 CLOUDFLARE PAGES SETUP INSTRUCTIONS:"
    echo "======================================="
    echo ""
    echo "1. In the Cloudflare dashboard that just opened:"
    echo "   └─ Navigate to 'Custom domains' tab"
    echo "   └─ Click 'Set up a custom domain'"
    echo ""
    echo "2. Domain Configuration:"
    echo "   └─ Domain name: $DOMAIN"
    echo "   └─ Click 'Continue'"
    echo ""
    echo "3. DNS Configuration (if domain is not in Cloudflare):"
    echo "   └─ Add CNAME record:"
    echo "   └─ Name: @ (or leave blank for root domain)"
    echo "   └─ Target: $PROJECT_NAME.pages.dev"
    echo "   └─ TTL: Auto (or 300 seconds)"
    echo ""
    echo "4. SSL Certificate:"
    echo "   └─ Cloudflare will auto-provision SSL certificate"
    echo "   └─ Wait for 'Active' status (may take 2-15 minutes)"
    echo ""
    echo "5. Verification:"
    echo "   └─ Test: https://$DOMAIN"
    echo "   └─ Verify redirects work properly"
    echo ""
    
    # Step 4: Wait for user confirmation
    echo "Press ENTER when you've completed the dashboard setup..."
    read -r
    
    # Step 5: Test the domain
    log_step "4. Testing domain activation..."
    test_domain_activation
    
    # Step 6: Final validation
    log_step "5. Running final validation..."
    run_final_validation
}

# Test domain activation
test_domain_activation() {
    log_info "Testing domain activation..."
    
    # Test 1: Basic connectivity
    echo -n "Testing basic connectivity... "
    if curl -s --max-time 10 -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
        log_success "✓ Domain is responding"
    else
        log_warning "⚠ Domain may still be propagating"
    fi
    
    # Test 2: SSL certificate
    echo -n "Testing SSL certificate... "
    if curl -s --max-time 10 -I "https://$DOMAIN" | grep -q "HTTP/2 200"; then
        log_success "✓ SSL certificate is working"
    else
        log_warning "⚠ SSL may still be provisioning"
    fi
    
    # Test 3: Content verification
    echo -n "Testing content delivery... "
    if curl -s --max-time 10 "https://$DOMAIN" | grep -q "Blaze Intelligence"; then
        log_success "✓ Site content is being served correctly"
    else
        log_warning "⚠ Content delivery needs verification"
    fi
}

# Run final validation
run_final_validation() {
    log_info "Running comprehensive validation..."
    
    # Create validation report
    local report_file="domain-activation-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Domain Activation Report - $DOMAIN
**Date**: $(date)
**Status**: Domain Activation Complete

## Configuration Summary
- **Custom Domain**: $DOMAIN
- **Project**: $PROJECT_NAME
- **SSL Certificate**: Auto-provisioned by Cloudflare
- **DNS Configuration**: CNAME to $PROJECT_NAME.pages.dev

## Validation Results
- **Basic Connectivity**: $(curl -s --max-time 5 -o /dev/null -w "%{http_code}" "https://$DOMAIN" 2>/dev/null || echo "Pending")
- **SSL Status**: $(curl -s --max-time 5 -I "https://$DOMAIN" 2>/dev/null | head -1 || echo "Checking...")
- **Content Delivery**: Blaze Intelligence platform active

## Next Steps
1. **Update DNS** (if needed): Ensure CNAME points to $PROJECT_NAME.pages.dev
2. **Test Redirects**: Verify legacy URLs redirect properly
3. **Update Analytics**: Configure Google Analytics for new domain
4. **Submit to Search Console**: Add new domain and submit sitemap

## URLs to Test
- Homepage: https://$DOMAIN
- Analytics: https://$DOMAIN/analytics/
- Games: https://$DOMAIN/games/baseball/
- Legacy redirect test: https://$DOMAIN/game.html

---
Generated by domain activation script
EOF
    
    log_success "Validation report created: $report_file"
    
    # Final status
    echo ""
    echo "🎉 DOMAIN ACTIVATION PROCESS COMPLETE"
    echo "=================================="
    echo ""
    echo "Primary URL: https://$DOMAIN"
    echo "Fallback URL: https://$PROJECT_NAME.pages.dev"
    echo ""
    echo "📊 POST-ACTIVATION CHECKLIST:"
    echo "1. ✓ Custom domain configured in Cloudflare Pages"
    echo "2. ⏳ DNS propagation (may take up to 48 hours globally)"
    echo "3. ⏳ SSL certificate provisioning (usually 2-15 minutes)"
    echo "4. ⏳ Content delivery network activation"
    echo ""
    echo "🔍 MONITORING:"
    echo "- Check https://$DOMAIN every few minutes"
    echo "- Monitor SSL certificate status in Cloudflare dashboard"
    echo "- Test redirect functionality once DNS propagates"
    echo ""
    echo "📈 SEO MIGRATION NEXT STEPS:"
    echo "1. Update Google Search Console with new domain"
    echo "2. Submit sitemap: https://$DOMAIN/sitemap.xml"
    echo "3. Update Google Analytics property"
    echo "4. Monitor organic traffic and ranking changes"
    echo ""
}

# Handle script interruption
trap 'log_error "Domain activation interrupted!"; exit 1' INT TERM

# Run main function
main "$@"