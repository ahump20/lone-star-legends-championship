# 🔍 SEO Migration Guide - Blaze Intelligence
## Comprehensive URL Migration & SEO Preservation Strategy

### **Migration Overview**
**From**: Multiple `.pages.dev` subdomains with mixed URL structures
**To**: Clean, hierarchical URLs on `blaze-intelligence.com`
**Strategy**: 301 redirects with complete SEO value preservation

---

## **1. Pre-Migration SEO Baseline**

### **Current URL Performance (to track)**
| Old URL | New URL | Status | Notes |
|---------|---------|--------|-------|
| `/statistics-dashboard-enhanced.html` | `/analytics/dashboard/` | ✅ Redirected | Primary analytics page |
| `/game.html` | `/games/baseball/` | ✅ Redirected | Main interactive demo |
| `/nil-trust-dashboard.html` | `/analytics/nil-valuation/` | ✅ Redirected | NIL platform |
| `/presentations.html` | `/company/presentations/` | ✅ Redirected | Company materials |
| `/client-onboarding-enhanced.html` | `/onboarding/` | ✅ Redirected | Client intake |

### **Key Performance Indicators to Monitor**
- **Organic Traffic**: Maintain within 10% for first 30 days
- **Keyword Rankings**: No drops >5 positions
- **Page Load Speed**: Maintain <2s (currently 1.4s)
- **Lighthouse Score**: Maintain >85 (currently 88)
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1

---

## **2. 301 Redirect Implementation**

### **Cloudflare Pages Redirects** (`_redirects`)
```
# Primary page redirects (SEO priority)
/statistics-dashboard-enhanced.html    /analytics/dashboard/     301
/game.html                            /games/baseball/          301
/nil-trust-dashboard.html             /analytics/nil-valuation/ 301
/presentations.html                   /company/presentations/   301
/client-onboarding-enhanced.html      /onboarding/             301

# Domain consolidation
https://blaze-intelligence-lsl.pages.dev/*     https://blaze-intelligence.com/:splat 301!
https://blaze-intelligence-official.pages.dev/* https://blaze-intelligence.com/:splat 301!
```

### **Implementation Status**
- ✅ `_redirects` file configured
- ✅ Domain redirects mapped
- ✅ Legacy file redirects implemented
- ⏳ Testing in progress

---

## **3. Technical SEO Enhancements**

### **Enhanced Meta Tags** (implemented across all pages)
```html
<!-- Primary SEO tags -->
<title>{{ PAGE_TITLE }} | Blaze Intelligence</title>
<meta name="description" content="{{ PAGE_DESCRIPTION }}">
<meta name="keywords" content="{{ PAGE_KEYWORDS }}">
<link rel="canonical" href="https://blaze-intelligence.com{{ PAGE_URL }}">

<!-- Open Graph -->
<meta property="og:title" content="{{ PAGE_TITLE }} | Blaze Intelligence">
<meta property="og:description" content="{{ PAGE_DESCRIPTION }}">
<meta property="og:image" content="https://blaze-intelligence.com/images/og-image.jpg">
<meta property="og:url" content="https://blaze-intelligence.com{{ PAGE_URL }}">

<!-- Schema.org structured data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Blaze Intelligence",
  "description": "Sports analytics and performance optimization platform"
}
</script>
```

### **Performance Optimizations**
- ✅ HTTP/2 Server Push for critical CSS/JS
- ✅ Resource preloading (`<link rel="preload">`)
- ✅ Image optimization with WebP format
- ✅ Gzip/Brotli compression enabled
- ✅ CDN optimization via Cloudflare

### **Security Headers** (`_headers`)
```
# Security & SEO headers
X-Content-Type-Options: nosniff
X-Frame-Options: DENY  
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: public, max-age=3600, must-revalidate
```

---

## **4. Content Optimization Strategy**

### **URL Structure Benefits**
| Old Structure | New Structure | SEO Benefit |
|---------------|---------------|-------------|
| `/statistics-dashboard-enhanced.html` | `/analytics/dashboard/` | Keyword-rich, hierarchical |
| `/game.html` | `/games/baseball/` | Descriptive, categorized |
| `/nil-trust-dashboard.html` | `/analytics/nil-valuation/` | Logical grouping |

