/**
 * Blaze Intelligence Analytics System
 * Comprehensive tracking for performance optimization
 */

class BlazeAnalytics {
    constructor() {
        this.initialized = false;
        this.sessionData = {
            startTime: Date.now(),
            pageViews: 0,
            interactions: 0,
            performanceMetrics: {}
        };
        this.init();
    }

    async init() {
        try {
            // Initialize Google Analytics 4
            if (typeof gtag !== 'undefined') {
                this.setupGA4();
            }

            // Core Web Vitals monitoring
            this.monitorCoreWebVitals();

            // User interaction tracking
            this.setupInteractionTracking();

            // Performance monitoring
            this.monitorPerformance();

            // Custom Blaze metrics
            this.trackBlazeMetrics();

            this.initialized = true;
            console.log('🔥 Blaze Analytics initialized');
        } catch (error) {
            console.error('Analytics initialization failed:', error);
        }
    }

    setupGA4() {
        // Enhanced ecommerce tracking
        gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: document.title,
            page_location: window.location.href,
            custom_map: {
                'dimension1': 'user_type',
                'dimension2': 'team_focus',
                'dimension3': 'feature_usage'
            }
        });

        // Track page view with custom dimensions
        this.trackPageView();
    }

    trackPageView() {
        this.sessionData.pageViews++;
        
        gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_referrer: document.referrer,
            user_type: this.getUserType(),
            team_focus: this.getTeamFocus(),
            session_page_views: this.sessionData.pageViews
        });
    }

    trackEvent(eventName, parameters = {}) {
        this.sessionData.interactions++;
        
        const eventData = {
            ...parameters,
            session_interactions: this.sessionData.interactions,
            timestamp: Date.now()
        };

        // Send to Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }

        // Send to custom analytics endpoint
        this.sendToCustomAnalytics(eventName, eventData);
    }

    monitorCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        this.measureLCP();
        
        // First Input Delay (FID)
        this.measureFID();
        
        // Cumulative Layout Shift (CLS)
        this.measureCLS();
    }

    measureLCP() {
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            this.sessionData.performanceMetrics.lcp = lastEntry.startTime;
            
            this.trackEvent('core_web_vital', {
                metric_name: 'LCP',
                metric_value: lastEntry.startTime,
                metric_rating: lastEntry.startTime < 2500 ? 'good' : 
                              lastEntry.startTime < 4000 ? 'needs_improvement' : 'poor'
            });
        }).observe({ entryTypes: ['largest-contentful-paint'] });
    }

    measureFID() {
        new PerformanceObserver((list) => {
            const firstInput = list.getEntries()[0];
            if (firstInput) {
                const fid = firstInput.processingStart - firstInput.startTime;
                
                this.sessionData.performanceMetrics.fid = fid;
                
                this.trackEvent('core_web_vital', {
                    metric_name: 'FID',
                    metric_value: fid,
                    metric_rating: fid < 100 ? 'good' : 
                                  fid < 300 ? 'needs_improvement' : 'poor'
                });
            }
        }).observe({ type: 'first-input', buffered: true });
    }

    measureCLS() {
        let cumulativeLayoutShiftScore = 0;
        
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    cumulativeLayoutShiftScore += entry.value;
                }
            }
            
            this.sessionData.performanceMetrics.cls = cumulativeLayoutShiftScore;
            
            this.trackEvent('core_web_vital', {
                metric_name: 'CLS',
                metric_value: cumulativeLayoutShiftScore,
                metric_rating: cumulativeLayoutShiftScore < 0.1 ? 'good' : 
                              cumulativeLayoutShiftScore < 0.25 ? 'needs_improvement' : 'poor'
            });
        }).observe({ type: 'layout-shift', buffered: true });
    }

    setupInteractionTracking() {
        // Track clicks on key elements
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // CTA buttons
            if (target.matches('button, .btn, [role="button"]')) {
                this.trackEvent('cta_click', {
                    button_text: target.textContent.trim(),
                    button_location: this.getElementLocation(target),
                    page_section: this.getPageSection(target)
                });
            }
            
            // Navigation links
            if (target.matches('nav a, .nav-link')) {
                this.trackEvent('navigation_click', {
                    link_text: target.textContent.trim(),
                    link_href: target.href,
                    navigation_type: 'main_nav'
                });
            }
            
            // Team cards
            if (target.closest('.team-card')) {
                this.trackEvent('team_engagement', {
                    team_name: target.closest('.team-card').querySelector('h3')?.textContent,
                    engagement_type: 'card_click'
                });
            }
        });

        // Track form interactions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.tagName === 'FORM') {
                this.trackEvent('form_submit', {
                    form_id: form.id || 'unnamed',
                    form_location: this.getElementLocation(form),
                    form_fields: form.elements.length
                });
            }
        });

        // Track scroll depth
        this.trackScrollDepth();
    }

    trackScrollDepth() {
        let maxScrollDepth = 0;
        const milestones = [25, 50, 75, 90];
        const tracked = new Set();

        window.addEventListener('scroll', () => {
            const scrollDepth = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollDepth > maxScrollDepth) {
                maxScrollDepth = scrollDepth;
            }
            
            milestones.forEach(milestone => {
                if (scrollDepth >= milestone && !tracked.has(milestone)) {
                    tracked.add(milestone);
                    this.trackEvent('scroll_depth', {
                        depth_percentage: milestone,
                        max_depth: maxScrollDepth
                    });
                }
            });
        });
    }

    monitorPerformance() {
        // Page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                
                this.trackEvent('page_performance', {
                    load_time: navigation.loadEventEnd - navigation.loadEventStart,
                    dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    first_byte: navigation.responseStart - navigation.requestStart,
                    dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
                    connection_time: navigation.connectEnd - navigation.connectStart
                });
            }, 1000);
        });

        // Resource loading
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > 1000) { // Track slow resources
                    this.trackEvent('slow_resource', {
                        resource_name: entry.name,
                        resource_type: entry.initiatorType,
                        load_duration: entry.duration,
                        resource_size: entry.transferSize || 0
                    });
                }
            }
        });
        observer.observe({ entryTypes: ['resource'] });
    }

    trackBlazeMetrics() {
        // Track real-time data loading
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                
                if (args[0].includes('/data/analytics/')) {
                    this.trackEvent('data_fetch', {
                        endpoint: args[0],
                        response_time: endTime - startTime,
                        status: response.status,
                        data_type: 'analytics'
                    });
                }
                
                return response;
            } catch (error) {
                this.trackEvent('data_fetch_error', {
                    endpoint: args[0],
                    error_message: error.message
                });
                throw error;
            }
        };

        // Track feature usage
        this.trackFeatureUsage();
    }

    trackFeatureUsage() {
        // Track when analytics widgets are viewed
        const analyticsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const metricName = entry.target.id || 'unnamed_metric';
                    this.trackEvent('metric_viewed', {
                        metric_name: metricName,
                        viewport_ratio: entry.intersectionRatio
                    });
                }
            });
        });

        // Observe all metric cards
        document.querySelectorAll('.metric-card, [id$="-score"]').forEach(card => {
            analyticsObserver.observe(card);
        });
    }

    async sendToCustomAnalytics(eventName, eventData) {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event: eventName,
                    data: eventData,
                    session_id: this.getSessionId(),
                    user_agent: navigator.userAgent,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            // Fail silently for analytics
            console.debug('Custom analytics failed:', error);
        }
    }

    // Utility methods
    getUserType() {
        // Determine user type based on behavior or URL params
        const params = new URLSearchParams(window.location.search);
        return params.get('utm_source') || 'organic';
    }

    getTeamFocus() {
        const url = window.location.pathname;
        if (url.includes('cardinals')) return 'cardinals';
        if (url.includes('titans')) return 'titans';
        if (url.includes('longhorns')) return 'longhorns';
        if (url.includes('grizzlies')) return 'grizzlies';
        return 'general';
    }

    getElementLocation(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            viewport_height: window.innerHeight
        };
    }

    getPageSection(element) {
        const sections = ['hero', 'analytics', 'teams', 'insights', 'contact'];
        for (const section of sections) {
            if (element.closest(`#${section}`)) {
                return section;
            }
        }
        return 'unknown';
    }

    getSessionId() {
        if (!localStorage.getItem('blaze_session_id')) {
            localStorage.setItem('blaze_session_id', 
                Date.now() + '_' + Math.random().toString(36).substr(2, 9));
        }
        return localStorage.getItem('blaze_session_id');
    }

    // Public API methods
    identify(userId, traits = {}) {
        this.trackEvent('user_identify', {
            user_id: userId,
            traits: traits
        });
    }

    trackConversion(conversionType, value = 0) {
        this.trackEvent('conversion', {
            conversion_type: conversionType,
            conversion_value: value,
            page_location: window.location.href
        });
    }

    trackEngagement(feature, action, value = null) {
        this.trackEvent('feature_engagement', {
            feature_name: feature,
            action_type: action,
            action_value: value
        });
    }
}

// Initialize analytics when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.blazeAnalytics = new BlazeAnalytics();
    });
} else {
    window.blazeAnalytics = new BlazeAnalytics();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeAnalytics;
}