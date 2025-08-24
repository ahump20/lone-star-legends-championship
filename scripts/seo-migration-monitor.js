/**
 * SEO Migration Monitoring Script
 * Tracks redirect performance, page load times, and SEO metrics
 */

const SEOMigrationMonitor = {
  // Migration mapping for tracking
  urlMappings: [
    {
      old: '/statistics-dashboard-enhanced.html',
      new: '/analytics/dashboard/',
      priority: 'high',
      expectedTraffic: 25 // percentage of total traffic
    },
    {
      old: '/game.html',
      new: '/games/baseball/',
      priority: 'high',
      expectedTraffic: 20
    },
    {
      old: '/nil-trust-dashboard.html',
      new: '/analytics/nil-valuation/',
      priority: 'high',
      expectedTraffic: 15
    },
    {
      old: '/presentations.html',
      new: '/company/presentations/',
      priority: 'medium',
      expectedTraffic: 10
    },
    {
      old: '/client-onboarding-enhanced.html',
      new: '/onboarding/',
      priority: 'high',
      expectedTraffic: 12
    }
  ],

  // Domain mappings
  domainMappings: [
    'blaze-intelligence-lsl.pages.dev',
    'blaze-intelligence-official.pages.dev',
    'blaze-intelligence-website.pages.dev',
    'blaze-intelligence-site.pages.dev',
    'blaze-intelligence-enhanced.pages.dev'
  ],

  // Initialize monitoring
  async init() {
    console.log('🔍 Starting SEO Migration Monitor...');
    
    // Test all redirects
    await this.testRedirects();
    
    // Monitor performance metrics
    this.startPerformanceMonitoring();
    
    // Check SEO elements
    this.validateSEOElements();
    
    // Set up continuous monitoring
    this.setupContinuousMonitoring();
    
    console.log('✅ SEO Migration Monitor initialized successfully');
  },

  // Test all redirect mappings
  async testRedirects() {
    console.log('Testing redirect mappings...');
    const results = [];
    
    for (const mapping of this.urlMappings) {
      try {
        const result = await this.testSingleRedirect(mapping);
        results.push(result);
        console.log(`${result.status === 301 ? '✅' : '❌'} ${mapping.old} → ${mapping.new} (${result.status})`);
      } catch (error) {
        console.error(`❌ Error testing ${mapping.old}:`, error.message);
        results.push({
          ...mapping,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Track results
    if (window.BlazeCore) {
      window.BlazeCore.track('redirect_test_results', {
        totalTests: results.length,
        successful: results.filter(r => r.status === 301).length,
        failed: results.filter(r => r.status !== 301).length,
        timestamp: Date.now()
      });
    }
    
    return results;
  },

  // Test a single redirect
  async testSingleRedirect(mapping) {
    const response = await fetch(mapping.old, { 
      method: 'HEAD',
      redirect: 'manual' 
    });
    
    return {
      ...mapping,
      status: response.status,
      redirectLocation: response.headers.get('Location'),
      responseTime: performance.now()
    };
  },

  // Monitor Core Web Vitals and performance
  startPerformanceMonitoring() {
    console.log('Starting performance monitoring...');
    
    // Monitor LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackWebVital(entry);
        }
      });
      
      observer.observe({ 
        entryTypes: ['largest-contentful-paint', 'first-input', 'cumulative-layout-shift'] 
      });
    }
    
    // Monitor page load times
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      
      if (window.BlazeCore) {
        window.BlazeCore.track('page_load_performance', {
          loadTime: loadTime,
          url: window.location.pathname,
          timestamp: Date.now(),
          target: loadTime < 2000 ? 'met' : 'missed' // 2s target
        });
      }
      
      console.log(`📊 Page load time: ${loadTime}ms (Target: <2000ms)`);
    });
  },

  // Track individual Web Vitals
  trackWebVital(entry) {
    let rating;
    let target;
    
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        target = 2500;
        rating = entry.startTime < 2500 ? 'good' : entry.startTime < 4000 ? 'needs-improvement' : 'poor';
        break;
      case 'first-input':
        target = 100;
        rating = entry.processingStart - entry.startTime < 100 ? 'good' : 
                entry.processingStart - entry.startTime < 300 ? 'needs-improvement' : 'poor';
        break;
      case 'cumulative-layout-shift':
        target = 0.1;
        rating = entry.value < 0.1 ? 'good' : entry.value < 0.25 ? 'needs-improvement' : 'poor';
        break;
    }
    
    if (window.BlazeCore) {
      window.BlazeCore.track('core_web_vital', {
        metric: entry.entryType,
        value: entry.value || entry.startTime,
        rating: rating,
        target: target,
        url: window.location.pathname
      });
    }
    
    console.log(`📈 ${entry.entryType}: ${entry.value || entry.startTime}ms (${rating})`);
  },

  // Validate SEO elements on current page
  validateSEOElements() {
    console.log('Validating SEO elements...');
    const issues = [];
    const warnings = [];
    
    // Check title tag
    const title = document.querySelector('title');
    if (!title || title.textContent.length < 30 || title.textContent.length > 60) {
      issues.push('Title tag length should be 30-60 characters');
    }
    
    // Check meta description
    const description = document.querySelector('meta[name="description"]');
    if (!description || description.content.length < 120 || description.content.length > 160) {
      warnings.push('Meta description should be 120-160 characters');
    }
    
    // Check canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      issues.push('Missing canonical URL');
    } else if (canonical.href !== window.location.href) {
      console.log(`📋 Canonical URL: ${canonical.href}`);
    }
    
    // Check Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    
    if (!ogTitle || !ogDescription || !ogImage) {
      warnings.push('Missing Open Graph tags (og:title, og:description, og:image)');
    }
    
    // Check structured data
    const structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
      warnings.push('Missing structured data (JSON-LD)');
    }
    
    // Check H1 tag
    const h1Tags = document.querySelectorAll('h1');
    if (h1Tags.length === 0) {
      issues.push('Missing H1 tag');
    } else if (h1Tags.length > 1) {
      issues.push('Multiple H1 tags found');
    }
    
    // Track results
    if (window.BlazeCore) {
      window.BlazeCore.track('seo_validation', {
        issues: issues.length,
        warnings: warnings.length,
        url: window.location.pathname,
        timestamp: Date.now()
      });
    }
    
    // Log results
    if (issues.length > 0) {
      console.warn('❌ SEO Issues:', issues);
    }
    if (warnings.length > 0) {
      console.warn('⚠️ SEO Warnings:', warnings);
    }
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ SEO validation passed');
    }
    
    return { issues, warnings };
  },

  // Set up continuous monitoring
  setupContinuousMonitoring() {
    // Check redirects every 5 minutes
    setInterval(() => {
      this.testRedirects();
    }, 300000);
    
    // Monitor 404 errors
    window.addEventListener('error', (event) => {
      if (event.target.tagName === 'IMG' || event.target.tagName === 'LINK') {
        console.warn('❌ Resource failed to load:', event.target.src || event.target.href);
        
        if (window.BlazeCore) {
          window.BlazeCore.track('resource_load_error', {
            resource: event.target.src || event.target.href,
            type: event.target.tagName,
            url: window.location.pathname
          });
        }
      }
    });
    
    // Monitor user behavior for SEO signals
    let scrollDepth = 0;
    let maxScroll = 0;
    
    window.addEventListener('scroll', () => {
      scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollDepth > maxScroll) {
        maxScroll = scrollDepth;
      }
    });
    
    // Track scroll depth on page unload
    window.addEventListener('beforeunload', () => {
      if (window.BlazeCore && maxScroll > 0) {
        window.BlazeCore.track('user_engagement', {
          maxScrollDepth: maxScroll,
          timeOnPage: Date.now() - window.performanceStartTime,
          url: window.location.pathname
        });
      }
    });
    
    console.log('🔄 Continuous monitoring started');
  },

  // Generate migration report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      performance: {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
      },
      seo: this.validateSEOElements(),
      redirects: [], // Will be populated by testRedirects()
      coreWebVitals: {} // Will be populated by performance observer
    };
    
    console.log('📊 Migration Report:', report);
    return report;
  }
};

// Auto-initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    SEOMigrationMonitor.init();
  });
} else {
  SEOMigrationMonitor.init();
}

// Track initial page performance
window.performanceStartTime = Date.now();

// Export for global access
window.SEOMigrationMonitor = SEOMigrationMonitor;