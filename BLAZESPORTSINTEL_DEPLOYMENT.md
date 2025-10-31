# BlazeSportsIntel.com Production Deployment Guide

## 🔥 Overview
Complete production deployment guide for Sandlot Superstars and Blaze Intelligence platform to **BlazeSportsIntel.com**.

---

## 📋 Pre-Deployment Checklist

### ✅ Files Created/Updated
- [x] `index.html` - Production-ready homepage with full Blaze branding
- [x] `blaze-branded-game.html` - Branded game launcher page
- [x] `blaze-analytics-integration.html` - Analytics dashboard
- [x] `blaze-portfolio-showcase.html` - Portfolio showcase
- [x] `fbs-coverage-integration.html` - FBS football coverage
- [x] `_headers` - Security headers with XSS protection
- [x] `_routes.json` - Routing configuration

### ✅ SEO & Meta Tags
- [x] Viewport meta tag on all pages
- [x] Open Graph tags for social media
- [x] Twitter Card metadata
- [x] Structured data (JSON-LD) for search engines
- [x] H1 tags on all pages
- [x] Meta descriptions
- [x] Canonical URLs

### ✅ Security
- [x] X-XSS-Protection enabled
- [x] Content Security Policy (CSP) configured
- [x] X-Frame-Options: SAMEORIGIN
- [x] X-Content-Type-Options: nosniff
- [x] HSTS with includeSubDomains
- [x] Referrer-Policy configured
- [x] Cross-Origin policies set

### ✅ Performance
- [x] Asset caching configured
- [x] Resource preloading
- [x] Service Worker for PWA
- [x] Mobile-responsive design
- [x] Lazy loading implemented

---

## 🌐 Recommended URL Structure

### Primary Routes
```
https://blazesportsintel.com/
├── /                                    # Homepage
├── /blaze-branded-game.html            # Main game launcher
├── /blaze-analytics-integration.html   # Analytics dashboard
├── /blaze-portfolio-showcase.html      # Portfolio
├── /fbs-coverage-integration.html      # FBS coverage
│
├── /games/
│   ├── /baseball/                      # Baseball game routes
│   │   ├── /index.html                 # Main game
│   │   ├── /character-creator.html     # Character customization
│   │   ├── /team-builder.html          # Team management
│   │   ├── /tournaments.html           # Tournament mode
│   │   ├── /stadiums.html              # Stadium selection
│   │   ├── /leaderboard.html           # Leaderboards
│   │   └── /multiplayer.html           # Multiplayer lobby
│
├── /api/                               # API endpoints
│   ├── /analytics                      # Analytics tracking
│   ├── /leaderboard                    # Leaderboard data
│   └── /multiplayer                    # Multiplayer WebSocket
│
└── /analytics/                         # Analytics pages
    ├── /cardinals                      # Cardinals analytics
    ├── /titans                         # Titans analytics
    ├── /longhorns                      # Longhorns analytics
    └── /grizzlies                      # Grizzlies analytics
```

---

## 🚀 Deployment Steps

### 1. Environment Variables
Set these in your Cloudflare Pages dashboard or via CLI:

```bash
# Production Environment
ENVIRONMENT=production
API_BASE_URL=https://api.blazesportsintel.com
CACHE_TTL=3600

# Optional: Analytics & Monitoring
SENTRY_DSN=your_sentry_dsn_here
GOOGLE_ANALYTICS_ID=your_ga_id_here
```

### 2. Deploy to Cloudflare Pages

#### Option A: GitHub Integration (Recommended)
1. Connect your GitHub repository to Cloudflare Pages
2. Set build configuration:
   ```
   Build command: npm run build
   Build output directory: ./
   Root directory: /
   ```
3. Configure custom domain: `blazesportsintel.com`
4. Enable automatic deployments on `main` branch

#### Option B: Manual Deployment via CLI
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to production
wrangler pages deploy ./ --project-name=blaze-intelligence

# Set custom domain
wrangler pages domains add blazesportsintel.com --project-name=blaze-intelligence
```

### 3. DNS Configuration
Point your domain to Cloudflare Pages:

```
A     @       192.0.2.1     (Cloudflare's IP - use actual from dashboard)
CNAME www     blaze-intelligence.pages.dev
```

### 4. SSL/TLS Configuration
- Enable "Full (strict)" SSL/TLS mode in Cloudflare dashboard
- Enable "Always Use HTTPS"
- Enable HTTP/3 (QUIC)
- Configure HSTS settings (already in `_headers`)

---

## 📊 Monitoring & Analytics Setup

### Sentry Error Tracking
Add to all HTML pages (already in index.html):
```html
<script src="https://js.sentry-cdn.com/YOUR_SENTRY_KEY.min.js"></script>
<script>
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: 'production',
    release: 'blaze-intelligence@3.0.0'
  });
