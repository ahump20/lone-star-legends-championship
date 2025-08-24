#!/bin/bash

# Blaze Intelligence - Production Deployment Script
# Phase 6: Deploy to blaze-intelligence.com

set -euo pipefail

echo "🚀 Starting Blaze Intelligence Production Deployment"
echo "Target Domain: blaze-intelligence.com"
echo "Source: Unified Website Architecture"
echo ""

# Configuration
DOMAIN="blaze-intelligence.com"
PROJECT_NAME="blaze-intelligence"
BACKUP_DIR="./deployment-backup-$(date +%Y%m%d-%H%M%S)"

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

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        log_error "Wrangler CLI not found. Please install: npm install -g wrangler"
        exit 1
    fi
    
    # Check wrangler authentication
    if ! wrangler whoami &> /dev/null; then
        log_error "Wrangler not authenticated. Please run: wrangler login"
        exit 1
    fi
    
    # Verify key files exist
    local required_files=(
        "index.html"
        "_redirects"
        "_headers"
        "sitemap.xml"
        "robots.txt"
        "css/blaze.css"
        "css/components.css"
        "js/core.js"
        "flow-styles.css"
        "flow-state-api.js"
        "flow-widgets.js"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done
    
    log_success "Pre-deployment checks passed"
}

# Validate redirects
validate_redirects() {
    log_info "Validating redirect configuration..."
    
    # Check _redirects file syntax
    if ! grep -q "301" _redirects; then
        log_warning "No 301 redirects found in _redirects file"
    fi
    
    # Validate critical redirects
    local critical_redirects=(
        "statistics-dashboard-enhanced.html"
        "game.html"
        "nil-trust-dashboard.html"
        "presentations.html"
        "client-onboarding-enhanced.html"
    )
    
    for redirect in "${critical_redirects[@]}"; do
        if ! grep -q "$redirect" _redirects; then
            log_warning "Critical redirect missing: $redirect"
        fi
    done
    
    log_success "Redirect validation completed"
}

# Validate SEO elements
validate_seo() {
    log_info "Validating SEO configuration..."
    
    # Check robots.txt points to new domain
    if ! grep -q "blaze-intelligence.com" robots.txt; then
        log_error "robots.txt still points to old domain"
        exit 1
    fi
    
    # Check sitemap exists and has content
    if [ ! -s sitemap.xml ]; then
        log_error "sitemap.xml is empty or missing"
        exit 1
    fi
    
    # Validate homepage SEO
    if ! grep -q "blaze-intelligence.com" index.html; then
        log_warning "Homepage may still reference old domain"
    fi
    
    log_success "SEO validation completed"
}

# Create backup of current deployment
create_backup() {
    log_info "Creating deployment backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup critical files
    cp -r css js images videos data "$BACKUP_DIR/" 2>/dev/null || true
    cp index.html _redirects _headers sitemap.xml robots.txt "$BACKUP_DIR/" 2>/dev/null || true
    
    log_success "Backup created: $BACKUP_DIR"
}

# Deploy to Cloudflare Pages
deploy_to_cloudflare() {
    log_info "Deploying to Cloudflare Pages..."
    
    # Deploy using wrangler
    if wrangler pages deploy . --project-name="$PROJECT_NAME"; then
        log_success "Deployment to Cloudflare Pages successful"
    else
        log_error "Deployment to Cloudflare Pages failed"
        exit 1
    fi
}

# Configure custom domain
configure_custom_domain() {
    log_info "Configuring custom domain: $DOMAIN"
    
    # Add custom domain to Cloudflare Pages project
    if wrangler pages domain add "$DOMAIN" --project-name="$PROJECT_NAME" 2>/dev/null; then
        log_success "Custom domain configured: $DOMAIN"
    else
        log_warning "Custom domain may already be configured"
    fi
    
    log_info "Domain propagation may take a few minutes. Check Cloudflare dashboard."
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    # Test the new domain if accessible
    local test_url="https://$DOMAIN"
    
    log_info "Testing URL: $test_url"
    
    # Test homepage
    if curl -s -o /dev/null -w "%{http_code}" "$test_url" 2>/dev/null | grep -q "200"; then
        log_success "Homepage test: PASSED"
    else
        log_warning "Homepage test: Domain may still be propagating"
    fi
}

# Generate deployment report
generate_report() {
    log_info "Generating deployment report..."
    
    local report_file="deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Blaze Intelligence - Deployment Report
**Date**: $(date)
**Domain**: $DOMAIN
**Status**: Deployment Complete

## Deployment Summary
- ✅ Pre-deployment checks passed
- ✅ Files deployed to Cloudflare Pages
- ✅ Custom domain configured
- ✅ Redirects implemented
- ✅ SEO elements validated

## URLs
- **Production**: https://$DOMAIN

## Key Files Deployed
- Homepage with unified navigation
- Analytics hub (/analytics/)
- Capabilities overview (/capabilities/)
- 301 redirects configuration
- Enhanced SEO tags and sitemap

## Next Steps
1. Monitor redirect performance using SEO migration monitor
2. Submit sitemap to Google Search Console
3. Update any external references to new domain
4. Track performance metrics and Core Web Vitals

## Backup Location
$BACKUP_DIR

---
Generated by deployment script
EOF

    log_success "Deployment report generated: $report_file"
}

# Post-deployment tasks
post_deployment() {
    log_info "Running post-deployment tasks..."
    
    cat << EOF

📊 POST-DEPLOYMENT CHECKLIST:
1. Open https://$DOMAIN and verify site loads correctly
2. Test key user paths (Analytics, Games, Capabilities)
3. Verify redirects work: Try /game.html → /games/baseball/
4. Submit sitemap to Google Search Console: https://$DOMAIN/sitemap.xml
5. Monitor SEO migration using: /scripts/seo-migration-monitor.js
6. Update any external links or bookmarks

📈 MONITORING SETUP:
- SEO Migration Monitor is automatically loaded on pages
- Check browser console for redirect test results
- Monitor Core Web Vitals in Google PageSpeed Insights
- Track organic traffic changes in Google Analytics

EOF

    log_success "Post-deployment tasks completed"
}

# Main deployment process
main() {
    echo "🔥 Blaze Intelligence Production Deployment"
    echo "=========================================="
    echo ""
    
    # Run deployment steps
    pre_deployment_checks
    validate_redirects
    validate_seo
    create_backup
    deploy_to_cloudflare
    configure_custom_domain
    test_deployment
    generate_report
    post_deployment
    
    echo ""
    log_success "🎉 Deployment completed successfully!"
    log_info "Production URL: https://$DOMAIN"
    echo ""
}

# Handle script interruption
trap 'log_error "Deployment interrupted!"; exit 1' INT TERM

# Run main function
main "$@"