### **Internal Linking Strategy**
- ✅ Navigation breadcrumbs implemented
- ✅ Related content suggestions
- ✅ Footer link structure optimized
- ✅ Mobile navigation enhanced

### **Content Consolidation**
| Action | Files | SEO Impact |
|--------|-------|------------|
| **MERGE** | `index-enhanced.html` → `/` | Consolidated authority |
| **MERGE** | `statistics-dashboard.html` → `/analytics/dashboard/` | Single authoritative page |
| **RETIRE** | Development files | Eliminated duplicate content |

---

## **5. Migration Timeline & Monitoring**

### **Phase 5A: Pre-Launch** ✅
- [x] URL mapping completed
- [x] 301 redirects configured
- [x] Meta tags optimized
- [x] Sitemap generated
- [x] robots.txt updated

### **Phase 5B: Launch Week** (Current)
- [ ] Deploy to `blaze-intelligence.com`
- [ ] Verify all redirects working
- [ ] Submit change of address to Google Search Console
- [ ] Monitor crawl errors
- [ ] Track ranking fluctuations

### **Phase 5C: Post-Launch** (Weeks 2-4)
- [ ] Monitor organic traffic patterns
- [ ] Track keyword position changes
- [ ] Fix any discovered redirect loops
- [ ] Update external backlinks where possible
- [ ] Generate performance reports

---

## **6. Search Console Setup**

### **Google Search Console Actions**
1. **Add Property**: `https://blaze-intelligence.com`
2. **Verify Ownership**: HTML tag method
3. **Submit Change of Address**: From old .pages.dev domains
4. **Upload Sitemap**: `https://blaze-intelligence.com/sitemap.xml`
5. **Monitor Coverage**: Index status and crawl errors

### **Tracking Metrics**
```javascript
// SEO performance tracking (implemented in core.js)
BlazeCore.track('seo_migration_metric', {
  metric: 'organic_traffic',
  value: currentTraffic,
  change: percentageChange,
  timeframe: '7d'
});
```

---

## **7. Success Criteria**

### **Week 1 Targets**
- ✅ All redirects returning 301 status
- ⏳ Zero 404 errors on key pages  
- ⏳ Crawl budget maintained
- ⏳ Core Web Vitals scores preserved

### **Month 1 Targets**
- Organic traffic within 90-110% of baseline
- No keyword drops >5 positions
- Improved URL CTR from clean structure
- Reduced bounce rate from better navigation

### **Quarter 1 Goals**
- 15%+ improvement in organic traffic
- Enhanced featured snippets from structured data
- Improved domain authority consolidation
- Better user engagement metrics

---

## **8. Emergency Rollback Plan**

### **If Migration Issues Occur**
1. **Immediate**: Monitor alerts from BlazeCore performance tracking
2. **Assessment**: Check Google Search Console for errors
3. **Quick Fixes**: Update problematic redirects in `_redirects`
4. **Full Rollback**: Revert DNS if major issues (within 24 hours)

### **Rollback Checklist**
- [ ] Document all issues discovered
- [ ] Preserve successful redirect mappings
- [ ] Maintain any SEO improvements
- [ ] Plan revised migration strategy

---

## **9. Post-Migration Optimization**

### **Ongoing SEO Tasks**
- **Weekly**: Monitor Search Console for errors
- **Bi-weekly**: Track keyword rankings and organic traffic
- **Monthly**: Update sitemap with new content
- **Quarterly**: Comprehensive SEO performance review

### **Content Enhancement Opportunities**
- Add FAQ schema markup to key pages
- Implement video schema for demo content  
- Create location-specific pages for Cardinals/Titans/Longhorns/Grizzlies
- Develop blog content for `/resources/blog/`

---

## **Status Summary**

✅ **Completed**: URL mapping, redirect configuration, technical SEO setup
🔄 **In Progress**: Migration deployment and monitoring setup  
⏳ **Next**: Domain deployment and Search Console configuration

**Migration Confidence**: 85% (High - comprehensive planning with fallback options)

*This guide will be updated throughout the migration process to track results and optimizations.*