</script>
```

### Google Analytics 4
```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Custom Analytics (Blaze Analytics)
The platform includes built-in analytics tracking:
```javascript
window.blazeAnalytics.track('event_name', {
  property1: 'value1',
  property2: 'value2'
});
```

---

## 🔧 Post-Deployment Configuration

### 1. Test All Routes
```bash
# Homepage
curl -I https://blazesportsintel.com/

# Game launcher
curl -I https://blazesportsintel.com/blaze-branded-game.html

# Analytics
curl -I https://blazesportsintel.com/blaze-analytics-integration.html

# Verify security headers
curl -I https://blazesportsintel.com/ | grep -i "x-xss\|x-frame\|content-security"
```

### 2. Performance Testing
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --url=https://blazesportsintel.com/

# WebPageTest
# Visit: https://www.webpagetest.org/
```

### 3. SEO Verification
- Submit sitemap: `https://blazesportsintel.com/sitemap.xml`
- Google Search Console verification
- Bing Webmaster Tools verification
- Test structured data: https://search.google.com/test/rich-results

---

## 🎮 Game-Specific Configuration

### WebSocket Configuration
For multiplayer features, ensure WebSocket endpoint is accessible:
```javascript
const ws = new WebSocket('wss://api.blazesportsintel.com/multiplayer');
```

### CDN Resources
All external resources are loaded from CDNs with proper CSP:
- Three.js: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- Chart.js: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`
- Fonts: Google Fonts (Inter, Space Grotesk)

---

## 📱 PWA Configuration

### Install Prompts
The game is installable as a PWA. Users can install via:
- Chrome: "Install" button in address bar
- Safari: "Add to Home Screen"
- Edge: "Install" from menu

### Offline Support
Service Worker caches:
- HTML pages
- CSS/JS assets
- Images
- Game data

---

## 🔍 Testing Checklist

### Functionality
- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Game launches and runs at 60 FPS
- [ ] Analytics dashboard displays data
- [ ] Mobile responsive design works
- [ ] PWA installs successfully
- [ ] Offline mode functions

### Security
- [ ] HTTPS enabled sitewide
- [ ] Security headers present (X-XSS-Protection, CSP, etc.)
- [ ] No mixed content warnings
- [ ] XSS protection verified
- [ ] CORS configured correctly

### SEO
- [ ] All pages have unique titles
- [ ] Meta descriptions present
- [ ] Open Graph tags working
- [ ] Structured data validates
- [ ] Sitemap accessible
- [ ] robots.txt configured

### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Assets properly cached
- [ ] Images optimized

---

## 🚨 Troubleshooting

### Issue: Security Headers Not Applied
**Solution**: Verify `_headers` file is in root directory and properly formatted.

### Issue: Game Not Loading
**Solution**: Check browser console for CSP violations. Update CSP in `_headers` if needed.

### Issue: PWA Not Installing
**Solution**: Ensure `manifest.json` and `sw.js` are accessible. Check service worker registration.

### Issue: Analytics Not Tracking
**Solution**: Verify analytics script loads. Check Content-Security-Policy allows analytics domain.

---

## 📞 Support

### Resources
- **Documentation**: `/SANDLOT_SUPERSTARS_README.md`
- **Character Guide**: `/CHARACTER_DETAILS_COMPENDIUM.md`
- **Stadium Guide**: `/STADIUM_DETAILS_COMPENDIUM.md`

### Contact
- **Email**: support@blazesportsintel.com
- **Issues**: https://github.com/ahump20/lone-star-legends-championship/issues

---

## 🎉 Launch Checklist

Final steps before announcing launch:

- [ ] All validation tests pass
- [ ] Production environment variables set
- [ ] DNS properly configured
- [ ] SSL certificate active
- [ ] Monitoring dashboards configured
- [ ] Analytics tracking verified
- [ ] Social media cards tested
- [ ] Press kit prepared
- [ ] Support channels ready

**Congratulations on your production deployment! 🔥⚾🏈🏀**

---

*Last Updated: 2025-10-31*
*Version: 3.0.0*
*Platform: Cloudflare Pages*
